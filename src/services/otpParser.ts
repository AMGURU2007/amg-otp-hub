import { OtpCodeType, OtpConfidence } from '../types';

export interface ParsedOtpResult {
  code: string;
  type: OtpCodeType;
  confidence: OtpConfidence;
  statusCategory: 'CONFIRMED' | 'UNCERTAIN';
  serviceName: string;
  expiresInMinutes?: number;
  snippet: string;
  score: number;
}

const TRUSTED_SENDER_DOMAINS = [
  'accounts.google.com',
  'google.com',
  'github.com',
  'microsoft.com',
  'accountprotection.microsoft.com',
  'amazon.com',
  'amazon.in',
  'aws.amazon.com',
  'discord.com',
  'slack.com',
  'apple.com',
  'openai.com',
  'vercel.com',
  'stripe.com',
  'uber.com',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'binance.com',
  'paypal.com',
  'steamcommunity.com',
  'steampowered.com',
  'instructure.com',
];

const SERVICE_PATTERNS: Array<{ name: string; matchers: RegExp[] }> = [
  { name: 'GitHub', matchers: [/github/i, /github\.com/i] },
  { name: 'Google', matchers: [/google/i, /accounts\.google\.com/i, /googlemail\.com/i] },
  { name: 'AWS', matchers: [/aws/i, /amazon web services/i, /amazon\.com/i] },
  { name: 'Microsoft', matchers: [/microsoft/i, /live\.com/i, /office365/i, /azure/i] },
  { name: 'Discord', matchers: [/discord/i, /discord\.com/i] },
  { name: 'OpenAI', matchers: [/openai/i, /chatgpt/i] },
  { name: 'Steam', matchers: [/steam/i, /steampowered\.com/i, /valve/i] },
  { name: 'Stripe', matchers: [/stripe/i, /stripe\.com/i] },
  { name: 'Vercel', matchers: [/vercel/i, /vercel\.com/i] },
  { name: 'Slack', matchers: [/slack/i, /slack\.com/i] },
  { name: 'Binance', matchers: [/binance/i, /binance\.com/i] },
  { name: 'DigitalOcean', matchers: [/digitalocean/i] },
  { name: 'Apple', matchers: [/apple/i, /icloud\.com/i, /appleid/i] },
  { name: 'Twitter/X', matchers: [/twitter/i, /x\.com/i] },
  { name: 'LinkedIn', matchers: [/linkedin/i] },
  { name: 'Uber', matchers: [/uber/i] },
  { name: 'Dropbox', matchers: [/dropbox/i] },
  { name: 'Canvas LMS', matchers: [/canvas/i, /instructure/i] },
];

const DECOY_PATTERNS = [
  /\b\d{4}[-/.]\d{2}[-/.]\d{2}\b/, // Dates like 2026-11-07
  /\b\d{2}[-/.]\d{2}[-/.]\d{4}\b/, // Dates like 07/11/2026
  /\b\$\s?\d+([.,]\d{2})?\b/,       // Currency $49.00
  /\b₹\s?\d+([.,]\d{2})?\b/,       // Currency ₹499
  /\binvoice\s*(?:#|no\.?|num)?\s*[:\s]?\s*[A-Z0-9-]{6,}\b/i, // Invoice numbers
  /\border\s*#?\s*\d{5,}\b/i,        // Order numbers
  /\btracking\s*(?:#|number)?\s*[:\s]?\s*[A-Z0-9]{8,}\b/i, // Tracking numbers
  /\bcommit\s+[0-9a-f]{7,40}\b/i,    // Git commit hashes
  /\b(?:19|20)\d{2}\b/,             // Standalone 4-digit years (1990 - 2099)
  /\b127\.0\.0\.1\b|\b192\.168\.\d+\.\d+\b/, // Local IPs
];

const HIGH_CONFIDENCE_PATTERNS = [
  /(?:verification\s+code\s*(?:is|:)?\s*)([A-Z0-9-]{4,8})/i,
  /(?:security\s+code\s*(?:is|:)?\s*)([A-Z0-9-]{4,8})/i,
  /(?:one-time\s+pass(?:code|word)\s*(?:is|:)?\s*)([A-Z0-9-]{4,8})/i,
  /(?:your\s+code\s*(?:is|:)?\s*)([A-Z0-9-]{4,8})/i,
  /(?:confirmation\s+code\s*(?:is|:)?\s*)([A-Z0-9-]{4,8})/i,
  /(?:enter\s+code\s*)([A-Z0-9-]{4,8})/i,
  /(?:use\s+code\s*)([A-Z0-9-]{4,8})/i,
  /(?:authentication\s+code\s*(?:is|:)?\s*)([A-Z0-9-]{4,8})/i,
  /(?:login\s+code\s*(?:is|:)?\s*)([A-Z0-9-]{4,8})/i,
  /(?:OTP\s*(?:is|:)?\s*)([A-Z0-9-]{4,8})/i,
  /\b(G-\d{6})\b/i, // Google G-code
];

export const otpParser = {
  detectServiceName(sender: string, senderName: string, subject: string): string {
    const combined = `${sender} ${senderName} ${subject}`;
    for (const service of SERVICE_PATTERNS) {
      if (service.matchers.some(regex => regex.test(combined))) {
        return service.name;
      }
    }
    if (senderName && senderName.length < 25 && !senderName.includes('@')) {
      return senderName.replace(/support|team|security|no-?reply|auth|notifications/gi, '').trim() || 'Service';
    }
    const match = sender.match(/@([^.]+)\./);
    if (match && match[1]) {
      const brand = match[1];
      return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
    return 'Security Service';
  },

  extractExpirationMinutes(text: string): number | undefined {
    const matchMin = text.match(/expires?\s+(?:in\s+)?(\d+)\s*(?:minutes?|mins?)\b/i);
    if (matchMin && matchMin[1]) {
      return parseInt(matchMin[1], 10);
    }
    const matchSec = text.match(/expires?\s+(?:in\s+)?(\d+)\s*(?:seconds?|secs?)\b/i);
    if (matchSec && matchSec[1]) {
      return Math.max(1, Math.round(parseInt(matchSec[1], 10) / 60));
    }
    const matchHours = text.match(/expires?\s+(?:in\s+)?(\d+)\s*(?:hours?|hrs?)\b/i);
    if (matchHours && matchHours[1]) {
      return parseInt(matchHours[1], 10) * 60;
    }
    return undefined;
  },

  parse(
    subject: string,
    bodyPlain: string,
    sender: string,
    senderName: string
  ): ParsedOtpResult | null {
    const fullText = `${subject}\n\n${bodyPlain}`;
    const serviceName = this.detectServiceName(sender, senderName, subject);
    const expiresInMinutes = this.extractExpirationMinutes(fullText);

    // Multi-signal scoring
    let baseScore = 0;
    const lowerSender = sender.toLowerCase();
    const isTrustedSender = TRUSTED_SENDER_DOMAINS.some(d => lowerSender.includes(d)) ||
      /noreply|no-reply|security|auth|verify|accounts/i.test(lowerSender);
    if (isTrustedSender) baseScore += 30;

    const hasStrongSubject = /verification|security\s+code|one-time|passcode|confirm\s+your|auth(?:entication)?\s+code|2FA|OTP/i.test(subject);
    if (hasStrongSubject) baseScore += 35;

    // 1. High-Confidence regex search
    for (const regex of HIGH_CONFIDENCE_PATTERNS) {
      const match = fullText.match(regex);
      if (match && match[1]) {
        const candidate = match[1].trim();
        if (this.isValidOtpCode(candidate, fullText)) {
          const totalScore = baseScore + 40;
          return {
            code: candidate,
            type: candidate.startsWith('G-') || /[A-Z]/i.test(candidate) ? 'ALPHANUMERIC' : 'NUMERIC',
            confidence: 'HIGH',
            statusCategory: totalScore >= 70 ? 'CONFIRMED' : 'UNCERTAIN',
            serviceName,
            expiresInMinutes,
            snippet: this.extractSnippetAround(fullText, candidate),
            score: totalScore,
          };
        }
      }
    }

    // 2. Medium-Confidence: Subject indicates verification code
    if (hasStrongSubject) {
      // Look for 4 to 8 digit numbers in text
      const digitsMatch = fullText.match(/\b([0-9]{4,8})\b/g);
      if (digitsMatch) {
        for (const candidate of digitsMatch) {
          if (this.isValidOtpCode(candidate, fullText)) {
            const totalScore = baseScore + 25;
            return {
              code: candidate,
              type: 'NUMERIC',
              confidence: totalScore >= 70 ? 'HIGH' : 'MEDIUM',
              statusCategory: totalScore >= 70 ? 'CONFIRMED' : 'UNCERTAIN',
              serviceName,
              expiresInMinutes,
              snippet: this.extractSnippetAround(fullText, candidate),
              score: totalScore,
            };
          }
        }
      }

      // Steam or alphanumeric 5-character token
      const alphaMatch = fullText.match(/\b([A-Z0-9]{5,7})\b/g);
      if (alphaMatch) {
        for (const candidate of alphaMatch) {
          if (/[A-Z]/.test(candidate) && /\d/.test(candidate) && this.isValidOtpCode(candidate, fullText)) {
            const totalScore = baseScore + 20;
            return {
              code: candidate,
              type: 'ALPHANUMERIC',
              confidence: 'MEDIUM',
              statusCategory: totalScore >= 70 ? 'CONFIRMED' : 'UNCERTAIN',
              serviceName,
              expiresInMinutes,
              snippet: this.extractSnippetAround(fullText, candidate),
              score: totalScore,
            };
          }
        }
      }
    }

    // 3. Loose fallback: body contains "code: " or "code is "
    const looseMatch = fullText.match(/\bcode\s*[:=-]\s*([A-Z0-9]{4,8})\b/i);
    if (looseMatch && looseMatch[1]) {
      const candidate = looseMatch[1].trim();
      if (this.isValidOtpCode(candidate, fullText)) {
        const totalScore = baseScore + 15;
        return {
          code: candidate,
          type: /[A-Z]/i.test(candidate) ? 'ALPHANUMERIC' : 'NUMERIC',
          confidence: 'LOW',
          statusCategory: 'UNCERTAIN',
          serviceName,
          expiresInMinutes,
          snippet: this.extractSnippetAround(fullText, candidate),
          score: totalScore,
        };
      }
    }

    return null;
  },

  isValidOtpCode(code: string, surroundingText: string): boolean {
    if (!code || code.length < 4 || code.length > 8) return false;

    // Filter out years (1990 - 2035) unless explicitly preceded by code/otp
    const num = parseInt(code, 10);
    if (!isNaN(num) && num >= 1990 && num <= 2035) {
      const isExplicitCode = /code\s*[:=-]?\s*20\d{2}|otp\s*[:=-]?\s*20\d{2}/i.test(surroundingText);
      if (!isExplicitCode) return false;
    }

    // Filter out common decoy patterns
    for (const decoy of DECOY_PATTERNS) {
      if (decoy.test(surroundingText)) {
        const match = surroundingText.match(decoy);
        if (match && match[0].includes(code) && !/verification code|your otp/i.test(surroundingText)) {
          return false;
        }
      }
    }

    return true;
  },

  extractSnippetAround(fullText: string, code: string): string {
    const index = fullText.indexOf(code);
    if (index === -1) {
      return fullText.slice(0, 110).replace(/\s+/g, ' ').trim() + '...';
    }
    const start = Math.max(0, index - 40);
    const end = Math.min(fullText.length, index + code.length + 55);
    const slice = fullText.substring(start, end).replace(/\s+/g, ' ').trim();
    return (start > 0 ? '...' : '') + slice + (end < fullText.length ? '...' : '');
  },
};
