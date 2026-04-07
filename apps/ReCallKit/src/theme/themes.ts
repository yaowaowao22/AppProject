// ============================================================
// ReCallKit テーマカタログ
// ライト10 + ダーク10 + モノクロ10 = 計30テーマ
// ============================================================

import { SystemColors } from './colors';

// ============================================================
// 型定義
// ============================================================

export type ThemeId =
  | 'light-amber'
  | 'light-ocean'
  | 'light-forest'
  | 'light-lavender'
  | 'light-rose'
  | 'light-coral'
  | 'light-teal'
  | 'light-indigo'
  | 'light-crimson'
  | 'light-jade'
  | 'light-blue'
  | 'dark-amber'
  | 'dark-ocean'
  | 'dark-forest'
  | 'dark-lavender'
  | 'dark-rose'
  | 'dark-coral'
  | 'dark-midnight'
  | 'dark-teal'
  | 'dark-indigo'
  | 'dark-crimson'
  | 'dark-blue'
  | 'mono-white'
  | 'mono-paper'
  | 'mono-stone'
  | 'mono-sepia'
  | 'mono-silver'
  | 'mono-black'
  | 'mono-charcoal'
  | 'mono-graphite'
  | 'mono-slate'
  | 'mono-ink';

export type ThemePreference = ThemeId | 'system';

export type ThemeCategory = 'light' | 'dark' | 'mono';

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
  background: string;
  backgroundSolid: string;
  overlay: string;
  activeBackground: string;
  activeTint: string;
  inactiveTint: string;
  badgeBackground: string;
  badgeText: string;
  sectionHeader: string;
  separator: string;
  footerTint: string;
  tagBackground: string;
  tagText: string;
  textPrimary: string;
  textTertiary: string;
  pressedBackground: string;
}

export interface ThemeEntry {
  id: ThemeId;
  name: string;
  category: ThemeCategory;
  isDark: boolean;
  /** アクセントカラー（テーマ選択スウォッチ用） */
  swatchColor: string;
  /** スウォッチ背景色（テーマ選択スウォッチ用） */
  swatchBg: string;
  colors: ColorScheme;
  sidebar: SidebarColorSet;
}

// ============================================================
// ヘルパー
// ============================================================

function ls(accent: string, r: number, g: number, b: number): SidebarColorSet {
  return {
    background: 'rgba(242,242,247,0.95)',
    backgroundSolid: '#F2F2F7',
    overlay: 'rgba(0,0,0,0.30)',
    activeBackground: `rgba(${r},${g},${b},0.12)`,
    activeTint: accent,
    inactiveTint: 'rgba(60,60,67,0.60)',
    badgeBackground: accent,
    badgeText: '#FFFFFF',
    sectionHeader: 'rgba(60,60,67,0.30)',
    separator: 'rgba(60,60,67,0.12)',
    footerTint: 'rgba(60,60,67,0.60)',
    tagBackground: 'rgba(60,60,67,0.08)',
    tagText: 'rgba(60,60,67,0.80)',
    textPrimary: '#000000',
    textTertiary: 'rgba(60,60,67,0.30)',
    pressedBackground: 'rgba(142,142,147,0.12)',
  };
}

function ds(
  accent: string,
  r: number,
  g: number,
  b: number,
  bgSolid = '#161618',
  bgRgba = 'rgba(22,22,24,0.92)',
): SidebarColorSet {
  return {
    background: bgRgba,
    backgroundSolid: bgSolid,
    overlay: 'rgba(0,0,0,0.50)',
    activeBackground: `rgba(${r},${g},${b},0.15)`,
    activeTint: accent,
    inactiveTint: 'rgba(235,235,245,0.60)',
    badgeBackground: accent,
    badgeText: '#000000',
    sectionHeader: 'rgba(235,235,245,0.30)',
    separator: 'rgba(84,84,88,0.65)',
    footerTint: 'rgba(235,235,245,0.50)',
    tagBackground: 'rgba(235,235,245,0.10)',
    tagText: 'rgba(235,235,245,0.75)',
    textPrimary: '#FFFFFF',
    textTertiary: 'rgba(235,235,245,0.30)',
    pressedBackground: 'rgba(142,142,147,0.24)',
  };
}

// ライトテーマの共通ベース（Google Calendar 配色準拠）
function lightBase(accent: string, r: number, g: number, b: number): ColorScheme {
  return {
    accent,
    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA',
    backgroundGrouped: '#F8F9FA',
    label: '#202124',
    labelSecondary: '#5F6368',
    labelTertiary: '#9AA0A6',
    card: '#FFFFFF',
    cardShadowColor: '#000000',
    separator: '#DADCE0',
    navBarBackground: 'rgba(249,249,249,0.94)',
    navBarBorder: '#DADCE0',
    filterBadgeBg: `rgba(${r},${g},${b},0.12)`,
    filterBadgeText: accent,
    hamburgerTint: '#202124',
    hamburgerPressedBg: 'rgba(142,142,147,0.12)',
    success: SystemColors.green,
    warning: SystemColors.orange,
    error: SystemColors.red,
    info: SystemColors.blue,
  };
}

// ダークテーマの共通ベース
function darkBase(
  accent: string,
  r: number,
  g: number,
  b: number,
  bg = '#000000',
  bgSec = '#1C1C1E',
  card = '#1C1C1E',
  navBar = 'rgba(30,30,30,0.94)',
  navBorder = 'rgba(84,84,88,0.65)',
): ColorScheme {
  return {
    accent,
    background: bg,
    backgroundSecondary: bgSec,
    backgroundGrouped: bg,
    label: '#FFFFFF',
    labelSecondary: 'rgba(235,235,245,0.60)',
    labelTertiary: 'rgba(235,235,245,0.30)',
    card,
    cardShadowColor: '#000000',
    separator: 'rgba(84,84,88,0.65)',
    navBarBackground: navBar,
    navBarBorder: navBorder,
    filterBadgeBg: `rgba(${r},${g},${b},0.15)`,
    filterBadgeText: accent,
    hamburgerTint: '#FFFFFF',
    hamburgerPressedBg: 'rgba(142,142,147,0.24)',
    success: SystemColors.green,
    warning: SystemColors.orange,
    error: SystemColors.red,
    info: SystemColors.blue,
  };
}

// ============================================================
// 30テーマ定義
// ============================================================

export const THEMES: Record<ThemeId, ThemeEntry> = {

  // ── ライト（10） ────────────────────────────────────────────

  'light-amber': {
    id: 'light-amber',
    name: 'アンバー',
    category: 'light',
    isDark: false,
    swatchColor: '#C47F17',
    swatchBg: '#FFFFFF',
    colors: lightBase('#C47F17', 196, 127, 23),
    sidebar: ls('#C47F17', 196, 127, 23),
  },

  'light-ocean': {
    id: 'light-ocean',
    name: 'オーシャン',
    category: 'light',
    isDark: false,
    swatchColor: '#0066CC',
    swatchBg: '#FFFFFF',
    colors: lightBase('#0066CC', 0, 102, 204),
    sidebar: ls('#0066CC', 0, 102, 204),
  },

  'light-forest': {
    id: 'light-forest',
    name: 'フォレスト',
    category: 'light',
    isDark: false,
    swatchColor: '#1E7E34',
    swatchBg: '#FFFFFF',
    colors: lightBase('#1E7E34', 30, 126, 52),
    sidebar: ls('#1E7E34', 30, 126, 52),
  },

  'light-lavender': {
    id: 'light-lavender',
    name: 'ラベンダー',
    category: 'light',
    isDark: false,
    swatchColor: '#7C3AED',
    swatchBg: '#FFFFFF',
    colors: lightBase('#7C3AED', 124, 58, 237),
    sidebar: ls('#7C3AED', 124, 58, 237),
  },

  'light-rose': {
    id: 'light-rose',
    name: 'ローズ',
    category: 'light',
    isDark: false,
    swatchColor: '#D1006B',
    swatchBg: '#FFFFFF',
    colors: lightBase('#D1006B', 209, 0, 107),
    sidebar: ls('#D1006B', 209, 0, 107),
  },

  'light-coral': {
    id: 'light-coral',
    name: 'コーラル',
    category: 'light',
    isDark: false,
    swatchColor: '#E04A00',
    swatchBg: '#FFFFFF',
    colors: lightBase('#E04A00', 224, 74, 0),
    sidebar: ls('#E04A00', 224, 74, 0),
  },

  'light-teal': {
    id: 'light-teal',
    name: 'ティール',
    category: 'light',
    isDark: false,
    swatchColor: '#00766C',
    swatchBg: '#FFFFFF',
    colors: lightBase('#00766C', 0, 118, 108),
    sidebar: ls('#00766C', 0, 118, 108),
  },

  'light-indigo': {
    id: 'light-indigo',
    name: 'インディゴ',
    category: 'light',
    isDark: false,
    swatchColor: '#3730A3',
    swatchBg: '#FFFFFF',
    colors: lightBase('#3730A3', 55, 48, 163),
    sidebar: ls('#3730A3', 55, 48, 163),
  },

  'light-crimson': {
    id: 'light-crimson',
    name: 'クリムゾン',
    category: 'light',
    isDark: false,
    swatchColor: '#B91C1C',
    swatchBg: '#FFFFFF',
    colors: lightBase('#B91C1C', 185, 28, 28),
    sidebar: ls('#B91C1C', 185, 28, 28),
  },

  'light-jade': {
    id: 'light-jade',
    name: 'ジェイド',
    category: 'light',
    isDark: false,
    swatchColor: '#06796A',
    swatchBg: '#FFFFFF',
    colors: lightBase('#06796A', 6, 121, 106),
    sidebar: ls('#06796A', 6, 121, 106),
  },

  // primary: #1A73E8 / tint: #E8F0FE（Google Calendar ブルー）
  'light-blue': {
    id: 'light-blue',
    name: 'ブルー',
    category: 'light',
    isDark: false,
    swatchColor: '#1A73E8',
    swatchBg: '#FFFFFF',
    colors: lightBase('#1A73E8', 26, 115, 232),
    sidebar: ls('#1A73E8', 26, 115, 232),
  },

  // ── ダーク（10） ────────────────────────────────────────────

  'dark-amber': {
    id: 'dark-amber',
    name: 'アンバー',
    category: 'dark',
    isDark: true,
    swatchColor: '#F5A623',
    swatchBg: '#1C1C1E',
    colors: darkBase('#F5A623', 245, 166, 35),
    sidebar: ds('#F5A623', 245, 166, 35),
  },

  'dark-ocean': {
    id: 'dark-ocean',
    name: 'オーシャン',
    category: 'dark',
    isDark: true,
    swatchColor: '#4DB8FF',
    swatchBg: '#1C1C1E',
    colors: darkBase('#4DB8FF', 77, 184, 255),
    sidebar: ds('#4DB8FF', 77, 184, 255),
  },

  'dark-forest': {
    id: 'dark-forest',
    name: 'フォレスト',
    category: 'dark',
    isDark: true,
    swatchColor: '#52C45E',
    swatchBg: '#1C1C1E',
    colors: darkBase('#52C45E', 82, 196, 94),
    sidebar: ds('#52C45E', 82, 196, 94),
  },

  'dark-lavender': {
    id: 'dark-lavender',
    name: 'ラベンダー',
    category: 'dark',
    isDark: true,
    swatchColor: '#C084FC',
    swatchBg: '#1C1C1E',
    colors: darkBase('#C084FC', 192, 132, 252),
    sidebar: ds('#C084FC', 192, 132, 252),
  },

  'dark-rose': {
    id: 'dark-rose',
    name: 'ローズ',
    category: 'dark',
    isDark: true,
    swatchColor: '#F472B6',
    swatchBg: '#1C1C1E',
    colors: darkBase('#F472B6', 244, 114, 182),
    sidebar: ds('#F472B6', 244, 114, 182),
  },

  'dark-coral': {
    id: 'dark-coral',
    name: 'コーラル',
    category: 'dark',
    isDark: true,
    swatchColor: '#FB7C56',
    swatchBg: '#1C1C1E',
    colors: darkBase('#FB7C56', 251, 124, 86),
    sidebar: ds('#FB7C56', 251, 124, 86),
  },

  'dark-midnight': {
    id: 'dark-midnight',
    name: 'ミッドナイト',
    category: 'dark',
    isDark: true,
    swatchColor: '#60A5FA',
    swatchBg: '#161B22',
    colors: darkBase(
      '#60A5FA', 96, 165, 250,
      '#0D1117', '#161B22', '#161B22',
      'rgba(13,17,23,0.94)', 'rgba(48,54,61,0.65)',
    ),
    sidebar: ds('#60A5FA', 96, 165, 250, '#0D1117', 'rgba(13,17,23,0.92)'),
  },

  'dark-teal': {
    id: 'dark-teal',
    name: 'ティール',
    category: 'dark',
    isDark: true,
    swatchColor: '#2DD4BF',
    swatchBg: '#1C1C1E',
    colors: darkBase('#2DD4BF', 45, 212, 191),
    sidebar: ds('#2DD4BF', 45, 212, 191),
  },

  'dark-indigo': {
    id: 'dark-indigo',
    name: 'インディゴ',
    category: 'dark',
    isDark: true,
    swatchColor: '#818CF8',
    swatchBg: '#1A1A2E',
    colors: darkBase(
      '#818CF8', 129, 140, 248,
      '#0F0F1A', '#1A1A2E', '#1A1A2E',
      'rgba(15,15,26,0.94)', 'rgba(84,84,88,0.65)',
    ),
    sidebar: ds('#818CF8', 129, 140, 248, '#0F0F1A', 'rgba(15,15,26,0.92)'),
  },

  'dark-crimson': {
    id: 'dark-crimson',
    name: 'クリムゾン',
    category: 'dark',
    isDark: true,
    swatchColor: '#F87171',
    swatchBg: '#1C1C1E',
    colors: darkBase('#F87171', 248, 113, 113),
    sidebar: ds('#F87171', 248, 113, 113),
  },

  'dark-blue': {
    id: 'dark-blue',
    name: 'ブルー',
    category: 'dark',
    isDark: true,
    swatchColor: '#60A5FA',
    swatchBg: '#0D1B2A',
    colors: darkBase(
      '#60A5FA', 96, 165, 250,
      '#0A1520', '#0D1B2A', '#0D1B2A',
      'rgba(10,21,32,0.94)', 'rgba(84,84,88,0.65)',
    ),
    sidebar: ds('#60A5FA', 96, 165, 250, '#0A1520', 'rgba(10,21,32,0.92)'),
  },

  // ── モノクロ・ライト（5） ────────────────────────────────────

  'mono-white': {
    id: 'mono-white',
    name: 'ホワイト',
    category: 'mono',
    isDark: false,
    swatchColor: '#3C3C43',
    swatchBg: '#FFFFFF',
    colors: {
      accent: '#3C3C43',
      background: '#FFFFFF',
      backgroundSecondary: '#F2F2F7',
      backgroundGrouped: '#F2F2F7',
      label: '#000000',
      labelSecondary: 'rgba(60,60,67,0.60)',
      labelTertiary: 'rgba(60,60,67,0.30)',
      card: '#FFFFFF',
      cardShadowColor: '#000000',
      separator: 'rgba(60,60,67,0.29)',
      navBarBackground: 'rgba(249,249,249,0.94)',
      navBarBorder: 'rgba(60,60,67,0.12)',
      filterBadgeBg: 'rgba(60,60,67,0.10)',
      filterBadgeText: '#3C3C43',
      hamburgerTint: '#000000',
      hamburgerPressedBg: 'rgba(142,142,147,0.12)',
      success: SystemColors.green,
      warning: SystemColors.orange,
      error: SystemColors.red,
      info: SystemColors.blue,
    },
    sidebar: ls('#3C3C43', 60, 60, 67),
  },

  'mono-paper': {
    id: 'mono-paper',
    name: 'ペーパー',
    category: 'mono',
    isDark: false,
    swatchColor: '#7C5C42',
    swatchBg: '#FFFDF6',
    colors: {
      accent: '#7C5C42',
      background: '#FFFDF6',
      backgroundSecondary: '#F5EFE0',
      backgroundGrouped: '#F5EFE0',
      label: '#1A0F0A',
      labelSecondary: 'rgba(58,40,20,0.60)',
      labelTertiary: 'rgba(58,40,20,0.30)',
      card: '#FFFDF6',
      cardShadowColor: '#3A2814',
      separator: 'rgba(58,40,20,0.20)',
      navBarBackground: 'rgba(255,253,246,0.94)',
      navBarBorder: 'rgba(58,40,20,0.12)',
      filterBadgeBg: 'rgba(124,92,66,0.12)',
      filterBadgeText: '#7C5C42',
      hamburgerTint: '#1A0F0A',
      hamburgerPressedBg: 'rgba(124,92,66,0.12)',
      success: SystemColors.green,
      warning: SystemColors.orange,
      error: SystemColors.red,
      info: SystemColors.blue,
    },
    sidebar: {
      background: 'rgba(245,239,224,0.92)',
      backgroundSolid: '#F5EFE0',
      overlay: 'rgba(0,0,0,0.25)',
      activeBackground: 'rgba(124,92,66,0.12)',
      activeTint: '#7C5C42',
      inactiveTint: 'rgba(58,40,20,0.55)',
      badgeBackground: '#7C5C42',
      badgeText: '#FFFFFF',
      sectionHeader: 'rgba(58,40,20,0.28)',
      separator: 'rgba(58,40,20,0.12)',
      footerTint: 'rgba(58,40,20,0.55)',
      tagBackground: 'rgba(58,40,20,0.07)',
      tagText: 'rgba(58,40,20,0.75)',
      textPrimary: '#1A0F0A',
      textTertiary: 'rgba(58,40,20,0.28)',
      pressedBackground: 'rgba(124,92,66,0.10)',
    },
  },

  'mono-stone': {
    id: 'mono-stone',
    name: 'ストーン',
    category: 'mono',
    isDark: false,
    swatchColor: '#52525B',
    swatchBg: '#FAFAFA',
    colors: {
      accent: '#52525B',
      background: '#FAFAFA',
      backgroundSecondary: '#F4F4F5',
      backgroundGrouped: '#F4F4F5',
      label: '#18181B',
      labelSecondary: 'rgba(24,24,27,0.60)',
      labelTertiary: 'rgba(24,24,27,0.30)',
      card: '#FFFFFF',
      cardShadowColor: '#000000',
      separator: 'rgba(24,24,27,0.18)',
      navBarBackground: 'rgba(250,250,250,0.94)',
      navBarBorder: 'rgba(24,24,27,0.10)',
      filterBadgeBg: 'rgba(82,82,91,0.10)',
      filterBadgeText: '#52525B',
      hamburgerTint: '#18181B',
      hamburgerPressedBg: 'rgba(82,82,91,0.10)',
      success: SystemColors.green,
      warning: SystemColors.orange,
      error: SystemColors.red,
      info: SystemColors.blue,
    },
    sidebar: ls('#52525B', 82, 82, 91),
  },

  'mono-sepia': {
    id: 'mono-sepia',
    name: 'セピア',
    category: 'mono',
    isDark: false,
    swatchColor: '#7A5C3E',
    swatchBg: '#FFF9EE',
    colors: {
      accent: '#7A5C3E',
      background: '#FFF9EE',
      backgroundSecondary: '#F0E6D2',
      backgroundGrouped: '#F0E6D2',
      label: '#2C1A0E',
      labelSecondary: 'rgba(44,26,14,0.60)',
      labelTertiary: 'rgba(44,26,14,0.30)',
      card: '#FFF9EE',
      cardShadowColor: '#2C1A0E',
      separator: 'rgba(44,26,14,0.20)',
      navBarBackground: 'rgba(255,249,238,0.94)',
      navBarBorder: 'rgba(44,26,14,0.12)',
      filterBadgeBg: 'rgba(122,92,62,0.12)',
      filterBadgeText: '#7A5C3E',
      hamburgerTint: '#2C1A0E',
      hamburgerPressedBg: 'rgba(122,92,62,0.10)',
      success: SystemColors.green,
      warning: SystemColors.orange,
      error: SystemColors.red,
      info: SystemColors.blue,
    },
    sidebar: {
      background: 'rgba(240,230,210,0.92)',
      backgroundSolid: '#F0E6D2',
      overlay: 'rgba(0,0,0,0.25)',
      activeBackground: 'rgba(122,92,62,0.12)',
      activeTint: '#7A5C3E',
      inactiveTint: 'rgba(44,26,14,0.55)',
      badgeBackground: '#7A5C3E',
      badgeText: '#FFFFFF',
      sectionHeader: 'rgba(44,26,14,0.28)',
      separator: 'rgba(44,26,14,0.12)',
      footerTint: 'rgba(44,26,14,0.55)',
      tagBackground: 'rgba(44,26,14,0.07)',
      tagText: 'rgba(44,26,14,0.75)',
      textPrimary: '#2C1A0E',
      textTertiary: 'rgba(44,26,14,0.28)',
      pressedBackground: 'rgba(122,92,62,0.08)',
    },
  },

  'mono-silver': {
    id: 'mono-silver',
    name: 'シルバー',
    category: 'mono',
    isDark: false,
    swatchColor: '#5F6B7C',
    swatchBg: '#F8F9FA',
    colors: {
      accent: '#5F6B7C',
      background: '#F8F9FA',
      backgroundSecondary: '#EDEEF0',
      backgroundGrouped: '#EDEEF0',
      label: '#1A2030',
      labelSecondary: 'rgba(26,32,48,0.60)',
      labelTertiary: 'rgba(26,32,48,0.30)',
      card: '#FFFFFF',
      cardShadowColor: '#000000',
      separator: 'rgba(26,32,48,0.18)',
      navBarBackground: 'rgba(248,249,250,0.94)',
      navBarBorder: 'rgba(26,32,48,0.10)',
      filterBadgeBg: 'rgba(95,107,124,0.10)',
      filterBadgeText: '#5F6B7C',
      hamburgerTint: '#1A2030',
      hamburgerPressedBg: 'rgba(95,107,124,0.10)',
      success: SystemColors.green,
      warning: SystemColors.orange,
      error: SystemColors.red,
      info: SystemColors.blue,
    },
    sidebar: ls('#5F6B7C', 95, 107, 124),
  },

  // ── モノクロ・ダーク（5） ────────────────────────────────────

  'mono-black': {
    id: 'mono-black',
    name: 'ブラック',
    category: 'mono',
    isDark: true,
    swatchColor: '#EBEBF5',
    swatchBg: '#000000',
    colors: {
      accent: '#EBEBF5',
      background: '#000000',
      backgroundSecondary: '#0D0D0D',
      backgroundGrouped: '#000000',
      label: '#FFFFFF',
      labelSecondary: 'rgba(235,235,245,0.60)',
      labelTertiary: 'rgba(235,235,245,0.30)',
      card: '#0D0D0D',
      cardShadowColor: '#000000',
      separator: 'rgba(84,84,88,0.65)',
      navBarBackground: 'rgba(0,0,0,0.94)',
      navBarBorder: 'rgba(84,84,88,0.65)',
      filterBadgeBg: 'rgba(235,235,245,0.10)',
      filterBadgeText: '#EBEBF5',
      hamburgerTint: '#FFFFFF',
      hamburgerPressedBg: 'rgba(142,142,147,0.24)',
      success: SystemColors.green,
      warning: SystemColors.orange,
      error: SystemColors.red,
      info: SystemColors.blue,
    },
    sidebar: ds('#EBEBF5', 235, 235, 245, '#000000', 'rgba(0,0,0,0.92)'),
  },

  'mono-charcoal': {
    id: 'mono-charcoal',
    name: 'チャコール',
    category: 'mono',
    isDark: true,
    swatchColor: '#C4B8A6',
    swatchBg: '#141210',
    colors: {
      accent: '#C4B8A6',
      background: '#141210',
      backgroundSecondary: '#1E1C18',
      backgroundGrouped: '#141210',
      label: '#EDE8E0',
      labelSecondary: 'rgba(237,232,224,0.60)',
      labelTertiary: 'rgba(237,232,224,0.30)',
      card: '#1E1C18',
      cardShadowColor: '#000000',
      separator: 'rgba(237,232,224,0.15)',
      navBarBackground: 'rgba(20,18,16,0.94)',
      navBarBorder: 'rgba(237,232,224,0.15)',
      filterBadgeBg: 'rgba(196,184,166,0.15)',
      filterBadgeText: '#C4B8A6',
      hamburgerTint: '#EDE8E0',
      hamburgerPressedBg: 'rgba(196,184,166,0.18)',
      success: SystemColors.green,
      warning: SystemColors.orange,
      error: SystemColors.red,
      info: SystemColors.blue,
    },
    sidebar: {
      background: 'rgba(20,18,16,0.92)',
      backgroundSolid: '#141210',
      overlay: 'rgba(0,0,0,0.50)',
      activeBackground: 'rgba(196,184,166,0.15)',
      activeTint: '#C4B8A6',
      inactiveTint: 'rgba(237,232,224,0.55)',
      badgeBackground: '#C4B8A6',
      badgeText: '#141210',
      sectionHeader: 'rgba(237,232,224,0.28)',
      separator: 'rgba(237,232,224,0.12)',
      footerTint: 'rgba(237,232,224,0.50)',
      tagBackground: 'rgba(237,232,224,0.08)',
      tagText: 'rgba(237,232,224,0.70)',
      textPrimary: '#EDE8E0',
      textTertiary: 'rgba(237,232,224,0.28)',
      pressedBackground: 'rgba(196,184,166,0.15)',
    },
  },

  'mono-graphite': {
    id: 'mono-graphite',
    name: 'グラファイト',
    category: 'mono',
    isDark: true,
    swatchColor: '#A8A8A8',
    swatchBg: '#1A1A1A',
    colors: {
      accent: '#A8A8A8',
      background: '#1A1A1A',
      backgroundSecondary: '#242424',
      backgroundGrouped: '#1A1A1A',
      label: '#F0F0F0',
      labelSecondary: 'rgba(240,240,240,0.60)',
      labelTertiary: 'rgba(240,240,240,0.30)',
      card: '#242424',
      cardShadowColor: '#000000',
      separator: 'rgba(240,240,240,0.15)',
      navBarBackground: 'rgba(26,26,26,0.94)',
      navBarBorder: 'rgba(240,240,240,0.15)',
      filterBadgeBg: 'rgba(168,168,168,0.15)',
      filterBadgeText: '#A8A8A8',
      hamburgerTint: '#F0F0F0',
      hamburgerPressedBg: 'rgba(168,168,168,0.18)',
      success: SystemColors.green,
      warning: SystemColors.orange,
      error: SystemColors.red,
      info: SystemColors.blue,
    },
    sidebar: ds('#A8A8A8', 168, 168, 168, '#1A1A1A', 'rgba(26,26,26,0.92)'),
  },

  'mono-slate': {
    id: 'mono-slate',
    name: 'スレート',
    category: 'mono',
    isDark: true,
    swatchColor: '#94A3B8',
    swatchBg: '#0F172A',
    colors: {
      accent: '#94A3B8',
      background: '#0F172A',
      backgroundSecondary: '#1E293B',
      backgroundGrouped: '#0F172A',
      label: '#F1F5F9',
      labelSecondary: 'rgba(241,245,249,0.60)',
      labelTertiary: 'rgba(241,245,249,0.30)',
      card: '#1E293B',
      cardShadowColor: '#000000',
      separator: 'rgba(241,245,249,0.15)',
      navBarBackground: 'rgba(15,23,42,0.94)',
      navBarBorder: 'rgba(30,41,59,0.65)',
      filterBadgeBg: 'rgba(148,163,184,0.15)',
      filterBadgeText: '#94A3B8',
      hamburgerTint: '#F1F5F9',
      hamburgerPressedBg: 'rgba(148,163,184,0.18)',
      success: SystemColors.green,
      warning: SystemColors.orange,
      error: SystemColors.red,
      info: SystemColors.blue,
    },
    sidebar: ds('#94A3B8', 148, 163, 184, '#0F172A', 'rgba(15,23,42,0.92)'),
  },

  'mono-ink': {
    id: 'mono-ink',
    name: 'インク',
    category: 'mono',
    isDark: true,
    swatchColor: '#B0C4DE',
    swatchBg: '#0B1120',
    colors: {
      accent: '#B0C4DE',
      background: '#0B1120',
      backgroundSecondary: '#14203A',
      backgroundGrouped: '#0B1120',
      label: '#E8EFF8',
      labelSecondary: 'rgba(232,239,248,0.60)',
      labelTertiary: 'rgba(232,239,248,0.30)',
      card: '#14203A',
      cardShadowColor: '#000000',
      separator: 'rgba(232,239,248,0.15)',
      navBarBackground: 'rgba(11,17,32,0.94)',
      navBarBorder: 'rgba(20,32,58,0.65)',
      filterBadgeBg: 'rgba(176,196,222,0.15)',
      filterBadgeText: '#B0C4DE',
      hamburgerTint: '#E8EFF8',
      hamburgerPressedBg: 'rgba(176,196,222,0.18)',
      success: SystemColors.green,
      warning: SystemColors.orange,
      error: SystemColors.red,
      info: SystemColors.blue,
    },
    sidebar: ds('#B0C4DE', 176, 196, 222, '#0B1120', 'rgba(11,17,32,0.92)'),
  },
};

// ============================================================
// カテゴリ分類（UI表示用）
// ============================================================

export const THEME_CATEGORIES: {
  id: ThemeCategory;
  label: string;
  ids: ThemeId[];
}[] = [
  {
    id: 'light',
    label: 'ライト',
    ids: [
      'light-amber', 'light-ocean', 'light-forest', 'light-lavender', 'light-rose',
      'light-coral', 'light-teal', 'light-indigo', 'light-crimson', 'light-jade',
    ],
  },
  {
    id: 'dark',
    label: 'ダーク',
    ids: [
      'dark-amber', 'dark-ocean', 'dark-forest', 'dark-lavender', 'dark-rose',
      'dark-coral', 'dark-midnight', 'dark-teal', 'dark-indigo', 'dark-crimson',
    ],
  },
  {
    id: 'mono',
    label: 'モノクロ',
    ids: [
      'mono-white', 'mono-paper', 'mono-stone', 'mono-sepia', 'mono-silver',
      'mono-black', 'mono-charcoal', 'mono-graphite', 'mono-slate', 'mono-ink',
    ],
  },
];

// ============================================================
// テーマ解決ユーティリティ
// ============================================================

/** DB に保存された生の文字列を ThemePreference に正規化 */
export function normalizeThemePreference(raw: string): ThemePreference {
  if (raw === 'system') return 'system';
  if (raw === 'light') return 'light-amber';    // 旧値マイグレーション
  if (raw === 'dark') return 'dark-amber';       // 旧値マイグレーション
  if (raw in THEMES) return raw as ThemeId;
  return 'system';
}

/** ThemePreference + OS設定 → ThemeEntry を解決 */
export function resolveTheme(pref: ThemePreference, systemDark: boolean): ThemeEntry {
  if (pref === 'system') {
    return THEMES[systemDark ? 'dark-amber' : 'light-amber'];
  }
  return THEMES[pref];
}
