// ============================================================
// ReCallKit queries
// 集計・分析系クエリ（マスタリーレベル・週間Activity・カテゴリ別統計）
// ============================================================

import type { SQLiteDatabase } from 'expo-sqlite';

// ============================================================
// マスタリーレベル
// ============================================================

/**
 * マスタリーレベル定義
 *   New       : 未復習（repetitions = 0）
 *   Learning  : 復習1〜2回（easiness_factor 問わず）
 *   Advanced  : 復習3〜4回 かつ easiness_factor >= 2.0
 *   Master    : 復習5回以上 かつ easiness_factor >= 2.5
 */
export type MasteryLevel = 'new' | 'learning' | 'advanced' | 'master';

export interface MasterySummary {
  new: number;
  learning: number;
  advanced: number;
  master: number;
  total: number;
}

interface MasteryRow {
  repetitions: number;
  easiness_factor: number;
}

function toMasteryLevel(row: MasteryRow): MasteryLevel {
  const { repetitions, easiness_factor } = row;
  if (repetitions === 0) return 'new';
  if (repetitions >= 5 && easiness_factor >= 2.5) return 'master';
  if (repetitions >= 3 && easiness_factor >= 2.0) return 'advanced';
  return 'learning';
}

/**
 * 全アイテムのマスタリーレベル分布を返す
 * アーカイブ済みアイテムは除外
 */
export async function getMasterySummary(db: SQLiteDatabase): Promise<MasterySummary> {
  const rows = await db.getAllAsync<MasteryRow>(`
    SELECT r.repetitions, r.easiness_factor
    FROM reviews r
    JOIN items i ON i.id = r.item_id
    WHERE i.archived = 0
  `);

  const summary: MasterySummary = { new: 0, learning: 0, advanced: 0, master: 0, total: rows.length };

  for (const row of rows) {
    summary[toMasteryLevel(row)]++;
  }

  return summary;
}

/**
 * 特定アイテムのマスタリーレベルを返す
 */
export async function getItemMasteryLevel(
  db: SQLiteDatabase,
  itemId: number
): Promise<MasteryLevel | null> {
  const row = await db.getFirstAsync<MasteryRow>(`
    SELECT repetitions, easiness_factor
    FROM reviews
    WHERE item_id = ?
    LIMIT 1
  `, [itemId]);

  return row ? toMasteryLevel(row) : null;
}

// ============================================================
// 週間Activity（過去7日の日別復習数）
// ============================================================

export interface DailyActivity {
  /** YYYY-MM-DD 形式 */
  date: string;
  count: number;
}

/**
 * 過去7日間（今日含む）の日別復習完了数を返す
 * 復習がなかった日は count=0 で補完する
 */
export async function getWeeklyActivity(db: SQLiteDatabase): Promise<DailyActivity[]> {
  const rows = await db.getAllAsync<{ review_date: string; count: number }>(`
    SELECT
      date(last_reviewed_at, 'localtime') AS review_date,
      COUNT(*) AS count
    FROM reviews
    WHERE last_reviewed_at IS NOT NULL
      AND date(last_reviewed_at, 'localtime') >= date('now', 'localtime', '-6 days')
    GROUP BY date(last_reviewed_at, 'localtime')
    ORDER BY review_date ASC
  `);

  // DB結果をMapに変換
  const map = new Map<string, number>(rows.map((r) => [r.review_date, r.count]));

  // 過去7日分を全日列挙して補完
  const result: DailyActivity[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    result.push({ date: key, count: map.get(key) ?? 0 });
  }

  return result;
}

/**
 * 過去N日分の日別復習完了数を返す（days で日数を指定）
 */
export async function getActivityByDays(
  db: SQLiteDatabase,
  days: number
): Promise<DailyActivity[]> {
  const rows = await db.getAllAsync<{ review_date: string; count: number }>(`
    SELECT
      date(last_reviewed_at, 'localtime') AS review_date,
      COUNT(*) AS count
    FROM reviews
    WHERE last_reviewed_at IS NOT NULL
      AND date(last_reviewed_at, 'localtime') >= date('now', 'localtime', ? || ' days')
    GROUP BY date(last_reviewed_at, 'localtime')
    ORDER BY review_date ASC
  `, [`-${days - 1}`]);

  const map = new Map<string, number>(rows.map((r) => [r.review_date, r.count]));

  const result: DailyActivity[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: map.get(key) ?? 0 });
  }

  return result;
}

// ============================================================
// カテゴリ別集計
// ============================================================

export interface CategoryStats {
  /** items.category の値（null は 'その他' として集計） */
  category: string;
  /** アーカイブ除外のアイテム総数 */
  itemCount: number;
  /** repetitions >= 3 かつ easiness_factor >= 2.0 の習熟済み数（Advanced + Master） */
  masteredCount: number;
  /** next_review_at が現在時刻以前（期限切れ）の件数 */
  dueCount: number;
}

/**
 * カテゴリ別の集計統計を返す
 * NULL カテゴリは 'その他' に統合して集計
 */
export async function getCategoryStats(db: SQLiteDatabase): Promise<CategoryStats[]> {
  const rows = await db.getAllAsync<{
    category: string | null;
    item_count: number;
    mastered_count: number;
    due_count: number;
  }>(`
    SELECT
      COALESCE(i.category, 'その他') AS category,
      COUNT(i.id)                    AS item_count,
      SUM(
        CASE
          WHEN r.repetitions >= 3 AND r.easiness_factor >= 2.0 THEN 1
          ELSE 0
        END
      )                              AS mastered_count,
      SUM(
        CASE
          WHEN r.next_review_at <= datetime('now', 'localtime') THEN 1
          ELSE 0
        END
      )                              AS due_count
    FROM items i
    JOIN reviews r ON r.item_id = i.id
    WHERE i.archived = 0
    GROUP BY COALESCE(i.category, 'その他')
    ORDER BY item_count DESC
  `);

  return rows.map((r) => ({
    category: r.category ?? 'その他',
    itemCount: r.item_count,
    masteredCount: r.mastered_count,
    dueCount: r.due_count,
  }));
}

/**
 * 特定カテゴリの統計を返す
 * 存在しないカテゴリは null を返す
 */
export async function getSingleCategoryStats(
  db: SQLiteDatabase,
  category: string
): Promise<CategoryStats | null> {
  const row = await db.getFirstAsync<{
    category: string | null;
    item_count: number;
    mastered_count: number;
    due_count: number;
  }>(`
    SELECT
      COALESCE(i.category, 'その他') AS category,
      COUNT(i.id)                    AS item_count,
      SUM(
        CASE
          WHEN r.repetitions >= 3 AND r.easiness_factor >= 2.0 THEN 1
          ELSE 0
        END
      )                              AS mastered_count,
      SUM(
        CASE
          WHEN r.next_review_at <= datetime('now', 'localtime') THEN 1
          ELSE 0
        END
      )                              AS due_count
    FROM items i
    JOIN reviews r ON r.item_id = i.id
    WHERE i.archived = 0
      AND COALESCE(i.category, 'その他') = ?
    GROUP BY COALESCE(i.category, 'その他')
    LIMIT 1
  `, [category]);

  if (!row) return null;

  return {
    category: row.category ?? 'その他',
    itemCount: row.item_count,
    masteredCount: row.mastered_count,
    dueCount: row.due_count,
  };
}
