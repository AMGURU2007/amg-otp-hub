import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Radius, Spacing, Typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/ThemeContext';
import { useLanguage } from '../src/i18n/LanguageContext';
import { TopBar } from '../src/components/TopBar';
import { GoogleSignInButton } from '../src/components/GoogleSignInButton';
import { useApp } from './_layout';
import { Account } from '../src/types';
import { db } from '../src/storage/database';
import { oauthService } from '../src/services/oauthService';
import { secureStore } from '../src/storage/secureStore';
import {
  UserPlus,
  RefreshCw,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  X,
  Plus,
  Send,
  Sparkles,
  AlertCircle,
  KeyRound,
} from 'lucide-react-native';

export default function AccountsScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const {
    accounts,
    refreshAccounts,
    syncAccount,
    syncAll,
    isSyncing,
    lastSyncTime,
    showToast,
    openMobileMenu,
  } = useApp();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form states
  const [newLabel, setNewLabel] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editLabel, setEditLabel] = useState('');

  const handleOpenAdd = () => {
    setNewLabel('');
    setNewEmail('');
    setNewPassword('');
    setShowPassword(false);
    setAddModalVisible(true);
  };

  const handleCreateAccount = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      showToast('Please enter a valid Gmail address');
      return;
    }
    const finalLabel = newLabel.trim() || newEmail.split('@')[0] || 'Personal';

    setIsSubmitting(true);
    try {
      const acc = await db.addLiveAccount({
        email: newEmail.trim().toLowerCase(),
        label: finalLabel,
      });

      if (newPassword.trim()) {
        await secureStore.saveTokens(acc.id, {
          accessToken: newPassword.trim(),
          expiresAt: Date.now() + 365 * 24 * 3600 * 1000,
          tokenType: 'AppPassword',
        });
      }

      await refreshAccounts();
      setAddModalVisible(false);
      showToast(`Account "${finalLabel}" secured & connected`);
    } catch (err: any) {
      showToast(`Error adding account: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignInFlow = async () => {
    setIsSubmitting(true);
    showToast('Connecting via Google OAuth 2.0 PKCE...');
    try {
      const res = await oauthService.signInWithGoogle(newLabel.trim() || 'Work');
      if (res.success && res.account) {
        await refreshAccounts();
        setAddModalVisible(false);
        showToast(`Google Account "${res.account.label}" connected successfully!`);
      } else if (res.success) {
        showToast('Redirecting to Google secure authentication...');
      } else {
        showToast(`OAuth notice: ${res.error || 'Connection failed'}`);
      }
    } catch (err: any) {
      showToast(`Sign in error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setEditLabel(acc.label);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAccount || !editLabel.trim()) return;
    try {
      editingAccount.label = editLabel.trim();
      await db.upsertAccount(editingAccount);
      await refreshAccounts();
      setEditModalVisible(false);
      showToast(`Label updated to "${editLabel.trim()}"`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleDeleteAccount = async (acc: Account) => {
    try {
      await secureStore.deleteTokens(acc.id);
      await db.deleteAccount(acc.id);
      await refreshAccounts();
      showToast(`Disconnected ${acc.label} (${acc.email})`);
    } catch (err: any) {
      showToast(`Error deleting account: ${err.message}`);
    }
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title={t('navAccounts')}
        isSyncing={isSyncing}
        onOpenMobileMenu={openMobileMenu}
        onSyncPress={async () => {
          await syncAll();
          showToast('All accounts synced');
        }}
        lastSyncTime={lastSyncTime}
      />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.contentContainer}>
        {/* Header Hero Banner (Clean, no dev jargon) */}
        <View
          style={[
            styles.heroBanner,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <View style={styles.heroLeft}>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
              {t('multiAccountHub')}
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
              {t('multiAccountDesc')}
            </Text>
          </View>
          <View style={styles.heroButtons}>
            <GoogleSignInButton
              onPress={handleGoogleSignInFlow}
              label="Connect Gmail"
              disabled={isSubmitting}
              style={{ minWidth: 150, height: 38, minHeight: 38, paddingLeft: 10, paddingRight: 14 }}
            />
          </View>
        </View>

        {/* Empty State vs Accounts List */}
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
                styles.emptyIconCircle,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <UserPlus size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
              {t('noAccountsYet')}
            </Text>
            <Text style={[styles.emptyStateDesc, { color: colors.textMuted }]}>
              {t('noAccountsDesc')}
            </Text>
            <View style={styles.emptyBtnRow}>
              <GoogleSignInButton
                onPress={handleGoogleSignInFlow}
                label="Sign in with Google"
                disabled={isSubmitting}
              />
            </View>
          </View>
        ) : (
          <View style={styles.accountsList}>
            {accounts.map(acc => {
              const isAccSyncing = acc.status === 'syncing';
              return (
                <View
                  key={acc.id}
                  style={[
                    styles.accountItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  {/* Avatar & Label */}
                  <View style={styles.accountColPrimary}>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: acc.avatarColor || colors.primary },
                      ]}
                    >
                      <Text style={styles.avatarText}>{acc.label.slice(0, 2).toUpperCase()}</Text>
                    </View>
                    <View style={styles.nameBlock}>
                      <View style={styles.labelRow}>
                        <Text style={[styles.accLabel, { color: colors.textPrimary }]}>
                          {acc.label}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor: acc.status === 'error' || acc.status === 'disconnected'
                                ? 'rgba(239, 68, 68, 0.15)'
                                : colors.emeraldLight,
                              borderColor: acc.status === 'error' || acc.status === 'disconnected'
                                ? '#ef4444'
                                : colors.emeraldBorder,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: acc.status === 'error' || acc.status === 'disconnected' ? '#ef4444' : colors.emerald },
                            ]}
                          />
                          <Text
                            style={[
                              styles.statusText,
                              { color: acc.status === 'error' || acc.status === 'disconnected' ? '#ef4444' : colors.emerald },
                            ]}
                          >
                            {acc.status.toUpperCase()}
                          </Text>
                        </View>

                        {(acc.status === 'error' || acc.status === 'disconnected') && (
                          <TouchableOpacity
                            style={[
                              styles.retrySyncPill,
                              {
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                borderColor: '#ef4444',
                              },
                            ]}
                            onPress={async () => {
                              showToast(`Retrying sync for ${acc.label}...`);
                              const ok = await syncAccount(acc.id);
                              showToast(ok ? `Synced ${acc.label}` : `Retry failed for ${acc.label}`);
                            }}
                            disabled={isAccSyncing}
                            activeOpacity={0.7}
                          >
                            <RefreshCw size={11} color="#ef4444" />
                            <Text style={styles.retrySyncPillText}>Retry Sync</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={[styles.accEmail, { color: colors.textMuted }]}>
                        {acc.email}
                      </Text>
                    </View>
                  </View>

                  {/* Counters */}
                  <View style={styles.countersCol}>
                    <View style={styles.counterItem}>
                      <Text style={[styles.counterVal, { color: colors.textPrimary }]}>
                        {acc.otpCount}
                      </Text>
                      <Text style={[styles.counterLabel, { color: colors.textMuted }]}>OTPs</Text>
                    </View>
                    <View style={styles.counterItem}>
                      <Text style={[styles.counterVal, { color: colors.textPrimary }]}>
                        {acc.unreadCount}
                      </Text>
                      <Text style={[styles.counterLabel, { color: colors.textMuted }]}>Unread</Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionsCol}>
                    <TouchableOpacity
                      style={[styles.actionIconBtn, { backgroundColor: colors.surfaceSecondary }]}
                      onPress={async () => {
                        const ok = await syncAccount(acc.id);
                        showToast(ok ? `Synced ${acc.label}` : `Sync failed for ${acc.label}`);
                      }}
                      disabled={isAccSyncing}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {isAccSyncing ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <RefreshCw size={15} color={colors.textSecondary} />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionIconBtn, { backgroundColor: colors.surfaceSecondary }]}
                      onPress={() => handleOpenEdit(acc)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Edit2 size={15} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionIconBtn, { backgroundColor: colors.surfaceSecondary }]}
                      onPress={() => handleDeleteAccount(acc)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={15} color={colors.rose} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Simplified, Consumer-Friendly Account Connection Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderLight }]}>
              <View style={styles.modalHeaderTitleRow}>
                <UserPlus size={18} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {t('connectGmailBtn')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Option 1: 1-Click Official White Google Sign In Button */}
              <GoogleSignInButton
                style={styles.googleSignInBtn}
                onPress={handleGoogleSignInFlow}
                disabled={isSubmitting}
                label={t('signInWithGoogle')}
              />

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.borderLight }]} />
                <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                  OR CONNECT DIRECTLY
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.borderLight }]} />
              </View>

              {/* Option 2: 3 Simple Fields Only */}
              {/* Field 1: Name / Tag */}
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                Custom Account Name
              </Text>

              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.borderLight,
                    color: colors.textPrimary,
                  },
                ]}
                value={newLabel}
                onChangeText={setNewLabel}
                placeholder="Enter custom name for this email (e.g., My Main, Father's Mail, Coding)..."
                placeholderTextColor={colors.textMuted}
              />

              {/* Field 2: Gmail Address */}
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                {t('gmailAddress')}
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.borderLight,
                    color: colors.textPrimary,
                  },
                ]}
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="yourname@gmail.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              {/* Field 3: Google App Password / Token with Show/Hide toggle */}
              <View style={styles.tokenLabelRow}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                  App Password / Token (Optional)
                </Text>
                <View style={[styles.vaultPill, { backgroundColor: `${colors.primary}18`, borderColor: colors.primary }]}>
                  <KeyRound size={11} color={colors.primary} />
                  <Text style={[styles.vaultPillText, { color: colors.primary }]}>Hardware Vault</Text>
                </View>
              </View>
              <Text style={[styles.formHelperText, { color: colors.textMuted }]}>
                Encrypted in device keychain. Plain passwords are never collected or stored.
              </Text>
              <View
                style={[
                  styles.passwordInputWrapper,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.passwordInput,
                    {
                      color: colors.textPrimary,
                    },
                  ]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="16-character App Password (e.g. abcd efgh ijkl mnop)"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? (
                    <EyeOff size={16} color={colors.textMuted} />
                  ) : (
                    <Eye size={16} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Clean Modal Footer */}
            <View style={[styles.modalFooter, { borderTopColor: colors.borderLight }]}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>
                  {t('cancelBtn')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.createBtn,
                  { backgroundColor: colors.primaryBtnBg },
                  isSubmitting && { opacity: 0.7 },
                ]}
                onPress={handleCreateAccount}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.primaryBtnText} />
                ) : (
                  <Text style={[styles.createBtnText, { color: colors.primaryBtnText }]}>
                    {t('connectAccountBtn')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Account Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Account Label</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Custom Account Name</Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.borderLight,
                    color: colors.textPrimary,
                  },
                ]}
                value={editLabel}
                onChangeText={setEditLabel}
                placeholder="Enter custom name for this email (e.g., My Main, Father's Mail, Coding)..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={[styles.modalFooter, { borderTopColor: colors.borderLight }]}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: colors.primaryBtnBg }]}
                onPress={handleSaveEdit}
              >
                <Text style={[styles.createBtnText, { color: colors.primaryBtnText }]}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  contentContainer: {
    padding: Spacing.xl,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  heroBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: Radius.card,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  heroLeft: {
    flex: 1,
    minWidth: 280,
  },
  heroTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: Typography.fontSizes.xs + 1,
    lineHeight: 18,
  },
  heroButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  injectQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  injectQuickBtnText: {
    fontSize: Typography.fontSizes.xs + 1,
    fontWeight: Typography.fontWeights.semibold,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: Radius.full,
  },
  addButtonText: {
    fontSize: Typography.fontSizes.xs + 1,
    fontWeight: Typography.fontWeights.bold,
  },
  accountsList: {
    gap: Spacing.sm,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  accountColPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    minWidth: 220,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#07101d',
    fontWeight: Typography.fontWeights.extrabold,
    fontSize: Typography.fontSizes.sm,
  },
  nameBlock: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accLabel: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: 9,
    fontWeight: Typography.fontWeights.extrabold,
  },
  retrySyncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  retrySyncPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tokenLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  vaultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  vaultPillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  formHelperText: {
    fontSize: Typography.fontSizes.xs - 1,
    marginBottom: Spacing.sm,
    lineHeight: 14,
  },
  accEmail: {
    fontSize: Typography.fontSizes.xs,
    marginTop: 2,
  },
  countersCol: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  counterItem: {
    alignItems: 'center',
  },
  counterVal: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  counterLabel: {
    fontSize: 10,
  },
  actionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateBox: {
    padding: Spacing.xxl,
    borderRadius: Radius.card,
    borderWidth: 1,
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
  emptyStateTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
  },
  emptyStateDesc: {
    fontSize: Typography.fontSizes.xs + 1,
    textAlign: 'center',
    maxWidth: 440,
    lineHeight: 18,
    marginBottom: 12,
  },
  emptyBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 14, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    borderRadius: Radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  googleSignInBtn: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  formLabel: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  chipTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chipTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipTagText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: '600',
  },
  formInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: Typography.fontSizes.sm,
    marginBottom: 6,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: 6,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: Typography.fontSizes.sm,
  },
  eyeBtn: {
    padding: Spacing.xs,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontSize: Typography.fontSizes.sm,
  },
  createBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: Radius.full,
  },
  createBtnText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
  },
});
