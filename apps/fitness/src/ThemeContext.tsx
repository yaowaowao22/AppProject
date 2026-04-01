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
import { adjustHexLightness, adjustHexSaturation } from './utils/colorUtils';

const STORAGE_KEY = '@tanren_theme_id';
const CONTRAST_STORAGE_KEY = '@tanren_contrast_settings';

// ── 型定義 ───────────────────────────────────────────────────────────────────

export interface ContrastSettings {
  baseLightness: number;    // 0-100、50 = 変化なし
  accentSaturation: number; // 0-100、50 = 変化なし
}

const DEFAULT_CONTRAST: ContrastSettings = { baseLightness: 50, accentSaturation: 50 };

interface ThemeContextValue {
  currentThemeId: ThemeId;
  colors: TanrenThemeColors;
  setTheme: (id: ThemeId) => void;
  themeList: Array<ThemeMeta & { colors: TanrenThemeColors }>;
  contrastSettings: ContrastSettings;
  setContrast: (settings: ContrastSettings) => void;
}

// ── コントラスト適用ロジック ──────────────────────────────────────────────────

function applyContrast(
  colors: TanrenThemeColors,
  { baseLightness, accentSaturation }: ContrastSettings,
): TanrenThemeColors {
  const lDelta = (baseLightness - 50) * 0.4;   // -20 〜 +20
  const sDelta = (accentSaturation - 50) * 0.6; // -30 〜 +30
  return {
    ...colors,
    background:    adjustHexLightness(colors.background, lDelta),
    surface1:      adjustHexLightness(colors.surface1, lDelta),
    surface2:      adjustHexLightness(colors.surface2, lDelta),
    tabBarBg:      adjustHexLightness(colors.tabBarBg, lDelta),
    cardBackground: colors.cardBackground
      ? adjustHexLightness(colors.cardBackground, lDelta)
      : undefined,
    accent:        adjustHexSaturation(colors.accent, sDelta),
  };
}

// ── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue>({
  currentThemeId: 'hakukou',
  colors: THEME_PRESETS.hakukou.colors,
  setTheme: () => {},
  themeList: [],
  contrastSettings: DEFAULT_CONTRAST,
  setContrast: () => {},
});

// ── Provider ─────────────────────────────────────────────────────────────────

export function TanrenThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>('hakukou');
  const [contrastSettings, setContrastSettings] = useState<ContrastSettings>(DEFAULT_CONTRAST);

  // 起動時に保存済みテーマ・コントラスト設定を読み込む
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(saved => {
        if (saved && saved in THEME_PRESETS) {
          setCurrentThemeId(saved as ThemeId);
        }
      })
      .catch(() => {/* AsyncStorage エラーは無視してデフォルトを使用 */});
    AsyncStorage.getItem(CONTRAST_STORAGE_KEY)
      .then(saved => {
        if (saved) {
          const parsed = JSON.parse(saved) as ContrastSettings;
          if (typeof parsed.baseLightness === 'number' && typeof parsed.accentSaturation === 'number') {
            setContrastSettings(parsed);
          }
        }
      })
      .catch(() => {});
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    setCurrentThemeId(id);
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
  }, []);

  const setContrast = useCallback((settings: ContrastSettings) => {
    setContrastSettings(settings);
    AsyncStorage.setItem(CONTRAST_STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
  }, []);

  const colors = useMemo((): TanrenThemeColors => {
    const preset = THEME_PRESETS[currentThemeId];
    const rawCardBg = preset.meta.isLight === true ? '#FFFFFF' : preset.colors.surface1;
    const base: TanrenThemeColors = { ...preset.colors, cardBackground: rawCardBg };
    return applyContrast(base, contrastSettings);
  }, [currentThemeId, contrastSettings]);

  const themeList = useMemo(
    () =>
      (Object.values(THEME_PRESETS) as Array<{ meta: ThemeMeta; colors: TanrenThemeColors }>).map(
        t => ({ ...t.meta, colors: t.colors }),
      ),
    [],
  );

  const value = useMemo(
    () => ({ currentThemeId, colors, setTheme, themeList, contrastSettings, setContrast }),
    [currentThemeId, colors, setTheme, themeList, contrastSettings, setContrast],
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
