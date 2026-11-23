import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Radius, Spacing, Typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/ThemeContext';
import { useLanguage } from '../src/i18n/LanguageContext';
import { TopBar } from '../src/components/TopBar';
import { OtpCard } from '../src/components/OtpCard';
import { SourceEmailModal } from '../src/components/SourceEmailModal';
import { LiveEmailInjectorModal } from '../src/components/LiveEmailInjectorModal';
import { useApp } from './_layout';
import { useOtpFeed } from '../src/hooks/useOtpFeed';
import { db } from '../src/storage/database';
import { EmailMessage, OtpEntry } from '../src/types';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Plus,
  Send,
} from 'lucide-react-native';

export default function OtpFeedScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { accounts, isSyncing, syncAll, lastSyncTime, showToast, openMobileMenu, refreshAccounts } =
    useApp();
  const {
    otps,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedAccountId,
    setSelectedAccountId,
    unreadOnly,
    setUnreadOnly,
    copiedOtpId,
    handleCopyOtp,
    markUsed,
    refreshOtps,
  } = useOtpFeed();

  const [confidenceFilter, setConfidenceFilter] = useState<'ALL' | 'CONFIRMED' | 'UNCERTAIN'>('ALL');
  const [inspectModalVisible, setInspectModalVisible] = useState(false);
  const [inspectedEmail, setInspectedEmail] = useState<EmailMessage | null>(null);
  const [inspectedOtp, setInspectedOtp] = useState<OtpEntry | null>(null);
  const [injectorVisible, setInjectorVisible] = useState(false);

  const handleOpenSourceModal = async (otp: OtpEntry) => {
    const email = await db.getEmailById(otp.emailId);
    setInspectedEmail(email);
    setInspectedOtp(otp);
    setInspectModalVisible(true);
  };

  const filteredOtps = otps.filter(o => {
    if (confidenceFilter === 'CONFIRMED') return o.confidence === 'HIGH';
    if (confidenceFilter === 'UNCERTAIN') return o.confidence === 'MEDIUM' || o.confidence === 'LOW';
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title={t('navOtps')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSyncing={isSyncing}
        onOpenMobileMenu={openMobileMenu}
        onSyncPress={async () => {
          await syncAll();
          await refreshOtps();
          showToast('Unified OTP stream refreshed');
        }}
        lastSyncTime={lastSyncTime}
        placeholder={t('searchPlaceholder')}
      />

      {/* Account Filter Chips Header */}
      <View
        style={[
          styles.chipBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
        >
          <TouchableOpacity
            style={[
              styles.accountChip,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.borderLight,
              },
              !selectedAccountId && {
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setSelectedAccountId(null)}
          >
            <Text
              style={[
                styles.chipText,
                { color: colors.textSecondary },
                !selectedAccountId && { color: colors.primary, fontWeight: '700' },
              ]}
            >
              All Accounts ({accounts.length})
            </Text>
          </TouchableOpacity>

          {accounts.map(acc => {
            const isSelected = selectedAccountId === acc.id;
            return (
              <TouchableOpacity
                key={acc.id}
                style={[
                  styles.accountChip,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.borderLight,
                  },
                  isSelected && {
                    backgroundColor: colors.primaryLight,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setSelectedAccountId(isSelected ? null : acc.id)}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: acc.avatarColor || colors.primary },
                  ]}
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: colors.textSecondary },
                    isSelected && { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  {acc.label}
                </Text>
                {acc.otpCount > 0 && (
                  <View
                    style={[
                      styles.otpCountPill,
                      {
                        backgroundColor: colors.emeraldLight,
                        borderColor: colors.emeraldBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.otpCountText, { color: colors.emerald }]}>
                      {acc.otpCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Confidence & Unused Filters Sub-toolbar */}
      <View
        style={[
          styles.subToolbar,
          {
            backgroundColor: colors.surfaceSecondary,
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <View style={styles.confidenceGroup}>
          <TouchableOpacity
            style={[
              styles.filterPill,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
              confidenceFilter === 'ALL' && {
                backgroundColor: colors.surfaceActive,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setConfidenceFilter('ALL')}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: colors.textSecondary },
                confidenceFilter === 'ALL' && { color: colors.textPrimary, fontWeight: '700' },
              ]}
            >
              All ({otps.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
              confidenceFilter === 'CONFIRMED' && {
                backgroundColor: colors.emeraldLight,
                borderColor: colors.emeraldBorder,
              },
            ]}
            onPress={() => setConfidenceFilter('CONFIRMED')}
          >
            <CheckCircle2
              size={12}
              color={confidenceFilter === 'CONFIRMED' ? colors.emerald : colors.textMuted}
            />
            <Text
              style={[
                styles.filterPillText,
                { color: colors.textSecondary },
                confidenceFilter === 'CONFIRMED' && { color: colors.emerald, fontWeight: '700' },
              ]}
            >
              Confirmed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
              confidenceFilter === 'UNCERTAIN' && {
                backgroundColor: colors.amberLight,
                borderColor: colors.amberBorder,
              },
            ]}
            onPress={() => setConfidenceFilter('UNCERTAIN')}
          >
            <AlertCircle
              size={12}
              color={confidenceFilter === 'UNCERTAIN' ? colors.amber : colors.textMuted}
            />
            <Text
              style={[
                styles.filterPillText,
                { color: colors.textSecondary },
                confidenceFilter === 'UNCERTAIN' && { color: colors.amber, fontWeight: '700' },
              ]}
            >
              Uncertain
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right side: Inject button & Unread Toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={[
              styles.injectBtn,
              { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder },
            ]}
            onPress={() => setInjectorVisible(true)}
          >
            <Send size={12} color={colors.primary} />
            <Text style={[styles.injectBtnText, { color: colors.primary }]}>+ Inject OTP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.unreadToggle,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
              unreadOnly && {
                backgroundColor: colors.emeraldLight,
                borderColor: colors.emeraldBorder,
              },
            ]}
            onPress={() => setUnreadOnly(!unreadOnly)}
          >
            <CheckCircle2
              size={13}
              color={unreadOnly ? colors.emerald : colors.textMuted}
            />
            <Text
              style={[
                styles.unreadToggleText,
                { color: unreadOnly ? colors.emerald : colors.textMuted },
                unreadOnly && { fontWeight: '700' },
              ]}
            >
              Unused Only
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* OTP Stream */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.contentContainer}>
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Scanning messages for verification codes...
            </Text>
          </View>
        ) : filteredOtps.length === 0 ? (
          <View style={styles.emptyBox}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <ShieldAlert size={34} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No verification codes detected
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {otps.length === 0
                ? 'Your local OTP stream is ready. Inject a simulated incoming 2FA email or connect an active Gmail account to test parsing.'
                : 'No OTPs match the selected filter or search query.'}
            </Text>
            <View style={styles.emptyBtnRow}>
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: colors.primaryBtnBg }]}
                onPress={() => setInjectorVisible(true)}
              >
                <Sparkles size={16} color={colors.primaryBtnText} />
                <Text style={[styles.primaryActionBtnText, { color: colors.primaryBtnText }]}>
                  Inject Sample OTP Email
                </Text>
              </TouchableOpacity>

              {accounts.length === 0 && (
                <TouchableOpacity
                  style={[
                    styles.secondaryActionBtn,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: colors.borderLight,
                    },
                  ]}
                  onPress={() => router.push('/accounts')}
                >
                  <Plus size={15} color={colors.textPrimary} />
                  <Text style={[styles.secondaryActionBtnText, { color: colors.textPrimary }]}>
                    Connect Account
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.cardsWrapper}>
            {filteredOtps.map(otp => (
              <OtpCard
                key={otp.id}
                otp={otp}
                isCopied={copiedOtpId === otp.id}
                onCopy={async () => {
                  await handleCopyOtp(otp);
                  showToast(`Copied ${otp.code} (${otp.serviceName})`);
                }}
                onViewSource={() => handleOpenSourceModal(otp)}
                onToggleUsed={async () => {
                  await markUsed(otp.id, !otp.isUsed);
                  showToast(otp.isUsed ? 'Marked as unread' : 'Marked as used');
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Live Email Injector Modal */}
      <LiveEmailInjectorModal
        visible={injectorVisible}
        onClose={() => setInjectorVisible(false)}
        accounts={accounts}
        onInjected={async res => {
          await refreshAccounts();
          await refreshOtps();
          showToast(
            res.otp
              ? `OTP ${res.otp.code} detected from ${res.otp.serviceName}!`
              : 'Email injected successfully'
          );
        }}
      />

      {/* Source Email Modal */}
      <SourceEmailModal
        visible={inspectModalVisible}
        onClose={() => setInspectModalVisible(false)}
        email={inspectedEmail}
        highlightOtp={inspectedOtp}
        onCopied={msg => showToast(msg)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chipBar: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  chipList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
  },
  otpCountPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  otpCountText: {
    fontSize: 9,
    fontWeight: Typography.fontWeights.bold,
  },
  subToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  confidenceGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: Typography.fontSizes.xs - 1,
  },
  injectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  injectBtnText: {
    fontSize: Typography.fontSizes.xs - 1,
    fontWeight: '700',
  },
  unreadToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  unreadToggleText: {
    fontSize: Typography.fontSizes.xs - 1,
  },
  scrollArea: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.xl,
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  cardsWrapper: {
    gap: Spacing.sm,
  },
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
    padding: Spacing.huge,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
  },
  emptySubtitle: {
    fontSize: Typography.fontSizes.xs + 1,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 18,
    marginBottom: 12,
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
    paddingHorizontal: 20,
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
