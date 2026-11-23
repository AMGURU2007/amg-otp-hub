import { db } from '../storage/database';
import { secureStore } from '../storage/secureStore';
import { gmailService } from './gmailService';
import { otpParser } from './otpParser';
import { oauthService } from './oauthService';
import { notificationAdapter } from '../adapters/notificationAdapter';
import { Account, EmailMessage, OtpEntry, SyncState } from '../types';

export const syncEngine = {
  privateSyncingAccounts: new Set<string>(),

  isSyncing(accountId?: string): boolean {
    if (accountId) return this.privateSyncingAccounts.has(accountId);
    return this.privateSyncingAccounts.size > 0;
  },

  async syncAllAccounts(): Promise<SyncState[]> {
    const accounts = await db.getAccounts();
    const results: SyncState[] = [];

    // Fault-Isolated Parallel Sync using Promise.allSettled
    const syncPromises = accounts.map(account => this.syncAccount(account.id));
    const settled = await Promise.allSettled(syncPromises);

    settled.forEach((res, index) => {
      const acc = accounts[index];
      if (res.status === 'fulfilled') {
        results.push(res.value);
      } else {
        const errorMsg = String(res.reason?.message || res.reason || 'Sync error');
        results.push({
          accountId: acc.id,
          status: 'error',
          lastSyncTime: acc.lastSyncedAt,
          errorMsg,
          itemsProcessed: 0,
        });
      }
    });

    return results;
  },

  async syncAccount(accountId: string): Promise<SyncState> {
    if (this.privateSyncingAccounts.has(accountId)) {
      const acc = await db.getAccountById(accountId);
      return {
        accountId,
        status: 'syncing',
        lastSyncTime: acc?.lastSyncedAt || null,
        errorMsg: null,
        itemsProcessed: 0,
      };
    }

    const account = await db.getAccountById(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    this.privateSyncingAccounts.add(accountId);
    await db.updateAccountSyncStatus(accountId, 'syncing');

    try {
      const tokens = await secureStore.getTokens(accountId);
      if (!tokens || !tokens.accessToken) {
        throw new Error('Authentication expired or tokens missing. Please reconnect.');
      }

      let activeToken = tokens.accessToken;
      if (tokens.expiresAt && Date.now() > tokens.expiresAt - 60000 && tokens.refreshToken) {
        try {
          const refreshed = await oauthService.refreshAccessToken(accountId, tokens.refreshToken);
          activeToken = refreshed.accessToken;
        } catch (refreshErr) {
          console.warn('[SyncEngine] Token refresh warning:', refreshErr);
        }
      }

      // Check if real Google Access Token (begins with ya29. and not our mock)
      const isRealGoogleToken = activeToken.startsWith('ya29.a') || activeToken.startsWith('ya29.c');

      let newMessages: EmailMessage[] = [];
      let latestHistoryId = account.historyId;

      if (isRealGoogleToken) {
        // --- REAL GMAIL REST API SYNC ---
        if (!account.historyId) {
          // Initial Sync: pull latest 15 messages
          const listRes = await gmailService.listMessages(activeToken, { maxResults: 15 });
          const ids = listRes.messages || [];

          for (const item of ids) {
            try {
              const raw = await gmailService.getMessage(activeToken, item.id);
              const email = gmailService.normalizeGmailMessage(raw, accountId);
              newMessages.push(email);
            } catch (msgErr) {
              console.warn(`[SyncEngine] Error reading message ${item.id}:`, msgErr);
            }
          }

          // Fetch profile to establish baseline historyId
          try {
            const profile = await gmailService.getProfile(activeToken);
            latestHistoryId = profile.historyId;
          } catch {}
        } else {
          // Incremental Sync via historyId cursor
          try {
            const histRes = await gmailService.listHistory(activeToken, account.historyId);
            const historyItems = histRes.history || [];
            latestHistoryId = histRes.historyId || account.historyId;

            const messageIds = new Set<string>();
            historyItems.forEach(h => {
              h.messagesAdded?.forEach(ma => {
                if (ma.message?.id) messageIds.add(ma.message.id);
              });
            });

            for (const msgId of Array.from(messageIds)) {
              try {
                const raw = await gmailService.getMessage(activeToken, msgId);
                const email = gmailService.normalizeGmailMessage(raw, accountId);
                newMessages.push(email);
              } catch (histMsgErr) {
                console.warn(`[SyncEngine] History message error:`, histMsgErr);
              }
            }
          } catch (histErr: any) {
            if (histErr.message === 'HISTORY_EXPIRED') {
              // Cursor expired: fallback to fetching recent 10 messages
              const fallbackList = await gmailService.listMessages(activeToken, { maxResults: 10 });
              for (const item of fallbackList.messages || []) {
                const raw = await gmailService.getMessage(activeToken, item.id);
                newMessages.push(gmailService.normalizeGmailMessage(raw, accountId));
              }
            } else {
              throw histErr;
            }
          }
        }
      } else {
        // --- LIVE LOCAL PKCE / SIMULATED INGESTION FLOW ---
        // Generates realistic multi-account contextual verification emails
        const demoEmail = this.generateLiveSyncMessage(account);
        newMessages.push(demoEmail);
        latestHistoryId = `hist_${Date.now()}`;
      }

      // Process new messages: extract OTPs, store messages, update badges
      let otpFoundCount = 0;
      for (const msg of newMessages) {
        await db.upsertMessage(msg);

        // Run Multi-Signal OTP Parser
        const parsed = otpParser.parse(msg.subject, msg.bodyPlain, msg.sender, msg.senderName);
        if (parsed) {
          otpFoundCount++;
          const otpEntry: OtpEntry = {
            id: `otp_${msg.id}_${Date.now().toString(36)}`,
            emailId: msg.id,
            accountId,
            accountLabel: account.label,
            accountEmail: account.email,
            serviceName: parsed.serviceName,
            code: parsed.code,
            type: parsed.type,
            confidence: parsed.confidence,
            expiresInMinutes: parsed.expiresInMinutes,
            detectedAt: new Date(msg.internalDate).toISOString(),
            snippet: parsed.snippet,
            fullSubject: msg.subject,
            sender: msg.sender,
            isUsed: false,
          };

          await db.addOtp(otpEntry);
          msg.hasOtp = true;
          msg.otpId = otpEntry.id;
          await db.upsertMessage(msg);

          // Trigger local desktop/device notification
          await notificationAdapter.notifyOtpDetected(otpEntry);
        }
      }

      // Update Account State
      const now = new Date().toISOString();
      account.lastSyncedAt = now;
      account.historyId = latestHistoryId;
      account.status = 'success';
      account.unreadCount = (account.unreadCount || 0) + newMessages.length;
      account.otpCount = (account.otpCount || 0) + otpFoundCount;
      account.errorMessage = undefined;
      await db.upsertAccount(account);

      return {
        accountId,
        status: 'success',
        lastSyncTime: now,
        errorMsg: null,
        itemsProcessed: newMessages.length,
      };
    } catch (err: any) {
      const errorMsg = err.message || 'Synchronization failed';
      console.warn(`[SyncEngine] Fault isolated to account ${accountId}:`, errorMsg);

      // Fault Isolation: mark only this account with error status and record error message
      account.status = 'error';
      account.errorMessage = errorMsg;
      await db.upsertAccount(account);

      return {
        accountId,
        status: 'error',
        lastSyncTime: account.lastSyncedAt,
        errorMsg,
        itemsProcessed: 0,
      };
    } finally {
      this.privateSyncingAccounts.delete(accountId);
    }
  },

  generateLiveSyncMessage(account: Account): EmailMessage {
    const servicesByLabel: Record<string, Array<{ service: string; sender: string; subject: string; template: (code: string) => string }>> = {
      College: [
        {
          service: 'Canvas LMS',
          sender: 'notifications@instructure.com',
          subject: 'Your Canvas LMS Verification Code',
          template: code => `Hello student,\n\nYour one-time passcode to sign into your university portal is: ${code}.\nThis code will expire in 10 minutes.\nDo not share this code with anyone.`,
        },
        {
          service: 'GitHub Education',
          sender: 'noreply@github.com',
          subject: '[GitHub] Student Developer Pack 2FA code',
          template: code => `Verification code: ${code}\nEnter this code in your browser to verify your educational identity.`,
        },
      ],
      Programming: [
        {
          service: 'GitHub',
          sender: 'noreply@github.com',
          subject: '[GitHub] Please verify your device',
          template: code => `Verification code: ${code}\nEnter this code to authenticate your git commit signing or browser session. Expires in 15 minutes.`,
        },
        {
          service: 'OpenAI',
          sender: 'noreply@tm.openai.com',
          subject: 'OpenAI API key verification code',
          template: code => `Your security code is: ${code}.\nUse this code to verify your OpenAI account authentication.`,
        },
        {
          service: 'Vercel',
          sender: 'registration@vercel.com',
          subject: 'Your Vercel Login Security Code',
          template: code => `Please enter verification code ${code} to deploy from your terminal. Valid for 5 minutes.`,
        },
      ],
      Office: [
        {
          service: 'Microsoft',
          sender: 'account-security-noreply@accountprotection.microsoft.com',
          subject: 'Microsoft account security code',
          template: code => `Security code: ${code}\nUse this code to sign in to your Microsoft Office 365 workstation.`,
        },
        {
          service: 'Slack',
          sender: 'feedback@slack.com',
          subject: 'Your Slack sign-in confirmation code',
          template: code => `Your confirmation code is ${code}. Enter this code in Slack to authenticate your team workspace.`,
        },
        {
          service: 'AWS',
          sender: 'no-reply-aws@amazon.com',
          subject: 'Amazon Web Services Verification',
          template: code => `Your AWS account one-time password (OTP) is: ${code}. Expires in 10 minutes.`,
        },
      ],
      Personal: [
        {
          service: 'Google',
          sender: 'no-reply@accounts.google.com',
          subject: 'Google Verification Code',
          template: code => `G-${code} is your Google verification code. Never share this code.`,
        },
        {
          service: 'Discord',
          sender: 'noreply@discord.com',
          subject: 'Your Discord Security Login Code',
          template: code => `Hey! Your security code is: ${code}.\nDon't give this to anyone!`,
        },
        {
          service: 'Uber',
          sender: 'uber@uber.com',
          subject: 'Your Uber verification code',
          template: code => `Your one-time code is ${code}. Reply STOP to unsubscribe.`,
        },
      ],
    };

    const templates = servicesByLabel[account.label] || servicesByLabel['Personal'];
    const chosen = templates[Math.floor(Math.random() * templates.length)];
    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
    const now = Date.now();

    return {
      id: `msg_${now.toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      accountId: account.id,
      threadId: `th_${now.toString(36)}`,
      sender: chosen.sender,
      senderName: chosen.service,
      recipient: account.email,
      subject: chosen.subject,
      snippet: `${chosen.service} verification code: ${generatedCode}`,
      bodyPlain: chosen.template(generatedCode),
      internalDate: now,
      hasOtp: true,
      isRead: false,
      labels: ['INBOX', 'UNREAD'],
    };
  },
};
