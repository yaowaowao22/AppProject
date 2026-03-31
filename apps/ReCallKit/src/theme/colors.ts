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
  indigo: '#5E5CE6',  // デッキカテゴリー等の補助強調
  purple: '#BF5AF2',  // タグ等の補助強調
  teal: '#5AC8FA',    // 進捗インジケーター補助
} as const;

// サイドバー専用カラートークン
export const SidebarColors = {
  light: {
    // 背景（和紙の透過感: #EAEAEF ベース）
    background: 'rgba(234,234,239,0.92)',
    backgroundSolid: '#EAEAEF',
    // オーバーレイ（ドロワー背後の暗幕）
    overlay: 'rgba(0,0,0,0.30)',
    // アクティブアイテム
    activeBackground: 'rgba(196,127,23,0.12)', // Recall Amber 12%
    activeTint: RecallAmber.light,
    // 非アクティブアイテム
    inactiveTint: 'rgba(60,60,67,0.80)',
    // バッジ（カウント表示）
    badgeBackground: RecallAmber.light,
    badgeText: '#FFFFFF',
    // セクションヘッダー
    sectionHeader: 'rgba(60,60,67,0.50)',
    // 区切り線
    separator: 'rgba(60,60,67,0.18)',
    // フッターアイコン
    footerTint: 'rgba(60,60,67,0.60)',
    // タグチップ背景
    tagBackground: 'rgba(60,60,67,0.08)',
    tagText: 'rgba(60,60,67,0.80)',
  },
  dark: {
    background: 'rgba(22,22,24,0.95)',
    backgroundSolid: '#161618',
    overlay: 'rgba(0,0,0,0.50)',
    activeBackground: 'rgba(245,166,35,0.15)',
    activeTint: RecallAmber.dark,
    inactiveTint: 'rgba(235,235,245,0.75)',
    badgeBackground: RecallAmber.dark,
    badgeText: '#000000',
    sectionHeader: 'rgba(235,235,245,0.40)',
    separator: 'rgba(84,84,88,0.40)',
    footerTint: 'rgba(235,235,245,0.50)',
    tagBackground: 'rgba(235,235,245,0.10)',
    tagText: 'rgba(235,235,245,0.75)',
  },
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
