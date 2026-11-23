import { Platform } from 'react-native';
import { oauthAdapter } from '../adapters/oauthAdapter';
import { secureStore, AccountTokens, UserSession } from '../storage/secureStore';
import { db } from '../storage/database';
import { Account } from '../types';

export const GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
export const USERINFO_EMAIL_SCOPE = 'https://www.googleapis.com/auth/userinfo.email';
export const USERINFO_PROFILE_SCOPE = 'https://www.googleapis.com/auth/userinfo.profile';

export const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
export const GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v2/userinfo';
export const GOOGLE_REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke';

export const PKCE_VERIFIER_STORAGE_KEY = 'amg_pkce_verifier_pending_v1';
export const PKCE_LABEL_STORAGE_KEY = 'amg_pkce_label_pending_v1';
export const PKCE_STATE_STORAGE_KEY = 'amg_pkce_state_pending_v1';

export interface UserProfileResponse {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface GoogleAuthResult {
  success: boolean;
  account?: Account;
  error?: string;
}

export interface OAuthCallbackResult {
  handled: boolean;
  success: boolean;
  account?: Account;
  error?: string;
}

export const oauthService = {
  async getEffectiveClientId(): Promise<string> {
    try {
      const settings = await db.getSettings();
      let clientId = '';
      if (Platform.OS === 'web') {
        clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || settings.googleClientIdWeb || '';
      } else if (Platform.OS === 'android') {
        clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || settings.googleClientIdAndroid || '';
      } else {
        clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_DESKTOP || settings.googleClientIdDesktop || '';
      }
      return clientId.trim();
    } catch {
      return (process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || '').trim();
    }
  },

  async generateAuthUrl(label = 'Google Account'): Promise<{ authUrl: string; verifier: string; state: string }> {
    const clientId = await this.getEffectiveClientId();
    const redirectUri = oauthAdapter.getRedirectUri();
    const { codeVerifier, codeChallenge } = await oauthAdapter.generatePKCE();
    const state = JSON.stringify({
      nonce: oauthAdapter.generateRandomString(16),
      label,
      ts: Date.now(),
    });

    const isWeb = Platform.OS === 'web';
    const authUrl = oauthAdapter.buildGoogleAuthUrl({
      clientId,
      redirectUri,
      isWeb,
      state: encodeURIComponent(state),
      codeChallenge,
    });

    return {
      authUrl,
      verifier: codeVerifier,
      state,
    };
  },

  async exchangeCodeForTokens(code: string, verifier?: string): Promise<AccountTokens> {
    const clientId = await this.getEffectiveClientId();
    const redirectUri = oauthAdapter.getRedirectUri();
    const clientSecret = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET_WEB || '';

    const bodyParams: Record<string, string> = {
      code,
      client_id: clientId,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    };

    if (verifier) {
      bodyParams.code_verifier = verifier;
    }
    if (clientSecret) {
      bodyParams.client_secret = clientSecret;
    }

    const body = new URLSearchParams(bodyParams);

    const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OAuth token exchange failed [${response.status}]: ${errText}`);
    }

    const json = await response.json();
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresAt: Date.now() + (json.expires_in || 3600) * 1000,
      scope: json.scope,
      tokenType: json.token_type,
      idToken: json.id_token,
    };
  },

  async refreshAccessToken(accountId: string, refreshToken: string): Promise<AccountTokens> {
    const clientId = await this.getEffectiveClientId();

    const body = new URLSearchParams({
      client_id: clientId,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Token refresh failed: ${err}`);
    }

    const json = await response.json();
    const updatedTokens: AccountTokens = {
      accessToken: json.access_token,
      refreshToken: json.refresh_token || refreshToken,
      expiresAt: Date.now() + (json.expires_in || 3600) * 1000,
      scope: json.scope,
    };

    await secureStore.saveTokens(accountId, updatedTokens);
    return updatedTokens;
  },

  async fetchUserProfile(accessToken: string): Promise<UserProfileResponse> {
    const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to fetch user profile [${response.status}]: ${errText}`);
    }

    return await response.json();
  },

  /**
   * Primary entry point for Google Sign-In via PKCE.
   * On Web/Desktop/Mobile: launches auth or connects real/live authenticated session.
   */
  async signInWithGoogle(label = 'Personal'): Promise<GoogleAuthResult> {
    try {
      // 1. Check if a real Client ID is configured in .env
      const clientId = await this.getEffectiveClientId();
      if (!clientId) {
        return {
          success: false,
          error: 'Please paste your Google Cloud Client ID into .env (EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB) to enable live sign-in.',
        };
      }

      // 2. Generate secure PKCE challenge
      const { authUrl, verifier, state } = await this.generateAuthUrl(label);

      // Save verifier, label, state before redirecting
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(PKCE_VERIFIER_STORAGE_KEY, verifier);
        window.localStorage.setItem(PKCE_LABEL_STORAGE_KEY, label);
        window.localStorage.setItem(PKCE_STATE_STORAGE_KEY, state);
      }
      await secureStore.setSecureItem(PKCE_VERIFIER_STORAGE_KEY, verifier);
      await secureStore.setSecureItem(PKCE_LABEL_STORAGE_KEY, label);

      // 3. Redirect to Google OAuth consent screen
      if (typeof window !== 'undefined') {
        window.location.href = authUrl;
        return { success: true };
      }

      return { success: false, error: 'OAuth redirect not supported in this runtime.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google OAuth failed' };
    }
  },

  /**
   * Immediate URL Callback Handler on Boot.
   * Runs as early as possible when app mounts in app/_layout.tsx.
   * Captures #access_token=... (direct web token flow) and ?code=...,
   * fetches user profile, saves account into SQLite, triggers sync, cleans URL,
   * and navigates to /dashboard.
   */
  async handleOAuthCallbackOnBoot(): Promise<OAuthCallbackResult> {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const WebBrowser = require('expo-web-browser');
        if (WebBrowser?.maybeCompleteAuthSession) {
          WebBrowser.maybeCompleteAuthSession();
        }
      } catch {}

      // 1. Check hash fragment for direct token flow on Web (#access_token=...&expires_in=...)
      let hashToken: string | null = null;
      let hashExpiresIn: number | null = null;
      let hashError: string | null = null;
      let hashState: string | null = null;

      if (window.location.hash && window.location.hash.length > 1) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        hashToken = hashParams.get('access_token');
        const exp = hashParams.get('expires_in');
        if (exp) hashExpiresIn = parseInt(exp, 10);
        hashError = hashParams.get('error');
        hashState = hashParams.get('state');
      }

      // 2. Check query params (?code=... or ?error=...)
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const searchError = searchParams.get('error');
      const errorParam = hashError || searchError;

      if (errorParam) {
        console.warn('[OAuthService] Google OAuth error parameter in URL:', errorParam);
        window.history.replaceState({}, document.title, window.location.pathname);
        return { handled: true, success: false, error: errorParam };
      }

      if (!hashToken && !code) {
        return { handled: false, success: false };
      }

      try {
        let tokens: AccountTokens;

        if (hashToken) {
          // Direct token flow on Web (response_type=token)
          tokens = {
            accessToken: hashToken,
            expiresAt: Date.now() + (hashExpiresIn || 3600) * 1000,
            tokenType: 'Bearer',
          };
        } else if (code) {
          // Retrieve saved PKCE verifier
          const verifier =
            window.localStorage.getItem(PKCE_VERIFIER_STORAGE_KEY) ||
            (await secureStore.getSecureItem(PKCE_VERIFIER_STORAGE_KEY)) ||
            '';

          tokens = await this.exchangeCodeForTokens(code, verifier);
        } else {
          return { handled: false, success: false };
        }

        // 1. Fetch real user profile from Google UserInfo endpoint
        const profile = await this.fetchUserProfile(tokens.accessToken);
        if (!profile.email) {
          throw new Error('Google UserProfile did not return a valid email address');
        }

        // Decode state to recover label if present
        let stateLabel = '';
        const rawState = hashState || searchParams.get('state');
        if (rawState) {
          try {
            const decodedState = JSON.parse(decodeURIComponent(rawState));
            if (decodedState?.label) stateLabel = decodedState.label;
          } catch {}
        }

        // Retrieve saved label or derive from profile/email
        const savedLabel =
          stateLabel ||
          window.localStorage.getItem(PKCE_LABEL_STORAGE_KEY) ||
          (await secureStore.getSecureItem(PKCE_LABEL_STORAGE_KEY)) ||
          profile.name ||
          profile.email.split('@')[0] ||
          'Personal';

        const accountId = `acc_${profile.email.replace(/[^a-zA-Z0-9]/g, '_')}`;

        // 2. Save encrypted tokens keyed by accountId AND keyed by email
        await secureStore.saveTokens(accountId, tokens);
        await secureStore.saveTokens(profile.email.toLowerCase().trim(), tokens);

        const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4', '#EC4899', '#6366F1'];
        const avatarColor =
          colors[Math.abs(profile.email.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colors.length];

        const account: Account = {
          id: accountId,
          email: profile.email.toLowerCase().trim(),
          label: savedLabel,
          avatarColor,
          status: 'success',
          lastSyncedAt: new Date().toISOString(),
          historyId: null,
          unreadCount: 0,
          otpCount: 0,
          createdAt: new Date().toISOString(),
          picture: profile.picture || null,
        };

        // Insert/upsert into persistent SQLite accounts table
        await db.upsertAccount(account);

        // Save active session for persistent reload survival
        await secureStore.saveActiveSession({
          accountId: account.id,
          email: account.email,
          name: profile.name || account.label,
          picture: profile.picture,
          signedInAt: new Date().toISOString(),
        });

        // 3. Clear URL hash / query parameters from browser URL
        window.history.replaceState({}, document.title, window.location.pathname);
        window.localStorage.removeItem(PKCE_VERIFIER_STORAGE_KEY);
        window.localStorage.removeItem(PKCE_LABEL_STORAGE_KEY);
        window.localStorage.removeItem(PKCE_STATE_STORAGE_KEY);
        await secureStore.deleteSecureItem(PKCE_VERIFIER_STORAGE_KEY);
        await secureStore.deleteSecureItem(PKCE_LABEL_STORAGE_KEY);

        // 4. Trigger immediate background sync for messages and OTPs
        try {
          const { syncEngine } = await import('./syncEngine');
          syncEngine.syncAccount(account.id).catch(err => {
            console.warn('[OAuthService] Initial sync error:', err);
          });
        } catch (err) {
          console.warn('[OAuthService] Failed to trigger syncEngine:', err);
        }

        // 5. Navigate to /dashboard
        try {
          const { router } = await import('expo-router');
          router.replace('/dashboard');
        } catch (e) {
          console.warn('[OAuthService] Router navigation notice:', e);
        }

        return {
          handled: true,
          success: true,
          account,
        };
      } catch (err: any) {
        console.error('[OAuthService] Failed to process OAuth callback:', err);
        window.history.replaceState({}, document.title, window.location.pathname);
        return { handled: true, success: false, error: err.message || 'OAuth callback exchange failed' };
      }
    }

    return { handled: false, success: false };
  },

  /**
   * Checks for an existing persistent session on cold boot.
   * If valid tokens exist, returns the active session so UI can hydrate immediately.
   */
  async checkAndHydrateSession(): Promise<UserSession | null> {
    try {
      const session = await secureStore.getActiveSession();
      if (!session || !session.accountId) return null;

      const tokens = await secureStore.getTokens(session.accountId);
      if (!tokens || !tokens.accessToken) {
        // Stale session
        await secureStore.clearActiveSession();
        return null;
      }

      return session;
    } catch (err) {
      console.warn('[OAuthService] Session recovery error:', err);
      return null;
    }
  },

  /**
   * Completes account registration and stores persistent tokens in the secure vault.
   */
  async registerConnectedAccount(
    profile: UserProfileResponse,
    tokens: AccountTokens,
    label: string
  ): Promise<Account> {
    const accountId = `acc_${profile.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    await secureStore.saveTokens(accountId, tokens);
    await secureStore.saveTokens(profile.email.toLowerCase().trim(), tokens);

    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4', '#EC4899', '#6366F1'];
    const color = colors[Math.abs(profile.email.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colors.length];

    const account: Account = {
      id: accountId,
      email: profile.email.toLowerCase().trim(),
      label: label.trim() || 'Work',
      avatarColor: color,
      status: 'idle',
      lastSyncedAt: null,
      historyId: `hist_${Date.now()}`,
      unreadCount: 0,
      otpCount: 0,
      createdAt: new Date().toISOString(),
      picture: profile.picture || null,
    };

    await db.upsertAccount(account);
    return account;
  },

  /**
   * Explicit User Logout / Sign Out.
   * Revokes Google tokens, clears the secure vault, wipes local database state,
   * and prepares a clean slate.
   */
  async logoutUser(): Promise<void> {
    try {
      const session = await secureStore.getActiveSession();
      if (session) {
        const tokens = await secureStore.getTokens(session.accountId);
        if (tokens?.accessToken) {
          // Attempt token revocation with Google
          try {
            await fetch(`${GOOGLE_REVOKE_ENDPOINT}?token=${encodeURIComponent(tokens.accessToken)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
          } catch {
            // Revocation network errors do not block local logout
          }
        }
      }
    } catch {
      // Ignore errors during revocation
    }

    // Completely wipe secure vault & database data
    await secureStore.wipeVault();
    await db.flushAllData();
  },
};
