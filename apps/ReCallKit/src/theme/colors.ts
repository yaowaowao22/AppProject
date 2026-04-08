// ============================================================
// ReCallKit カラーシステム
// Indigo Pro アクセントカラー + セマンティックカラー
// ============================================================

export const RecallAmber = {
  light: '#E8A000',
  dark: '#F5A623',
} as const;

// Indigo アクションカラー体系（3色）
// primary   : メインアクション・CTA ボタン（Indigo）
// secondary : 補助強調・アイコン・インジケーター
// tint      : 背景塗り・ハイライト・フィルターバッジ背景
export const RecallBlue = {
  primary:   { light: '#6366F1', dark: '#818CF8' },
  secondary: { light: '#818CF8', dark: '#A5B4FC' },
  tint:      { light: '#EEF2FF', dark: '#1E1B4B' },
} as const;

// システムカラー（Indigo Pro 準拠）
export const SystemColors = {
  green: '#059669',   // ストリーク・正解・成功
  orange: '#D97706',  // 復習遅延（警告・難しい）
  red: '#DC2626',     // 不正解・Again・エラー
  blue: '#6366F1',    // リンク・情報・主要アクション
  indigo: '#6366F1',  // デッキカテゴリー等の補助強調
  purple: '#BF5AF2',  // タグ等の補助強調
  teal: '#5AC8FA',    // 進捗インジケーター補助
} as const;

// Indigo Pro 準拠カラーパレット
export const IndigoProColors = {
  accent:       '#6366F1',  // --accent: Indigo アクセント
  green:        '#059669',  // --green: 成功・Infrastructure
  red:          '#DC2626',  // --red: エラー・期限切れ
  orange:       '#D97706',  // --orange: 警告・難しい
  textPrimary:  '#171717',  // --text-1: label
  textSecondary:'#525252',  // --text-2: labelSecondary
  textTertiary: '#A3A3A3',  // --text-3: labelTertiary
  border:       '#E5E5E5',  // --border: separator
  tint:         '#F5F5F5',  // --tint: backgroundSecondary
  surface:      '#FAFAFA',  // --surface / --bg
  // pill背景色
  pillIndigoBg: '#EEF2FF',
  pillGreenBg:  '#ECFDF5',
  pillRedBg:    '#FEF2F2',
  pillAmberBg:  '#FFFBEB',
} as const;

// 後方互換エイリアス（旧プロパティ名も維持）
export const GoogleCalendarColors = {
  ...IndigoProColors,
  blue: IndigoProColors.accent,
  amber: '#D97706',
  pillBlueBg: IndigoProColors.pillIndigoBg,
} as const;
