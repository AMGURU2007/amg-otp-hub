# AMG OTP Hub 🛡️
> Private, Local-First, Multi-Account Gmail Workspace & Context-Aware OTP Aggregator

AMG OTP Hub is a cross-platform application (**Web PWA, Android APK, Windows Tauri**) that brings 15+ target Gmail accounts into one unified, contact-first interface. It continuously monitors incoming emails, heuristic-classifies 2FA/login verification codes (OTPs), and exposes them in a unified feed with 1-click clipboard copy—completely local-first with zero central servers.

---

## 🌟 Key Features

- **Local-First SQLite Engine & OS Token Vault**:
  - All email records, parsed OTPs, and metadata persist in device-local storage.
  - Sensitive OAuth 2.0 access and refresh tokens are encrypted using the operating system's native Keystore/Keychain (`expo-secure-store`) rather than plain SQLite tables.
  - Zero cloud relay: Your client talks directly to Google APIs via TLS.
- **Support for 15+ Target Accounts**:
  - Organize accounts by domain/purpose like messaging contacts: `College` (`college@gmail.com`), `Programming` (`dev@gmail.com`), `Hackathons` (`team@gmail.com`), `Office` (`office@gmail.com`), `Crypto Vault`, `Gaming & Discord`, etc.
  - Individual history cursor per account: Independent incremental sync using Gmail `historyId`. If one account experiences a network or auth error, other accounts continue syncing unaffected.
- **Context-Aware Heuristic OTP Parser**:
  - Differentiates true verification codes from decoys (invoice numbers, order IDs, currency amounts, dates, commit SHAs, IP addresses).
  - Handles 4-8 digit numeric codes, alphanumeric codes (Steam Guard), and Google `G-` codes.
  - Computes confidence scores (`HIGH`, `MEDIUM`, `LOW`) and extracts estimated expiration windows.
- **1-Click Copy & Instant Feedback**:
  - Cross-platform clipboard copy with audio-visual chime and toast confirmation.
  - Mark codes as used/read to keep the active feed clean.
- **Deep Source Message Inspection**:
  - Open any OTP card to view the exact raw email headers, metadata, and full plain text message with the extracted OTP highlighted.
- **Data Retention & Privacy Controls**:
  - Configurable retention policy (7, 14, 30, 90 days, or Forever).
  - Purge expired messages with one click.
  - Export and import non-secret JSON backups.
- **Immediate Demo / Seed Workspace Mode**:
  - Pre-populated with 16 realistic target accounts and sample emails across GitHub, Google, AWS, Microsoft, Discord, OpenAI, and Steam.
  - Fully interactive on first run with simulated sync capabilities.

---

## 🏗️ Architecture & File Structure

```text
AMG-OTP-HUB/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Responsive shell: Sidebar on Desktop/Web (>=768px), Bottom Tabs on Mobile (<768px)
│   ├── index.tsx                 # Welcome / Onboarding / Quick Launch & Demo Mode Toggle
│   ├── dashboard.tsx             # Overview stats (15+ Target Accounts, New OTPs, Active Platforms), Quick Contacts & Latest OTPs
│   ├── accounts.tsx              # Account Manager: Connect Gmail, Assign Custom Labels, Sync Status, Disconnect
│   ├── inbox.tsx                 # Individual Inbox View: Contact-selected email list, message reader modal, manual sync retry
│   ├── otp.tsx                   # Unified OTP Feed: Chronological verification codes across all accounts, confidence badges, 1-click copy
│   └── settings.tsx              # Privacy, Retention Policy auto-cleanup, Non-secret JSON Backup/Restore, Theme toggle, OAuth Client ID config
├── src/
│   ├── components/               # Shared UI components
│   │   ├── SidebarNav.tsx        # Sticky desktop navigation + contact quick-switcher + Local-First status badge
│   │   ├── TopBar.tsx            # Breadcrumb, Sync Status Pill (pulsing green dot), Global Search input, Quick Sync button
│   │   ├── StatCard.tsx          # Hero metric cards (Target accounts, New OTPs, Platforms)
│   │   ├── AccountContactCard.tsx# Messaging-style contact row with avatar, label, email, unread/OTP badge, sync state
│   │   ├── OtpCard.tsx           # Verification item with service name, account label, timestamp, code display, confidence badge, 1-click copy
│   │   ├── EmailRow.tsx          # Inbox message item with sender, subject, snippet, OTP indicator pill
│   │   ├── SourceEmailModal.tsx  # Modal to inspect full source email body & metadata from any OTP card
│   │   └── Toast.tsx             # Floating toast notification ("Copied 849201 from Programming account")
│   ├── services/                 # Core business logic
│   │   ├── oauthService.ts       # Google OAuth 2.0 PKCE flow per account (`gmail.readonly`)
│   │   ├── gmailService.ts       # Gmail REST API over HTTPS (`messages.list`, `messages.get`, `users.history.list`)
│   │   ├── syncEngine.ts         # First-connection fetch + Incremental Sync via Gmail `historyId` cursor + independent retry
│   │   └── otpParser.ts          # Context-aware heuristic OTP classifier & extractor
│   ├── storage/                  # Local database & persistence
│   │   ├── database.ts           # SQLite schema initialization, CRUD queries, retention policy cleanup, non-secret JSON export/import
│   │   ├── secureStore.ts        # Encrypted token vault wrapper (never stores tokens in plain SQLite)
│   │   └── seedData.ts           # Rich realistic multi-account dataset for immediate UI validation
│   ├── adapters/                 # Platform-specific abstraction layer
│   │   ├── oauthAdapter.ts       # Web redirect / Android intent / Windows Tauri deep-link callback handlers
│   │   ├── storageAdapter.ts     # Web IndexedDB/localStorage fallback vs Native SQLite & Keystore/Keychain
│   │   ├── clipboardAdapter.ts   # Cross-platform 1-click clipboard copy with feedback trigger
│   │   └── notificationAdapter.ts# Local desktop/mobile OTP arrival notification adapter
│   ├── hooks/
│   │   ├── useAccounts.ts        # State & CRUD actions for connected Gmail accounts
│   │   ├── useOtpFeed.ts         # Filtered, searchable unified OTP stream + copy handler
│   │   └── useSync.ts            # Incremental sync state, per-account loading/error indicators, manual refresh
│   ├── types/
│   │   └── index.ts              # Strict TypeScript interfaces
│   └── theme/
│       └── tokens.ts             # Design system color tokens, typography, shadows, and breakpoints
├── app.json
├── package.json
├── eas.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 2. Start Local Development Server
```bash
# Start Metro bundler
npx expo start

# Run in Web browser
npx expo start --web

# Run on Android device / emulator
npx expo start --android
```

---

## 🔑 Google Cloud OAuth 2.0 Configuration

To connect live Google accounts beyond the pre-loaded Demo Workspace:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g. `AMG-OTP-Hub`).
3. Enable the **Gmail API** under **APIs & Services > Library**.
4. Configure the OAuth Consent Screen:
   - User Type: **External** (or Internal for Workspace organizations).
   - Scopes: Add `https://www.googleapis.com/auth/gmail.readonly` and `userinfo.email`.
   - Test Users: Add your target Gmail accounts while in testing status.
5. Create OAuth 2.0 Client IDs:
   - **Web Application**: Authorized redirect URI: `http://localhost:8081/oauth/callback` (or your production origin).
   - **Android Application**: Package name `com.amg.otphub`, add your SHA-1 certificate fingerprint.
   - **Desktop / Tauri**: Custom scheme `amgotphub://oauth/callback`.
6. Open **Settings** in the AMG OTP Hub app and enter the Client IDs in the designated fields.

---

## 🔒 Security & Privacy Guarantees

- **Minimal Scope**: Only requests `gmail.readonly`. The application cannot send emails, delete messages, modify drafts, or alter Google account settings.
- **Local SQLite Engine**: Messages and history markers are stored locally on your device.
- **Hardware/OS Token Encryption**: Refresh tokens and access tokens are saved in platform keychains (`expo-secure-store`) and are never written to plain text databases.
- **Zero Telemetry**: No third-party analytical SDKs or central tracking beacons.
