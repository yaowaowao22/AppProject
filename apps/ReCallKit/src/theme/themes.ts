// ============================================================
// ReCallKit テーマカタログ
// ライト / ダーク の2テーマ（Indigo Pro）
// ============================================================

import { SystemColors } from './colors';

// ============================================================
// 型定義
// ============================================================

export type ThemeId = 'light' | 'dark';

export type ThemePreference = ThemeId | 'system';

// ColorScheme — 全テーマ共通の構造
export interface ColorScheme {
  accent: string;
  /** accent背景上のテキスト/アイコン色 */
  onAccent: string;
  background: string;
  backgroundSecondary: string;
  backgroundGrouped: string;
  label: string;
  labelSecondary: string;
  labelTertiary: string;
  card: string;
  cardShadowColor: string;
  separator: string;
  navBarBackground: string;
  navBarBorder: string;
  filterBadgeBg: string;
  filterBadgeText: string;
  hamburgerTint: string;
  hamburgerPressedBg: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

// SidebarColorSet — サイドバー（ドロワー）専用カラー
export interface SidebarColorSet {
  backgroundSolid: string;
  overlay: string;
  activeBackground: string;
  activeTint: string;
  inactiveTint: string;
  sectionHeader: string;
  separator: string;
  textPrimary: string;
  textTertiary: string;
  pressedBackground: string;
}

export interface ThemeEntry {
  id: ThemeId;
  name: string;
  isDark: boolean;
  /** アクセントカラー（テーマ選択スウォッチ用） */
  swatchColor: string;
  /** スウォッチ背景色（テーマ選択スウォッチ用） */
  swatchBg: string;
  colors: ColorScheme;
  sidebar: SidebarColorSet;
}

// ============================================================
// 2テーマ定義（Indigo Pro）
// ============================================================

export const THEMES: Record<ThemeId, ThemeEntry> = {

  'light': {
    id: 'light',
    name: 'ライト',
    isDark: false,
    swatchColor: '#171717',
    swatchBg: '#FFFFFF',
    colors: {
      accent: '#171717',
      onAccent: '#FFFFFF',
      background: '#FFFFFF',
      backgroundSecondary: '#F5F5F5',
      backgroundGrouped: '#F5F5F5',
      label: '#171717',
      labelSecondary: '#525252',
      labelTertiary: '#A3A3A3',
      card: '#FFFFFF',
      cardShadowColor: '#E5E5E5',
      separator: '#E5E5E5',
      navBarBackground: '#FFFFFF',
      navBarBorder: '#E5E5E5',
      filterBadgeBg: '#F5F5F5',
      filterBadgeText: '#171717',
      hamburgerTint: '#171717',
      hamburgerPressedBg: 'rgba(142,142,147,0.12)',
      success: SystemColors.green,
      warning: SystemColors.orange,
      error: SystemColors.red,
      info: '#171717',
    },
    sidebar: {
      backgroundSolid: '#FFFFFF',
      overlay: 'rgba(0,0,0,0.30)',
      activeBackground: 'rgba(0,0,0,0.06)',
      activeTint: '#171717',
      inactiveTint: 'rgba(60,60,67,0.60)',
      sectionHeader: '#A3A3A3',
      separator: 'rgba(60,60,67,0.12)',
      textPrimary: '#000000',
      textTertiary: 'rgba(60,60,67,0.30)',
      pressedBackground: 'rgba(142,142,147,0.12)',
    },
  },

  'dark': {
    id: 'dark',
    name: 'ダーク',
    isDark: true,
    swatchColor: '#FFFFFF',
    swatchBg: '#1C1C1E',
    colors: {
      accent: '#FFFFFF',
      onAccent: '#000000',
      background: '#000000',
      backgroundSecondary: '#1C1C1E',
      backgroundGrouped: '#000000',
      label: '#FFFFFF',
      labelSecondary: 'rgba(235,235,245,0.60)',
      labelTertiary: 'rgba(235,235,245,0.30)',
      card: '#1C1C1E',
      cardShadowColor: '#000000',
      separator: 'rgba(84,84,88,0.65)',
      navBarBackground: 'rgba(30,30,30,0.94)',
      navBarBorder: 'rgba(84,84,88,0.65)',
      filterBadgeBg: 'rgba(255,255,255,0.15)',
      filterBadgeText: '#FFFFFF',
      hamburgerTint: '#FFFFFF',
      hamburgerPressedBg: 'rgba(142,142,147,0.24)',
      success: SystemColors.green,
      warning: SystemColors.orange,
      error: SystemColors.red,
      info: '#FFFFFF',
    },
    sidebar: {
      backgroundSolid: '#161618',
      overlay: 'rgba(0,0,0,0.50)',
      activeBackground: 'rgba(255,255,255,0.08)',
      activeTint: '#FFFFFF',
      inactiveTint: 'rgba(235,235,245,0.60)',
      sectionHeader: 'rgba(235,235,245,0.50)',
      separator: 'rgba(84,84,88,0.65)',
      textPrimary: '#FFFFFF',
      textTertiary: 'rgba(235,235,245,0.30)',
      pressedBackground: 'rgba(142,142,147,0.24)',
    },
  },
};

// ============================================================
// テーマ一覧（UI表示用）
// ============================================================

export const THEME_CATEGORIES: {
  id: string;
  label: string;
  ids: ThemeId[];
}[] = [
  { id: 'appearance', label: '外観', ids: ['light', 'dark'] },
];

// ============================================================
// テーマ解決ユーティリティ
// ============================================================

/** DB に保存された生の文字列を ThemePreference に正規化 */
export function normalizeThemePreference(raw: string): ThemePreference {
  if (raw === 'system') return 'system';
  if (raw === 'light' || raw.startsWith('light-')) return 'light';
  if (raw === 'dark' || raw.startsWith('dark-') || raw.startsWith('mono-')) return 'dark';
  return 'system';
}

/** ThemePreference + OS設定 → ThemeEntry を解決 */
export function resolveTheme(pref: ThemePreference, systemDark: boolean): ThemeEntry {
  if (pref === 'system') {
    return THEMES[systemDark ? 'dark' : 'light'];
  }
  return THEMES[pref];
}
