import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors, type ColorScheme } from './colors';
import { getDatabase } from '../db/connection';
import { getSetting, setSetting } from '../db/settingsRepository';

// ============================================================
// ThemeContext
// ============================================================
export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  colors: ColorScheme;
  isDark: boolean;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: LightColors,
  isDark: false,
  themePreference: 'system',
  setThemePreference: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePref] = useState<ThemePreference>('system');

  // DB から保存済みテーマを読み込む（失敗してもデフォルトテーマで継続）
  useEffect(() => {
    (async () => {
      try {
        const db = await getDatabase();
        const saved = await getSetting(db, 'theme');
        setThemePref(saved as ThemePreference);
      } catch {
        // Web で SharedArrayBuffer が利用不可など DB 初期化失敗時はデフォルト値を使用
      }
    })();
  }, []);

  const isDark =
    themePreference === 'dark'
      ? true
      : themePreference === 'light'
      ? false
      : systemScheme === 'dark';

  const colors = isDark ? DarkColors : LightColors;

  const setThemePreference = useCallback(async (pref: ThemePreference) => {
    const db = await getDatabase();
    await setSetting(db, 'theme', pref);
    setThemePref(pref);
  }, []);

  return (
    <ThemeContext.Provider value={{ colors, isDark, themePreference, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
