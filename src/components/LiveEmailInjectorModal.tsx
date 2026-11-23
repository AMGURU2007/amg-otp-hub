import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Radius, Spacing, Typography } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { db } from '../storage/database';
import { Account } from '../types';
import { SAMPLE_EMAIL_TEMPLATES } from '../storage/seedData';
import { X, Send, Sparkles, Mail, CheckCircle2 } from 'lucide-react-native';

interface LiveEmailInjectorModalProps {
  visible: boolean;
  onClose: () => void;
  accounts: Account[];
  onInjected: (result: { email: any; otp: any }) => void;
}

export const LiveEmailInjectorModal: React.FC<LiveEmailInjectorModalProps> = ({
  visible,
  onClose,
  accounts,
  onInjected,
}) => {
  const { colors, isDark } = useTheme();

  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts[0]?.id || ''
  );
  const [sender, setSender] = useState('security@github.com');
  const [senderName, setSenderName] = useState('GitHub');
  const [subject, setSubject] = useState('[GitHub] Your one-time verification code is 849201');
  const [bodyPlain, setBodyPlain] = useState(
    'Please enter the following 6-digit verification code to complete your device sign-in: 849201. This code expires in 10 minutes.'
  );
  const [isInjecting, setIsInjecting] = useState(false);

  // Quick preset loader
  const handleSelectTemplate = (template: (typeof SAMPLE_EMAIL_TEMPLATES)[0]) => {
    setSender(template.sender);
    setSenderName(template.senderName);
    setSubject(template.subject);
    setBodyPlain(template.bodyPlain);
  };

  const handleInject = async () => {
    if (!subject.trim() || !bodyPlain.trim()) return;

    setIsInjecting(true);
    try {
      // If no account exists yet, auto-create one first
      let accId = selectedAccountId;
      if (!accId && accounts.length > 0) {
        accId = accounts[0].id;
      }
      if (!accId) {
        const created = await db.addLiveAccount({
          email: 'user@gmail.com',
          label: 'Default Inbox',
        });
        accId = created.id;
      }

      const res = await db.injectLiveEmail({
        accountId: accId,
        sender: sender.trim() || 'alerts@service.com',
        senderName: senderName.trim() || sender.split('@')[0],
        subject: subject.trim(),
        bodyPlain: bodyPlain.trim(),
      });

      onInjected(res);
      onClose();
    } catch (err) {
      console.error('Error injecting live email:', err);
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.modalTitleRow}>
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder },
                ]}
              >
                <Sparkles size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Live Incoming Email Injector
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  Test real-time OTP parsing & database ingestion
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Quick Presets */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              QUICK PROVIDER PRESETS
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsRow}
            >
              {SAMPLE_EMAIL_TEMPLATES.map((tmpl, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.presetPill,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: colors.borderLight,
                    },
                  ]}
                  onPress={() => handleSelectTemplate(tmpl)}
                >
                  <Text style={[styles.presetPillText, { color: colors.textPrimary }]}>
                    {tmpl.senderName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Target Account Selector */}
            {accounts.length > 0 && (
              <>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  DELIVER TO ACCOUNT
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.accountSelectorRow}
                >
                  {accounts.map(acc => {
                    const isSelected = (selectedAccountId || accounts[0].id) === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        style={[
                          styles.accountSelectPill,
                          {
                            backgroundColor: isSelected ? colors.primaryLight : colors.surfaceSecondary,
                            borderColor: isSelected ? colors.primary : colors.borderLight,
                          },
                        ]}
                        onPress={() => setSelectedAccountId(acc.id)}
                      >
                        <Text
                          style={[
                            styles.accountSelectText,
                            { color: isSelected ? colors.primary : colors.textSecondary },
                            isSelected && { fontWeight: '700' },
                          ]}
                        >
                          {acc.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Form Inputs */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              SENDER EMAIL & NAME
            </Text>
            <View style={styles.formRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    flex: 1.2,
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.borderLight,
                    color: colors.textPrimary,
                  },
                ]}
                value={sender}
                onChangeText={setSender}
                placeholder="e.g. no-reply@service.com"
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    flex: 0.8,
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.borderLight,
                    color: colors.textPrimary,
                  },
                ]}
                value={senderName}
                onChangeText={setSenderName}
                placeholder="Sender Name"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SUBJECT</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.borderLight,
                  color: colors.textPrimary,
                },
              ]}
              value={subject}
              onChangeText={setSubject}
              placeholder="Email subject..."
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              EMAIL BODY (PLAIN TEXT)
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.borderLight,
                  color: colors.textPrimary,
                },
              ]}
              value={bodyPlain}
              onChangeText={setBodyPlain}
              placeholder="Paste email text containing a code..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
            />
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.modalFooter, { borderTopColor: colors.borderLight }]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.injectBtn,
                { backgroundColor: colors.primaryBtnBg },
                isInjecting && { opacity: 0.7 },
              ]}
              onPress={handleInject}
              disabled={isInjecting}
            >
              {isInjecting ? (
                <ActivityIndicator size="small" color={colors.primaryBtnText} />
              ) : (
                <>
                  <Send size={15} color={colors.primaryBtnText} />
                  <Text style={[styles.injectBtnText, { color: colors.primaryBtnText }]}>
                    Inject & Parse OTP
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 14, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
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
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  modalSubtitle: {
    fontSize: Typography.fontSizes.xs,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 10,
  },
  presetsRow: {
    gap: 8,
    paddingBottom: 6,
  },
  presetPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  presetPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  accountSelectorRow: {
    gap: 8,
    paddingBottom: 6,
  },
  accountSelectPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  accountSelectText: {
    fontSize: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: Typography.fontSizes.sm,
    marginBottom: 8,
  },
  textArea: {
    height: 85,
    textAlignVertical: 'top',
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
    fontWeight: Typography.fontWeights.medium,
  },
  injectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Radius.md,
  },
  injectBtnText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
  },
});
