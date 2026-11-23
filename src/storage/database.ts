import { Platform } from 'react-native';
import { Account, EmailMessage, OtpEntry, AppSettings, BackupPayload } from '../types';
import { DEFAULT_APP_SETTINGS } from './seedData';
import { otpParser } from '../services/otpParser';
import { notificationAdapter } from '../adapters/notificationAdapter';
import { storageAdapter } from '../adapters/storageAdapter';

// SQLite Table Names
const TABLES = {
  ACCOUNTS: 'accounts',
  MESSAGES: 'messages',
  OTP_ENTRIES: 'otp_entries',
  SETTINGS: 'settings',
};

// Legacy keys for one-time seamless migration / cleanup
const LEGACY_STORAGE_KEYS = {
  ACCOUNTS_V2: 'amg_otp_hub_accounts_v2',
  EMAILS_V2: 'amg_otp_hub_emails_v2',
  OTPS_V2: 'amg_otp_hub_otps_v2',
  SETTINGS_V2: 'amg_otp_hub_settings_v2',
};

type DatabaseChangeListener = () => void;

class DatabaseManager {
  private nativeDb: any = null;
  private memoryAccounts: Account[] = [];
  private memoryEmails: EmailMessage[] = [];
  private memoryOtps: OtpEntry[] = [];
  private memorySettings: AppSettings = { ...DEFAULT_APP_SETTINGS };
  private isInitialized = false;
  private listeners: Set<DatabaseChangeListener> = new Set();

  constructor() {
    this.hydrateFromWebSync();
  }

  /**
   * Subscribe to database changes (inserts, updates, deletes).
   * Used by reactive hooks and dashboard gauges.
   */
  public subscribe(listener: DatabaseChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notifyChange(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.warn('[Database] Listener error:', err);
      }
    }
  }

  /**
   * Frame 1 synchronous hydration from localStorage on Web.
   * Ensures instant paint without layout shifts or blank screens.
   */
  private hydrateFromWebSync(): void {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        // 1. Try modern SQLite table store
        let acc = storageAdapter.getTableSync<Account>(TABLES.ACCOUNTS);
        let emails = storageAdapter.getTableSync<EmailMessage>(TABLES.MESSAGES);
        let otps = storageAdapter.getTableSync<OtpEntry>(TABLES.OTP_ENTRIES);
        let settingsStr = window.localStorage.getItem(`amg_sqlite_table_${TABLES.SETTINGS}_v3`);

        // 2. Migration fallback from v2 storage if modern store is empty
        if ((!acc || acc.length === 0) && window.localStorage.getItem(LEGACY_STORAGE_KEYS.ACCOUNTS_V2)) {
          try {
            const v2Acc = JSON.parse(window.localStorage.getItem(LEGACY_STORAGE_KEYS.ACCOUNTS_V2) || '[]');
            if (Array.isArray(v2Acc) && v2Acc.length > 0) acc = v2Acc;
          } catch {}
        }
        if ((!emails || emails.length === 0) && window.localStorage.getItem(LEGACY_STORAGE_KEYS.EMAILS_V2)) {
          try {
            const v2Emails = JSON.parse(window.localStorage.getItem(LEGACY_STORAGE_KEYS.EMAILS_V2) || '[]');
            if (Array.isArray(v2Emails) && v2Emails.length > 0) emails = v2Emails;
          } catch {}
        }
        if ((!otps || otps.length === 0) && window.localStorage.getItem(LEGACY_STORAGE_KEYS.OTPS_V2)) {
          try {
            const v2Otps = JSON.parse(window.localStorage.getItem(LEGACY_STORAGE_KEYS.OTPS_V2) || '[]');
            if (Array.isArray(v2Otps) && v2Otps.length > 0) otps = v2Otps;
          } catch {}
        }
        if (!settingsStr && window.localStorage.getItem(LEGACY_STORAGE_KEYS.SETTINGS_V2)) {
          settingsStr = window.localStorage.getItem(LEGACY_STORAGE_KEYS.SETTINGS_V2);
        }

        if (Array.isArray(acc)) this.memoryAccounts = acc;
        if (Array.isArray(emails)) this.memoryEmails = emails;
        if (Array.isArray(otps)) this.memoryOtps = otps;
        if (settingsStr) {
          try {
            this.memorySettings = { ...DEFAULT_APP_SETTINGS, ...JSON.parse(settingsStr) };
          } catch {}
        }
      } catch (err) {
        console.warn('[Database] Synchronous hydration warning:', err);
      }
    }
  }

  /**
   * Asynchronous database initialization.
   * Initializes expo-sqlite on Native with WAL mode and tables.
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;

    if (Platform.OS !== 'web') {
      try {
        const SQLite = await import('expo-sqlite');
        this.nativeDb = await SQLite.openDatabaseAsync('amg_otp_hub.db');
        await this.nativeDb.execAsync('PRAGMA journal_mode = WAL;');

        // Create Persistent SQLite Tables
        await this.nativeDb.execAsync(`
          CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            label TEXT NOT NULL,
            picture TEXT,
            historyId TEXT,
            lastSyncAt TEXT,
            syncStatus TEXT,
            errorMessage TEXT,
            createdAt TEXT,
            avatarColor TEXT,
            unreadCount INTEGER DEFAULT 0,
            otpCount INTEGER DEFAULT 0
          );
          CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            accountId TEXT NOT NULL,
            threadId TEXT,
            senderName TEXT,
            senderEmail TEXT,
            subject TEXT,
            snippet TEXT,
            bodyText TEXT,
            receivedAt TEXT,
            isRead INTEGER DEFAULT 0,
            hasOtp INTEGER DEFAULT 0,
            otpId TEXT
          );
          CREATE TABLE IF NOT EXISTS otp_entries (
            id TEXT PRIMARY KEY,
            messageId TEXT,
            accountId TEXT NOT NULL,
            accountLabel TEXT,
            accountEmail TEXT,
            serviceName TEXT,
            code TEXT NOT NULL,
            confidence TEXT,
            receivedAt TEXT,
            isCopied INTEGER DEFAULT 0,
            expiresInMinutes INTEGER,
            snippet TEXT,
            fullSubject TEXT,
            sender TEXT
          );
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
          );
        `);

        // Hydrate from Native SQLite
        const accRows = await this.nativeDb.getAllAsync('SELECT * FROM accounts');
        if (accRows && accRows.length > 0) {
          this.memoryAccounts = accRows.map((r: any) => ({
            id: r.id,
            email: r.email,
            label: r.label,
            picture: r.picture || null,
            historyId: r.historyId || null,
            lastSyncedAt: r.lastSyncAt || null,
            status: r.syncStatus || 'idle',
            errorMessage: r.errorMessage || null,
            createdAt: r.createdAt,
            avatarColor: r.avatarColor || '#3B82F6',
            unreadCount: r.unreadCount || 0,
            otpCount: r.otpCount || 0,
          }));
        }

        const msgRows = await this.nativeDb.getAllAsync('SELECT * FROM messages ORDER BY receivedAt DESC');
        if (msgRows && msgRows.length > 0) {
          this.memoryEmails = msgRows.map((r: any) => ({
            id: r.id,
            accountId: r.accountId,
            threadId: r.threadId,
            sender: r.senderEmail,
            senderName: r.senderName,
            recipient: '',
            subject: r.subject,
            snippet: r.snippet,
            bodyPlain: r.bodyText,
            internalDate: new Date(r.receivedAt).getTime(),
            hasOtp: Boolean(r.hasOtp),
            otpId: r.otpId || undefined,
            isRead: Boolean(r.isRead),
            labels: ['INBOX'],
          }));
        }

        const otpRows = await this.nativeDb.getAllAsync('SELECT * FROM otp_entries ORDER BY receivedAt DESC');
        if (otpRows && otpRows.length > 0) {
          this.memoryOtps = otpRows.map((r: any) => ({
            id: r.id,
            emailId: r.messageId,
            accountId: r.accountId,
            accountLabel: r.accountLabel,
            accountEmail: r.accountEmail,
            serviceName: r.serviceName,
            code: r.code,
            type: /^[0-9]+$/.test(r.code) ? 'NUMERIC' : 'ALPHANUMERIC',
            confidence: r.confidence || 'HIGH',
            detectedAt: r.receivedAt,
            snippet: r.snippet || '',
            fullSubject: r.fullSubject || '',
            sender: r.sender || '',
            isUsed: Boolean(r.isCopied),
            expiresInMinutes: r.expiresInMinutes || null,
          }));
        }
      } catch (err) {
        console.warn('[Database] Native SQLite initialization error:', err);
      }
    }

    this.isInitialized = true;
  }

  /**
   * Persists current table states on Web and Native.
   */
  private async persistAll(): Promise<void> {
    if (Platform.OS === 'web') {
      storageAdapter.setTableSync(TABLES.ACCOUNTS, this.memoryAccounts);
      storageAdapter.setTableSync(TABLES.MESSAGES, this.memoryEmails);
      storageAdapter.setTableSync(TABLES.OTP_ENTRIES, this.memoryOtps);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(
          `amg_sqlite_table_${TABLES.SETTINGS}_v3`,
          JSON.stringify(this.memorySettings)
        );
      }
    } else if (this.nativeDb) {
      // Background sync to native SQLite tables
      try {
        await this.nativeDb.withTransactionAsync(async () => {
          for (const a of this.memoryAccounts) {
            await this.nativeDb.runAsync(
              `INSERT OR REPLACE INTO accounts (id, email, label, picture, historyId, lastSyncAt, syncStatus, errorMessage, createdAt, avatarColor, unreadCount, otpCount)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
              [
                a.id,
                a.email,
                a.label,
                (a as any).picture || '',
                a.historyId || '',
                a.lastSyncedAt || '',
                a.status,
                a.errorMessage || '',
                a.createdAt,
                a.avatarColor || '#3B82F6',
                a.unreadCount || 0,
                a.otpCount || 0,
              ]
            );
          }
        });
      } catch (err) {
        console.warn('[Database] Native SQLite sync warning:', err);
      }
    }

    this.notifyChange();
  }

  // --- SYNCHRONOUS GETTERS (FRAME 1 IMMEDIATE RENDER) ---
  public getAccountsSync(): Account[] {
    return [...this.memoryAccounts];
  }

  public getOtpsSync(): OtpEntry[] {
    return [...this.memoryOtps];
  }

  public getEmailsSync(accountId?: string): EmailMessage[] {
    if (accountId) {
      return this.memoryEmails.filter(e => e.accountId === accountId);
    }
    return [...this.memoryEmails];
  }

  public getSettingsSync(): AppSettings {
    return { ...this.memorySettings };
  }

  // --- ACCOUNTS ---
  public async getAccounts(): Promise<Account[]> {
    await this.init();
    return [...this.memoryAccounts].sort((a, b) => a.label.localeCompare(b.label));
  }

  public async getAccountById(id: string): Promise<Account | null> {
    await this.init();
    return this.memoryAccounts.find(a => a.id === id) || null;
  }

  public async upsertAccount(account: Account): Promise<void> {
    await this.init();
    const index = this.memoryAccounts.findIndex(
      a => a.id === account.id || a.email.toLowerCase() === account.email.toLowerCase()
    );
    if (index >= 0) {
      this.memoryAccounts[index] = { ...this.memoryAccounts[index], ...account };
    } else {
      this.memoryAccounts.push(account);
    }
    await this.persistAll();
  }

  public async addLiveAccount(data: {
    email: string;
    label: string;
    avatarColor?: string;
    picture?: string;
  }): Promise<Account> {
    await this.init();
    const colors = ['#00e5ff', '#10b981', '#a855f7', '#f59e0b', '#3b82f6', '#ec4899', '#6366f1'];
    const color = data.avatarColor || colors[this.memoryAccounts.length % colors.length];
    const newAcc: Account = {
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: data.email.toLowerCase().trim(),
      label: data.label.trim() || 'Custom Account',
      avatarColor: color,
      status: 'success',
      lastSyncedAt: new Date().toISOString(),
      historyId: `hist_${Date.now()}`,
      unreadCount: 0,
      otpCount: 0,
      createdAt: new Date().toISOString(),
    };
    if (data.picture) {
      (newAcc as any).picture = data.picture;
    }
    await this.upsertAccount(newAcc);
    return newAcc;
  }

  public async updateAccountSyncStatus(
    id: string,
    status: Account['status'],
    errorMessage: string | null = null,
    lastSyncedAt: string | null = new Date().toISOString(),
    historyId?: string | null
  ): Promise<void> {
    await this.init();
    const account = this.memoryAccounts.find(a => a.id === id);
    if (account) {
      account.status = status;
      account.errorMessage = errorMessage;
      if (lastSyncedAt) account.lastSyncedAt = lastSyncedAt;
      if (historyId !== undefined) account.historyId = historyId;
      await this.persistAll();
    }
  }

  public async deleteAccount(id: string): Promise<void> {
    await this.init();
    this.memoryAccounts = this.memoryAccounts.filter(a => a.id !== id);
    this.memoryEmails = this.memoryEmails.filter(e => e.accountId !== id);
    this.memoryOtps = this.memoryOtps.filter(o => o.accountId !== id);

    if (this.nativeDb) {
      try {
        await this.nativeDb.runAsync('DELETE FROM accounts WHERE id = ?;', [id]);
        await this.nativeDb.runAsync('DELETE FROM messages WHERE accountId = ?;', [id]);
        await this.nativeDb.runAsync('DELETE FROM otp_entries WHERE accountId = ?;', [id]);
      } catch (err) {
        console.warn('[Database] Native delete warning:', err);
      }
    }

    await this.persistAll();
  }

  // --- EMAILS / MESSAGES ---
  public async getEmails(accountId?: string, limit = 100): Promise<EmailMessage[]> {
    await this.init();
    let result = this.memoryEmails;
    if (accountId) {
      result = result.filter(e => e.accountId === accountId);
    }
    return result
      .sort((a, b) => b.internalDate - a.internalDate)
      .slice(0, limit);
  }

  public async getEmailById(id: string): Promise<EmailMessage | null> {
    await this.init();
    return this.memoryEmails.find(e => e.id === id) || null;
  }

  public async upsertEmails(newEmails: EmailMessage[]): Promise<void> {
    await this.init();
    for (const email of newEmails) {
      const idx = this.memoryEmails.findIndex(e => e.id === email.id);
      if (idx >= 0) {
        this.memoryEmails[idx] = { ...this.memoryEmails[idx], ...email };
      } else {
        this.memoryEmails.unshift(email);
      }
    }
    this.recalculateCounts();
    await this.persistAll();
  }

  public async upsertMessage(email: EmailMessage): Promise<void> {
    await this.upsertEmails([email]);
  }

  public async markEmailRead(emailId: string, isRead = true): Promise<void> {
    await this.init();
    const email = this.memoryEmails.find(e => e.id === emailId);
    if (email) {
      email.isRead = isRead;
      this.recalculateCounts();
      await this.persistAll();
    }
  }

  // --- OTPS ---
  public async getOtps(filters?: { accountId?: string; query?: string; unreadOnly?: boolean }): Promise<OtpEntry[]> {
    await this.init();
    let result = [...this.memoryOtps];

    if (filters?.accountId) {
      result = result.filter(o => o.accountId === filters.accountId);
    }

    if (filters?.unreadOnly) {
      result = result.filter(o => !o.isUsed);
    }

    if (filters?.query) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(
        o =>
          o.code.toLowerCase().includes(q) ||
          o.serviceName.toLowerCase().includes(q) ||
          o.accountLabel.toLowerCase().includes(q) ||
          o.accountEmail.toLowerCase().includes(q) ||
          o.snippet.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
  }

  public async getOtpById(id: string): Promise<OtpEntry | null> {
    await this.init();
    return this.memoryOtps.find(o => o.id === id) || null;
  }

  public async upsertOtps(newOtps: OtpEntry[]): Promise<void> {
    await this.init();
    for (const otp of newOtps) {
      const idx = this.memoryOtps.findIndex(o => o.id === otp.id || (o.emailId === otp.emailId && o.code === otp.code));
      if (idx >= 0) {
        this.memoryOtps[idx] = { ...this.memoryOtps[idx], ...otp };
      } else {
        this.memoryOtps.unshift(otp);
      }
    }
    this.recalculateCounts();
    await this.persistAll();
  }

  public async addOtp(otp: OtpEntry): Promise<void> {
    await this.upsertOtps([otp]);
  }

  public async markOtpUsed(otpId: string, isUsed = true): Promise<void> {
    await this.init();
    const otp = this.memoryOtps.find(o => o.id === otpId);
    if (otp) {
      otp.isUsed = isUsed;
      await this.persistAll();
    }
  }

  private recalculateCounts(): void {
    for (const acc of this.memoryAccounts) {
      acc.unreadCount = this.memoryEmails.filter(e => e.accountId === acc.id && !e.isRead).length;
      acc.otpCount = this.memoryOtps.filter(o => o.accountId === acc.id).length;
    }
  }

  // --- SETTINGS ---
  public async getSettings(): Promise<AppSettings> {
    await this.init();
    return { ...this.memorySettings };
  }

  public async saveSettings(patch: Partial<AppSettings>): Promise<void> {
    await this.init();
    this.memorySettings = { ...this.memorySettings, ...patch };
    await this.persistAll();
  }

  // --- RETENTION POLICY CLEANUP ---
  public async cleanUpOldData(retentionDays: number): Promise<{ deletedEmails: number; deletedOtps: number }> {
    await this.init();
    if (!retentionDays || retentionDays <= 0) return { deletedEmails: 0, deletedOtps: 0 };

    const cutoffMs = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const initialEmails = this.memoryEmails.length;
    const initialOtps = this.memoryOtps.length;

    this.memoryEmails = this.memoryEmails.filter(e => e.internalDate >= cutoffMs);
    this.memoryOtps = this.memoryOtps.filter(o => new Date(o.detectedAt).getTime() >= cutoffMs);

    const deletedEmails = initialEmails - this.memoryEmails.length;
    const deletedOtps = initialOtps - this.memoryOtps.length;

    this.recalculateCounts();
    await this.persistAll();
    return { deletedEmails, deletedOtps };
  }

  // --- BACKUP & RESTORE ---
  public async exportBackupPayload(): Promise<BackupPayload> {
    await this.init();
    return {
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      accounts: [...this.memoryAccounts],
      emails: [...this.memoryEmails],
      otps: [...this.memoryOtps],
      settings: { ...this.memorySettings },
    };
  }

  // --- DYNAMIC LIVE FLUSH (PURGE DATA) ---
  public async flushAllData(): Promise<void> {
    this.memoryAccounts = [];
    this.memoryEmails = [];
    this.memoryOtps = [];
    this.memorySettings = { ...DEFAULT_APP_SETTINGS };

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(`amg_sqlite_table_${TABLES.ACCOUNTS}_v3`);
        window.localStorage.removeItem(`amg_sqlite_table_${TABLES.MESSAGES}_v3`);
        window.localStorage.removeItem(`amg_sqlite_table_${TABLES.OTP_ENTRIES}_v3`);
        window.localStorage.removeItem(`amg_sqlite_table_${TABLES.SETTINGS}_v3`);
        window.localStorage.removeItem(LEGACY_STORAGE_KEYS.ACCOUNTS_V2);
        window.localStorage.removeItem(LEGACY_STORAGE_KEYS.EMAILS_V2);
        window.localStorage.removeItem(LEGACY_STORAGE_KEYS.OTPS_V2);
        window.localStorage.removeItem(LEGACY_STORAGE_KEYS.SETTINGS_V2);
      } catch {}
    } else if (this.nativeDb) {
      try {
        await this.nativeDb.runAsync('DELETE FROM accounts;');
        await this.nativeDb.runAsync('DELETE FROM messages;');
        await this.nativeDb.runAsync('DELETE FROM otp_entries;');
      } catch {}
    }

    this.notifyChange();
  }

  public async resetToSeedData(): Promise<void> {
    await this.flushAllData();
  }

  public async clearAllData(): Promise<void> {
    await this.flushAllData();
  }

  // --- DYNAMIC LIVE EMAIL INJECTOR ---
  public async injectLiveEmail(data: {
    accountId: string;
    sender: string;
    senderName?: string;
    recipient?: string;
    subject: string;
    bodyPlain: string;
  }): Promise<{ email: EmailMessage; otp: OtpEntry | null }> {
    await this.init();
    const account = this.memoryAccounts.find(a => a.id === data.accountId) || this.memoryAccounts[0];
    if (!account) {
      throw new Error('No account found to associate with injected email.');
    }

    const emailId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const parsed = otpParser.parse(data.subject, data.bodyPlain, data.sender, data.senderName || data.sender);

    let createdOtp: OtpEntry | null = null;
    let otpId: string | undefined = undefined;

    if (parsed) {
      otpId = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      createdOtp = {
        id: otpId,
        emailId,
        accountId: account.id,
        accountLabel: account.label,
        accountEmail: account.email,
        serviceName: parsed.serviceName,
        code: parsed.code,
        type: parsed.type,
        confidence: parsed.confidence,
        expiresInMinutes: parsed.expiresInMinutes,
        detectedAt: new Date().toISOString(),
        snippet: parsed.snippet,
        fullSubject: data.subject,
        sender: data.sender,
        isUsed: false,
      };
      this.memoryOtps.unshift(createdOtp);
      notificationAdapter.playChime();
      notificationAdapter.sendLocalNotification({
        title: `Live OTP: ${parsed.code} (${parsed.serviceName})`,
        body: `Received in ${account.label} inbox. Ready to 1-click copy.`,
      });
    }

    const newEmail: EmailMessage = {
      id: emailId,
      accountId: account.id,
      threadId: `th_${Date.now()}`,
      sender: data.sender,
      senderName: data.senderName || data.sender.split('@')[0],
      recipient: data.recipient || account.email,
      subject: data.subject,
      snippet: data.bodyPlain.slice(0, 140).replace(/\s+/g, ' ').trim(),
      bodyPlain: data.bodyPlain,
      internalDate: Date.now(),
      hasOtp: !!createdOtp,
      otpId,
      isRead: false,
      labels: ['INBOX', 'UNREAD'],
    };

    this.memoryEmails.unshift(newEmail);
    this.recalculateCounts();
    await this.persistAll();

    return { email: newEmail, otp: createdOtp };
  }
}

export const db = new DatabaseManager();
