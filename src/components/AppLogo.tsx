import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Text, Platform, Animated, Easing } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface AppLogoProps {
  size?: number;
  withGlow?: boolean;
  animated?: boolean;
  style?: any;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 116,
  withGlow = true,
  animated = true,
  style,
}) => {
  const [hasError, setHasError] = useState(false);
  const { colors, isDark } = useTheme();

  // Gentle floating breathing animation (translateY(-5px) over 3.2s loop)
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    const floatingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    floatingLoop.start();
    return () => floatingLoop.stop();
  }, [animated, floatAnim]);

  const cornerRadius = Math.round(size * 0.22);
  const borderColor = isDark ? '#22e5ff' : '#d49b27';

  // Fallback high-precision neon badge matching the user's icon if image fails
  const renderFallback = () => {
    const scale = size / 116;
    return (
      <View
        style={[
          styles.fallbackContainer,
          {
            width: size,
            height: size,
            borderRadius: cornerRadius,
            borderColor,
            backgroundColor: isDark ? '#060d1b' : '#fffaf0',
          },
        ]}
      >
        {/* Badge *** */}
        <View
          style={[
            styles.starsBadge,
            {
              top: Math.round(14 * scale),
              right: Math.round(16 * scale),
              paddingHorizontal: Math.round(5 * scale),
              paddingVertical: Math.round(2 * scale),
              backgroundColor: isDark ? '#8b5cf6' : '#d49b27',
            },
          ]}
        >
          <Text style={[styles.starsText, { fontSize: Math.max(8, Math.round(9 * scale)) }]}>
            ***
          </Text>
        </View>

        {/* Envelope & Orbital Ring */}
        <View style={[styles.envelopeWrap, { transform: [{ scale }] }]}>
          <View style={[styles.orbitalRing, { borderColor }]} />
          <View
            style={[
              styles.envelopeBody,
              {
                backgroundColor: isDark ? '#1e40af' : '#b87e14',
                borderColor: borderColor,
              },
            ]}
          >
            <View style={styles.envelopeFlap} />
          </View>
        </View>

        {/* Lettering */}
        {size >= 64 && (
          <View style={styles.textWrap}>
            <Text style={[styles.amgText, { fontSize: Math.round(15 * scale), color: isDark ? '#ffffff' : '#162238' }]}>
              AMG
            </Text>
            <Text style={[styles.otpHubText, { fontSize: Math.round(8 * scale), color: colors.textSecondary }]}>
              — <Text style={{ color: borderColor, fontWeight: '700' }}>OTP</Text> Hub —
            </Text>
          </View>
        )}
      </View>
    );
  };

  const glowShadow = withGlow
    ? Platform.OS === 'web'
      ? isDark
        ? {
            boxShadow:
              '0 10px 30px rgba(34, 229, 255, 0.35), 0 0 16px rgba(168, 85, 247, 0.28), 0 2px 8px rgba(0, 0, 0, 0.6)',
          }
        : {
            boxShadow:
              '0 10px 28px rgba(212, 155, 39, 0.32), 0 2px 10px rgba(184, 126, 20, 0.2)',
          }
      : {
          shadowColor: borderColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
          elevation: 8,
        }
    : {};

  return (
    <Animated.View
      style={[
        styles.outerContainer,
        {
          width: size,
          height: size,
          borderRadius: cornerRadius,
          borderWidth: 1.5,
          borderColor,
          transform: animated ? [{ translateY: floatAnim }] : [],
          ...(glowShadow as any),
        },
        style,
      ]}
    >
      {!hasError ? (
        <Image
          source={require('../../assets/app-logo.png')}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: cornerRadius - 1,
            },
          ]}
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      ) : (
        renderFallback()
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    overflow: 'hidden',
  },
  fallbackContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  starsBadge: {
    position: 'absolute',
    borderRadius: 6,
    zIndex: 3,
  },
  starsText: {
    color: '#ffffff',
    fontWeight: '800',
    letterSpacing: 1,
  },
  envelopeWrap: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  orbitalRing: {
    position: 'absolute',
    width: 58,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    transform: [{ rotate: '-22deg' }],
  },
  envelopeBody: {
    width: 36,
    height: 26,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    zIndex: 2,
  },
  envelopeFlap: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderTopWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(255, 255, 255, 0.45)',
  },
  textWrap: {
    alignItems: 'center',
    marginTop: 4,
  },
  amgText: {
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  otpHubText: {
    letterSpacing: 0.8,
    marginTop: -2,
  },
});

export default AppLogo;
