import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { OtpEntry } from '../types';
import { Radius, Spacing, Typography } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { Copy, Check, ExternalLink, ShieldCheck, Clock, CheckCheck, Sparkles, AlertCircle } from 'lucide-react-native';

interface OtpCardProps {
  otp: OtpEntry;
  isCopied: boolean;
  onCopy: () => void;
  onViewSource?: () => void;
  onToggleUsed?: () => void;
}

export const OtpCard: React.FC<OtpCardProps> = ({
  otp,
  isCopied,
  onCopy,
  onViewSource,
  onToggleUsed,
}) => {
  const { colors, isDark } = useTheme();

  // Confetti / Sparkle burst animation
  const burstAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isCopied) {
      burstAnim.setValue(0);
      Animated.spring(burstAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }).start();
    } else {
      burstAnim.setValue(0);
    }
  }, [isCopied, burstAnim]);

  const formatTimeAgo = (dateStr: string): string => {
    const ms = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(ms / (60 * 1000));
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getConfidenceStyle = () => {
    switch (otp.confidence) {
      case 'HIGH':
        return {
          bg: colors.emeraldLight,
          border: colors.emeraldBorder,
          text: colors.emerald,
          label: 'Verified OTP',
        };
      case 'MEDIUM':
        return {
          bg: colors.amberLight,
          border: colors.amberBorder,
          text: colors.amber,
          label: 'Probable OTP',
        };
      default:
        return {
          bg: colors.amberLight,
          border: colors.amberBorder,
          text: colors.amber,
          label: 'Uncertain Match',
        };
    }
  };

  const confStyle = getConfidenceStyle();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: otp.isUsed ? colors.surfaceSecondary : colors.surface,
          borderColor: isCopied ? colors.emerald : otp.isUsed ? colors.borderLight : colors.border,
          ...(Platform.OS === 'web' && isCopied
            ? { boxShadow: `0 0 20px ${colors.emerald}40` }
            : {}),
        },
        otp.isUsed && styles.cardUsed,
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.serviceRow}>
          <View
            style={[
              styles.serviceAvatar,
              {
                backgroundColor: colors.surfaceHover,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <Text style={[styles.serviceAvatarText, { color: colors.textPrimary }]}>
              {otp.serviceName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View>
            <View style={styles.titleWithLabel}>
              <Text style={[styles.serviceName, { color: colors.textPrimary }]}>
                {otp.serviceName}
              </Text>
              <View
                style={[
                  styles.accountPill,
                  {
                    backgroundColor: colors.primaryLight,
                    borderColor: colors.primaryBorder,
                  },
                ]}
              >
                <Text style={[styles.accountPillText, { color: colors.primary }]}>
                  {otp.accountLabel}
                </Text>
              </View>
            </View>
            <Text style={[styles.senderText, { color: colors.textMuted }]} numberOfLines={1}>
              {otp.sender}
            </Text>
          </View>
        </View>

        <View style={styles.headerMeta}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {otp.isSpam && (
              <View
                style={[
                  styles.spamBadge,
                  { backgroundColor: colors.amberLight, borderColor: colors.amberBorder },
                ]}
              >
                <AlertCircle size={10} color={colors.amber} />
                <Text style={[styles.spamBadgeText, { color: colors.amber }]}>Found in Spam</Text>
              </View>
            )}
            <View
              style={[
                styles.badge,
                { backgroundColor: confStyle.bg, borderColor: confStyle.border },
              ]}
            >
              <ShieldCheck size={11} color={confStyle.text} />
              <Text style={[styles.badgeText, { color: confStyle.text }]}>{confStyle.label}</Text>
            </View>
          </View>
          <View style={styles.timeRow}>
            <Clock size={11} color={colors.textMuted} />
            <Text style={[styles.timeText, { color: colors.textMuted }]}>
              {formatTimeAgo(otp.detectedAt)}
            </Text>
          </View>
        </View>
      </View>

      {/* Code Display & Action Row */}
      <View style={styles.codeRow}>
        <TouchableOpacity
          style={[
            styles.codeBox,
            {
              backgroundColor: colors.codeBg,
              borderColor: isCopied ? colors.emerald : colors.codeBorder,
            },
            isCopied && { backgroundColor: colors.emeraldLight },
          ]}
          onPress={onCopy}
          activeOpacity={0.7}
          {...(Platform.OS === 'web' ? ({ className: 'glow-on-click' } as any) : {})}
        >
          <Text
            style={[
              styles.codeText,
              { color: isCopied ? colors.emerald : colors.codeText },
            ]}
          >
            {otp.code}
          </Text>
        </TouchableOpacity>

        <View style={styles.copyButtonWrapper}>
          <TouchableOpacity
            style={[
              styles.copyButton,
              { backgroundColor: isCopied ? colors.emerald : colors.primaryBtnBg },
            ]}
            onPress={onCopy}
            activeOpacity={0.7}
            {...(Platform.OS === 'web' ? ({ className: 'glow-on-click' } as any) : {})}
          >
            {isCopied ? (
              <>
                <Check size={15} color={colors.primaryBtnText} />
                <Text style={[styles.copyButtonActiveText, { color: colors.primaryBtnText }]}>
                  COPIED
                </Text>
              </>
            ) : (
              <>
                <Copy size={15} color={colors.primaryBtnText} />
                <Text style={[styles.copyButtonText, { color: colors.primaryBtnText }]}>COPY</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Micro-Confetti / Sparkle Burst Particles */}
          {isCopied && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.confettiContainer,
                {
                  opacity: burstAnim.interpolate({
                    inputRange: [0, 0.7, 1],
                    outputRange: [1, 1, 0],
                  }),
                  transform: [
                    {
                      scale: burstAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.6, 1.4],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.sparkleDot, { top: -8, left: 10, backgroundColor: colors.primary }]} />
              <View style={[styles.sparkleDot, { top: -10, right: 15, backgroundColor: colors.cyan }]} />
              <View style={[styles.sparkleDot, { bottom: -6, left: 20, backgroundColor: colors.emerald }]} />
              <View style={[styles.sparkleDot, { bottom: -8, right: 25, backgroundColor: colors.purple }]} />
              <View style={[styles.sparkleStar, { top: 2, right: -10 }]}>
                <Sparkles size={12} color={colors.primary} />
              </View>
              <View style={[styles.sparkleStar, { bottom: 2, left: -10 }]}>
                <Sparkles size={12} color={colors.cyan} />
              </View>
            </Animated.View>
          )}
        </View>
      </View>

      {/* Context snippet */}
      <Text style={[styles.snippet, { color: colors.textSecondary }]} numberOfLines={2}>
        {otp.snippet}
      </Text>

      {/* Footer Tools */}
      <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
        {otp.expiresInMinutes ? (
          <Text style={[styles.expiresText, { color: colors.textMuted }]}>
            ⏱ Code expires in ~{otp.expiresInMinutes} mins
          </Text>
        ) : (
          <Text style={[styles.expiresText, { color: colors.textMuted }]}>
            Single-use verification code
          </Text>
        )}

        <View style={styles.footerActions}>
          {onToggleUsed && (
            <TouchableOpacity
              onPress={onToggleUsed}
              style={styles.actionBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              activeOpacity={0.7}
              {...(Platform.OS === 'web' ? ({ className: 'glow-on-click' } as any) : {})}
            >
              <CheckCheck size={13} color={otp.isUsed ? colors.emerald : colors.textMuted} />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: otp.isUsed ? colors.emerald : colors.textSecondary },
                ]}
              >
                {otp.isUsed ? 'Used' : 'Mark Used'}
              </Text>
            </TouchableOpacity>
          )}

          {onViewSource && (
            <TouchableOpacity
              onPress={onViewSource}
              style={styles.actionBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              activeOpacity={0.7}
              {...(Platform.OS === 'web' ? ({ className: 'glow-on-click' } as any) : {})}
            >
              <ExternalLink size={13} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>Source Email</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  cardUsed: {
    opacity: 0.72,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceAvatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  serviceAvatarText: {
    fontWeight: Typography.fontWeights.bold,
    fontSize: Typography.fontSizes.sm,
  },
  titleWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  serviceName: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  accountPill: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  accountPillText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
  },
  senderText: {
    fontSize: Typography.fontSizes.xs,
    marginTop: 2,
    maxWidth: 240,
  },
  headerMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: Typography.fontSizes.xs,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  codeBox: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontVariant: ['tabular-nums'],
    fontSize: Typography.fontSizes.xxl,
    fontWeight: Typography.fontWeights.extrabold,
    letterSpacing: 4,
  },
  spamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  spamBadgeText: {
    fontSize: 9,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 0.2,
  },
  copyButtonWrapper: {
    position: 'relative',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minWidth: 105,
    height: 48,
  },
  copyButtonText: {
    fontWeight: Typography.fontWeights.extrabold,
    fontSize: Typography.fontSizes.xs + 1,
    letterSpacing: 0.8,
  },
  copyButtonActiveText: {
    fontWeight: Typography.fontWeights.extrabold,
    fontSize: Typography.fontSizes.xs + 1,
    letterSpacing: 0.8,
  },
  confettiContainer: {
    position: 'absolute',
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    zIndex: 99,
  },
  sparkleDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sparkleStar: {
    position: 'absolute',
  },
  snippet: {
    fontSize: Typography.fontSizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  expiresText: {
    fontSize: Typography.fontSizes.xs,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
  },
});
