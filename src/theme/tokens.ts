export const Breakpoints = {
  mobileMax: 767,
  tabletMin: 768,
  tabletMax: 1023,
  desktopMin: 1024,
  sidebarWidth: 260,
  topBarHeight: 64,
  bottomBarHeight: 64,
} as const;

export type AppThemeMode = 'midnight' | 'aurora' | 'milky' | 'pearl' | 'dark' | 'light';

export interface ThemeColors {
  id: string;
  name: string;
  isDark: boolean;
  dotColor: string;
  background: string;
  backgroundGlow: string;
  backgroundGradient: string;
  cyanWaveAccent: string;
  surface: string;
  surfaceSecondary: string;
  surfaceHover: string;
  surfaceActive: string;
  border: string;
  borderLight: string;
  borderFocus: string;
  glow: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryBorder: string;
  accentGradient: string;
  primaryBtnBg: string;
  primaryBtnText: string;
  primaryBtnShadow: string;
  secondaryBtnBg: string;
  secondaryBtnBorder: string;
  secondaryBtnText: string;
  emerald: string;
  emeraldLight: string;
  emeraldBorder: string;
  amber: string;
  amberLight: string;
  amberBorder: string;
  rose: string;
  roseLight: string;
  roseBorder: string;
  purple: string;
  purpleLight: string;
  purpleBorder: string;
  cyan: string;
  cyanLight: string;
  cyanBorder: string;
  codeBg: string;
  codeBorder: string;
  codeText: string;
  laurel: string;
}

const midnightTheme: ThemeColors = {
  id: 'midnight',
  name: 'Midnight Neon Cyan',
  isDark: true,
  dotColor: '#00f2fe',
  background: '#040b18',
  backgroundGlow: '#08152c',
  backgroundGradient: 'radial-gradient(ellipse at 50% 20%, #081d3d 0%, #040b18 80%)',
  cyanWaveAccent: '#00e5ff',
  surface: 'rgba(8, 28, 52, 0.78)',
  surfaceSecondary: '#091c36',
  surfaceHover: 'rgba(16, 44, 78, 0.9)',
  surfaceActive: '#122f56',
  border: 'rgba(34, 229, 255, 0.35)',
  borderLight: 'rgba(34, 229, 255, 0.18)',
  borderFocus: '#00e5ff',
  glow: 'rgba(0, 242, 254, 0.45)',
  textPrimary: '#ffffff',
  textSecondary: '#d0e8ff',
  textMuted: '#7ca8d4',
  textInverse: '#031022',
  primary: '#22e5ff',
  primaryHover: '#00c6ff',
  primaryLight: 'rgba(34, 229, 255, 0.14)',
  primaryBorder: 'rgba(34, 229, 255, 0.45)',
  accentGradient: 'linear-gradient(90deg, #00c6ff, #00f2fe)',
  primaryBtnBg: '#00e5ff',
  primaryBtnText: '#031022',
  primaryBtnShadow: 'rgba(0, 229, 255, 0.55)',
  secondaryBtnBg: 'rgba(6, 18, 36, 0.85)',
  secondaryBtnBorder: 'rgba(34, 229, 255, 0.45)',
  secondaryBtnText: '#ffffff',
  emerald: '#5ce0ae',
  emeraldLight: 'rgba(92, 224, 174, 0.14)',
  emeraldBorder: 'rgba(92, 224, 174, 0.4)',
  amber: '#f4c76a',
  amberLight: 'rgba(244, 199, 106, 0.14)',
  amberBorder: 'rgba(244, 199, 106, 0.4)',
  rose: '#f28fb5',
  roseLight: 'rgba(242, 143, 181, 0.14)',
  roseBorder: 'rgba(242, 143, 181, 0.4)',
  purple: '#c084fc',
  purpleLight: 'rgba(192, 132, 252, 0.14)',
  purpleBorder: 'rgba(192, 132, 252, 0.4)',
  cyan: '#22e5ff',
  cyanLight: 'rgba(34, 229, 255, 0.14)',
  cyanBorder: 'rgba(34, 229, 255, 0.4)',
  codeBg: '#020712',
  codeBorder: '#102a4e',
  codeText: '#d5f7ff',
  laurel: '#22e5ff',
};

const auroraTheme: ThemeColors = {
  id: 'aurora',
  name: 'Aurora Emerald & Violet',
  isDark: true,
  dotColor: '#10f5b8',
  background: '#070714',
  backgroundGlow: '#120e29',
  backgroundGradient: 'radial-gradient(ellipse at 50% 20%, #1e1338 0%, #070714 85%)',
  cyanWaveAccent: '#10f5b8',
  surface: 'rgba(19, 16, 42, 0.78)',
  surfaceSecondary: '#181436',
  surfaceHover: 'rgba(28, 23, 62, 0.9)',
  surfaceActive: '#22194c',
  border: 'rgba(16, 245, 184, 0.35)',
  borderLight: 'rgba(157, 101, 255, 0.22)',
  borderFocus: '#10f5b8',
  glow: 'rgba(16, 245, 184, 0.45)',
  textPrimary: '#ffffff',
  textSecondary: '#e4d9ff',
  textMuted: '#9b8cb8',
  textInverse: '#070714',
  primary: '#10f5b8',
  primaryHover: '#05d9a0',
  primaryLight: 'rgba(16, 245, 184, 0.15)',
  primaryBorder: 'rgba(16, 245, 184, 0.45)',
  accentGradient: 'linear-gradient(90deg, #10f5b8, #9d65ff)',
  primaryBtnBg: '#10f5b8',
  primaryBtnText: '#070714',
  primaryBtnShadow: 'rgba(16, 245, 184, 0.55)',
  secondaryBtnBg: 'rgba(19, 16, 42, 0.85)',
  secondaryBtnBorder: 'rgba(157, 101, 255, 0.45)',
  secondaryBtnText: '#ffffff',
  emerald: '#10f5b8',
  emeraldLight: 'rgba(16, 245, 184, 0.14)',
  emeraldBorder: 'rgba(16, 245, 184, 0.4)',
  amber: '#fbbf24',
  amberLight: 'rgba(251, 191, 36, 0.14)',
  amberBorder: 'rgba(251, 191, 36, 0.4)',
  rose: '#fb7185',
  roseLight: 'rgba(251, 113, 133, 0.14)',
  roseBorder: 'rgba(251, 113, 133, 0.4)',
  purple: '#9d65ff',
  purpleLight: 'rgba(157, 101, 255, 0.16)',
  purpleBorder: 'rgba(157, 101, 255, 0.45)',
  cyan: '#38bdf8',
  cyanLight: 'rgba(56, 189, 248, 0.14)',
  cyanBorder: 'rgba(56, 189, 248, 0.4)',
  codeBg: '#080514',
  codeBorder: '#271f45',
  codeText: '#c7d2fe',
  laurel: '#10f5b8',
};

const milkyTheme: ThemeColors = {
  id: 'milky',
  name: 'Milky Ivory & Royal Gold',
  isDark: false,
  dotColor: '#e6b63b',
  background: '#fdfbf4',
  backgroundGlow: '#f5ebd6',
  backgroundGradient: 'radial-gradient(ellipse at 50% 20%, #fbf5e6 0%, #f5ebd6 90%)',
  cyanWaveAccent: '#d49b27',
  surface: 'rgba(255, 250, 238, 0.92)',
  surfaceSecondary: '#f7eee0',
  surfaceHover: '#faeedb',
  surfaceActive: '#f3e1c6',
  border: 'rgba(212, 155, 39, 0.45)',
  borderLight: 'rgba(212, 155, 39, 0.22)',
  borderFocus: '#b87e14',
  glow: 'rgba(184, 126, 20, 0.25)',
  textPrimary: '#162238',
  textSecondary: '#1f2d3d',
  textMuted: '#78664e',
  textInverse: '#ffffff',
  primary: '#b87e14',
  primaryHover: '#9c690e',
  primaryLight: 'rgba(184, 126, 20, 0.12)',
  primaryBorder: 'rgba(184, 126, 20, 0.38)',
  accentGradient: 'linear-gradient(90deg, #b88116, #e6b63b, #c28818)',
  primaryBtnBg: '#c89224',
  primaryBtnText: '#ffffff',
  primaryBtnShadow: 'rgba(194, 136, 24, 0.45)',
  secondaryBtnBg: '#ffffff',
  secondaryBtnBorder: '#d5b263',
  secondaryBtnText: '#162238',
  emerald: '#0d9488',
  emeraldLight: 'rgba(13, 148, 136, 0.10)',
  emeraldBorder: 'rgba(13, 148, 136, 0.35)',
  amber: '#b87e14',
  amberLight: 'rgba(184, 126, 20, 0.10)',
  amberBorder: 'rgba(184, 126, 20, 0.35)',
  rose: '#e11d48',
  roseLight: 'rgba(225, 29, 72, 0.10)',
  roseBorder: 'rgba(225, 29, 72, 0.35)',
  purple: '#7e22ce',
  purpleLight: 'rgba(126, 34, 206, 0.10)',
  purpleBorder: 'rgba(126, 34, 206, 0.35)',
  cyan: '#0891b2',
  cyanLight: 'rgba(8, 145, 178, 0.10)',
  cyanBorder: 'rgba(8, 145, 178, 0.35)',
  codeBg: '#fffdf8',
  codeBorder: '#e8d7be',
  codeText: '#925807',
  laurel: '#c89224',
};

const pearlTheme: ThemeColors = {
  id: 'pearl',
  name: 'Pearl Rose & Sapphire',
  isDark: false,
  dotColor: '#2563eb',
  background: '#f8faff',
  backgroundGlow: '#eef2ff',
  backgroundGradient: 'radial-gradient(ellipse at 50% 20%, #ffffff 0%, #eef2ff 90%)',
  cyanWaveAccent: '#2563eb',
  surface: 'rgba(255, 255, 255, 0.94)',
  surfaceSecondary: '#f1f5f9',
  surfaceHover: '#e2e8f0',
  surfaceActive: '#cbd5e1',
  border: 'rgba(37, 99, 235, 0.32)',
  borderLight: 'rgba(37, 99, 235, 0.18)',
  borderFocus: '#2563eb',
  glow: 'rgba(37, 99, 235, 0.25)',
  textPrimary: '#0f172a',
  textSecondary: '#1e293b',
  textMuted: '#64748b',
  textInverse: '#ffffff',
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryLight: 'rgba(37, 99, 235, 0.12)',
  primaryBorder: 'rgba(37, 99, 235, 0.35)',
  accentGradient: 'linear-gradient(90deg, #2563eb, #f43f5e)',
  primaryBtnBg: '#2563eb',
  primaryBtnText: '#ffffff',
  primaryBtnShadow: 'rgba(37, 99, 235, 0.38)',
  secondaryBtnBg: '#ffffff',
  secondaryBtnBorder: '#93c5fd',
  secondaryBtnText: '#0f172a',
  emerald: '#059669',
  emeraldLight: 'rgba(5, 150, 105, 0.10)',
  emeraldBorder: 'rgba(5, 150, 105, 0.35)',
  amber: '#d97706',
  amberLight: 'rgba(217, 119, 6, 0.10)',
  amberBorder: 'rgba(217, 119, 6, 0.35)',
  rose: '#f43f5e',
  roseLight: 'rgba(244, 63, 94, 0.12)',
  roseBorder: 'rgba(244, 63, 94, 0.35)',
  purple: '#6366f1',
  purpleLight: 'rgba(99, 102, 241, 0.12)',
  purpleBorder: 'rgba(99, 102, 241, 0.35)',
  cyan: '#0284c7',
  cyanLight: 'rgba(2, 132, 199, 0.12)',
  cyanBorder: 'rgba(2, 132, 199, 0.35)',
  codeBg: '#f8fafc',
  codeBorder: '#cbd5e1',
  codeText: '#1e40af',
  laurel: '#2563eb',
};

export const Colors = {
  midnight: midnightTheme,
  aurora: auroraTheme,
  milky: milkyTheme,
  pearl: pearlTheme,
  dark: midnightTheme,
  light: milkyTheme,
};

export const THEME_PALETTES = [
  { id: 'midnight', name: 'Midnight Neon Cyan', isDark: true, dot: '#00f2fe' },
  { id: 'aurora', name: 'Aurora Emerald & Violet', isDark: true, dot: '#10f5b8' },
  { id: 'milky', name: 'Milky Ivory & Royal Gold', isDark: false, dot: '#e6b63b' },
  { id: 'pearl', name: 'Pearl Rose & Sapphire', isDark: false, dot: '#2563eb' },
] as const;

export type ThemePalette = (typeof THEME_PALETTES)[number];

export const Radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  card: 22,
  full: 9999,
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  huge: 48,
};

export const Typography = {
  fontSizes: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    huge: 34,
    mega: 44,
  },
  fontWeights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeights: {
    tight: 1.15,
    normal: 1.4,
    relaxed: 1.6,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
};
