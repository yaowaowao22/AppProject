// ── 無料プランの制限定義 ──────────────────────────────────────────────────────

export const FREE_LIMITS = {
  /** 作成可能なテンプレート最大数 */
  MAX_TEMPLATES: 3,
  /** 月別レポート機能を利用可能か */
  MONTHLY_REPORT_ENABLED: false,
  /** 選択可能なテーマ数（ThemeId 一覧の先頭 N 件） */
  FREE_THEME_COUNT: 5,
} as const;

// ── フィーチャーキー ──────────────────────────────────────────────────────────

export type FeatureKey =
  | 'templates'     // テンプレート作成
  | 'monthlyReport' // 月別レポート
  | 'themes';       // テーマ変更

// ── 制限チェック ──────────────────────────────────────────────────────────────

/**
 * 指定した機能が利用可能かどうかを返す。
 * isPremium=true の場合は常に true。
 *
 * @param feature  チェック対象のフィーチャーキー
 * @param isPremium 現在のプレミアム状態
 * @param count    数量ベースの制限チェックに使う現在の件数（templates / themes 用）
 */
export function canUseFeature(
  feature: FeatureKey,
  isPremium: boolean,
  count?: number,
): boolean {
  if (isPremium) return true;

  switch (feature) {
    case 'monthlyReport':
      return FREE_LIMITS.MONTHLY_REPORT_ENABLED;
    case 'templates':
      return count === undefined || count < FREE_LIMITS.MAX_TEMPLATES;
    case 'themes':
      return count === undefined || count < FREE_LIMITS.FREE_THEME_COUNT;
    default:
      return true;
  }
}
