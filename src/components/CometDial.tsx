'use client';

import React, { useEffect, useState, useId } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import './CometDial.css';

// Graceful import of motion/react for web spring physics
let motion: any = null;
let animateFn: any = null;
try {
  if (Platform.OS === 'web') {
    const motionModule = require('motion/react');
    motion = motionModule.motion;
    animateFn = motionModule.animate;
  }
} catch {
  // Graceful native fallback
}

export interface CometDialProps {
  value: number;
  min?: number;
  max?: number;
  label: string;
  subtitle?: string;
  unit?: string;
  icon?: React.ReactNode;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const CometDial: React.FC<CometDialProps> = ({
  value,
  min = 0,
  max = 100,
  label,
  subtitle,
  unit,
  icon,
  color,
  size = 170,
  style,
  onPress,
}) => {
  const { colors, isDark } = useTheme();
  const rawId = useId();
  const dialId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');

  const accentColor = color || colors.primary;
  const inkColor = colors.textPrimary;
  const mutedColor = colors.textSecondary;
  const glowColor = colors.glow;

  // Clamped target progress [0, 1]
  const clampedProgress = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));

  // Spring animated value & progress for smooth visual glide
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [displayProgress, setDisplayProgress] = useState<number>(clampedProgress);

  useEffect(() => {
    if (Platform.OS === 'web' && animateFn) {
      // Animate displayed number with spring curve
      const valAnim = animateFn(displayValue, value, {
        duration: 0.85,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (latest: number) => setDisplayValue(Math.round(latest)),
      });

      // Animate progress arc with matching duration
      const progAnim = animateFn(displayProgress, clampedProgress, {
        duration: 0.85,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (latest: number) => setDisplayProgress(latest),
      });

      return () => {
        valAnim.stop();
        progAnim.stop();
      };
    } else {
      setDisplayValue(value);
      setDisplayProgress(clampedProgress);
    }
  }, [value, clampedProgress]);

  // Geometry calculations
  const cx = 85;
  const cy = 85;
  const radius = 62;
  const strokeWidth = 9;
  const totalCircumference = 2 * Math.PI * radius; // ~389.56
  const arcSweepAngle = 270; // 270-degree arc from 135deg to 405deg
  const totalArcLength = (arcSweepAngle / 360) * totalCircumference; // ~292.17

  // Stroke dash array & offset
  const strokeDashoffset = totalArcLength * (1 - displayProgress);

  // Comet Head Position (Angle in radians)
  const currentAngleDeg = 135 + displayProgress * arcSweepAngle;
  const currentAngleRad = (currentAngleDeg * Math.PI) / 180;
  const headX = cx + radius * Math.cos(currentAngleRad);
  const headY = cy + radius * Math.sin(currentAngleRad);

  const ContainerComponent: any = onPress ? TouchableOpacity : View;

  // Web SVG Rendering with motion / comet-tail
  if (Platform.OS === 'web') {
    return (
      <ContainerComponent
        style={[
          {
            backgroundColor: isDark ? 'rgba(12, 21, 36, 0.72)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: colors.borderLight,
          },
          style,
        ]}
        // @ts-ignore - Web DOM classes & CSS variables
        className="comet-dial-card glow-on-click"
        onPress={onPress}
        activeOpacity={0.8}
        // @ts-ignore
        style={{
          '--dial-accent': accentColor,
          '--dial-glow': glowColor,
        }}
      >
        <div className="comet-dial-svg-wrapper" style={{ width: size, height: size }}>
          <svg
            className="comet-dial-svg"
            viewBox="0 0 170 170"
            style={{ width: size, height: size }}
          >
            <defs>
              {/* Comet Tail Gradient */}
              <linearGradient id={`cometGrad_${dialId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={accentColor} stopOpacity={0.15} />
                <stop offset="55%" stopColor={accentColor} stopOpacity={0.65} />
                <stop offset="100%" stopColor={accentColor} stopOpacity={1} />
              </linearGradient>

              {/* Comet Head Glow Filter */}
              <filter id={`cometGlow_${dialId}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background Track (270-degree static arc) */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${totalArcLength} ${totalCircumference}`}
              style={{
                transform: `rotate(135deg)`,
                transformOrigin: `${cx}px ${cy}px`,
              }}
            />

            {/* Active Comet Tail Arc (Progress) */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={`url(#cometGrad_${dialId})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${totalArcLength} ${totalCircumference}`}
              strokeDashoffset={strokeDashoffset}
              style={{
                transform: `rotate(135deg)`,
                transformOrigin: `${cx}px ${cy}px`,
                transition: animateFn ? undefined : 'stroke-dashoffset 0.4s ease',
              }}
            />

            {/* Glowing Comet Head Particle */}
            {displayProgress > 0.01 && (
              <g filter={`url(#cometGlow_${dialId})`}>
                <circle
                  cx={headX}
                  cy={headY}
                  r={7.5}
                  fill={accentColor}
                  opacity={0.5}
                />
                <circle
                  cx={headX}
                  cy={headY}
                  r={4.5}
                  fill="#ffffff"
                  className="comet-head-circle"
                />
              </g>
            )}
          </svg>

          {/* Center Content: Icon + Big Number */}
          <div className="comet-dial-center">
            {icon && (
              <div
                className="comet-dial-icon-box"
                style={{ backgroundColor: `${accentColor}18` }}
              >
                {icon}
              </div>
            )}
            <div className="comet-dial-number" style={{ color: inkColor }}>
              {displayValue}
            </div>
            {unit && (
              <div className="comet-dial-unit" style={{ color: mutedColor }}>
                {unit}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Label & Subtitle */}
        <div className="comet-dial-footer">
          <div className="comet-dial-title" style={{ color: inkColor }}>
            {label}
          </div>
          {subtitle && (
            <div className="comet-dial-subtitle" style={{ color: mutedColor }}>
              {subtitle}
            </div>
          )}
        </div>
      </ContainerComponent>
    );
  }

  // Graceful Native Fallback
  return (
    <ContainerComponent
      style={[
        styles.nativeCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.nativeIconBadge, { backgroundColor: `${accentColor}20` }]}>
        {icon}
      </View>
      <Text style={[styles.nativeValue, { color: inkColor }]}>{value}</Text>
      <Text style={[styles.nativeLabel, { color: inkColor }]}>{label}</Text>
      {subtitle && <Text style={[styles.nativeSubtitle, { color: mutedColor }]}>{subtitle}</Text>}
    </ContainerComponent>
  );
};

const styles = StyleSheet.create({
  nativeCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
    flex: 1,
  },
  nativeIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  nativeValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 2,
  },
  nativeLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  nativeSubtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
});
