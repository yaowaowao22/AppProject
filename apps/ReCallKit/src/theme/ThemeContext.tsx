import React, { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors, type ColorScheme } from './colors';

// ============================================================
// ThemeContext
// ============================================================
interface ThemeContextValue {
  colors: ColorScheme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: LightColors,
  isDark: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
