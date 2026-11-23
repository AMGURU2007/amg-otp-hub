import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Mail, Shield, Check } from 'lucide-react-native';

export const WelcomeDeviceShowcase: React.FC = () => {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Gmail icon SVG-styled representation
  const renderGmailM = () => (
    <View style={styles.gmailIcon}>
      <Text style={styles.gmailMText}>M</Text>
    </View>
  );

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      {/* Background radial glow */}
      <View
        style={[
          styles.glowBackdrop,
          {
            backgroundColor: isDark ? 'rgba(0, 229, 255, 0.12)' : 'rgba(212, 155, 39, 0.12)',
          },
          Platform.OS === 'web' ? ({ filter: 'blur(45px)' } as any) : null,
        ]}
      />

      <View style={[styles.showcaseStage, isMobile && styles.showcaseStageMobile]}>
        {/* 1. LEFT FLOATING GLASS CARD (ACCOUNT LIST) */}
        <View
          style={[
            styles.accountGlassCard,
            isMobile && styles.accountGlassCardMobile,
            {
              backgroundColor: isDark ? 'rgba(8, 28, 52, 0.88)' : 'rgba(255, 250, 238, 0.95)',
              borderColor: isDark ? 'rgba(34, 229, 255, 0.45)' : 'rgba(212, 155, 39, 0.55)',
            },
          ]}
        >
          {/* Account Rows */}
          <View style={styles.accountRow}>
            {renderGmailM()}
            <Text style={[styles.accountLabel, { color: isDark ? '#ffffff' : '#162238' }]}>College</Text>
          </View>
          <View style={styles.accountRow}>
            {renderGmailM()}
            <Text style={[styles.accountLabel, { color: isDark ? '#ffffff' : '#162238' }]}>Programming</Text>
          </View>
          <View style={styles.accountRow}>
            {renderGmailM()}
            <Text style={[styles.accountLabel, { color: isDark ? '#ffffff' : '#162238' }]}>Office</Text>
          </View>
          <View style={styles.accountRow}>
            {renderGmailM()}
            <Text style={[styles.accountLabel, { color: isDark ? '#ffffff' : '#162238' }]}>Personal</Text>
          </View>

          <View style={styles.moreBadgeRow}>
            <Text style={[styles.moreBadgeText, { color: isDark ? '#22e5ff' : '#b87e14' }]}>
              + 15 More...
            </Text>
          </View>
        </View>

        {/* 2. CENTER LAPTOP MOCKUP */}
        <View style={[styles.laptopWrapper, isMobile && styles.laptopWrapperMobile]}>
          {/* Laptop Screen Bezel */}
          <View
            style={[
              styles.laptopScreenBezel,
              {
                borderColor: isDark ? '#0c2342' : '#d2baa0',
                backgroundColor: isDark ? '#020712' : '#f9f3e6',
              },
            ]}
          >
            {/* Screen Inner Display */}
            <View
              style={[
                styles.laptopDisplay,
                {
                  backgroundColor: isDark ? '#040e20' : '#fff9ee',
                },
              ]}
            >
              {/* Screen Content: Envelope + Shield */}
              <View style={styles.screenIllustration}>
                {/* 3D Envelope */}
                <View
                  style={[
                    styles.laptopEnvelope,
                    {
                      backgroundColor: isDark ? '#1e40af' : '#dca327',
                      borderColor: isDark ? '#38bdf8' : '#ffd98a',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.envelopeFlap,
                      {
                        borderTopColor: isDark ? '#60a5fa' : '#ffe6a8',
                      },
                    ]}
                  />
                  <Mail size={isMobile ? 22 : 36} color={isDark ? '#e0f2fe' : '#ffffff'} />
                </View>

                {/* Shield with checkmark */}
                <View
                  style={[
                    styles.shieldBadge,
                    {
                      backgroundColor: isDark ? '#6366f1' : '#c89224',
                      borderColor: isDark ? '#a5b4fc' : '#ffea9f',
                    },
                  ]}
                >
                  <Check size={isMobile ? 12 : 18} color="#ffffff" strokeWidth={3.5} />
                </View>
              </View>
            </View>
          </View>

          {/* Laptop Keyboard Base & Hinge */}
          <View
            style={[
              styles.laptopHinge,
              {
                backgroundColor: isDark ? '#0f274a' : '#cbb092',
              },
            ]}
          />
          <View
            style={[
              styles.laptopBase,
              {
                backgroundColor: isDark ? '#1b3a63' : '#d8c2aa',
                borderColor: isDark ? '#00e5ff' : '#e2bb6e',
              },
            ]}
          >
            <View
              style={[
                styles.notchCutout,
                { backgroundColor: isDark ? '#040b18' : '#fdfbf4' },
              ]}
            />
          </View>
        </View>

        {/* 3. RIGHT SMARTPHONE MOCKUP */}
        <View
          style={[
            styles.phoneWrapper,
            isMobile && styles.phoneWrapperMobile,
            {
              backgroundColor: isDark ? '#020712' : '#f9f3e6',
              borderColor: isDark ? '#143863' : '#cca982',
            },
          ]}
        >
          {/* Top Radiating Alert Ticks */}
          <View style={styles.alertTicksWrap}>
            <View style={[styles.tick, styles.tick1, { backgroundColor: isDark ? '#22e5ff' : '#d49b27' }]} />
            <View style={[styles.tick, styles.tick2, { backgroundColor: isDark ? '#22e5ff' : '#d49b27' }]} />
            <View style={[styles.tick, styles.tick3, { backgroundColor: isDark ? '#22e5ff' : '#d49b27' }]} />
          </View>

          {/* Phone Screen Display */}
          <View
            style={[
              styles.phoneScreen,
              {
                backgroundColor: isDark ? '#040e20' : '#fff9ee',
              },
            ]}
          >
            <View style={styles.phoneSpeaker} />

            {/* Envelope Icon */}
            <View
              style={[
                styles.phoneEnvelopeBox,
                {
                  backgroundColor: isDark ? '#1e40af' : '#dca327',
                },
              ]}
            >
              <Mail size={isMobile ? 16 : 24} color="#ffffff" />
            </View>

            {/* OTP Bold Text */}
            <Text style={[styles.phoneOtpText, { color: isDark ? '#ffffff' : '#162238' }]}>
              OTP
            </Text>

            {/* ***** Stars Badge */}
            <View
              style={[
                styles.phoneStarsPill,
                {
                  backgroundColor: isDark ? '#00e5ff' : '#c89224',
                },
              ]}
            >
              <Text
                style={[
                  styles.phoneStarsText,
                  { color: isDark ? '#031022' : '#ffffff' },
                ]}
              >
                ★★★★★
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 720,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  containerMobile: {
    marginVertical: 12,
    maxWidth: 360,
  },
  glowBackdrop: {
    position: 'absolute',
    width: 440,
    height: 240,
    borderRadius: 220,
    opacity: 0.85,
  },
  showcaseStage: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
    paddingBottom: 8,
  },
  showcaseStageMobile: {
    gap: 8,
    alignItems: 'flex-end',
  },
  // --- 1. ACCOUNT GLASS CARD ---
  accountGlassCard: {
    width: 145,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    transform: [{ rotate: '-6deg' }, { translateY: -15 }],
    zIndex: 2,
  },
  accountGlassCardMobile: {
    width: 105,
    padding: 8,
    borderRadius: 12,
    transform: [{ rotate: '-4deg' }, { translateY: -8 }],
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 7,
  },
  gmailIcon: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  gmailMText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ea4335',
  },
  accountLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  moreBadgeRow: {
    marginTop: 2,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  moreBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  // --- 2. CENTER LAPTOP ---
  laptopWrapper: {
    alignItems: 'center',
    width: 280,
    zIndex: 1,
  },
  laptopWrapperMobile: {
    width: 165,
  },
  laptopScreenBezel: {
    width: '100%',
    height: 168,
    borderRadius: 12,
    borderWidth: 5,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  laptopDisplay: {
    flex: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  screenIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  laptopEnvelope: {
    width: 68,
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  envelopeFlap: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 34,
    borderRightWidth: 34,
    borderTopWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 2,
  },
  shieldBadge: {
    position: 'absolute',
    right: -14,
    bottom: -8,
    width: 32,
    height: 36,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  laptopHinge: {
    width: 64,
    height: 4,
    borderRadius: 2,
  },
  laptopBase: {
    width: 320,
    height: 12,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  notchCutout: {
    width: 44,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  // --- 3. RIGHT SMARTPHONE ---
  phoneWrapper: {
    width: 95,
    height: 172,
    borderRadius: 18,
    borderWidth: 4,
    padding: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 2,
    position: 'relative',
  },
  phoneWrapperMobile: {
    width: 72,
    height: 135,
    borderRadius: 14,
    borderWidth: 3,
    padding: 3,
  },
  alertTicksWrap: {
    position: 'absolute',
    top: -12,
    right: -8,
    width: 24,
    height: 24,
  },
  tick: {
    position: 'absolute',
    width: 3,
    height: 8,
    borderRadius: 2,
  },
  tick1: {
    top: 6,
    left: 4,
    transform: [{ rotate: '-35deg' }],
  },
  tick2: {
    top: 0,
    left: 12,
    transform: [{ rotate: '0deg' }],
  },
  tick3: {
    top: 6,
    left: 20,
    transform: [{ rotate: '35deg' }],
  },
  phoneScreen: {
    flex: 1,
    width: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  phoneSpeaker: {
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#334155',
    marginBottom: 4,
  },
  phoneEnvelopeBox: {
    width: 34,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneOtpText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  phoneStarsPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  phoneStarsText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
