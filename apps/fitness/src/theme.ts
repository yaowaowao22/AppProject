// TANREN デザイントークン
// 設計思想: 鍛鉄の間（MA）— 余白と一点の炎

// ── カラートークン ────────────────────────────────────────────────────────────
export const COLORS = {
  // 背景・表面
  background: '#111113',          // --bg: 鍛冶場の闇
  surface1:   '#191919',          // --s1: カード・ボタン背景
  surface2:   '#222224',          // --s2: ステップボタン・グラフバー

  // テキスト
  textPrimary:   '#F5F5F7',                    // --t1
  textSecondary: 'rgba(245,245,247,0.45)',      // --t2
  textTertiary:  'rgba(245,245,247,0.22)',      // --t3 ラベル・キャプション

  // アクセント（画面上3箇所のみ使用）
  accent:    '#FF6200',                // --ac: 灼熱オレンジ
  accentDim: 'rgba(255,98,0,0.12)',    // --acd: PRバッジ背景

  // 成功
  success: '#2DB55D',    // --ok: セット完了グリーン

  // 区切り線
  separator: 'rgba(255,255,255,0.07)', // --sep
} as const;

// ── スペーシング（8px グリッド） ────────────────────────────────────────────
export const SPACING = {
  xs:  4,   // 0.5u
  sm:  8,   // 1u  カード間隔
  md:  16,  // 2u  コンテンツマージン・カード内パディング
  lg:  24,  // 3u  セクション間
  xl:  32,  // 4u
  xxl: 48,  // 6u

  // 意味付き
  contentMargin: 16,  // --mg: コンテンツ左右マージン
  cardPadding:   14,  // カード内パディング
  cardGap:       8,   // カード間隔
  sectionGap:    20,  // セクション間
} as const;

// ── 角丸 ──────────────────────────────────────────────────────────────────────
export const RADIUS = {
  card:   13,  // --r: カード
  button: 16,  // --rbtn: ボタン
  btnCTA: 18,  // 主CTA（ワークアウト開始）
  chip:   20,  // クイックスタートチップ
  badge:  4,   // PRバッジ
  sheet:  18,  // ボトムシート上端
} as const;

// ── タイポグラフィ ──────────────────────────────────────────────────────────
export const TYPOGRAPHY = {
  // サイズ
  heroNumber:   58,  // 重量・レップ数 hero 表示
  screenTitle:  26,  // 画面タイトル
  exerciseName: 20,  // 種目名
  body:         16,  // リスト項目
  bodySmall:    15,
  caption:      12,  // 補足・日付
  captionSmall: 10,  // ラベル・単位

  // ウェイト
  heavy:    '800' as const,   // heroNumber
  bold:     '700' as const,   // タイトル・種目名
  semiBold: '600' as const,   // body
  regular:  '500' as const,   // caption
} as const;

// ── ボタンサイズ ──────────────────────────────────────────────────────────────
export const BUTTON_HEIGHT = {
  primary:   60,  // 主CTA（btn-p / done-btn）
  secondary: 50,  // 副アクション（btn-g）
  icon:      44,  // stepbtn・back-btn タップターゲット
  iconSmall: 32,  // back-btn 表示サイズ
} as const;

// ── @massapp/ui ThemeConfig ───────────────────────────────────────────────────
// TANREN は常時ダークモード。light / dark 両方に同じ値を設定する。
import type { ThemeConfig } from '@massapp/ui';
import {
  defaultTypography,
  defaultSpacing,
  defaultRadius,
  defaultShadows,
} from '@massapp/ui';

const tanrenColors = {
  primary:             COLORS.accent,
  primaryDark:         '#CC4E00',
  primaryLight:        COLORS.accentDim,
  secondary:           COLORS.surface2,
  secondaryDark:       COLORS.surface1,
  accent:              COLORS.accent,
  background:          COLORS.background,
  backgroundSecondary: COLORS.surface1,
  surface:             COLORS.surface1,
  surfaceElevated:     COLORS.surface2,
  text:                COLORS.textPrimary,
  textSecondary:       COLORS.textSecondary,
  textMuted:           COLORS.textTertiary,
  textOnPrimary:       COLORS.textPrimary,
  border:              COLORS.separator,
  divider:             COLORS.separator,
  error:               '#FF453A',
  success:             COLORS.success,
  warning:             '#FFD60A',
  info:                '#64D2FF',
};

export const theme: ThemeConfig = {
  name: 'tanren',
  colors: {
    light: tanrenColors,
    dark:  tanrenColors,
  },
  typography: {
    ...defaultTypography,
    fontSize: {
      xs:   TYPOGRAPHY.captionSmall,
      sm:   TYPOGRAPHY.caption,
      md:   TYPOGRAPHY.bodySmall,
      lg:   TYPOGRAPHY.body,
      xl:   TYPOGRAPHY.exerciseName,
      xxl:  TYPOGRAPHY.screenTitle,
      hero: TYPOGRAPHY.heroNumber,
    },
  },
  spacing: defaultSpacing,
  radius: {
    ...defaultRadius,
    sm:  RADIUS.badge,
    md:  RADIUS.card,
    lg:  RADIUS.sheet,
    xl:  RADIUS.btnCTA,
    xxl: RADIUS.chip,
  },
  shadows: defaultShadows,
  overrides: {
    tabBar: { borderTopWidth: 1 },
    card:   { borderRadius: RADIUS.card },
    button: { borderRadius: RADIUS.button },
  },
};
