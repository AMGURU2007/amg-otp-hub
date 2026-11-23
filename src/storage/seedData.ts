import { Account, EmailMessage, OtpEntry, AppSettings } from '../types';

// Production default: 100% clean, empty arrays on launch
export const SEED_ACCOUNTS: Account[] = [];
export const SEED_EMAILS: EmailMessage[] = [];
export const SEED_OTPS: OtpEntry[] = [];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'dark',
  retentionDays: 14,
  autoSyncIntervalMin: 5,
  demoMode: false,
  notifyNewOtp: true,
  soundEnabled: true,
  maskOtpsByDefault: true,
  googleClientIdWeb: '',
  googleClientIdAndroid: '',
  googleClientIdDesktop: '',
};

// Preset catalog for optional one-click dynamic injection
export const SAMPLE_ACCOUNT_TEMPLATES = [
  { label: 'College', email: 'college@gmail.com', avatarColor: '#00e5ff' },
  { label: 'Programming', email: 'dev@gmail.com', avatarColor: '#10b981' },
  { label: 'Hackathons', email: 'team@gmail.com', avatarColor: '#a855f7' },
  { label: 'Office', email: 'office@gmail.com', avatarColor: '#f59e0b' },
  { label: 'Personal', email: 'personal@gmail.com', avatarColor: '#3b82f6' },
  { label: 'Crypto', email: 'crypto.vault@gmail.com', avatarColor: '#ec4899' },
];

export const SAMPLE_EMAIL_TEMPLATES = [
  {
    sender: 'no-reply@github.com',
    senderName: 'GitHub Security',
    subject: '[GitHub] Please verify your device - 849201',
    bodyPlain: `Hey developer,\n\nYour GitHub verification code is:\n849201\n\nThis code will expire in 10 minutes.\n\nThanks,\nGitHub Security Team`,
  },
  {
    sender: 'accounts.google.com',
    senderName: 'Google Account Protection',
    subject: 'Google Verification Code: G-394821',
    bodyPlain: `G-394821 is your Google verification code.\n\nNever share this code with anyone.\nGoogle LLC`,
  },
  {
    sender: 'no-reply-aws@amazon.com',
    senderName: 'Amazon Web Services',
    subject: 'Your AWS account verification code',
    bodyPlain: `Your AWS sign-in verification code is: 620419\n\nUse this code within 15 minutes to confirm your root/IAM session.`,
  },
  {
    sender: 'accountprotection.microsoft.com',
    senderName: 'Microsoft Security',
    subject: 'Microsoft account security code: 903412',
    bodyPlain: `Use security code 903412 for Microsoft authentication.\n\nThanks,\nMicrosoft Account Team`,
  },
];
