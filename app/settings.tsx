import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Radius, Spacing, Typography, THEME_PALETTES, ThemePalette, AppThemeMode } from '../src/theme/tokens';
import { useTheme } from '../src/theme/ThemeContext';
import { useLanguage } from '../src/i18n/LanguageContext';
import { TopBar } from '../src/components/TopBar';
import { useApp } from './_layout';
import { db } from '../src/storage/database';
import { oauthService } from '../src/services/oauthService';
import { secureStore, UserSession } from '../src/storage/secureStore';
import { AppSettings } from '../src/types';
import { DEFAULT_APP_SETTINGS } from '../src/storage/seedData';
import {
  Palette,
  Globe,
  Copy,
  Bell,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Check,
  AlertTriangle,
  RotateCcw,
  LogOut,
  UserCheck,
  KeyRound,
  ShieldAlert,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, theme, setTheme, palettes } = useTheme();
  const { language, setLanguage, languages, t } = useLanguage();
  const { isSyncing, syncAll, lastSyncTime, refreshAccounts, showToast, openMobileMenu } = useApp();

  const [settings, setSettings] = useState<AppSettings>({ ...DEFAULT_APP_SETTINGS });
  const [retentionDays, setRetentionDays] = useState<number>(14);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [activeSession, setActiveSession] = useState<UserSession | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const sess = await secureStore.getActiveSession();
      setActiveSession(sess);
    } catch {
      // ignore
    }
  };

  const loadSettings = async () => {
    try {
      const s = await db.getSettings();
      setSettings(s);
      setRetentionDays(s.retentionDays || 14);
    } catch {
      // fallback
    }
  };

  const handleToggleAutoCopy = async (value: boolean) => {
    const updated = { ...settings, autoCopyOtp: value };
    setSettings(updated);
    await db.saveSettings({ autoCopyOtp: value });
    showToast(value ? 'Auto-copy OTP enabled' : 'Auto-copy OTP disabled');
  };

  const handleToggleMaskOtps = async (value: boolean) => {
    const updated = { ...settings, maskOtpsByDefault: value };
    setSettings(updated);
    await db.saveSettings({ maskOtpsByDefault: value });
    showToast(value ? 'OTP codes masked by default' : 'OTP codes visible by default');
  };

  const handleToggleNotifications = async (value: boolean) => {
    const updated = { ...settings, notificationsEnabled: value };
    setSettings(updated);
    await db.saveSettings({ notificationsEnabled: value });
    showToast(value ? 'OTP sound alerts enabled' : 'OTP sound alerts muted');
  };

  const handleRetentionChange = async (days: number) => {
    setRetentionDays(days);
    await db.saveSettings({ retentionDays: days });
    showToast(`Retention set to ${days === 0 ? 'Keep Forever' : `${days} days`}`);
  };

  const handleExecuteLogout = async () => {
    setIsLoggingOut(true);
    try {
      await oauthService.logoutUser();
      await refreshAccounts();
      setActiveSession(null);
      setShowLogoutConfirm(false);
      showToast('Signed out successfully. Session tokens wiped.');
      router.replace('/');
    } catch (e: any) {
      showToast(`Logout failed: ${e.message}`);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleExecuteReset = async () => {
    try {
      await oauthService.logoutUser();
      await db.flushAllData();
      await refreshAccounts();
      setActiveSession(null);
      setShowConfirmReset(false);
      showToast('All local accounts & OTP history wiped clean.');
      router.replace('/');
    } catch (e: any) {
      showToast(`Reset failed: ${e.message}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title={t('navSettings')}
        subtitle="Manage appearance, Indian languages, and local privacy"
        onSync={syncAll}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        onMenuPress={openMobileMenu}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 1: APPEARANCE & 4 THEMES */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: `${colors.primary}20` }]}>
              <Palette size={20} color={colors.primary} />
            </View>
            <View style={styles.sectionTitleBlock}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('appearanceTitle')}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                {t('appearanceDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.themeGrid}>
            {palettes.map(p => {
              const isSelected = theme === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.themeOptionCard,
                    {
                      backgroundColor: p.isDark ? '#0c1524' : '#f8f6f0',
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                      ...(isSelected && Platform.OS === 'web'
                        ? ({ boxShadow: `0 0 16px ${colors.glow}` } as any)
                        : {}),
                    },
                  ]}
                  onPress={() => setTheme(p.id as AppThemeMode)}
                  activeOpacity={0.7}
                  {...(Platform.OS === 'web' ? ({ className: 'glow-on-click' } as any) : {})}
                >
                  <View style={styles.themeCardTop}>
                    <View style={styles.colorSwatchesRow}>
                      <View style={[styles.swatchDot, { backgroundColor: p.dot }]} />
                      <View style={[styles.swatchDot, { backgroundColor: p.isDark ? '#07101d' : '#fcfaf5', borderWidth: 1, borderColor: '#ffffff40' }]} />
                    </View>
                    <View
                      style={[
                        styles.themeTypeBadge,
                        {
                          backgroundColor: p.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)',
                          borderColor: p.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        },
                      ]}
                    >
                      <Text style={[styles.themeTypeText, { color: p.isDark ? '#94a3b8' : '#64748b' }]}>
                        {p.isDark ? 'Dark' : 'Light'}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.themeCardName,
                      { color: p.isDark ? '#edf5ff' : '#1e293b' },
                    ]}
                  >
                    {p.name}
                  </Text>
                  <Text
                    style={[
                      styles.themeCardDesc,
                      { color: p.isDark ? '#94a3b8' : '#64748b' },
                    ]}
                  >
                    {p.id === 'google-white'
                      ? 'Crisp Pure White + Google Blue'
                      : p.id === 'midnight'
                      ? 'Deep Obsidian + Neon Cyan'
                      : p.id === 'aurora'
                      ? 'Obsidian + Emerald Violet'
                      : p.id === 'milky'
                      ? 'Milky Ivory + Royal Gold'
                      : 'Pearl White + Rose Sky'}
                  </Text>

                  {isSelected && (
                    <View style={[styles.activePillBadge, { backgroundColor: `${colors.primary}25`, borderColor: colors.primary }]}>
                      <Check size={12} color={colors.primary} />
                      <Text style={[styles.activePillText, { color: colors.primary }]}>Active</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SECTION 2: INDIAN REGIONAL LANGUAGES */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: `${colors.primary}20` }]}>
              <Globe size={20} color={colors.primary} />
            </View>
            <View style={styles.sectionTitleBlock}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('appLanguageTitle')}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Select your preferred Indian regional language for all UI elements
              </Text>
            </View>
          </View>

          <View style={styles.languagesGrid}>
            {languages.map(l => {
              const isSelected = language === l.code;
              return (
                <TouchableOpacity
                  key={l.code}
                  style={[
                    styles.languageButton,
                    {
                      backgroundColor: isSelected ? `${colors.primary}18` : colors.surfaceSecondary,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    setLanguage(l.code);
                    showToast(`Language set to ${l.nativeName}`);
                  }}
                  activeOpacity={0.7}
                  {...(Platform.OS === 'web' ? ({ className: 'glow-on-click' } as any) : {})}
                >
                  <View style={styles.langTextCol}>
                    <Text
                      style={[
                        styles.langNativeLabel,
                        { color: isSelected ? colors.primary : colors.textPrimary },
                      ]}
                    >
                      {l.nativeName}
                    </Text>
                    <Text style={[styles.langSubLabel, { color: colors.textSecondary }]}>
                      {l.name}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={[styles.langCheckCircle, { backgroundColor: colors.primary }]}>
                      <Check size={12} color={isDark ? '#07101d' : '#ffffff'} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SECTION 3: OTP AUTO-COPY & NOTIFICATIONS */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: `${colors.primary}20` }]}>
              <Copy size={20} color={colors.primary} />
            </View>
            <View style={styles.sectionTitleBlock}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                OTP Automation & Alerts
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Convenient instant actions when verification codes arrive
              </Text>
            </View>
          </View>

          <View style={[styles.switchRow, { borderBottomColor: colors.border }]}>
            <View style={styles.switchTextCol}>
              <Text style={[styles.switchTitle, { color: colors.textPrimary }]}>
                {t('otpAutoCopyTitle')}
              </Text>
              <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>
                {t('otpAutoCopyDesc')}
              </Text>
            </View>
            <Switch
              value={settings.autoCopyOtp ?? true}
              onValueChange={handleToggleAutoCopy}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDark ? '#edf5ff' : '#ffffff'}
            />
          </View>

          <View style={[styles.switchRow, { borderBottomColor: colors.border }]}>
            <View style={styles.switchTextCol}>
              <Text style={[styles.switchTitle, { color: colors.textPrimary }]}>
                Mask OTPs by Default
              </Text>
              <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>
                Hide verification digits behind security dots with tap-to-reveal to prevent on-device screen scanning and shoulder surfing
              </Text>
            </View>
            <Switch
              value={settings.maskOtpsByDefault ?? true}
              onValueChange={handleToggleMaskOtps}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDark ? '#edf5ff' : '#ffffff'}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <Text style={[styles.switchTitle, { color: colors.textPrimary }]}>
                {t('soundAlertTitle')}
              </Text>
              <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>
                {t('soundAlertDesc')}
              </Text>
            </View>
            <Switch
              value={settings.notificationsEnabled ?? true}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDark ? '#edf5ff' : '#ffffff'}
            />
          </View>
        </View>

        {/* SECTION 4: AUTO-CLEAN OLD OTPS */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: `${colors.primary}20` }]}>
              <Trash2 size={20} color={colors.primary} />
            </View>
            <View style={styles.sectionTitleBlock}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('autoCleanTitle')}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Automatically purge expired verification codes to keep storage minimal
              </Text>
            </View>
          </View>

          <View style={styles.retentionPillRow}>
            {[
              { days: 1, label: t('keep24h') },
              { days: 7, label: t('keep7d') },
              { days: 0, label: t('keepForever') },
            ].map(item => {
              const isSelected = retentionDays === item.days;
              return (
                <TouchableOpacity
                  key={item.days}
                  style={[
                    styles.retentionPill,
                    {
                      backgroundColor: isSelected ? `${colors.primary}20` : colors.surfaceSecondary,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleRetentionChange(item.days)}
                  activeOpacity={0.7}
                  {...(Platform.OS === 'web' ? ({ className: 'glow-on-click' } as any) : {})}
                >
                  <Text
                    style={[
                      styles.retentionPillText,
                      { color: isSelected ? colors.primary : colors.textPrimary, fontWeight: isSelected ? '700' : '500' },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SECTION 5: ACCOUNT & ACTIVE SESSION */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: `${colors.primary}20` }]}>
              <UserCheck size={20} color={colors.primary} />
            </View>
            <View style={styles.sectionTitleBlock}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Account & Active Session
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Google OAuth 2.0 PKCE authentication and hardware-backed session persistence
              </Text>
            </View>
          </View>

          {activeSession ? (
            <View style={[styles.sessionInfoBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight }]}>
              <View style={styles.sessionUserRow}>
                <View style={[styles.sessionAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.sessionAvatarText}>
                    {activeSession.email.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.sessionDetails}>
                  <Text style={[styles.sessionEmail, { color: colors.textPrimary }]}>
                    {activeSession.email}
                  </Text>
                  <View style={styles.sessionTagRow}>
                    <View style={[styles.sessionBadge, { backgroundColor: `${colors.emerald}20`, borderColor: colors.emerald }]}>
                      <KeyRound size={11} color={colors.emerald} />
                      <Text style={[styles.sessionBadgeText, { color: colors.emerald }]}>
                        Vault Active (PKCE)
                      </Text>
                    </View>
                    <Text style={[styles.sessionDateText, { color: colors.textMuted }]}>
                      Persistent session active
                    </Text>
                  </View>
                </View>
              </View>

              {showLogoutConfirm ? (
                <View style={[styles.confirmResetBox, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: '#ef4444' }]}>
                  <Text style={[styles.confirmResetText, { color: colors.textPrimary }]}>
                    Are you sure you want to sign out? This will revoke active OAuth tokens with Google and clear encrypted keys from this device.
                  </Text>
                  <View style={styles.confirmBtnRow}>
                    <TouchableOpacity
                      style={[styles.confirmBtn, { backgroundColor: '#ef4444' }]}
                      onPress={handleExecuteLogout}
                      disabled={isLoggingOut}
                      activeOpacity={0.8}
                    >
                      {isLoggingOut ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <LogOut size={16} color="#ffffff" />
                          <Text style={styles.confirmBtnText}>Sign Out Now</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cancelResetBtn, { borderColor: colors.border }]}
                      onPress={() => setShowLogoutConfirm(false)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.cancelResetBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.logoutBtn, { borderColor: '#ef444480', backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}
                  onPress={() => setShowLogoutConfirm(true)}
                  activeOpacity={0.7}
                  {...(Platform.OS === 'web' ? ({ className: 'glow-on-click' } as any) : {})}
                >
                  <LogOut size={16} color="#ef4444" />
                  <Text style={styles.logoutBtnText}>Sign Out / Logout</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={[styles.sessionInfoBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight }]}>
              <View style={styles.noSessionRow}>
                <ShieldCheck size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.noSessionTitle, { color: colors.textPrimary }]}>
                    Device-Local Mode Active
                  </Text>
                  <Text style={[styles.noSessionSubtitle, { color: colors.textMuted }]}>
                    All OTP processing and data are running private and device-local.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.signInShortcutBtn, { backgroundColor: colors.primaryBtnBg }]}
                  onPress={() => router.push('/accounts')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.signInShortcutText, { color: colors.primaryBtnText }]}>
                    Connect Account
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* SECTION 6: CLEAR APP DATA */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: '#ef444440' }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <AlertTriangle size={20} color="#ef4444" />
            </View>
            <View style={styles.sectionTitleBlock}>
              <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>
                {t('clearDataTitle')}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                {t('clearDataDesc')}
              </Text>
            </View>
          </View>

          {showConfirmReset ? (
            <View style={[styles.confirmResetBox, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: '#ef4444' }]}>
              <Text style={[styles.confirmResetText, { color: colors.textPrimary }]}>
                Are you sure? This will wipe all connected Gmail accounts, emails, and OTPs from this browser/device.
              </Text>
              <View style={styles.confirmBtnRow}>
                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: '#ef4444' }]}
                  onPress={handleExecuteReset}
                  activeOpacity={0.8}
                >
                  <Trash2 size={16} color="#ffffff" />
                  <Text style={styles.confirmBtnText}>Yes, Wipe All Data</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelResetBtn, { borderColor: colors.border }]}
                  onPress={() => setShowConfirmReset(false)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cancelResetBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.clearDataBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: '#ef444480' }]}
              onPress={() => setShowConfirmReset(true)}
              activeOpacity={0.7}
              {...(Platform.OS === 'web' ? ({ className: 'glow-on-click' } as any) : {})}
            >
              <RotateCcw size={16} color="#ef4444" />
              <Text style={styles.clearDataBtnText}>
                {t('clearDataBtn')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* BOTTOM PRIVACY FOOTER */}
        <View style={styles.privacyFooter}>
          <ShieldCheck size={16} color={colors.primary} />
          <Text style={[styles.privacyFooterText, { color: colors.textMuted }]}>
            100% Device-Local Architecture • Zero Cloud Servers • Private Keyring Storage
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl * 2,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.xl,
  },
  sectionCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionIconBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleBlock: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSizes.sm,
    marginTop: 2,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  themeOptionCard: {
    flex: 1,
    minWidth: 200,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    position: 'relative',
  },
  themeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  colorSwatchesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatchDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themeTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  themeTypeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  themeCardName: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    marginBottom: 2,
  },
  themeCardDesc: {
    fontSize: Typography.fontSizes.xs,
    marginBottom: Spacing.sm,
  },
  activePillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginTop: 4,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  languagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  languageButton: {
    flex: 1,
    minWidth: 135,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  langTextCol: {
    flex: 1,
  },
  langNativeLabel: {
    fontSize: Typography.fontSizes.base,
    fontWeight: '700',
  },
  langSubLabel: {
    fontSize: Typography.fontSizes.xs,
    marginTop: 2,
  },
  langCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  switchTextCol: {
    flex: 1,
    paddingRight: Spacing.lg,
  },
  switchTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: '600',
  },
  switchDesc: {
    fontSize: Typography.fontSizes.xs,
    marginTop: 2,
  },
  retentionPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  retentionPill: {
    flex: 1,
    minWidth: 120,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retentionPillText: {
    fontSize: Typography.fontSizes.sm,
  },
  clearDataBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  clearDataBtnText: {
    color: '#ef4444',
    fontSize: Typography.fontSizes.base,
    fontWeight: '700',
  },
  confirmResetBox: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  confirmResetText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '500',
    lineHeight: 20,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
  },
  cancelResetBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  cancelResetBtnText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
  },
  sessionInfoBox: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  sessionUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sessionAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionAvatarText: {
    color: '#ffffff',
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
  },
  sessionDetails: {
    flex: 1,
  },
  sessionEmail: {
    fontSize: Typography.fontSizes.base,
    fontWeight: '700',
  },
  sessionTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  sessionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sessionDateText: {
    fontSize: Typography.fontSizes.xs,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
  },
  noSessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  noSessionTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
  },
  noSessionSubtitle: {
    fontSize: Typography.fontSizes.xs,
    marginTop: 2,
  },
  signInShortcutBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
  },
  signInShortcutText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: '700',
  },
  privacyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  privacyFooterText: {
    fontSize: Typography.fontSizes.xs,
  },
});
