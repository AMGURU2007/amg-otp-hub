export type AccountSyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'disconnected';

export interface Account {
  id: string;
  email: string;
  label: string; // e.g. "College", "Programming", "Hackathons", "Office", "Crypto", etc.
  avatarColor: string;
  status: AccountSyncStatus;
  lastSyncedAt: string | null;
  historyId: string | null;
  unreadCount: number;
  otpCount: number;
  createdAt: string;
  errorMessage?: string | null;
  picture?: string | null;
}

export type OtpCodeType = 'NUMERIC' | 'ALPHANUMERIC' | 'MAGIC_LINK';
export type OtpConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface OtpEntry {
  id: string;
  emailId: string;
  accountId: string;
  accountLabel: string;
  accountEmail: string;
  serviceName: string; // e.g. "GitHub", "Google", "AWS", "Discord", "OpenAI"
  code: string; // The extracted OTP (e.g. "849201", "G-394821")
  type: OtpCodeType;
  confidence: OtpConfidence;
  expiresInMinutes?: number | null;
  detectedAt: string;
  snippet: string;
  fullSubject: string;
  sender: string;
  isUsed?: boolean;
}

export interface EmailMessage {
  id: string;
  accountId: string;
  threadId: string;
  sender: string;
  senderName: string;
  recipient: string;
  subject: string;
  snippet: string;
  bodyPlain: string;
  bodyHtml?: string;
  internalDate: number; // Unix timestamp in ms
  hasOtp: boolean;
  otpId?: string;
  isRead: boolean;
  labels: string[];
}

export interface SyncState {
  accountId: string;
  status: AccountSyncStatus;
  lastSyncTime: string | null;
  errorMsg: string | null;
  itemsProcessed: number;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  retentionDays: number; // e.g. 7, 14, 30, 90
  autoSyncIntervalMin: number; // 0 = manual, 5, 15, 30
  demoMode: boolean;
  notifyNewOtp: boolean;
  soundEnabled: boolean;
  autoCopyOtp?: boolean;
  notificationsEnabled?: boolean;
  googleClientIdWeb: string;
  googleClientIdAndroid: string;
  googleClientIdDesktop: string;
}

export interface BackupPayload {
  version: string;
  exportedAt: string;
  accounts: Account[];
  emails: EmailMessage[];
  otps: OtpEntry[];
  settings: AppSettings;
}

export interface DashboardMetrics {
  totalTargetAccounts: number;
  activeAccounts: number;
  totalOtpsDetected: number;
  otpsToday: number;
  activePlatforms: string[];
  lastSyncOverall: string | null;
}

export type NavigationTab = 'dashboard' | 'accounts' | 'inbox' | 'otp' | 'settings';
