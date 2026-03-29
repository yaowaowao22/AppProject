import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TanrenThemeColors, ThemeId, ThemeMeta } from './theme';
import { THEME_PRESETS } from './theme';

const STORAGE_KEY = '@tanren_theme_id';

// ── 型定義 ───────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  currentThemeId: ThemeId;
  colors: TanrenThemeColors;
  setTheme: (id: ThemeId) => void;
  themeList: Array<ThemeMeta & { colors: TanrenThemeColors }>;
}

// ── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue>({
  currentThemeId: 'hakukou',
  colors: THEME_PRESETS.hakukou.colors,
  setTheme: () => {},
  themeList: [],
});

// ── Provider ─────────────────────────────────────────────────────────────────

export function TanrenThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>('hakukou');

  // 起動時に保存済みテーマを読み込む
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(saved => {
        if (saved && saved in THEME_PRESETS) {
          setCurrentThemeId(saved as ThemeId);
        }
      })
      .catch(() => {/* AsyncStorage エラーは無視してデフォルトを使用 */});
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    setCurrentThemeId(id);
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
  }, []);

  const colors = useMemo(
    () => THEME_PRESETS[currentThemeId].colors,
    [currentThemeId],
  );

  const themeList = useMemo(
    () =>
      (Object.values(THEME_PRESETS) as Array<{ meta: ThemeMeta; colors: TanrenThemeColors }>).map(
        t => ({ ...t.meta, colors: t.colors }),
      ),
    [],
  );

  const value = useMemo(
    () => ({ currentThemeId, colors, setTheme, themeList }),
    [currentThemeId, colors, setTheme, themeList],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
