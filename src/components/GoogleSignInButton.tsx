import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Platform,
  StyleProp,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export interface GoogleSignInButtonProps {
  onPress?: () => void | Promise<void>;
  onClick?: () => void | Promise<void>;
  label?: string;
  loadingLabel?: string;
  loading?: boolean;
  shape?: 'rectangular' | 'pill';
  variant?: 'light' | 'dark' | 'auto';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Official 4-Color Google "G" SVG Vector
 * Official Google Colors:
 * - Blue: #4285F4
 * - Green: #34A853
 * - Yellow: #FBBC05
 * - Red: #EA4335
 */
export const GoogleLogoSvg: React.FC<{ size?: number }> = ({ size = 18 }) => {
  if (Platform.OS === 'web') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 18 18"
        aria-hidden="true"
        style={{ display: 'block', flexShrink: 0 }}
      >
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
        />
        <path
          fill="#FBBC05"
          d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.347 2.825.957 4.039l3.007-2.332z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
        />
      </svg>
    );
  }

  // Native Android/iOS crisp fallback vector badge
  return (
    <View style={styles.nativeFallbackIcon}>
      <Text style={styles.nativeFallbackText}>G</Text>
    </View>
  );
};

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onPress,
  onClick,
  label = 'Sign in with Google',
  loadingLabel = 'Connecting...',
  loading = false,
  shape = 'pill',
  variant = 'auto',
  disabled = false,
  style,
  textStyle,
}) => {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const [internalLoading, setInternalLoading] = useState(false);

  const isMobile = width < 768;
  const isButtonLoading = loading || internalLoading;
  const isButtonDisabled = disabled || isButtonLoading;

  // Resolve light vs dark theme spec
  const isDarkMode = variant === 'auto' ? isDark : variant === 'dark';

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

  const buttonHeight = isMobile ? 44 : 40;
  const borderRadius = shape === 'rectangular' ? 4 : 20;

  return (
    <TouchableOpacity
      style={[
        styles.buttonBase,
        {
          height: buttonHeight,
          minHeight: buttonHeight,
          borderRadius,
        },
        isDarkMode ? styles.buttonDark : styles.buttonLight,
        isButtonDisabled && styles.buttonDisabled,
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.82}
      disabled={isButtonDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...(Platform.OS === 'web'
        ? ({
            className: `google-signin-btn ${isDarkMode ? 'google-signin-btn-dark' : 'google-signin-btn-light'}`,
            style: {
              cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
              zIndex: 40,
            },
          } as any)
        : {})}
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
          isDarkMode ? styles.labelDark : styles.labelLight,
          textStyle,
        ]}
        numberOfLines={1}
      >
        {isButtonLoading ? loadingLabel : label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
    paddingRight: 16,
    minWidth: 210,
    borderWidth: 1,
    zIndex: 40,
  },
  // Light Theme Official Google Specs
  buttonLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#747775',
    shadowColor: '#3c4043',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 1,
  },
  // Dark Theme Official Google Specs
  buttonDark: {
    backgroundColor: '#131314',
    borderColor: '#8E918F',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.28,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.62,
  },
  iconContainer: {
    width: 20,
    height: 20,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.25,
    ...(Platform.OS === 'web'
      ? ({
          fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          userSelect: 'none',
        } as any)
      : {}),
  },
  labelLight: {
    color: '#1F1F1F',
  },
  labelDark: {
    color: '#E3E3E3',
  },
  nativeFallbackIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeFallbackText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
