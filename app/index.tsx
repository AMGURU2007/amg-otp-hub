import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/ThemeContext';
import { useLanguage } from '../src/i18n/LanguageContext';
import { WelcomeDeviceShowcase } from '../src/components/WelcomeDeviceShowcase';
import { AppLogo } from '../src/components/AppLogo';
import { LightTunnel } from '../src/components/LightTunnel';
import { GoogleSignInButton } from '../src/components/GoogleSignInButton';
import ShatterType from '../src/components/ShatterType';
import { bootManager, BootStage } from '../src/utils/bootState';
import { oauthService } from '../src/services/oauthService';
import { useApp } from './_layout';
import { THEME_PALETTES, Radius, Spacing, Typography } from '../src/theme/tokens';
import {
  Users,
  Code,
  Zap,
  Lock,
  MonitorSmartphone,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Globe,
  ShieldCheck,
  HardDrive,
  Sparkles,
} from 'lucide-react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isDark, colors, toggleTheme, theme, setTheme } = useTheme();
  const { t, language, setLanguage, languages, currentLanguageInfo } = useLanguage();
  const { width } = useWindowDimensions();
  const { showToast, activeSession } = useApp();

  const isMobile = width < 768;
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Strict 3-stage sequential boot machine state
  const [bootStage, setBootStage] = useState<BootStage>(() => {
    return bootManager.hasColdBooted ? 'STAGE_2_ACTIVE' : 'STAGE_1_SHATTER';
  });
  const [isStage2Rolling, setIsStage2Rolling] = useState(bootManager.hasColdBooted);
  const welcomeFadeAnim = useRef(new Animated.Value(bootManager.hasColdBooted ? 1 : 0)).current;
  const [tunnelFadingOut, setTunnelFadingOut] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Subscribe to external stage triggers (e.g. clicking Home/Logo in sidebar)
  useEffect(() => {
    return bootManager.subscribe(newStage => {
      setBootStage(newStage);
    });
  }, []);

  // --- STAGE 2 (0.0s – 2.6s): CINEMATIC LIGHT TUNNEL & WELCOME EMERGENCE ANIMATIONS ---
  const tunnelOpacityAnim = useRef(new Animated.Value(1)).current;
  const portalScaleAnim = useRef(new Animated.Value(bootManager.hasColdBooted ? 1 : 0.35)).current;
  const portalOpacityAnim = useRef(new Animated.Value(bootManager.hasColdBooted ? 1 : 0)).current;
  const materializationOpacityAnim = useRef(new Animated.Value(bootManager.hasColdBooted ? 1 : 0)).current;
  const materializationTranslateYAnim = useRef(new Animated.Value(bootManager.hasColdBooted ? 0 : 24)).current;

  const startStage2RollIn = () => {
    setIsStage2Rolling(true);

    // Seamless Cross-Fade (0.4s ease-in-out)
    Animated.timing(welcomeFadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Reset animation values for a fresh, crisp roll-in at t = 0
    portalScaleAnim.setValue(0.35);
    portalOpacityAnim.setValue(0);
    materializationOpacityAnim.setValue(0);
    materializationTranslateYAnim.setValue(24);
    tunnelOpacityAnim.setValue(1);
    setTunnelFadingOut(false);

    // 0.0s – 0.9s: Center Portal Emergence from Tunnel Vanishing Point
    Animated.parallel([
      Animated.timing(portalScaleAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.back(1.15)),
        useNativeDriver: true,
      }),
      Animated.timing(portalOpacityAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // 0.4s – 1.4s: Materialize Welcome Page UI (showcase, cards, buttons)
    const timerMaterialize = setTimeout(() => {
      Animated.parallel([
        Animated.timing(materializationOpacityAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(materializationTranslateYAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 400);

    // 2.0s – 2.6s: Smoothly fade LightTunnel opacity from 1 down to 0 over 600ms
    const timerTunnelFade = setTimeout(() => {
      setTunnelFadingOut(true);
      Animated.timing(tunnelOpacityAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 2000);

    // At 2.6s: Completely STOP and UNMOUNT LightTunnel -> advance to STAGE_3_READY
    const timerTunnelUnmount = setTimeout(() => {
      setBootStage('STAGE_3_READY');
      setIsStage2Rolling(false);
    }, 2600);

    return () => {
      clearTimeout(timerMaterialize);
      clearTimeout(timerTunnelFade);
      clearTimeout(timerTunnelUnmount);
    };
  };

  const handleCrossFadeStart = () => {
    setBootStage('STAGE_2_ACTIVE');
    startStage2RollIn();
  };

  const handleShatterComplete = () => {
    bootManager.hasColdBooted = true;
    setBootStage('STAGE_2_ACTIVE');
  };

  useEffect(() => {
    if (bootStage === 'STAGE_2_ACTIVE') {
      const cleanup = startStage2RollIn();
      return cleanup;
    } else if (bootStage === 'STAGE_3_READY') {
      welcomeFadeAnim.setValue(1);
      portalScaleAnim.setValue(1);
      portalOpacityAnim.setValue(1);
      materializationOpacityAnim.setValue(1);
      materializationTranslateYAnim.setValue(0);
      tunnelOpacityAnim.setValue(0);
      setTunnelFadingOut(true);
      setIsStage2Rolling(false);
    }
  }, [bootStage]);

  // Dynamic Theme Colors for LightTunnel during intro
  const getTunnelThemeProps = () => {
    switch (theme) {
      case 'aurora':
        return {
          cableColor: '#10f5b8',
          pulseColor: '#9d65ff',
          tunnelColor: '#090e17',
          lightMode: false,
        };
      case 'milky':
        return {
          cableColor: '#e6b63b',
          pulseColor: '#b88116',
          tunnelColor: '#fcfaf5',
          lightMode: true,
        };
      case 'pearl':
        return {
          cableColor: '#2563eb',
          pulseColor: '#f43f5e',
          tunnelColor: '#ffffff',
          lightMode: true,
        };
      case 'midnight':
      default:
        return {
          cableColor: isDark ? '#00f2fe' : '#e6b63b',
          pulseColor: isDark ? '#6b9cff' : '#b88116',
          tunnelColor: isDark ? '#07101d' : '#fcfaf5',
          lightMode: !isDark,
        };
    }
  };

  const tunnelThemeProps = getTunnelThemeProps();

  const handleGoogleSignIn = async () => {
    showToast('Initiating Google OAuth 2.0 PKCE...');
    try {
      const res = await oauthService.signInWithGoogle('Primary');
      if (res.success && res.account) {
        showToast(`Connected ${res.account.label}! Redirecting to Dashboard...`);
        router.push('/dashboard');
      } else if (res.success) {
        showToast('Redirecting to Google secure authentication...');
      } else {
        showToast(`OAuth: ${res.error || 'Connection failed'}`);
        router.push('/accounts');
      }
    } catch (err: any) {
      showToast(`Sign in error: ${err.message}`);
      router.push('/accounts');
    }
  };

  // Laurel Wreath rendering
  const renderLaurelWreathLeft = () => {
    const strokeColor = colors.laurel || colors.primary;
    if (Platform.OS === 'web') {
      return (
        <svg width="42" height="56" viewBox="0 0 38 52" fill="none" style={{ marginRight: 12 }}>
          <path
            d="M32 48 C24 38, 16 26, 20 4"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M25 42 C18 42, 14 37, 16 32 C18 30, 23 35, 25 42 Z" fill={strokeColor} />
          <path d="M28 38 C33 34, 37 31, 35 27 C31 25, 27 30, 28 38 Z" fill={strokeColor} />
          <path d="M21 31 C14 30, 10 24, 13 19 C17 17, 20 23, 21 31 Z" fill={strokeColor} />
          <path d="M24 26 C29 22, 33 19, 31 15 C28 13, 25 18, 24 26 Z" fill={strokeColor} />
          <path d="M20 17 C13 15, 11 9, 15 5 C18 4, 20 10, 20 17 Z" fill={strokeColor} />
          <path d="M22 13 C26 9, 28 5, 26 2 C23 1, 21 6, 22 13 Z" fill={strokeColor} />
        </svg>
      );
    }
    return <Sparkles size={24} color={strokeColor} style={{ marginRight: 8 }} />;
  };

  const renderLaurelWreathRight = () => {
    const strokeColor = colors.laurel || colors.primary;
    if (Platform.OS === 'web') {
      return (
        <svg
          width="42"
          height="56"
          viewBox="0 0 38 52"
          fill="none"
          style={{ marginLeft: 12, transform: 'scaleX(-1)' }}
        >
          <path
            d="M32 48 C24 38, 16 26, 20 4"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M25 42 C18 42, 14 37, 16 32 C18 30, 23 35, 25 42 Z" fill={strokeColor} />
          <path d="M28 38 C33 34, 37 31, 35 27 C31 25, 27 30, 28 38 Z" fill={strokeColor} />
          <path d="M21 31 C14 30, 10 24, 13 19 C17 17, 20 23, 21 31 Z" fill={strokeColor} />
          <path d="M24 26 C29 22, 33 19, 31 15 C28 13, 25 18, 24 26 Z" fill={strokeColor} />
          <path d="M20 17 C13 15, 11 9, 15 5 C18 4, 20 10, 20 17 Z" fill={strokeColor} />
          <path d="M22 13 C26 9, 28 5, 26 2 C23 1, 21 6, 22 13 Z" fill={strokeColor} />
        </svg>
      );
    }
    return <Sparkles size={24} color={strokeColor} style={{ marginLeft: 8 }} />;
  };


  const featureCards = [
    {
      id: 'f1',
      icon: Users,
      title: t('featManageAccounts'),
      action: () => router.push('/accounts'),
    },
    {
      id: 'f2',
      icon: Code,
      title: t('featAutoDetectOtp'),
      action: () => router.push('/otp'),
    },
    {
      id: 'f3',
      icon: Zap,
      title: t('featUnifiedOtp'),
      action: () => router.push('/otp'),
    },
    {
      id: 'f4',
      icon: Lock,
      title: t('featPrivateLocal'),
      action: () => router.push('/settings'),
    },
    {
      id: 'f5',
      icon: MonitorSmartphone,
      title: t('featCrossPlatform'),
      action: () => router.push('/dashboard'),
    },
    ...(isMobile
      ? [
          {
            id: 'f6',
            icon: Sparkles,
            title: t('featThemes'),
            action: toggleTheme,
          },
        ]
      : []),
  ];

  return (
    <View style={[styles.rootContainer, { backgroundColor: colors.background }]}>
      {/* 0. STAGE 1: SHATTER-TYPE GLASS-SHARD HEADLINE (Cross-fades out and unmounts once 100% finished) */}
      {bootStage === 'STAGE_1_SHATTER' && (
        <ShatterType
          text="AMG"
          subtitle="ONE CODEBASE · ALL ACCOUNTS · ONE INBOX"
          primaryColor={isDark ? '#22e5ff' : '#d49b27'}
          secondaryColor="#ffffff"
          bgColor="#040b18"
          autoCompleteMs={4800}
          onCrossFadeStart={handleCrossFadeStart}
          onComplete={handleShatterComplete}
        />
      )}

      {/* 1. CINEMATIC LIGHT TUNNEL INTRO (Pre-mounted in background for zero-glitch shader compilation; unmounted at STAGE_3_READY) */}
      {bootStage !== 'STAGE_3_READY' && (
        <Animated.View
          style={[
            styles.tunnelBackdrop,
            {
              opacity: isStage2Rolling ? tunnelOpacityAnim : 0,
            },
          ]}
          pointerEvents="none"
        >
          <LightTunnel
            {...tunnelThemeProps}
            intro={true}
            active={isStage2Rolling}
            flowDirection="inward"
            speed={0.22}
            pulseSpeed={2.8}
            glow={1.4}
            centerX={0}
            centerY={0}
            style={{ width: '100%', height: '100%' }}
          />
        </Animated.View>
      )}

      {/* 2. WELCOME PAGE CONTENT CONTAINER (Cross-fades in with 0.4s ease-in-out) */}
      <Animated.View
        style={[
          styles.welcomeContentFader,
          {
            opacity: welcomeFadeAnim,
          },
        ]}
        pointerEvents={bootStage === 'STAGE_1_SHATTER' ? 'none' : 'auto'}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
        {/* 2. TOP-RIGHT CONTROLS: 4-DOT PALETTE + THEME TOGGLE + INDIAN LANGUAGES */}
        <Animated.View
          style={[
            styles.topControlRow,
            {
              opacity: materializationOpacityAnim,
              transform: [{ translateY: materializationTranslateYAnim }],
            },
          ]}
        >
          {/* 4-Dot Color Pattern Selector */}
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
                  {...(Platform.OS === 'web' ? ({ className: 'glow-on-click' } as any) : {})}
                >
                  <View
                    style={[
                      styles.paletteDot,
                      {
                        backgroundColor: p.dot,
                        transform: [{ scale: isActive ? 1.3 : 1 }],
                      },
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sun / Moon Switch Pill */}
          <TouchableOpacity
            style={[
              styles.themeTogglePill,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.borderLight,
              },
            ]}
            onPress={toggleTheme}
            activeOpacity={0.7}
            {...(Platform.OS === 'web' ? ({ className: 'glow-on-click' } as any) : {})}
          >
            <View
              style={[
                styles.themeToggleHalf,
                isDark && {
                  backgroundColor: colors.primaryLight,
                  borderRadius: 999,
                },
              ]}
            >
              <Moon size={14} color={isDark ? colors.primary : colors.textMuted} />
            </View>
            <View
              style={[
                styles.themeToggleHalf,
                !isDark && {
                  backgroundColor: colors.primaryBtnBg,
                  borderRadius: 999,
                },
              ]}
            >
              <Sun size={14} color={!isDark ? colors.primaryBtnText : colors.textMuted} />
            </View>
          </TouchableOpacity>

          {/* Indian Languages Selector Dropdown */}
          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              style={[
                styles.langPill,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.borderLight,
                },
              ]}
              onPress={() => setShowLangMenu(!showLangMenu)}
              activeOpacity={0.7}
              {...(Platform.OS === 'web' ? ({ className: 'glow-on-click' } as any) : {})}
            >
              <Globe size={14} color={colors.primary} />
              <Text style={[styles.langText, { color: colors.textPrimary }]}>
                {currentLanguageInfo.nativeName}
              </Text>
              <ChevronDown size={14} color={colors.primary} />
            </TouchableOpacity>

            {showLangMenu && (
              <View
                style={[
                  styles.langDropdown,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {languages.map(l => (
                  <TouchableOpacity
                    key={l.code}
                    style={[
                      styles.langOption,
                      language === l.code && {
                        backgroundColor: colors.surfaceHover,
                      },
                    ]}
                    onPress={() => {
                      setLanguage(l.code);
                      setShowLangMenu(false);
                      showToast(`Language set to ${l.nativeName}`);
                    }}
                    {...(Platform.OS === 'web' ? ({ className: 'glow-on-click' } as any) : {})}
                  >
                    <Text
                      style={[
                        styles.langOptionText,
                        { color: language === l.code ? colors.primary : colors.textPrimary },
                        language === l.code && { fontWeight: '700' },
                      ]}
                    >
                      {l.nativeName} ({l.name})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Animated.View>

        {/* 3. CENTER HERO: LOGO & BRAND TITLE EMERGING FROM TUNNEL PORTAL (0.8s – 1.8s) */}
        <Animated.View
          style={[
            styles.heroHeader,
            {
              opacity: portalOpacityAnim,
              transform: [{ scale: portalScaleAnim }],
            },
          ]}
        >
          {/* Clean Rounded-Square App Logo */}
          <View style={styles.logoItem}>
            <AppLogo size={isMobile ? 96 : 116} withGlow={true} animated />
          </View>

          {/* Laurel Wreaths + AMG OTP Hub Title */}
          <View style={styles.titleWithWreaths}>
            {renderLaurelWreathLeft()}

            <Text
              style={[
                styles.heroTitle,
                { color: isDark ? '#ffffff' : '#162238' },
              ]}
            >
              AMG{' '}
              <Text
                style={{
                  color: colors.primary,
                  fontWeight: '800',
                  textShadowColor: colors.glow,
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 10,
                }}
              >
                OTP Hub
              </Text>
            </Text>

            {renderLaurelWreathRight()}
          </View>

          {/* Subtitle */}
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            {t('heroSubtitle')}
          </Text>
        </Animated.View>

        {/* 4. CENTER COMPOSITE DEVICE SHOWCASE & CARDS (MATERIALIZATION 1.4s – 2.2s) */}
        <Animated.View
          style={[
            styles.mainMaterializeSection,
            {
              opacity: materializationOpacityAnim,
              transform: [{ translateY: materializationTranslateYAnim }],
            },
          ]}
        >
          <View style={styles.showcaseContainer}>
            <WelcomeDeviceShowcase />
          </View>

          {/* 5. RESPONSIVE FEATURE CARDS (WITH VIVID CLICK-GLOW BURST & ACTIVE AURA) */}
          <View style={[styles.cardsContainer, isMobile && styles.cardsContainerMobile]}>
            {featureCards.map(c => {
              const Icon = c.icon;
              const isCardActive = selectedCardId === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.featureCard,
                    isMobile && styles.featureCardMobile,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isCardActive ? colors.primary : colors.borderLight,
                    },
                    isCardActive && (Platform.OS === 'web'
                      ? ({
                          boxShadow: `0 0 28px 6px var(--theme-glow-color, ${colors.primary}), inset 0 0 14px var(--theme-glow-color, ${colors.primary})`,
                          borderColor: colors.primary,
                          transform: 'scale(1.025)',
                        } as any)
                      : {
                          borderColor: colors.primary,
                          elevation: 10,
                        }),
                  ]}
                  onPress={() => {
                    setSelectedCardId(c.id);
                    c.action();
                  }}
                  activeOpacity={0.7}
                  {...(Platform.OS === 'web'
                    ? ({
                        className: `glow-on-click feature-card${isCardActive ? ' card-clicked-glow' : ''}`,
                        'data-selected': isCardActive ? 'true' : 'false',
                      } as any)
                    : {})}
                >
                  <View
                    style={[
                      styles.cardIconBox,
                      {
                        backgroundColor: isCardActive ? colors.primary : colors.primaryLight,
                      },
                    ]}
                  >
                    <Icon size={isMobile ? 22 : 26} color={isCardActive ? colors.primaryBtnText : colors.primary} />
                  </View>
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: isCardActive ? colors.primary : colors.textPrimary },
                      isMobile && styles.cardTitleMobile,
                    ]}
                  >
                    {c.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 6. ACTION BUTTONS: GET STARTED & SIGN IN WITH GOOGLE */}
          <View style={[styles.ctaSection, isMobile && styles.ctaSectionMobile]}>
            {/* Primary CTA: Get Started */}
            <TouchableOpacity
              style={[
                styles.primaryCtaBtn,
                {
                  backgroundColor: colors.primaryBtnBg,
                  shadowColor: colors.primaryBtnShadow,
                },
              ]}
              onPress={() => router.push('/dashboard')}
              activeOpacity={0.7}
              {...(Platform.OS === 'web' ? ({ className: 'glow-on-click' } as any) : {})}
            >
              <Text
                style={[
                  styles.primaryCtaText,
                  { color: colors.primaryBtnText },
                ]}
              >
                {t('getStarted')}
              </Text>
              <ArrowRight size={20} color={colors.primaryBtnText} />
            </TouchableOpacity>

            {/* Secondary CTA: Official White Google Sign In Button */}
            <GoogleSignInButton
              style={styles.googleCtaBtn}
              onPress={handleGoogleSignIn}
              label={activeSession ? `Connected as ${activeSession.email}` : t('signInWithGoogle')}
            />
          </View>

          {/* 7. LEARN MORE ACCORDION */}
          <View style={styles.learnMoreSection}>
            <TouchableOpacity
              style={styles.learnMoreTrigger}
              onPress={() => setShowLearnMore(!showLearnMore)}
              activeOpacity={0.7}
              {...(Platform.OS === 'web' ? ({ className: 'glow-on-click' } as any) : {})}
            >
              <Text style={[styles.learnMoreText, { color: colors.textSecondary }]}>
                {t('learnMore')}
              </Text>
              {showLearnMore ? (
                <ChevronUp size={16} color={colors.primary} />
              ) : (
                <ChevronDown size={16} color={colors.primary} />
              )}
            </TouchableOpacity>

            {showLearnMore && (
              <View
                style={[
                  styles.learnMoreBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <View style={styles.learnMoreRow}>
                  <HardDrive size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.learnMoreItemTitle, { color: colors.textPrimary }]}>
                      {t('learnMoreTitle1')}
                    </Text>
                    <Text style={[styles.learnMoreItemDesc, { color: colors.textMuted }]}>
                      {t('learnMoreDesc1')}
                    </Text>
                  </View>
                </View>

                <View style={styles.learnMoreRow}>
                  <ShieldCheck size={18} color={colors.emerald} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.learnMoreItemTitle, { color: colors.textPrimary }]}>
                      {t('learnMoreTitle2')}
                    </Text>
                    <Text style={[styles.learnMoreItemDesc, { color: colors.textMuted }]}>
                      {t('learnMoreDesc2')}
                    </Text>
                  </View>
                </View>

                <View style={styles.learnMoreRow}>
                  <Zap size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.learnMoreItemTitle, { color: colors.textPrimary }]}>
                      {t('learnMoreTitle3')}
                    </Text>
                    <Text style={[styles.learnMoreItemDesc, { color: colors.textMuted }]}>
                      {t('learnMoreDesc3')}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    minHeight: '100vh' as any,
    position: 'relative',
    overflow: 'hidden',
  },
  welcomeContentFader: {
    flex: 1,
    width: '100%',
    minHeight: '100vh' as any,
  },
  shatterContainer: {
    flex: 1,
    minHeight: '100vh' as any,
    width: '100%',
    backgroundColor: '#040b18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tunnelBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  scrollArea: {
    flex: 1,
    zIndex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  topControlRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    zIndex: 10,
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
    width: 22,
    height: 22,
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
  themeTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    width: 64,
    height: 32,
  },
  themeToggleHalf: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    height: 32,
  },
  langText: {
    fontSize: 13,
    fontWeight: '600',
  },
  langDropdown: {
    position: 'absolute',
    top: 38,
    right: 0,
    minWidth: 160,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
  },
  langOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  langOptionText: {
    fontSize: 13,
  },
  heroHeader: {
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 2,
  },
  logoItem: {
    marginBottom: 12,
  },
  titleWithWreaths: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  mainMaterializeSection: {
    width: '100%',
    alignItems: 'center',
    zIndex: 2,
  },
  showcaseContainer: {
    width: '100%',
    marginVertical: 14,
    alignItems: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    gap: 14,
    width: '100%',
    maxWidth: 960,
    marginTop: 8,
    marginBottom: 24,
  },
  cardsContainerMobile: {
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  featureCard: {
    flex: 1,
    minWidth: 150,
    maxWidth: 180,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  featureCardMobile: {
    flexBasis: '31%',
    minWidth: 100,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 14,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  cardTitleMobile: {
    fontSize: 11,
    lineHeight: 14,
  },
  ctaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 620,
    marginBottom: 24,
    zIndex: 50,
  },
  ctaSectionMobile: {
    flexDirection: 'column',
    width: '100%',
    maxWidth: 340,
    gap: 12,
    zIndex: 50,
  },
  primaryCtaBtn: {
    flex: 1,
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Radius.full,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 50,
  },
  primaryCtaText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  googleCtaBtn: {
    flex: 1,
    minWidth: 220,
    zIndex: 50,
  },
  learnMoreSection: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 640,
  },
  learnMoreTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  learnMoreText: {
    fontSize: 13,
    fontWeight: '600',
  },
  learnMoreBox: {
    width: '100%',
    marginTop: 12,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  learnMoreRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  learnMoreItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  learnMoreItemDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});
