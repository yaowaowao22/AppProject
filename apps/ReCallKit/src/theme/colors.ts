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
