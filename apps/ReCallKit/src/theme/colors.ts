// ============================================================
// ReCallKit カラーシステム
// Recall Amber アクセントカラー + セマンティックカラー
// ============================================================

export const RecallAmber = {
  light: '#E8A000',
  dark: '#F5A623',
} as const;

// Blue アクションカラー体系（3色）
// primary   : メインアクション・CTA ボタン（Google Calendar ブルー）
// secondary : 補助強調・アイコン・インジケーター
// tint      : 背景塗り・ハイライト・フィルターバッジ背景
export const RecallBlue = {
  primary:   { light: '#1A73E8', dark: '#0A84FF' },
  secondary: { light: '#5AC8FA', dark: '#64D2FF' },
  tint:      { light: '#E8F0FE', dark: '#1C3558' },
} as const;

// システムカラー（Google Calendar 準拠）
export const SystemColors = {
  green: '#1E8E3E',   // ストリーク・正解・成功
  orange: '#F29900',  // 復習遅延（警告・難しい）
  red: '#D93025',     // 不正解・Again・エラー
  blue: '#1A73E8',    // リンク・情報・主要アクション
  indigo: '#5E5CE6',  // デッキカテゴリー等の補助強調
  purple: '#BF5AF2',  // タグ等の補助強調
  teal: '#5AC8FA',    // 進捗インジケーター補助
} as const;

// サイドバー専用カラートークン
export const SidebarColors = {
  light: {
    // 背景（#F2F2F7 ベース）
    background: 'rgba(242,242,247,0.95)',
    backgroundSolid: '#F2F2F7',
    // オーバーレイ（ドロワー背後の暗幕）
    overlay: 'rgba(0,0,0,0.30)',
    // アクティブアイテム
    activeBackground: 'rgba(196,127,23,0.12)', // Recall Amber 12%
    activeTint: RecallAmber.light,
    // 非アクティブアイテム（--text-secondary: rgba(60,60,67,0.6)）
    inactiveTint: 'rgba(60,60,67,0.60)',
    // バッジ（カウント表示）
    badgeBackground: RecallAmber.light,
    badgeText: '#FFFFFF',
    // セクションヘッダー（--text-tertiary: rgba(60,60,67,0.3)）
    sectionHeader: 'rgba(60,60,67,0.30)',
    // 区切り線（--separator: rgba(60,60,67,0.12)）
    separator: 'rgba(60,60,67,0.12)',
    // フッターアイコン
    footerTint: 'rgba(60,60,67,0.60)',
    // タグチップ背景
    tagBackground: 'rgba(60,60,67,0.08)',
    tagText: 'rgba(60,60,67,0.80)',
    // テキスト階層（--sidebar-text-primary/tertiary）
    textPrimary: '#000000',
    textTertiary: 'rgba(60,60,67,0.30)',
    // プレス状態背景（--system-gray5 light）
    pressedBackground: 'rgba(142,142,147,0.12)',
  },
  dark: {
    // dark background: rgba(22,22,24,0.92) に修正
    background: 'rgba(22,22,24,0.92)',
    backgroundSolid: '#161618',
    overlay: 'rgba(0,0,0,0.50)',
    activeBackground: 'rgba(245,166,35,0.15)',
    activeTint: RecallAmber.dark,
    // 非アクティブアイテム（--text-secondary: rgba(235,235,245,0.6)）
    inactiveTint: 'rgba(235,235,245,0.60)',
    badgeBackground: RecallAmber.dark,
    badgeText: '#000000',
    // セクションヘッダー（--text-tertiary: rgba(235,235,245,0.3)）
    sectionHeader: 'rgba(235,235,245,0.30)',
    // 区切り線（--separator: rgba(84,84,88,0.65)）
    separator: 'rgba(84,84,88,0.65)',
    footerTint: 'rgba(235,235,245,0.50)',
    tagBackground: 'rgba(235,235,245,0.10)',
    tagText: 'rgba(235,235,245,0.75)',
    // テキスト階層（--sidebar-text-primary/tertiary）
    textPrimary: '#FFFFFF',
    textTertiary: 'rgba(235,235,245,0.30)',
    // プレス状態背景（--system-gray5 dark）
    pressedBackground: 'rgba(142,142,147,0.24)',
  },
} as const;

// ライトモード（Google Calendar 配色準拠）
export const LightColors = {
  // アクセント
  accent: RecallAmber.light,

  // 背景
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  backgroundGrouped: '#F8F9FA',

  // テキスト
  label: '#202124',
  labelSecondary: '#5F6368',
  labelTertiary: '#9AA0A6',

  // カード
  card: '#FFFFFF',
  cardShadowColor: '#000000',

  // 区切り線
  separator: '#DADCE0',

  // ナビゲーションバー（--nav-bg / --tab-border）
  navBarBackground: 'rgba(249,249,249,0.94)',
  navBarBorder: 'rgba(60,60,67,0.12)',

  // フィルターバッジ（--accent-light / --accent）
  filterBadgeBg: 'rgba(196,127,23,0.12)',
  filterBadgeText: RecallAmber.light,

  // ハンバーガーボタン（サイドバー開閉トリガー）
  hamburgerTint: '#000000',
  hamburgerPressedBg: 'rgba(142,142,147,0.12)',

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

  // ナビゲーションバー（--nav-bg / --tab-border dark）
  navBarBackground: 'rgba(30,30,30,0.94)',
  navBarBorder: 'rgba(84,84,88,0.65)',

  // フィルターバッジ（--accent-light / --accent dark）
  filterBadgeBg: 'rgba(245,166,35,0.15)',
  filterBadgeText: RecallAmber.dark,

  // ハンバーガーボタン（サイドバー開閉トリガー）
  hamburgerTint: '#FFFFFF',
  hamburgerPressedBg: 'rgba(142,142,147,0.24)',

  // 状態色
  success: SystemColors.green,
  warning: SystemColors.orange,
  error: SystemColors.red,
  info: SystemColors.blue,
} as const;

export type ColorScheme = typeof LightColors | typeof DarkColors;

/** サイドバー（ドロワー）専用カラーセットの型エイリアス */
export type SidebarColorSet = typeof SidebarColors.light;

// Google Calendar 準拠カラーパレット（モックアップ :root 変数から抽出）
export const GoogleCalendarColors = {
  blue:         '#1A73E8',  // --blue: 主要アクション色
  amber:        '#E8A000',  // --accent: Amber アクセント
  green:        '#1E8E3E',  // --green: 成功・Infrastructure
  red:          '#D93025',  // --red: エラー・期限切れ
  orange:       '#F29900',  // --orange: 警告・難しい
  textPrimary:  '#202124',  // --text-1: label
  textSecondary:'#5F6368',  // --text-2: labelSecondary
  textTertiary: '#9AA0A6',  // --text-3: labelTertiary
  border:       '#DADCE0',  // --border: separator
  tint:         '#F8F9FA',  // --tint: backgroundSecondary
  surface:      '#FFFFFF',  // --surface / --bg
  // pill背景色
  pillBlueBg:   '#E8F0FE',
  pillGreenBg:  '#E6F4EA',
  pillRedBg:    '#FCE8E6',
  pillAmberBg:  '#FEF7E0',
} as const;
