import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Radius, Spacing, Typography } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  badgeType?: 'success' | 'warning' | 'info';
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  badge,
  badgeType = 'info',
  icon,
}) => {
  const { colors, isDark } = useTheme();

  // Number ticker animation
  const [displayValue, setDisplayValue] = useState<string | number>(
    typeof value === 'number' ? 0 : value
  );

  useEffect(() => {
    if (typeof value === 'number') {
      const target = value;
      const duration = 600;
      const startTime = Date.now();
      const startVal = typeof displayValue === 'number' ? displayValue : 0;

      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startVal + (target - startVal) * easeOut);
        setDisplayValue(current);

        if (progress >= 1) {
          clearInterval(timer);
          setDisplayValue(target);
        }
      }, 16);

      return () => clearInterval(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  // Orbital pulse animation for icon container
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  const getBadgeColors = () => {
    switch (badgeType) {
      case 'success':
        return { bg: colors.emeraldLight, border: colors.emeraldBorder, text: colors.emerald };
      case 'warning':
        return { bg: colors.amberLight, border: colors.amberBorder, text: colors.amber };
      default:
        return { bg: colors.primaryLight, border: colors.primaryBorder, text: colors.primary };
    }
  };

  const badgeColor = getBadgeColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          ...(Platform.OS === 'web'
            ? ({
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'default',
              } as any)
            : {}),
        },
      ]}
      {...(Platform.OS === 'web' ? ({ className: 'glow-on-click interactive-card' } as any) : {})}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
        {icon && (
          <View style={styles.iconWrapper}>
            {/* Orbital Pulse Ring */}
            <Animated.View
              style={[
                styles.orbitalRing,
                {
                  borderColor: `${colors.primary}35`,
                  backgroundColor: `${colors.primary}10`,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  borderColor: colors.border,
                },
              ]}
            >
              {icon}
            </View>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={[styles.value, { color: colors.textPrimary }]}>{displayValue}</Text>
        {badge && (
          <View
            style={[
              styles.badge,
              { backgroundColor: badgeColor.bg, borderColor: badgeColor.border },
            ]}
          >
            <Text style={[styles.badgeText, { color: badgeColor.text }]}>{badge}</Text>
          </View>
        )}
      </View>

      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    flex: 1,
    minWidth: 190,
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
  iconWrapper: {
    position: 'relative',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitalRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  value: {
    fontSize: Typography.fontSizes.huge,
    fontWeight: Typography.fontWeights.extrabold,
    letterSpacing: -0.5,
  },
  badge: {
    paddingHorizontal: Spacing.xs + 3,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeights.bold,
  },
  subtitle: {
    fontSize: Typography.fontSizes.xs,
    marginTop: 2,
  },
});
