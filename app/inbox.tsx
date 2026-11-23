import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Radius, Spacing, Typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/ThemeContext';
import { useLanguage } from '../src/i18n/LanguageContext';
import { TopBar } from '../src/components/TopBar';
import { EmailRow } from '../src/components/EmailRow';
import { SourceEmailModal } from '../src/components/SourceEmailModal';
import { useApp } from './_layout';
import { db } from '../src/storage/database';
import { EmailMessage, OtpEntry } from '../src/types';
import {
  Mail,
  ShieldCheck,
  Search,
  RefreshCw,
  Inbox as InboxIcon,
  Plus,
  Send,
  Sparkles,
  AlertCircle,
} from 'lucide-react-native';

export default function InboxScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const {
    accounts,
    selectedAccountId,
    setSelectedAccountId,
    syncAccount,
    isSyncing,
    lastSyncTime,
    showToast,
    openMobileMenu,
    isDesktop,
    refreshAccounts,
  } = useApp();

  const activeAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0] || null;

  const [emails, setEmails] = useState<EmailMessage[]>(() => {
    return activeAccount ? db.getEmailsSync(activeAccount.id) : [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterOtpsOnly, setFilterOtpsOnly] = useState<boolean>(false);
  const [currentFolder, setCurrentFolder] = useState<'PRIMARY' | 'SPAM' | 'ALL'>('PRIMARY');

  // Inspector modal
  const [inspectModalVisible, setInspectModalVisible] = useState(false);
  const [inspectedEmail, setInspectedEmail] = useState<EmailMessage | null>(null);
  const [highlightOtp, setHighlightOtp] = useState<OtpEntry | null>(null);

  const loadEmails = useCallback(async () => {
    if (!activeAccount) {
      setEmails([]);
      return;
    }
    try {
      const list = await db.getEmails(activeAccount.id, 100);
      setEmails(list);
    } catch (err) {
      console.warn('[Inbox] load emails warning:', err);
    }
  }, [activeAccount]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  const handleOpenEmail = async (email: EmailMessage) => {
    await db.markEmailRead(email.id, true);
    let otp: OtpEntry | null = null;
    if (email.otpId) {
      otp = await db.getOtpById(email.otpId);
    }
    setInspectedEmail(email);
    setHighlightOtp(otp);
    setInspectModalVisible(true);
    await loadEmails();
  };

  const spamCount = emails.filter(
    e => e.folder === 'SPAM' || (e.labels || []).includes('SPAM')
  ).length;
  const primaryCount = emails.filter(
    e => e.folder !== 'SPAM' && !(e.labels || []).includes('SPAM')
  ).length;
  const allCount = emails.length;

  const filteredEmails = emails.filter(e => {
    const isMsgSpam = e.folder === 'SPAM' || (e.labels || []).includes('SPAM');
    if (currentFolder === 'PRIMARY' && isMsgSpam) return false;
    if (currentFolder === 'SPAM' && !isMsgSpam) return false;
    if (filterOtpsOnly && !e.hasOtp) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.subject.toLowerCase().includes(q) ||
        e.sender.toLowerCase().includes(q) ||
        e.snippet.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSyncCurrentAccount = async () => {
    if (!activeAccount) return;
    const ok = await syncAccount(activeAccount.id);
    await loadEmails();
    showToast(ok ? `Synced ${activeAccount.label}` : `Sync failed`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title={activeAccount ? activeAccount.label : t('navInbox')}
        subtitle={activeAccount ? activeAccount.email : undefined}
        isSyncing={isSyncing}
        onOpenMobileMenu={openMobileMenu}
        onSyncPress={handleSyncCurrentAccount}
        lastSyncTime={lastSyncTime}
      />

      {accounts.length === 0 ? (
        <View style={styles.noAccountsWrapper}>
          <View
            style={[
              styles.emptyStateBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <InboxIcon size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
              No Connected Accounts
            </Text>
            <Text style={[styles.emptyStateDesc, { color: colors.textMuted }]}>
              Link a Gmail target account or inject sample incoming emails to populate the inbox.
            </Text>
            <View style={styles.emptyBtnRow}>
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: colors.primaryBtnBg }]}
                onPress={() => router.push('/accounts')}
              >
                <Plus size={16} color={colors.primaryBtnText} />
                <Text style={[styles.primaryActionBtnText, { color: colors.primaryBtnText }]}>
                  Connect Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.bodySplit}>
          {/* Left Column: Account Contact Switcher (Desktop only) */}
          {isDesktop && (
            <View
              style={[
                styles.leftContactsPanel,
                {
                  backgroundColor: colors.surface,
                  borderRightColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.leftPanelHeader,
                  { borderBottomColor: colors.borderLight },
                ]}
              >
                <InboxIcon size={16} color={colors.primary} />
                <Text style={[styles.leftPanelTitle, { color: colors.textSecondary }]}>
                  ACCOUNT INBOXES
                </Text>
              </View>

              <ScrollView style={styles.accountsList} showsVerticalScrollIndicator={false}>
                {accounts.map(acc => {
                  const isSelected = activeAccount?.id === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      style={[
                        styles.accountItem,
                        isSelected && {
                          backgroundColor: colors.surfaceSecondary,
                          borderColor: colors.border,
                          borderWidth: 1,
                        },
                      ]}
                      onPress={() => setSelectedAccountId(acc.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.avatarBox,
                          { backgroundColor: acc.avatarColor || colors.primary },
                        ]}
                      >
                        <Text style={styles.avatarChar}>
                          {acc.label.slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.accountTextCol}>
                        <Text
                          style={[
                            styles.accountLabel,
                            { color: isSelected ? colors.primary : colors.textPrimary },
                            isSelected && { fontWeight: '700' },
                          ]}
                          numberOfLines={1}
                        >
                          {acc.label}
                        </Text>
                        <Text
                          style={[styles.accountEmail, { color: colors.textMuted }]}
                          numberOfLines={1}
                        >
                          {acc.email}
                        </Text>
                      </View>
                      {acc.otpCount > 0 && (
                        <View
                          style={[
                            styles.otpBadge,
                            {
                              backgroundColor: colors.emeraldLight,
                              borderColor: colors.emeraldBorder,
                            },
                          ]}
                        >
                          <Text style={[styles.otpBadgeText, { color: colors.emerald }]}>
                            {acc.otpCount}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Right Column / Mobile Main Content */}
          <View style={styles.rightContentPanel}>
            {/* Mobile Account Horizontal Chips */}
            {!isDesktop && (
              <View
                style={[
                  styles.mobileAccountBar,
                  {
                    backgroundColor: colors.surface,
                    borderBottomColor: colors.borderLight,
                  },
                ]}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.mobileChipsList}
                >
                  {accounts.map(acc => {
                    const isSelected = activeAccount?.id === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        style={[
                          styles.mobileChip,
                          {
                            backgroundColor: isSelected
                              ? colors.primaryLight
                              : colors.surfaceSecondary,
                            borderColor: isSelected ? colors.primary : colors.borderLight,
                          },
                        ]}
                        onPress={() => setSelectedAccountId(acc.id)}
                      >
                        <Text
                          style={[
                            styles.mobileChipText,
                            { color: isSelected ? colors.primary : colors.textSecondary },
                            isSelected && { fontWeight: '700' },
                          ]}
                        >
                          {acc.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Gmail-Replica Folder Navigation Tabs */}
            <View
              style={[
                styles.gmailFolderTabBar,
                { backgroundColor: colors.surface, borderBottomColor: colors.borderLight },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.gmailFolderTab,
                  currentFolder === 'PRIMARY' && [
                    styles.gmailFolderTabActive,
                    { borderBottomColor: colors.primary },
                  ],
                ]}
                onPress={() => setCurrentFolder('PRIMARY')}
                activeOpacity={0.7}
              >
                <InboxIcon
                  size={16}
                  color={currentFolder === 'PRIMARY' ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.gmailFolderTabText,
                    {
                      color:
                        currentFolder === 'PRIMARY' ? colors.primary : colors.textSecondary,
                    },
                    currentFolder === 'PRIMARY' && { fontWeight: '700' },
                  ]}
                >
                  Primary
                </Text>
                <View
                  style={[
                    styles.folderBadge,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Text style={[styles.folderBadgeText, { color: colors.primary }]}>
                    {primaryCount}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.gmailFolderTab,
                  currentFolder === 'SPAM' && [
                    styles.gmailFolderTabActive,
                    { borderBottomColor: colors.amber },
                  ],
                ]}
                onPress={() => setCurrentFolder('SPAM')}
                activeOpacity={0.7}
              >
                <AlertCircle
                  size={16}
                  color={currentFolder === 'SPAM' ? colors.amber : colors.textMuted}
                />
                <Text
                  style={[
                    styles.gmailFolderTabText,
                    {
                      color: currentFolder === 'SPAM' ? colors.amber : colors.textSecondary,
                    },
                    currentFolder === 'SPAM' && { fontWeight: '700' },
                  ]}
                >
                  Spam
                </Text>
                {spamCount > 0 && (
                  <View
                    style={[
                      styles.folderBadge,
                      { backgroundColor: colors.amberLight },
                    ]}
                  >
                    <Text style={[styles.folderBadgeText, { color: colors.amber }]}>
                      {spamCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.gmailFolderTab,
                  currentFolder === 'ALL' && [
                    styles.gmailFolderTabActive,
                    { borderBottomColor: colors.purple || '#a855f7' },
                  ],
                ]}
                onPress={() => setCurrentFolder('ALL')}
                activeOpacity={0.7}
              >
                <Mail
                  size={16}
                  color={
                    currentFolder === 'ALL'
                      ? colors.purple || '#a855f7'
                      : colors.textMuted
                  }
                />
                <Text
                  style={[
                    styles.gmailFolderTabText,
                    {
                      color:
                        currentFolder === 'ALL'
                          ? colors.purple || '#a855f7'
                          : colors.textSecondary,
                    },
                    currentFolder === 'ALL' && { fontWeight: '700' },
                  ]}
                >
                  All Mail
                </Text>
                <View
                  style={[
                    styles.folderBadge,
                    { backgroundColor: colors.surfaceSecondary },
                  ]}
                >
                  <Text style={[styles.folderBadgeText, { color: colors.textMuted }]}>
                    {allCount}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Sub-toolbar: Search & OTPs Only Filter */}
            <View
              style={[
                styles.filterToolbar,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: colors.borderLight,
                },
              ]}
            >
              <View
                style={[
                  styles.searchBox,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <Search size={14} color={colors.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: colors.textPrimary }]}
                  placeholder={`Search ${activeAccount?.label || ''} messages...`}
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <View style={styles.filterTabsGroup}>
                <TouchableOpacity
                  style={[
                    styles.filterTab,
                    !filterOtpsOnly && {
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => setFilterOtpsOnly(false)}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      { color: !filterOtpsOnly ? colors.textPrimary : colors.textMuted },
                    ]}
                  >
                    All ({emails.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterTab,
                    filterOtpsOnly && {
                      backgroundColor: colors.emeraldLight,
                      borderColor: colors.emeraldBorder,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => setFilterOtpsOnly(true)}
                >
                  <ShieldCheck
                    size={13}
                    color={filterOtpsOnly ? colors.emerald : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.filterTabText,
                      { color: filterOtpsOnly ? colors.emerald : colors.textMuted },
                      filterOtpsOnly && { fontWeight: '700' },
                    ]}
                  >
                    OTPs Only
                  </Text>
                </TouchableOpacity>

              </View>
            </View>

            {/* Email Messages Stream */}
            <ScrollView style={styles.scrollArea} contentContainerStyle={styles.listContainer}>
              {isLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                    Fetching messages for {activeAccount?.label}...
                  </Text>
                </View>
              ) : filteredEmails.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Mail size={38} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                    No messages found
                  </Text>
                  <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                    {filterOtpsOnly
                      ? 'No verification code emails detected in this account.'
                      : 'This inbox has no messages yet. Sync your connected Gmail account to pull messages.'}
                  </Text>
                  {activeAccount && (
                    <TouchableOpacity
                      style={[styles.primaryActionBtn, { backgroundColor: colors.primaryBtnBg }]}
                      onPress={async () => {
                        await syncAccount(activeAccount.id);
                        await loadEmails();
                      }}
                    >
                      <RefreshCw size={15} color={colors.primaryBtnText} />
                      <Text style={[styles.primaryActionBtnText, { color: colors.primaryBtnText }]}>
                        Sync Account Now
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.emailContainer}>
                  {filteredEmails.map(email => (
                    <EmailRow
                      key={email.id}
                      email={email}
                      onPress={() => handleOpenEmail(email)}
                    />
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Source Email Reader Modal */}
      <SourceEmailModal
        visible={inspectModalVisible}
        onClose={() => setInspectModalVisible(false)}
        email={inspectedEmail}
        highlightOtp={highlightOtp}
        onCopied={msg => showToast(msg)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  noAccountsWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  bodySplit: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
  },
  leftContactsPanel: {
    width: 260,
    borderRightWidth: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  leftPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  leftPanelTitle: {
    fontSize: 10,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 0.8,
  },
  accountsList: {
    flex: 1,
    padding: Spacing.sm,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
    marginBottom: 2,
  },
  avatarBox: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChar: {
    color: '#07101d',
    fontSize: 12,
    fontWeight: 'bold',
  },
  accountTextCol: {
    flex: 1,
  },
  accountLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
  },
  accountEmail: {
    fontSize: 10,
  },
  otpBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  otpBadgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeights.bold,
  },
  rightContentPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  mobileAccountBar: {
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
  },
  mobileChipsList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  mobileChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  mobileChipText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
  },
  gmailFolderTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.sm,
  },
  gmailFolderTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  gmailFolderTabActive: {
    // borderBottomColor set dynamically
  },
  gmailFolderTabText: {
    fontSize: Typography.fontSizes.xs + 1,
    fontWeight: Typography.fontWeights.medium,
  },
  folderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  folderBadgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeights.bold,
  },
  filterToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm + 2,
    height: 36,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: Typography.fontSizes.xs + 1,
    paddingVertical: 0,
  },
  filterTabsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  filterTabText: {
    fontSize: Typography.fontSizes.xs,
  },
  injectEmailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  injectEmailBtnText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  listContainer: {
    flexGrow: 1,
  },
  emailContainer: {},
  loadingBox: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.fontSizes.sm,
  },
  emptyBox: {
    flex: 1,
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 280,
  },
  emptyTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  emptyDesc: {
    fontSize: Typography.fontSizes.xs + 1,
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: 8,
  },
  emptyStateBox: {
    padding: Spacing.xxl,
    borderRadius: Radius.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    maxWidth: 480,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
  },
  emptyStateDesc: {
    fontSize: Typography.fontSizes.xs + 1,
    textAlign: 'center',
    maxWidth: 400,
    lineHeight: 18,
    marginBottom: 10,
  },
  emptyBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: Radius.full,
  },
  primaryActionBtnText: {
    fontSize: Typography.fontSizes.xs + 1,
    fontWeight: Typography.fontWeights.bold,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: Typography.fontSizes.xs + 1,
    fontWeight: Typography.fontWeights.semibold,
  },
});
