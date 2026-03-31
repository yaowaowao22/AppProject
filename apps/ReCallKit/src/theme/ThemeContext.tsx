import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { getDatabase } from '../db/connection';
import { getSetting, setSetting } from '../db/settingsRepository';
import {
  type ThemePreference,
  type ColorScheme,
  type SidebarColorSet,
  normalizeThemePreference,
  resolveTheme,
  THEMES,
} from './themes';

// ThemePreference を再エクスポート（後方互換）
export type { ThemePreference };

// ============================================================
// ThemeContext
// ============================================================

interface ThemeContextValue {
  colors: ColorScheme;
  sidebarColors: SidebarColorSet;
  isDark: boolean;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
}

const _defaultTheme = THEMES['light-amber'];

const ThemeContext = createContext<ThemeContextValue>({
  colors: _defaultTheme.colors,
  sidebarColors: _defaultTheme.sidebar,
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
        setThemePref(normalizeThemePreference(saved));
      } catch {
        // Web で SharedArrayBuffer が利用不可など DB 初期化失敗時はデフォルト値を使用
      }
    })();
  }, []);

  const systemDark = systemScheme === 'dark';
  const entry = resolveTheme(themePreference, systemDark);

  const setThemePreference = useCallback(async (pref: ThemePreference) => {
    const db = await getDatabase();
    await setSetting(db, 'theme', pref);
    setThemePref(pref);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        colors: entry.colors,
        sidebarColors: entry.sidebar,
        isDark: entry.isDark,
        themePreference,
        setThemePreference,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
