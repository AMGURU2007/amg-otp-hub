import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { EmailMessage } from '../types';
import { Radius, Spacing, Typography } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { KeyRound, Mail, MailOpen } from 'lucide-react-native';

interface EmailRowProps {
  email: EmailMessage;
  isSelected?: boolean;
  onPress: () => void;
}

export const EmailRow: React.FC<EmailRowProps> = ({ email, isSelected, onPress }) => {
  const { colors } = useTheme();

  const formatTime = (ts: number): string => {
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.borderLight,
        },
        isSelected && { backgroundColor: colors.surfaceSecondary },
        !email.isRead && { backgroundColor: colors.surfaceHover },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconCol}>
        {email.isRead ? (
          <MailOpen size={16} color={colors.textMuted} />
        ) : (
          <Mail size={16} color={colors.primary} />
        )}
      </View>

      <View style={styles.contentCol}>
        <View style={styles.topRow}>
          <Text
            style={[
              styles.sender,
              { color: colors.textPrimary },
              !email.isRead && styles.boldText,
            ]}
            numberOfLines={1}
          >
            {email.senderName || email.sender}
          </Text>

          <View style={styles.timeGroup}>
            {email.hasOtp && (
              <View
                style={[
                  styles.otpIndicator,
                  {
                    backgroundColor: colors.emeraldLight,
                    borderColor: colors.emeraldBorder,
                  },
                ]}
              >
                <KeyRound size={11} color={colors.emerald} />
                <Text style={[styles.otpIndicatorText, { color: colors.emerald }]}>OTP</Text>
              </View>
            )}
            <Text style={[styles.timeText, { color: colors.textMuted }]}>
              {formatTime(email.internalDate)}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.subject,
            { color: colors.textPrimary },
            !email.isRead && styles.boldSubject,
          ]}
          numberOfLines={1}
        >
          {email.subject}
        </Text>

        <Text style={[styles.snippet, { color: colors.textMuted }]} numberOfLines={2}>
          {email.snippet}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  iconCol: {
    marginRight: Spacing.md,
    paddingTop: 2,
  },
  contentCol: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  sender: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
    flex: 1,
    marginRight: Spacing.sm,
  },
  boldText: {
    fontWeight: Typography.fontWeights.bold,
  },
  timeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: Typography.fontSizes.xs - 1,
  },
  otpIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  otpIndicatorText: {
    fontSize: 9,
    fontWeight: Typography.fontWeights.extrabold,
    letterSpacing: 0.5,
  },
  subject: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.normal,
    marginBottom: 4,
  },
  boldSubject: {
    fontWeight: Typography.fontWeights.semibold,
  },
  snippet: {
    fontSize: Typography.fontSizes.xs,
    lineHeight: 16,
  },
});
