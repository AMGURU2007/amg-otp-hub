import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import { Radius, Spacing, Typography, Breakpoints, THEME_PALETTES } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Search, RefreshCw, X, Menu, Sun, Moon, LogOut, ShieldAlert } from 'lucide-react-native';
import { oauthService } from '../services/oauthService';
import { secureStore } from '../storage/secureStore';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  breadcrumb?: string;
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  isSyncing?: boolean;
  onSyncPress?: () => void;
  onSync?: () => void;
  lastSyncTime?: string | null;
  placeholder?: string;
  onOpenMobileMenu?: () => void;
  onMenuPress?: () => void;
  onFlushData?: () => void;
  onLogout?: () => void;
  onLogoutPress?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  breadcrumb,
  searchQuery,
  onSearchChange,
  isSyncing,
  onSyncPress,
  onSync,
  placeholder,
  onOpenMobileMenu,
  onMenuPress,
  onLogout,
  onLogoutPress,
}) => {
  const { colors, isDark, toggleTheme, theme, setTheme } = useTheme();
  const { t } = useLanguage();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeUserEmail, setActiveUserEmail] = useState<string | null>(null);

  useEffect(() => {
    secureStore.getActiveSession().then(sess => {
      if (sess?.email) setActiveUserEmail(sess.email);
    }).catch(() => {});
  }, []);

  const handleSync = onSyncPress || onSync;
  const handleMenu = onOpenMobileMenu || onMenuPress;
  const handleLogoutAction = onLogout || onLogoutPress;

  const executeLogout = async () => {
    setShowLogoutConfirm(false);
    if (handleLogoutAction) {
      handleLogoutAction();
    } else {
      try {
        await oauthService.logoutUser();
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    }
  };

  // Clean title display (without "AMG /" or repeated app names)
  const displayTitle = (title || breadcrumb || 'Workspace')
    .replace(/^AMG OTP Hub \/ /, '')
    .replace(/^AMG \/ /, '')
    .trim();

  const searchPlaceholder = placeholder || t('searchPlaceholder');

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.borderLight,
        },
      ]}
    >
      {/* Mobile Hamburger & Clean Section Title */}
      <View style={styles.titleSection}>
        {handleMenu && (
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={handleMenu}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Menu size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {displayTitle}
          </Text>
          {subtitle && (
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {/* Global Search Input */}
      {onSearchChange !== undefined && (
        <View
          style={[
            styles.searchWrapper,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <Search size={15} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => onSearchChange('')} style={styles.clearSearchBtn}>
              <X size={14} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Right Controls: 4-Dot Theme Palette, Sun/Moon Toggle, and Sync Button */}
      <View style={styles.actionsSection}>
        {/* 4-Dot Theme Palette Selector */}
        <View
          style={[
            styles.paletteCluster,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.borderLight,
            },
          ]}
        >
          {THEME_PALETTES.map(p => {
            const isActive =
              theme === p.id ||
              (p.id === 'midnight' && theme === 'dark') ||
              (p.id === 'milky' && theme === 'light');
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.paletteDotWrapper,
                  isActive && {
                    borderColor: p.dot,
                    backgroundColor: colors.surfaceActive,
                  },
                ]}
                onPress={() => setTheme(p.id as any)}
                activeOpacity={0.7}
                accessibilityLabel={p.name}
              >
                <View
                  style={[
                    styles.paletteDot,
                    {
                      backgroundColor: p.dot,
                      transform: [{ scale: isActive ? 1.25 : 1 }],
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sun/Moon Toggle Button */}
        <TouchableOpacity
          style={[
            styles.iconActionBtn,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.borderLight,
            },
          ]}
          onPress={toggleTheme}
          accessibilityLabel={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {isDark ? (
            <Sun size={15} color={colors.amber} />
          ) : (
            <Moon size={15} color={colors.primary} />
          )}
        </TouchableOpacity>

        {/* Profile / Logout Button */}
        <TouchableOpacity
          style={[
            styles.iconActionBtn,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.borderLight,
            },
          ]}
          onPress={() => setShowLogoutConfirm(true)}
          accessibilityLabel="Sign Out / Logout"
        >
          <LogOut size={14} color="#ef4444" />
        </TouchableOpacity>

        {/* Clean Sync Button */}
        {handleSync && (
          <TouchableOpacity
            style={[
              styles.syncButton,
              { backgroundColor: colors.primaryBtnBg },
              isSyncing && styles.syncButtonDisabled,
            ]}
            onPress={handleSync}
            disabled={isSyncing}
            activeOpacity={0.8}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={colors.primaryBtnText} />
            ) : (
              <>
                <RefreshCw size={13} color={colors.primaryBtnText} />
                <Text style={[styles.syncButtonText, { color: colors.primaryBtnText }]}>
                  {t('syncNow')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.logoutModalOverlay}>
          <View
            style={[
              styles.logoutModalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.logoutModalHeader}>
              <View style={[styles.logoutIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <LogOut size={20} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.logoutModalTitle, { color: colors.textPrimary }]}>
                  Sign Out from AMG OTP Hub?
                </Text>
                {activeUserEmail && (
                  <Text style={[styles.logoutModalUser, { color: colors.primary }]}>
                    {activeUserEmail}
                  </Text>
                )}
              </View>
            </View>

            <Text style={[styles.logoutModalDesc, { color: colors.textSecondary }]}>
              Signing out will revoke active OAuth tokens with Google and clear encrypted credentials from this device.
            </Text>

            <View style={styles.logoutModalBtnRow}>
              <TouchableOpacity
                style={[styles.logoutCancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowLogoutConfirm(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.logoutCancelText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.logoutConfirmBtn, { backgroundColor: '#ef4444' }]}
                onPress={executeLogout}
                activeOpacity={0.8}
              >
                <LogOut size={14} color="#ffffff" />
                <Text style={styles.logoutConfirmText}>
                  Yes, Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: Breakpoints.topBarHeight,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 0,
  },
  menuBtn: {
    padding: Spacing.xs,
    marginRight: 2,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 0.2,
  },
  searchWrapper: {
    flex: 1,
    maxWidth: 380,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 36,
  },
  searchIcon: {
    marginRight: Spacing.xs + 2,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSizes.xs + 1,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: Spacing.xs,
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  paletteCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  paletteDotWrapper: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
  },
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  logoutModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    gap: Spacing.md,
  },
  logoutModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoutIconBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
  },
  logoutModalUser: {
    fontSize: Typography.fontSizes.xs,
    marginTop: 2,
    fontWeight: '600',
  },
  logoutModalDesc: {
    fontSize: Typography.fontSizes.sm,
    lineHeight: 20,
  },
  logoutModalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  logoutCancelBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  logoutCancelText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
  },
  logoutConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
  },
  logoutConfirmText: {
    color: '#ffffff',
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
  },
});
