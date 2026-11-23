import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { EmailMessage, OtpEntry } from '../types';
import { Radius, Spacing, Typography } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { X, Copy, ShieldCheck, Mail, Calendar, User, Tag } from 'lucide-react-native';
import { clipboardAdapter } from '../adapters/clipboardAdapter';

interface SourceEmailModalProps {
  visible: boolean;
  onClose: () => void;
  email: EmailMessage | null;
  highlightOtp?: OtpEntry | null;
  onCopied?: (text: string) => void;
}

export const SourceEmailModal: React.FC<SourceEmailModalProps> = ({
  visible,
  onClose,
  email,
  highlightOtp,
  onCopied,
}) => {
  const { colors } = useTheme();

  if (!email) return null;

  const handleCopyBody = async () => {
    const textToCopy = email.bodyPlain || email.snippet;
    await clipboardAdapter.copy(textToCopy);
    onCopied?.('Email body copied to clipboard');
  };

  const handleCopyCode = async () => {
    if (highlightOtp?.code) {
      await clipboardAdapter.copy(highlightOtp.code);
      onCopied?.(`Copied ${highlightOtp.code}`);
    }
  };

  const renderHighlightedBody = (body: string, codeToHighlight?: string) => {
    if (!codeToHighlight || !body.includes(codeToHighlight)) {
      return <Text style={[styles.bodyText, { color: colors.textPrimary }]}>{body}</Text>;
    }

    const parts = body.split(codeToHighlight);
    return (
      <Text style={[styles.bodyText, { color: colors.textPrimary }]}>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              <Text
                style={[
                  styles.highlightedCodeSpan,
                  {
                    backgroundColor: colors.emeraldLight,
                    borderColor: colors.emeraldBorder,
                    color: colors.emerald,
                  },
                ]}
              >
                {codeToHighlight}
              </Text>
            )}
          </React.Fragment>
        ))}
      </Text>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.headerLeft}>
              <Mail size={18} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                Source Message Inspector
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator>
            {/* Subject */}
            <Text style={[styles.subjectText, { color: colors.textPrimary }]}>{email.subject}</Text>

            {/* OTP Banner if extracted */}
            {highlightOtp && (
              <View
                style={[
                  styles.otpBanner,
                  {
                    backgroundColor: colors.emeraldLight,
                    borderColor: colors.emeraldBorder,
                  },
                ]}
              >
                <View style={styles.otpBannerLeft}>
                  <ShieldCheck size={16} color={colors.emerald} />
                  <Text style={[styles.otpBannerTitle, { color: colors.emerald }]}>
                    Extracted {highlightOtp.serviceName} OTP
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.otpBannerCopy,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.emeraldBorder,
                    },
                  ]}
                  onPress={handleCopyCode}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.otpBannerCode, { color: colors.emerald }]}>
                    {highlightOtp.code}
                  </Text>
                  <Copy size={13} color={colors.emerald} />
                </TouchableOpacity>
              </View>
            )}

            {/* Metadata Grid */}
            <View
              style={[
                styles.metaGrid,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.borderLight,
                },
              ]}
            >
              <View style={styles.metaRow}>
                <User size={13} color={colors.textMuted} />
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>From:</Text>
                <Text style={[styles.metaValue, { color: colors.textSecondary }]} numberOfLines={1}>
                  {email.senderName} &lt;{email.sender}&gt;
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Mail size={13} color={colors.textMuted} />
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>To:</Text>
                <Text style={[styles.metaValue, { color: colors.textSecondary }]} numberOfLines={1}>
                  {email.recipient}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Calendar size={13} color={colors.textMuted} />
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Date:</Text>
                <Text style={[styles.metaValue, { color: colors.textSecondary }]}>
                  {new Date(email.internalDate).toLocaleString()}
                </Text>
              </View>

              {email.labels && email.labels.length > 0 && (
                <View style={styles.metaRow}>
                  <Tag size={13} color={colors.textMuted} />
                  <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Labels:</Text>
                  <View style={styles.labelsRow}>
                    {email.labels.map(l => (
                      <View
                        key={l}
                        style={[
                          styles.labelPill,
                          { backgroundColor: colors.surfaceHover },
                        ]}
                      >
                        <Text style={[styles.labelPillText, { color: colors.textMuted }]}>
                          {l}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Body */}
            <View
              style={[
                styles.bodyBox,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.codeBg,
                },
              ]}
            >
              <View
                style={[
                  styles.bodyBoxHeader,
                  {
                    backgroundColor: colors.surfaceHover,
                    borderBottomColor: colors.borderLight,
                  },
                ]}
              >
                <Text style={[styles.bodyBoxTitle, { color: colors.textSecondary }]}>
                  Message Body (Plaintext / Decoded)
                </Text>
                <TouchableOpacity
                  style={styles.copyBodyBtn}
                  onPress={handleCopyBody}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Copy size={12} color={colors.textSecondary} />
                  <Text style={[styles.copyBodyText, { color: colors.textSecondary }]}>
                    Copy Full Body
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView nestedScrollEnabled style={styles.bodyContentScroll}>
                {renderHighlightedBody(email.bodyPlain || email.snippet, highlightOtp?.code)}
              </ScrollView>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
            <TouchableOpacity
              style={[
                styles.dismissBtn,
                {
                  backgroundColor: colors.surfaceHover,
                  borderColor: colors.border,
                },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.dismissBtnText, { color: colors.textPrimary }]}>
                Close Inspector
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 10, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.base,
  },
  container: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    width: '100%',
    maxWidth: 720,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semibold,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  scrollArea: {
    padding: Spacing.lg,
  },
  subjectText: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    marginBottom: Spacing.md,
  },
  otpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  otpBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  otpBannerTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
  },
  otpBannerCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  otpBannerCode: {
    fontFamily: 'monospace',
    fontWeight: Typography.fontWeights.bold,
    fontSize: Typography.fontSizes.sm,
  },
  metaGrid: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs + 2,
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  metaLabel: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
    width: 48,
  },
  metaValue: {
    fontSize: Typography.fontSizes.xs,
    flex: 1,
  },
  labelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  labelPill: {
    borderRadius: Radius.xs,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  labelPillText: {
    fontSize: 10,
  },
  bodyBox: {
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  bodyBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
  },
  bodyBoxTitle: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
  },
  copyBodyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyBodyText: {
    fontSize: Typography.fontSizes.xs,
  },
  bodyContentScroll: {
    maxHeight: 280,
    padding: Spacing.md,
  },
  bodyText: {
    fontFamily: 'monospace',
    fontSize: Typography.fontSizes.xs + 1,
    lineHeight: 20,
  },
  highlightedCodeSpan: {
    fontWeight: Typography.fontWeights.extrabold,
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  dismissBtn: {
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  dismissBtnText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
});
