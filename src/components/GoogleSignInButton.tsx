import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Platform,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Radius } from '../theme/tokens';

export interface GoogleSignInButtonProps {
  onPress?: () => void;
  onClick?: () => void;
  label?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  variant?: 'white' | 'dark';
}

/**
 * Authentic 4-color Google "G" SVG Vector
 * Official Google Colors:
 * - Red: #EA4335
 * - Blue: #4285F4
 * - Yellow: #FBBC05
 * - Green: #34A853
 */
export const GoogleLogoSvg: React.FC<{ size?: number }> = ({ size = 20 }) => {
  if (Platform.OS === 'web') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        aria-hidden="true"
        style={{ display: 'block', flexShrink: 0 }}
      >
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
        <path fill="none" d="M0 0h48v48H0z" />
      </svg>
    );
  }

  // Native fallback if needed (using styled container)
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
  style,
  textStyle,
  disabled = false,
  variant = 'white',
}) => {
  const handlePress = () => {
    if (disabled) return;
    if (onPress) {
      onPress();
    } else if (onClick) {
      onClick();
    }
  };

  const isDarkVariant = variant === 'dark';

  return (
    <TouchableOpacity
      style={[
        styles.buttonBase,
        isDarkVariant ? styles.buttonDark : styles.buttonWhite,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.85}
      disabled={disabled}
      {...(Platform.OS === 'web'
        ? ({
            className: 'glow-on-click google-signin-official-btn',
            style: {
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: disabled ? 'not-allowed' : 'pointer',
            },
          } as any)
        : {})}
    >
      <View style={styles.iconContainer}>
        <GoogleLogoSvg size={20} />
      </View>
      <Text
        style={[
          styles.buttonLabel,
          isDarkVariant ? styles.labelDark : styles.labelWhite,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: Radius.full,
    borderWidth: 1,
    minHeight: 48,
    gap: 12,
  },
  buttonWhite: {
    backgroundColor: '#ffffff',
    borderColor: '#dadce0',
    // Subtle official Google elevation shadow
    shadowColor: '#3c4043',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonDark: {
    backgroundColor: '#131314',
    borderColor: '#8e918f',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.25,
    ...(Platform.OS === 'web'
      ? ({
          fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        } as any)
      : {}),
  },
  labelWhite: {
    color: '#3c4043',
  },
  labelDark: {
    color: '#e3e3e3',
  },
  nativeFallbackIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeFallbackText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
