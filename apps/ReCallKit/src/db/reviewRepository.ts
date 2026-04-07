// ============================================================
// ReCallKit reviewRepository
// 復習関連のDB操作をまとめたリポジトリ
// ============================================================

import type { SQLiteDatabase } from 'expo-sqlite';
import { sm2, sm2ResultToDBParams } from '../sm2/algorithm';
import type { Quality } from '../sm2/algorithm';
import type { ItemWithMeta } from '../types';

// getDueItems の戻り値型
export interface ReviewableItem {
  reviewId: number;
  item: ItemWithMeta;
}

// DB行の型（JOIN結果）
interface DueRow {
  id: number;
  type: string;
  title: string;
  content: string;
  source_url: string | null;
  excerpt: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
  archived: 0 | 1;
  flagged: number;
  review_id: number;
  repetitions: number;
  easiness_factor: number;
  interval_days: number;
  next_review_at: string;
  last_reviewed_at: string | null;
  quality_history: string;
}

/**
 * 今日の復習対象アイテムを取得
 * next_review_at <= 現在時刻 のもの
 */
export async function getDueItems(db: SQLiteDatabase): Promise<ReviewableItem[]> {
  const rows = await db.getAllAsync<DueRow>(`
    SELECT
      i.id, i.type, i.title, i.content, i.source_url, i.excerpt, i.category,
      i.created_at, i.updated_at, i.archived,
      r.id as review_id, r.repetitions, r.easiness_factor,
      r.interval_days, r.next_review_at, r.last_reviewed_at, r.quality_history
    FROM items i
    JOIN reviews r ON r.item_id = i.id
    WHERE i.archived = 0
      AND r.next_review_at <= datetime('now', 'localtime')
    ORDER BY r.next_review_at ASC
  `);

  return rows.map((row) => ({
    reviewId: row.review_id,
    item: {
      id: row.id,
      type: row.type as 'url' | 'text' | 'screenshot',
      title: row.title,
      content: row.content,
      source_url: row.source_url,
      excerpt: row.excerpt,
      category: row.category,
      created_at: row.created_at,
      updated_at: row.updated_at,
      archived: row.archived,
      flagged: row.flagged,
      tags: [],
      review: {
        id: row.review_id,
        item_id: row.id,
        repetitions: row.repetitions,
        easiness_factor: row.easiness_factor,
        interval_days: row.interval_days,
        next_review_at: row.next_review_at,
        last_reviewed_at: row.last_reviewed_at,
        quality_history: row.quality_history,
      },
    },
  }));
}

/**
 * 現在のストリーク日数を計算
 * 連続して復習を行った日数（今日含む）
 */
export async function getStreakDays(db: SQLiteDatabase): Promise<number> {
  const rows = await db.getAllAsync<{ review_date: string }>(`
    SELECT date(last_reviewed_at, 'localtime') as review_date
    FROM reviews
    WHERE last_reviewed_at IS NOT NULL
    GROUP BY date(last_reviewed_at, 'localtime')
    ORDER BY review_date DESC
    LIMIT 365
  `);

  if (rows.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  for (const row of rows) {
    const rowDate = new Date(row.review_date + 'T00:00:00');
    rowDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (checkDate.getTime() - rowDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0 || diffDays === 1) {
      streak++;
      checkDate = new Date(rowDate);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * 今日完了した復習数を取得
 */
export async function getTodayCompletedCount(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(`
    SELECT COUNT(*) as count
    FROM reviews
    WHERE date(last_reviewed_at, 'localtime') = date('now', 'localtime')
  `);
  return result?.count ?? 0;
}

/**
 * アーカイブされていないアイテム総数
 */
export async function getTotalItemCount(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM items WHERE archived = 0`
  );
  return result?.count ?? 0;
}

/**
 * 最近復習したアイテムを取得（デフォルト5件、limit で変更可）
 */
export async function getRecentlyReviewedItems(db: SQLiteDatabase, limit = 5): Promise<ReviewableItem[]> {
  const rows = await db.getAllAsync<DueRow>(`
    SELECT
      i.id, i.type, i.title, i.content, i.source_url, i.excerpt, i.category,
      i.created_at, i.updated_at, i.archived,
      r.id as review_id, r.repetitions, r.easiness_factor,
      r.interval_days, r.next_review_at, r.last_reviewed_at, r.quality_history
    FROM items i
    JOIN reviews r ON r.item_id = i.id
    WHERE i.archived = 0
      AND r.last_reviewed_at IS NOT NULL
    ORDER BY r.last_reviewed_at DESC
    LIMIT ?
  `, [limit]);

  return rows.map((row) => ({
    reviewId: row.review_id,
    item: {
      id: row.id,
      type: row.type as 'url' | 'text' | 'screenshot',
      title: row.title,
      content: row.content,
      source_url: row.source_url,
      excerpt: row.excerpt,
      category: row.category,
      created_at: row.created_at,
      updated_at: row.updated_at,
      archived: row.archived,
      flagged: row.flagged,
      tags: [],
      review: {
        id: row.review_id,
        item_id: row.id,
        repetitions: row.repetitions,
        easiness_factor: row.easiness_factor,
        interval_days: row.interval_days,
        next_review_at: row.next_review_at,
        last_reviewed_at: row.last_reviewed_at,
        quality_history: row.quality_history,
      },
    },
  }));
}

/**
 * アイテムIDで単一アイテム（＋レビュー状態）を取得
 */
export async function getItemById(
  db: SQLiteDatabase,
  itemId: number
): Promise<ReviewableItem | null> {
  const row = await db.getFirstAsync<DueRow>(`
    SELECT
      i.id, i.type, i.title, i.content, i.source_url, i.excerpt, i.category,
      i.created_at, i.updated_at, i.archived,
      r.id as review_id, r.repetitions, r.easiness_factor,
      r.interval_days, r.next_review_at, r.last_reviewed_at, r.quality_history
    FROM items i
    JOIN reviews r ON r.item_id = i.id
    WHERE i.id = ? AND i.archived = 0
    LIMIT 1
  `, [itemId]);

  if (!row) return null;

  return {
    reviewId: row.review_id,
    item: {
      id: row.id,
      type: row.type as 'url' | 'text' | 'screenshot',
      title: row.title,
      content: row.content,
      source_url: row.source_url,
      excerpt: row.excerpt,
      category: row.category,
      created_at: row.created_at,
      updated_at: row.updated_at,
      archived: row.archived,
      flagged: row.flagged,
      tags: [],
      review: {
        id: row.review_id,
        item_id: row.id,
        repetitions: row.repetitions,
        easiness_factor: row.easiness_factor,
        interval_days: row.interval_days,
        next_review_at: row.next_review_at,
        last_reviewed_at: row.last_reviewed_at,
        quality_history: row.quality_history,
      },
    },
  };
}

/**
 * 全アーカイブされていないアイテムを取得（強制復習用）
 */
export async function getAllReviewableItems(db: SQLiteDatabase): Promise<ReviewableItem[]> {
  const rows = await db.getAllAsync<DueRow>(`
    SELECT
      i.id, i.type, i.title, i.content, i.source_url, i.excerpt, i.category,
      i.created_at, i.updated_at, i.archived,
      r.id as review_id, r.repetitions, r.easiness_factor,
      r.interval_days, r.next_review_at, r.last_reviewed_at, r.quality_history
    FROM items i
    JOIN reviews r ON r.item_id = i.id
    WHERE i.archived = 0
    ORDER BY r.next_review_at ASC
  `);

  return rows.map((row) => ({
    reviewId: row.review_id,
    item: {
      id: row.id,
      type: row.type as 'url' | 'text' | 'screenshot',
      title: row.title,
      content: row.content,
      source_url: row.source_url,
      excerpt: row.excerpt,
      category: row.category,
      created_at: row.created_at,
      updated_at: row.updated_at,
      archived: row.archived,
      flagged: row.flagged,
      tags: [],
      review: {
        id: row.review_id,
        item_id: row.id,
        repetitions: row.repetitions,
        easiness_factor: row.easiness_factor,
        interval_days: row.interval_days,
        next_review_at: row.next_review_at,
        last_reviewed_at: row.last_reviewed_at,
        quality_history: row.quality_history,
      },
    },
  }));
}

/**
 * 復習評価を保存してSM-2状態を更新
 */
export async function submitReviewRating(
  db: SQLiteDatabase,
  reviewId: number,
  currentState: {
    repetitions: number;
    easiness_factor: number;
    interval_days: number;
  },
  quality: Quality
): Promise<void> {
  const sm2State = {
    repetitions: currentState.repetitions,
    easinessFactor: currentState.easiness_factor,
    intervalDays: currentState.interval_days,
  };

  const result = sm2(sm2State, quality);
  const params = sm2ResultToDBParams(result);

  await db.runAsync(
    `UPDATE reviews
     SET repetitions       = ?,
         easiness_factor   = ?,
         interval_days     = ?,
         next_review_at    = ?,
         last_reviewed_at  = datetime('now', 'localtime'),
         quality_history   = json_insert(quality_history, '$[#]', ?)
     WHERE id = ?`,
    [
      params.repetitions,
      params.easiness_factor,
      params.interval_days,
      params.next_review_at,
      quality,
      reviewId,
    ]
  );
}

/**
 * アイテムのフラグ状態を更新
 */
export async function toggleItemFlag(
  db: SQLiteDatabase,
  itemId: number,
  flagged: boolean
): Promise<void> {
  await db.runAsync(
    `UPDATE items SET flagged = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`,
    [flagged ? 1 : 0, itemId]
  );
}
