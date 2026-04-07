// ============================================================
// ReCallKit テーマカタログ
// ライト / ダーク の2テーマ
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
// 2テーマ定義
// ============================================================

export const THEMES: Record<ThemeId, ThemeEntry> = {

  'light': {
    id: 'light',
    name: 'ライト',
    isDark: false,
    swatchColor: '#1A73E8',
    swatchBg: '#FFFFFF',
    colors: {
      accent: '#1A73E8',
      background: '#FFFFFF',
      backgroundSecondary: '#F8F9FA',
      backgroundGrouped: '#F8F9FA',
      label: '#202124',
      labelSecondary: '#5F6368',
      labelTertiary: '#9AA0A6',
      card: '#FFFFFF',
      cardShadowColor: '#000000',
      separator: '#DADCE0',
      navBarBackground: '#FFFFFF',
      navBarBorder: '#DADCE0',
      filterBadgeBg: '#E8F0FE',
      filterBadgeText: '#1A73E8',
      hamburgerTint: '#202124',
      hamburgerPressedBg: 'rgba(142,142,147,0.12)',
      success: SystemColors.green,
      warning: SystemColors.orange,
      error: SystemColors.red,
      info: SystemColors.blue,
    },
    sidebar: {
      backgroundSolid: '#EAEAEF',
      overlay: 'rgba(0,0,0,0.30)',
      activeBackground: '#E8F0FE',
      activeTint: '#1A73E8',
      inactiveTint: 'rgba(60,60,67,0.60)',
      sectionHeader: 'rgba(60,60,67,0.30)',
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
    swatchColor: '#0A84FF',
    swatchBg: '#1C1C1E',
    colors: {
      accent: '#0A84FF',
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
      filterBadgeBg: 'rgba(10,132,255,0.15)',
      filterBadgeText: '#0A84FF',
      hamburgerTint: '#FFFFFF',
      hamburgerPressedBg: 'rgba(142,142,147,0.24)',
      success: SystemColors.green,
      warning: SystemColors.orange,
      error: SystemColors.red,
      info: SystemColors.blue,
    },
    sidebar: {
      backgroundSolid: '#161618',
      overlay: 'rgba(0,0,0,0.50)',
      activeBackground: 'rgba(10,132,255,0.15)',
      activeTint: '#0A84FF',
      inactiveTint: 'rgba(235,235,245,0.60)',
      sectionHeader: 'rgba(235,235,245,0.30)',
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
