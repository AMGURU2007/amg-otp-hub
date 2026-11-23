import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

export interface OAuthPKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
}

export interface ParsedOAuthCallback {
  code?: string;
  accessToken?: string;
  tokenType?: string;
  expiresIn?: number;
  state?: string;
  error?: string;
  errorDescription?: string;
}

export const oauthAdapter = {
  getRedirectUri(): string {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
      }
      return 'http://localhost:8081';
    }
    // Android custom deep link scheme defined in app.json (scheme: "amgotphub")
    return 'amgotphub:/oauthredirect';
  },

  buildGoogleAuthUrl(options: {
    clientId: string;
    redirectUri: string;
    isWeb?: boolean;
    state?: string;
    codeChallenge?: string;
    scope?: string;
  }): string {
    const isWeb = options.isWeb ?? (Platform.OS === 'web');
    const scope =
      options.scope ||
      'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

    const params = new URLSearchParams({
      client_id: options.clientId,
      redirect_uri: options.redirectUri,
      response_type: isWeb ? 'token' : 'code',
      scope,
      prompt: 'consent select_account',
    });

    if (options.state) {
      params.set('state', options.state);
    }

    if (!isWeb) {
      params.set('access_type', 'offline');
      if (options.codeChallenge) {
        params.set('code_challenge', options.codeChallenge);
        params.set('code_challenge_method', 'S256');
      }
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  async generatePKCE(): Promise<OAuthPKCEChallenge> {
    const rawVerifier = this.generateRandomString(64);
    // Base64-URL encode SHA256 of verifier
    let codeChallenge = rawVerifier;
    try {
      const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawVerifier,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );
      codeChallenge = digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch {
      // In web or fallback environments
      if (typeof window !== 'undefined' && window.crypto?.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(rawVerifier);
        const hash = await window.crypto.subtle.digest('SHA-256', data);
        const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
        codeChallenge = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      }
    }

    return {
      codeVerifier: rawVerifier,
      codeChallenge,
    };
  },

  generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      result += charset[randomIndex];
    }
    return result;
  },

  parseCallbackUrl(url: string): ParsedOAuthCallback {
    try {
      let code: string | undefined;
      let accessToken: string | undefined;
      let tokenType: string | undefined;
      let expiresIn: number | undefined;
      let state: string | undefined;
      let error: string | undefined;
      let errorDescription: string | undefined;

      // 1. Check query parameters (?code=...&state=...)
      const queryIndex = url.indexOf('?');
      if (queryIndex !== -1) {
        const queryString = url.substring(queryIndex + 1).split('#')[0];
        const params = new URLSearchParams(queryString);
        code = params.get('code') || undefined;
        state = params.get('state') || undefined;
        error = params.get('error') || undefined;
        errorDescription = params.get('error_description') || undefined;
      }

      // 2. Check hash fragment (#access_token=...&expires_in=...)
      const hashIndex = url.indexOf('#');
      if (hashIndex !== -1) {
        const hashString = url.substring(hashIndex + 1);
        const hashParams = new URLSearchParams(hashString);
        if (!accessToken) accessToken = hashParams.get('access_token') || undefined;
        if (!tokenType) tokenType = hashParams.get('token_type') || undefined;
        if (!state) state = hashParams.get('state') || undefined;
        if (!error) error = hashParams.get('error') || undefined;
        if (!errorDescription) errorDescription = hashParams.get('error_description') || undefined;
        const exp = hashParams.get('expires_in');
        if (exp) expiresIn = parseInt(exp, 10);
      }

      return {
        code,
        accessToken,
        tokenType,
        expiresIn,
        state,
        error,
        errorDescription,
      };
    } catch {
      return {};
    }
  }
};
