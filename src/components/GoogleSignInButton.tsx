import React, { useState } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  Platform,
  StyleProp,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

export interface GoogleSignInButtonProps {
  onPress?: () => void | Promise<void>;
  onClick?: () => void | Promise<void>;
  label?: string;
  loadingLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Official 4-Color Google "G" Logo
 * Crisp SVG with exact brand colors
 */
export const GoogleLogoSvg: React.FC<{ size?: number }> = ({ size = 18 }) => {
  return (
    <View style={[styles.iconWrapper, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <Path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <Path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <Path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </Svg>
    </View>
  );
};

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onPress,
  onClick,
  label = 'Sign in with Google',
  loadingLabel = 'Connecting...',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const { isDark } = useTheme();
  const [internalLoading, setInternalLoading] = useState(false);

  const isButtonLoading = loading || internalLoading;
  const isButtonDisabled = disabled || isButtonLoading;

  const handlePress = async () => {
    if (isButtonDisabled) return;

    try {
      const fn = onPress || onClick;
      if (fn) {
        const res = fn();
        if (res instanceof Promise) {
          setInternalLoading(true);
          await res;
        }
      }
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.buttonBase,
        {
          backgroundColor: isDark
            ? pressed
              ? '#2D2E30'
              : '#131314'
            : pressed
            ? '#E8EAED'
            : '#FFFFFF',
          borderColor: isDark ? '#8E918F' : '#747775',
        },
        isButtonDisabled && styles.buttonDisabled,
        style,
      ]}
      onPress={handlePress}
      disabled={isButtonDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.iconContainer}>
        {isButtonLoading ? (
          <ActivityIndicator size="small" color="#1A73E8" />
        ) : (
          <GoogleLogoSvg size={18} />
        )}
      </View>
      <Text
        style={[
          styles.buttonLabel,
          { color: isDark ? '#E3E3E3' : '#1F1F1F' },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {isButtonLoading ? loadingLabel : label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 40,
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
          outlineStyle: 'none',
          boxSizing: 'border-box',
          userSelect: 'none',
        } as any)
      : {}),
  },
  buttonDisabled: {
    opacity: 0.6,
    ...(Platform.OS === 'web' ? ({ cursor: 'not-allowed' } as any) : {}),
  },
  iconContainer: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrapper: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.25,
    includeFontPadding: false,
    ...(Platform.OS === 'web'
      ? ({
          fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          whiteSpace: 'nowrap',
        } as any)
      : {}),
  },
});
