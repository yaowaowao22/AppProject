import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import { useColorScheme } from 'react-native';
import type {
  ThemeConfig,
  ColorTokens,
  TypographyTokens,
  SpacingTokens,
  RadiusTokens,
  ShadowTokens,
  ComponentOverrides,
} from './types';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  theme: ThemeConfig;
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  shadows: ShadowTokens;
  overrides: ComponentOverrides;
  isDark: boolean;
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  theme: ThemeConfig;
  children: React.ReactNode;
  initialMode?: ThemeMode;
}

export function ThemeProvider({
  theme,
  children,
  initialMode = 'system',
}: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  const isDark = useMemo(() => {
    if (mode === 'system') {
      return systemColorScheme === 'dark';
    }
    return mode === 'dark';
  }, [mode, systemColorScheme]);

  const colors = useMemo(() => {
    return isDark ? theme.colors.dark : theme.colors.light;
  }, [isDark, theme.colors]);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'light';
      // If system, toggle to the opposite of current system value
      return isDark ? 'light' : 'dark';
    });
  }, [isDark]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colors,
      typography: theme.typography,
      spacing: theme.spacing,
      radius: theme.radius,
      shadows: theme.shadows,
      overrides: theme.overrides ?? {},
      isDark,
      mode,
      toggleTheme,
      setMode,
    }),
    [theme, colors, isDark, mode, toggleTheme, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
