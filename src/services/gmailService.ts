import { EmailMessage, EmailFolder } from '../types';

export const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

export interface GmailProfileResponse {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailListMessagesResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface GmailHistoryResponse {
  history?: Array<{
    id: string;
    messages?: Array<{ id: string; threadId: string }>;
    messagesAdded?: Array<{ message: { id: string; threadId: string; labelIds?: string[] } }>;
  }>;
  nextPageToken?: string;
  historyId?: string;
}

export const gmailService = {
  async getProfile(accessToken: string): Promise<GmailProfileResponse> {
    const url = `${GMAIL_API_BASE}/profile`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gmail getProfile failed [${res.status}]: ${err}`);
    }

    return await res.json();
  },

  async listMessages(
    accessToken: string,
    options: { maxResults?: number; q?: string; pageToken?: string } = {}
  ): Promise<GmailListMessagesResponse> {
    const params = new URLSearchParams();
    params.set('maxResults', String(options.maxResults || 25));
    params.set('includeSpamTrash', 'true');
    const query = options.q ? `(${options.q}) -in:trash` : '(in:inbox OR in:spam) -in:trash';
    params.set('q', query);
    if (options.pageToken) params.set('pageToken', options.pageToken);

    const url = `${GMAIL_API_BASE}/messages?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gmail listMessages failed [${res.status}]: ${err}`);
    }

    return await res.json();
  },

  async getMessage(accessToken: string, messageId: string): Promise<any> {
    const url = `${GMAIL_API_BASE}/messages/${messageId}?format=full`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gmail getMessage(${messageId}) failed [${res.status}]: ${err}`);
    }

    return await res.json();
  },

  async listHistory(
    accessToken: string,
    startHistoryId: string,
    maxResults = 50
  ): Promise<GmailHistoryResponse> {
    const params = new URLSearchParams({
      startHistoryId,
      maxResults: String(maxResults),
      historyTypes: 'messageAdded',
    });

    const url = `${GMAIL_API_BASE}/history?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('HISTORY_EXPIRED');
      }
      const err = await res.text();
      throw new Error(`Gmail listHistory failed [${res.status}]: ${err}`);
    }

    return await res.json();
  },

  decodeBase64Url(input: string): string {
    try {
      let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      if (typeof atob === 'function') {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder('utf-8').decode(bytes);
      }
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(base64, 'base64').toString('utf-8');
      }
      return '';
    } catch {
      return '';
    }
  },

  extractMessageBody(payload: any): { plain: string; html?: string } {
    let plain = '';
    let html = '';

    const traverse = (part: any) => {
      if (!part) return;
      if (part.mimeType === 'text/plain' && part.body?.data) {
        plain += this.decodeBase64Url(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        html += this.decodeBase64Url(part.body.data);
      }
      if (part.parts && Array.isArray(part.parts)) {
        for (const subPart of part.parts) {
          traverse(subPart);
        }
      }
    };

    if (payload) {
      if (payload.body?.data) {
        if (payload.mimeType === 'text/plain') {
          plain = this.decodeBase64Url(payload.body.data);
        } else if (payload.mimeType === 'text/html') {
          html = this.decodeBase64Url(payload.body.data);
        }
      }
      if (payload.parts) {
        traverse(payload);
      }
    }

    return { plain: plain.trim(), html: html.trim() || undefined };
  },

  normalizeGmailMessage(raw: any, accountId: string): EmailMessage {
    const headers = raw.payload?.headers || [];
    const getHeader = (name: string): string => {
      const h = headers.find((item: any) => item.name?.toLowerCase() === name.toLowerCase());
      return h ? h.value : '';
    };

    const senderHeader = getHeader('From');
    let senderName = '';
    let senderEmail = senderHeader;

    const nameMatch = senderHeader.match(/^(.*?)\s*<(.+?)>$/);
    if (nameMatch) {
      senderName = nameMatch[1].replace(/["']/g, '').trim();
      senderEmail = nameMatch[2].trim();
    } else {
      senderName = senderHeader.split('@')[0];
    }

    const { plain, html } = this.extractMessageBody(raw.payload);
    const labelIds: string[] = raw.labelIds || [];
    let folder: EmailFolder = 'PRIMARY';
    if (labelIds.includes('SPAM')) {
      folder = 'SPAM';
    } else if (labelIds.includes('CATEGORY_UPDATES') || labelIds.includes('CATEGORY_PROMOTIONS')) {
      folder = 'UPDATES';
    }

    return {
      id: raw.id,
      accountId,
      threadId: raw.threadId,
      sender: senderEmail,
      senderName: senderName || senderEmail,
      recipient: getHeader('To'),
      subject: getHeader('Subject') || '(No Subject)',
      snippet: raw.snippet || '',
      bodyPlain: plain || raw.snippet || '',
      bodyHtml: html,
      internalDate: parseInt(raw.internalDate || String(Date.now()), 10),
      hasOtp: false,
      isRead: !labelIds.includes('UNREAD'),
      labels: labelIds,
      folder,
    };
  },
};
