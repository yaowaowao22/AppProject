import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import type { TextStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TanrenThemeColors, ThemeId, ThemeMeta } from './theme';
import { THEME_PRESETS, TYPOGRAPHY } from './theme';
import { adjustHexLightness, adjustHexSaturation } from './utils/colorUtils';

const STORAGE_KEY = '@tanren_theme_id';
const CONTRAST_STORAGE_KEY = '@tanren_contrast_settings';
const FONT_STORAGE_KEY = '@tanren_font_settings';

// ── 型定義 ───────────────────────────────────────────────────────────────────

export interface ContrastSettings {
  baseLightness: number;    // 0-100、50 = 変化なし
  accentSaturation: number; // 0-100、50 = 変化なし
}

const DEFAULT_CONTRAST: ContrastSettings = { baseLightness: 50, accentSaturation: 50 };

// ── フォント設定 ─────────────────────────────────────────────────────────────

export interface FontSettings {
  fontSizeScale: number;         // 0-100、40 = 1.0x（等倍）
  fontWeightLevel: -1 | 0 | 1;  // -1=細め, 0=標準, +1=太め
  fontFamily: 'system' | 'serif' | 'mono';
}

export const DEFAULT_FONT_SETTINGS: FontSettings = {
  fontSizeScale: 40,
  fontWeightLevel: 0,
  fontFamily: 'system',
};

export interface DynamicTypography {
  heroNumber:   number;
  screenTitle:  number;
  exerciseName: number;
  body:         number;
  bodySmall:    number;
  caption:      number;
  captionSmall: number;
  heavy:    TextStyle['fontWeight'];
  bold:     TextStyle['fontWeight'];
  semiBold: TextStyle['fontWeight'];
  regular:  TextStyle['fontWeight'];
  fontFamily: string | undefined;
}

const WEIGHT_TABLE: Record<number, Pick<DynamicTypography, 'heavy' | 'bold' | 'semiBold' | 'regular'>> = {
  [-1]: { heavy: '600', bold: '500', semiBold: '400', regular: '300' },
  [0]:  { heavy: '800', bold: '700', semiBold: '600', regular: '500' },
  [1]:  { heavy: '900', bold: '800', semiBold: '700', regular: '600' },
};

const FONT_FAMILY_MAP: Record<FontSettings['fontFamily'], string | undefined> = {
  system: undefined,
  serif:  Platform.select({ ios: 'Georgia', android: 'serif', default: undefined }),
  mono:   Platform.select({ ios: 'Menlo', android: 'monospace', default: undefined }),
};

function computeTypography(settings: FontSettings): DynamicTypography {
  const scale   = 0.80 + settings.fontSizeScale * 0.005; // 0→0.80x, 40→1.00x, 100→1.30x
  const weights = WEIGHT_TABLE[settings.fontWeightLevel] ?? WEIGHT_TABLE[0];
  return {
    heroNumber:   Math.round(TYPOGRAPHY.heroNumber   * scale),
    screenTitle:  Math.round(TYPOGRAPHY.screenTitle  * scale),
    exerciseName: Math.round(TYPOGRAPHY.exerciseName * scale),
    body:         Math.round(TYPOGRAPHY.body         * scale),
    bodySmall:    Math.round(TYPOGRAPHY.bodySmall    * scale),
    caption:      Math.round(TYPOGRAPHY.caption      * scale),
    captionSmall: Math.round(TYPOGRAPHY.captionSmall * scale),
    ...weights,
    fontFamily: FONT_FAMILY_MAP[settings.fontFamily],
  };
}

interface ThemeContextValue {
  currentThemeId: ThemeId;
  colors: TanrenThemeColors;
  setTheme: (id: ThemeId) => void;
  themeList: Array<ThemeMeta & { colors: TanrenThemeColors }>;
  contrastSettings: ContrastSettings;
  setContrast: (settings: ContrastSettings) => void;
  fontSettings: FontSettings;
  setFontSettings: (settings: FontSettings) => void;
  typography: DynamicTypography;
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
  fontSettings: DEFAULT_FONT_SETTINGS,
  setFontSettings: () => {},
  typography: computeTypography(DEFAULT_FONT_SETTINGS),
});

// ── Provider ─────────────────────────────────────────────────────────────────

export function TanrenThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>('hakukou');
  const [contrastSettings, setContrastSettings] = useState<ContrastSettings>(DEFAULT_CONTRAST);
  const [fontSettings, setFontSettingsState] = useState<FontSettings>(DEFAULT_FONT_SETTINGS);

  // 起動時に保存済みテーマ・コントラスト・フォント設定を読み込む
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
    AsyncStorage.getItem(FONT_STORAGE_KEY)
      .then(saved => {
        if (saved) {
          const parsed = JSON.parse(saved) as FontSettings;
          if (typeof parsed.fontSizeScale === 'number') {
            setFontSettingsState(parsed);
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

  const setFontSettings = useCallback((settings: FontSettings) => {
    setFontSettingsState(settings);
    AsyncStorage.setItem(FONT_STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
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

  const typography = useMemo(() => computeTypography(fontSettings), [fontSettings]);

  const value = useMemo(
    () => ({ currentThemeId, colors, setTheme, themeList, contrastSettings, setContrast, fontSettings, setFontSettings, typography }),
    [currentThemeId, colors, setTheme, themeList, contrastSettings, setContrast, fontSettings, setFontSettings, typography],
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
