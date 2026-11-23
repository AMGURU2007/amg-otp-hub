import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Account } from '../types';
import { Radius, Spacing, Typography } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react-native';

interface AccountContactCardProps {
  account: Account;
  isSelected?: boolean;
  onPress: () => void;
  onSyncPress?: () => void;
}

export const AccountContactCard: React.FC<AccountContactCardProps> = ({
  account,
  isSelected,
  onPress,
  onSyncPress,
}) => {
  const { colors } = useTheme();

  const getInitials = (label: string, email: string): string => {
    if (label && label.length > 0) {
      const parts = label.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return label.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  const isSyncing = account.status === 'syncing';
  const hasError = account.status === 'error';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      {...(Platform.OS === 'web' ? ({ className: 'glow-on-click' } as any) : {})}
    >
      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          { backgroundColor: account.avatarColor || colors.primary },
        ]}
      >
        <Text style={styles.avatarText}>{getInitials(account.label, account.email)}</Text>
        <View
          style={[
            styles.statusDot,
            { borderColor: colors.background },
            isSyncing && { backgroundColor: colors.primary },
            hasError && { backgroundColor: colors.rose },
            !isSyncing && !hasError && { backgroundColor: colors.emerald },
          ]}
        />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.label,
              { color: colors.textPrimary },
              isSelected && { color: colors.primary, fontWeight: '700' },
            ]}
            numberOfLines={1}
          >
            {account.label}
          </Text>
          {account.otpCount > 0 && (
            <View
              style={[
                styles.otpBadge,
                {
                  backgroundColor: colors.emeraldLight,
                  borderColor: colors.emeraldBorder,
                },
              ]}
            >
              <ShieldCheck size={11} color={colors.emerald} />
              <Text style={[styles.otpBadgeText, { color: colors.emerald }]}>
                {account.otpCount}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.email, { color: colors.textMuted }]} numberOfLines={1}>
          {account.email}
        </Text>
      </View>

      {/* Sync Action */}
      {onSyncPress && (
        <TouchableOpacity
          onPress={onSyncPress}
          style={styles.syncBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          disabled={isSyncing}
        >
          {hasError ? (
            <AlertCircle size={15} color={colors.rose} />
          ) : (
            <RefreshCw
              size={14}
              color={isSyncing ? colors.primary : colors.textMuted}
            />
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    borderWidth: 2,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  label: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.semibold,
    flexShrink: 1,
  },
  email: {
    fontSize: Typography.fontSizes.xs,
  },
  otpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  otpBadgeText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
  },
  syncBtn: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
    opacity: 0.8,
  },
});
