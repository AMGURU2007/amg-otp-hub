import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NavigationTab, Account } from '../types';
import { Radius, Spacing, Typography, Breakpoints } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { AppLogo } from './AppLogo';
import {
  LayoutDashboard,
  ShieldAlert,
  Mail,
  Users,
  Settings,
  Sparkles,
  X,
  Plus,
} from 'lucide-react-native';

export type ExtendedNavTab = NavigationTab | 'welcome';

interface SidebarNavProps {
  currentTab: string;
  onSelectTab: (tab: ExtendedNavTab) => void;
  accounts: Account[];
  selectedAccountId: string | null;
  onSelectAccount: (id: string) => void;
  onCloseMobileDrawer?: () => void;
  isMobileDrawer?: boolean;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentTab,
  onSelectTab,
  accounts,
  selectedAccountId,
  onSelectAccount,
  onCloseMobileDrawer,
  isMobileDrawer,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const navItems: Array<{ id: ExtendedNavTab; label: string; icon: any }> = [
    { id: 'welcome', label: t('navHome'), icon: Sparkles },
    { id: 'dashboard', label: t('navDashboard'), icon: LayoutDashboard },
    { id: 'otp', label: t('navOtps'), icon: ShieldAlert },
    { id: 'inbox', label: t('navInbox'), icon: Mail },
    { id: 'accounts', label: t('navAccounts'), icon: Users },
    { id: 'settings', label: t('navSettings'), icon: Settings },
  ];

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: colors.surface,
          borderRightColor: colors.borderLight,
        },
        isMobileDrawer && styles.mobileDrawerSidebar,
      ]}
    >
      {/* Clean Brand Header (Logo Icon Only - No App Title Clutter) */}
      <View
        style={[
          styles.brandHeader,
          {
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.logoRow}
          onPress={() => onSelectTab('welcome')}
          activeOpacity={0.8}
        >
          <AppLogo size={36} withGlow={isDark} />
        </TouchableOpacity>

        {isMobileDrawer && onCloseMobileDrawer && (
          <TouchableOpacity onPress={onCloseMobileDrawer} style={styles.closeDrawerBtn}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Nav Menu */}
      <View
        style={[
          styles.navSection,
          {
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.id ||
            (item.id === 'welcome' && (currentTab === '/' || currentTab === 'welcome'));
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.navItem,
                isActive && {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
              onPress={() => {
                onSelectTab(item.id);
                if (isMobileDrawer && onCloseMobileDrawer) {
                  onCloseMobileDrawer();
                }
              }}
              activeOpacity={0.7}
            >
              <Icon
                size={18}
                color={isActive ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.navLabel,
                  { color: isActive ? colors.textPrimary : colors.textSecondary },
                  isActive && { fontWeight: Typography.fontWeights.bold },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Target Accounts Section */}
      <View style={styles.contactsHeader}>
        <Text style={[styles.sectionHeaderTitle, { color: colors.textMuted }]}>
          {t('targetAccounts').toUpperCase()} ({accounts.length})
        </Text>
        <TouchableOpacity
          onPress={() => onSelectTab('accounts')}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Plus size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.accountsScroll} showsVerticalScrollIndicator={false}>
        {accounts.length === 0 ? (
          <View style={styles.emptyAccountsNotice}>
            <Text style={[styles.emptyAccountsText, { color: colors.textMuted }]}>
              {t('noAccountsYet')}
            </Text>
            <TouchableOpacity
              style={[
                styles.addFirstAccountBtn,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight },
              ]}
              onPress={() => onSelectTab('accounts')}
            >
              <Text style={[styles.addFirstAccountBtnText, { color: colors.primary }]}>
                + {t('connectGmailBtn')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          accounts.map(acc => {
            const isSelected = selectedAccountId === acc.id;
            return (
              <TouchableOpacity
                key={acc.id}
                style={[
                  styles.contactRow,
                  isSelected && {
                    backgroundColor: colors.surfaceHover,
                  },
                ]}
                onPress={() => {
                  onSelectAccount(acc.id);
                  if (isMobileDrawer && onCloseMobileDrawer) {
                    onCloseMobileDrawer();
                  }
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.accountDot,
                    { backgroundColor: acc.avatarColor || colors.primary },
                  ]}
                >
                  <Text style={styles.avatarMiniChar}>
                    {acc.label.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.accountTextCol}>
                  <Text
                    style={[
                      styles.accountLabel,
                      { color: isSelected ? colors.primary : colors.textPrimary },
                      isSelected && { fontWeight: Typography.fontWeights.bold },
                    ]}
                    numberOfLines={1}
                  >
                    {acc.label}
                  </Text>
                  <Text style={[styles.accountEmail, { color: colors.textMuted }]} numberOfLines={1}>
                    {acc.email}
                  </Text>
                </View>

                {acc.otpCount > 0 && (
                  <View
                    style={[
                      styles.otpPill,
                      {
                        backgroundColor: colors.emeraldLight,
                        borderColor: colors.emeraldBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.otpPillText, { color: colors.emerald }]}>
                      {acc.otpCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: Breakpoints.sidebarWidth,
    height: '100%',
    borderRightWidth: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  mobileDrawerSidebar: {
    width: 280,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  brandHeader: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: {
    paddingVertical: 2,
  },
  closeDrawerBtn: {
    padding: Spacing.xs,
  },
  navSection: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: 3,
    borderBottomWidth: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
  },
  navLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
  contactsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  sectionHeaderTitle: {
    fontSize: 10,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 0.8,
  },
  accountsScroll: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  emptyAccountsNotice: {
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyAccountsText: {
    fontSize: Typography.fontSizes.xs,
    textAlign: 'center',
  },
  addFirstAccountBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  addFirstAccountBtnText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.md,
    gap: Spacing.sm,
    marginBottom: 2,
  },
  accountDot: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniChar: {
    color: '#07101d',
    fontSize: 10,
    fontWeight: 'bold',
  },
  accountTextCol: {
    flex: 1,
  },
  accountLabel: {
    fontSize: Typography.fontSizes.xs + 1,
    fontWeight: Typography.fontWeights.medium,
  },
  accountEmail: {
    fontSize: 10,
  },
  otpPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  otpPillText: {
    fontSize: 10,
    fontWeight: Typography.fontWeights.bold,
  },
});
