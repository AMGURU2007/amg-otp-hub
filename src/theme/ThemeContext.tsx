import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { Colors, AppThemeMode, ThemeColors, THEME_PALETTES } from './tokens';

interface ThemeContextType {
  theme: AppThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: AppThemeMode) => void;
  palettes: typeof THEME_PALETTES;
}

const THEME_STORAGE_KEY = 'amg_otp_hub_theme_mode_v3';

const ThemeContext = createContext<ThemeContextType>({
  theme: 'midnight',
  colors: Colors.midnight,
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
  palettes: THEME_PALETTES,
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppThemeMode>('midnight');

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY) as AppThemeMode | null;
      if (saved && (saved in Colors)) {
        setThemeState(saved);
      }
    }
  }, []);

  const setTheme = (mode: AppThemeMode) => {
    setThemeState(mode);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  };

  const toggleTheme = () => {
    // If currently dark, switch to primary light ('milky'); if light, switch to primary dark ('midnight')
    if (theme === 'midnight' || theme === 'aurora' || theme === 'dark') {
      setTheme('milky');
    } else {
      setTheme('midnight');
    }
  };

  // Resolve palette
  const resolvedKey =
    theme === 'dark' ? 'midnight' : theme === 'light' ? 'milky' : theme;
  const colors: ThemeColors = (Colors as any)[resolvedKey] || Colors.midnight;
  const isDark = colors.isDark;

  // Apply CSS variables on Web for click glow & hover elevation
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const root = document.documentElement;
      const glowColor =
        resolvedKey === 'aurora'
          ? '#10f5b8'
          : resolvedKey === 'milky'
          ? '#e6b63b'
          : resolvedKey === 'pearl'
          ? '#2563eb'
          : '#00f2fe';

      root.style.setProperty('--theme-glow-color', glowColor);
      root.style.setProperty('--theme-accent', glowColor);
      root.style.setProperty('--theme-primary', colors.primary);
      root.style.setProperty('--theme-glow', colors.glow);
      root.style.setProperty('--theme-bg', colors.background);
      root.style.setProperty('--theme-surface', colors.surface);
      root.style.setProperty('--theme-border', colors.border);

      // Ensure click glow stylesheet is injected into document
      let styleTag = document.getElementById('amg-click-glow-styles');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'amg-click-glow-styles';
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = `
        @keyframes clickGlowPulse {
          0% {
            box-shadow: 0 0 0 0 var(--theme-glow-color, ${glowColor});
          }
          50% {
            box-shadow: 0 0 32px 8px var(--theme-glow-color, ${glowColor}), inset 0 0 16px var(--theme-glow-color, ${glowColor});
          }
          100% {
            box-shadow: 0 0 22px 5px var(--theme-glow-color, ${glowColor}), inset 0 0 12px var(--theme-glow-color, ${glowColor});
          }
        }
        .glow-on-click, button, [role="button"], .feature-card, .otp-card-press {
          transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease !important;
        }
        .glow-on-click:active, button:active, [role="button"]:active, .glow-on-click[data-selected="true"], [data-active="true"] {
          box-shadow: 0 0 28px 6px var(--theme-glow-color, ${glowColor}), inset 0 0 14px var(--theme-glow-color, ${glowColor}) !important;
          border-color: var(--theme-accent, ${glowColor}) !important;
          transform: scale(0.98) !important;
        }
      `;
    }
  }, [colors, resolvedKey]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        isDark,
        toggleTheme,
        setTheme,
        palettes: THEME_PALETTES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
