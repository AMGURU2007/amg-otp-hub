import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Radius, Spacing, Typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/ThemeContext';
import { useLanguage } from '../src/i18n/LanguageContext';
import { CometDial } from '../src/components/CometDial';
import { TopBar } from '../src/components/TopBar';
import { OtpCard } from '../src/components/OtpCard';
import { AccountContactCard } from '../src/components/AccountContactCard';
import { SourceEmailModal } from '../src/components/SourceEmailModal';
import { LiveEmailInjectorModal } from '../src/components/LiveEmailInjectorModal';
import { useApp } from './_layout';
import { useOtpFeed } from '../src/hooks/useOtpFeed';
import { db } from '../src/storage/database';
import { EmailMessage, OtpEntry } from '../src/types';
import {
  Users,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Plus,
  Send,
  Mail,
  Inbox,
  RefreshCw,
} from 'lucide-react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const {
    accounts,
    isSyncing,
    syncAll,
    lastSyncTime,
    setSelectedAccountId,
    showToast,
    openMobileMenu,
    refreshAccounts,
  } = useApp();
  const { otps, copiedOtpId, handleCopyOtp, markUsed, refreshOtps } = useOtpFeed();

  const [inspectModalVisible, setInspectModalVisible] = useState(false);
  const [inspectedEmail, setInspectedEmail] = useState<EmailMessage | null>(null);
  const [inspectedOtp, setInspectedOtp] = useState<OtpEntry | null>(null);
  const [injectorVisible, setInjectorVisible] = useState(false);
  const [emails, setEmails] = useState<EmailMessage[]>([]);

  const loadEmails = async () => {
    try {
      const list = await db.getEmails();
      setEmails(list);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadEmails();
    const unsubscribe = db.subscribe(() => {
      loadEmails();
      refreshOtps();
      refreshAccounts();
    });

    let onFocus: (() => void) | null = null;
    if (typeof window !== 'undefined') {
      onFocus = () => {
        loadEmails();
        refreshOtps();
        refreshAccounts();
      };
      window.addEventListener('focus', onFocus);
    }

    return () => {
      unsubscribe();
      if (onFocus && typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
      }
    };
  }, [accounts, otps, isSyncing, refreshOtps, refreshAccounts]);

  // Radar / Wave Sync sweep animation
  const radarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSyncing) {
      const loop = Animated.loop(
        Animated.timing(radarAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        })
      );
      loop.start();
      return () => loop.stop();
    } else {
      radarAnim.setValue(0);
    }
  }, [isSyncing, radarAnim]);

  const handleOpenSourceModal = async (otp: OtpEntry) => {
    const email = await db.getEmailById(otp.emailId);
    setInspectedEmail(email);
    setInspectedOtp(otp);
    setInspectModalVisible(true);
  };

  const uniqueServices = Array.from(new Set(otps.map(o => o.serviceName)));
  const todayOtps = otps.filter(o => {
    const diff = Date.now() - new Date(o.detectedAt).getTime();
    return diff <= 24 * 3600 * 1000;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title={t('navDashboard')}
        subtitle="Multi-account overview, 1-click OTPs, and sync status"
        onSync={async () => {
          await syncAll();
          await refreshOtps();
          await loadEmails();
          showToast('All target accounts synced');
        }}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        onMenuPress={openMobileMenu}
      />

      {/* Live Radar Wave Scanning Indicator */}
      {isSyncing && (
        <View style={styles.radarBarContainer}>
          <Animated.View
            style={[
              styles.radarBeam,
              {
                backgroundColor: colors.primary,
                ...(Platform.OS === 'web' ? { boxShadow: `0 0 12px ${colors.glow}` } : {}),
                transform: [
                  {
                    translateX: radarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-200, 1200],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      )}

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Responsive CometDial KPI Gauges Grid */}
        <View style={styles.metricsGrid}>
          <CometDial
            label={t('targetAccounts')}
            min={0}
            max={15}
            value={accounts.length}
            subtitle={accounts.length > 0 ? `${accounts.length} accounts in vault` : '0 accounts linked'}
            unit="ACCOUNTS"
            color={colors.primary}
            icon={<Users size={16} color={colors.primary} />}
            onPress={() => router.push('/accounts')}
          />
          <CometDial
            label={t('activeOtps')}
            min={0}
            max={50}
            value={otps.length}
            subtitle={otps.length > 0 ? `${todayOtps.length} received today` : 'Waiting for incoming codes'}
            unit="CODES"
            color={colors.emerald || '#10b981'}
            icon={<ShieldAlert size={16} color={colors.emerald || '#10b981'} />}
            onPress={() => router.push('/otp')}
          />
          <CometDial
            label="Synced Emails"
            min={0}
            max={100}
            value={emails.length}
            subtitle={emails.length > 0 ? `${uniqueServices.length} platforms parsed` : 'No messages yet'}
            unit="EMAILS"
            color={colors.purple || '#a855f7'}
            icon={<Mail size={16} color={colors.purple || '#a855f7'} />}
            onPress={() => router.push('/inbox')}
          />
        </View>

        {/* Quick Target Accounts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('targetAccounts')} & {t('navInbox')}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                {t('accountsSubtitle')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => router.push('/accounts')}
            >
              <Text style={[styles.seeAllText, { color: colors.primary }]}>{t('manageAccountsBtn')}</Text>
              <ArrowRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {accounts.length === 0 ? (
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
                  styles.emptyStateIconCircle,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Users size={28} color={colors.primary} />
              </View>
              <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
                {t('noAccountsYet')}
              </Text>
              <Text style={[styles.emptyStateDesc, { color: colors.textMuted }]}>
                {t('noAccountsDesc')}
              </Text>
              <View style={styles.emptyStateBtnRow}>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: colors.primaryBtnBg }]}
                  onPress={() => router.push('/accounts')}
                  activeOpacity={0.7}
                  {...(Platform.OS === 'web' ? ({ className: 'glow-on-click' } as any) : {})}
                >
                  <Plus size={16} color={colors.primaryBtnText} />
                  <Text style={[styles.primaryActionBtnText, { color: colors.primaryBtnText }]}>
                    {t('connectGmailBtn')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.secondaryActionBtn,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: colors.borderLight,
                    },
                  ]}
                  onPress={() => setInjectorVisible(true)}
                  activeOpacity={0.7}
                  {...(Platform.OS === 'web' ? ({ className: 'glow-on-click' } as any) : {})}
                >
                  <Send size={15} color={colors.textPrimary} />
                  <Text style={[styles.secondaryActionBtnText, { color: colors.textPrimary }]}>
                    {t('injectTestEmail')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.accountGrid}>
              {accounts.slice(0, 6).map(acc => (
                <View
                  key={acc.id}
                  style={[
                    styles.accountCardWrapper,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  <AccountContactCard
                    account={acc}
                    onPress={() => {
                      setSelectedAccountId(acc.id);
                      router.push('/inbox');
                    }}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Latest Verification Codes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('navOtps')}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                {t('otpsSubtitle')}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <TouchableOpacity
                style={[
                  styles.quickInjectLink,
                  { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder },
                ]}
                onPress={() => setInjectorVisible(true)}
                activeOpacity={0.7}
                {...(Platform.OS === 'web' ? ({ className: 'glow-on-click' } as any) : {})}
              >
                <Sparkles size={12} color={colors.primary} />
                <Text style={[styles.quickInjectLinkText, { color: colors.primary }]}>
                  + {t('simulateIncomingOtp')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => router.push('/otp')}
                activeOpacity={0.7}
                {...(Platform.OS === 'web' ? ({ className: 'glow-on-click' } as any) : {})}
              >
                <Text style={[styles.seeAllText, { color: colors.primary }]}>
                  {t('viewAllOtpsBtn')} ({otps.length})
                </Text>
                <ArrowRight size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {otps.length === 0 ? (
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
                  styles.emptyStateIconCircle,
                  { backgroundColor: colors.emeraldLight },
                ]}
              >
                <ShieldAlert size={28} color={colors.emerald} />
              </View>
              <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
                {t('emptyOtpFeedTitle')}
              </Text>
              <Text style={[styles.emptyStateDesc, { color: colors.textMuted }]}>
                {t('emptyOtpFeedDesc')}
              </Text>
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: colors.primaryBtnBg }]}
                onPress={() => setInjectorVisible(true)}
              >
                <Sparkles size={16} color={colors.primaryBtnText} />
                <Text style={[styles.primaryActionBtnText, { color: colors.primaryBtnText }]}>
                  {t('simulateIncomingOtp')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.otpList}>
              {otps.slice(0, 4).map(otp => (
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
        </View>
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
  radarBarContainer: {
    height: 3,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  radarBeam: {
    width: 250,
    height: '100%',
    borderRadius: 2,
  },
  scrollArea: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.xl,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSizes.xs,
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
  },
  quickInjectLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  quickInjectLinkText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
  },
  accountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  accountCardWrapper: {
    flex: 1,
    minWidth: 280,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  otpList: {
    gap: Spacing.xs,
  },
  emptyStateBox: {
    padding: Spacing.xxl,
    borderRadius: Radius.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  emptyStateIconCircle: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  emptyStateDesc: {
    fontSize: Typography.fontSizes.xs + 1,
    textAlign: 'center',
    maxWidth: 440,
    lineHeight: 18,
    marginBottom: 10,
  },
  emptyStateBtnRow: {
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
    paddingHorizontal: 18,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: Typography.fontSizes.xs + 1,
    fontWeight: Typography.fontWeights.semibold,
  },
});
