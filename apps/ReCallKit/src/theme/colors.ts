// ============================================================
// ReCallKit カラーシステム
// Recall Amber アクセントカラー + セマンティックカラー
// ============================================================

export const RecallAmber = {
  light: '#C47F17',
  dark: '#F5A623',
} as const;

// iOS システムカラー（React Native の useColorScheme で切り替え）
export const SystemColors = {
  green: '#30D158',   // ストリーク・正解
  orange: '#FF9F0A',  // 復習遅延（警告）
  red: '#FF3B30',     // 不正解・Again
  blue: '#0A84FF',    // リンク・情報
} as const;

// ライトモード
export const LightColors = {
  // アクセント
  accent: RecallAmber.light,

  // 背景
  background: '#FFFFFF',
  backgroundSecondary: '#F2F2F7',
  backgroundGrouped: '#F2F2F7',

  // テキスト
  label: '#000000',
  labelSecondary: 'rgba(60,60,67,0.60)',
  labelTertiary: 'rgba(60,60,67,0.30)',

  // カード
  card: '#FFFFFF',
  cardShadowColor: '#000000',

  // 区切り線
  separator: 'rgba(60,60,67,0.29)',

  // タブバー
  tabBarActive: RecallAmber.light,
  tabBarInactive: 'rgba(60,60,67,0.60)',

  // 状態色
  success: SystemColors.green,
  warning: SystemColors.orange,
  error: SystemColors.red,
  info: SystemColors.blue,
} as const;

// ダークモード
export const DarkColors = {
  // アクセント
  accent: RecallAmber.dark,

  // 背景
  background: '#000000',
  backgroundSecondary: '#1C1C1E',
  backgroundGrouped: '#000000',

  // テキスト
  label: '#FFFFFF',
  labelSecondary: 'rgba(235,235,245,0.60)',
  labelTertiary: 'rgba(235,235,245,0.30)',

  // カード
  card: '#1C1C1E',
  cardShadowColor: '#000000',

  // 区切り線
  separator: 'rgba(84,84,88,0.65)',

  // タブバー
  tabBarActive: RecallAmber.dark,
  tabBarInactive: 'rgba(235,235,245,0.60)',

  // 状態色
  success: SystemColors.green,
  warning: SystemColors.orange,
  error: SystemColors.red,
  info: SystemColors.blue,
} as const;

export type ColorScheme = typeof LightColors | typeof DarkColors;
