// ============================================================
// pointsRepository - ポイントイベントDB操作
// ============================================================

import type { SQLiteDatabase } from 'expo-sqlite';
import type { PointEvent } from '../types';

/** ポイント獲得イベントを記録 */
export async function earnPoints(
  db: SQLiteDatabase,
  amount: number,
  reason: string,
  itemId?: number
): Promise<void> {
  await db.runAsync(
    `INSERT INTO point_events (type, amount, reason, item_id) VALUES ('earn', ?, ?, ?)`,
    [amount, reason, itemId ?? null]
  );
}

/** ポイント消費イベントを記録 */
export async function spendPoints(
  db: SQLiteDatabase,
  amount: number,
  reason: string
): Promise<void> {
  await db.runAsync(
    `INSERT INTO point_events (type, amount, reason, item_id) VALUES ('spend', ?, ?, NULL)`,
    [amount, reason]
  );
}

/** 累計ポイントを取得（マイナスにならない） */
export async function getTotalPoints(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ total: number }>(`
    SELECT COALESCE(
      SUM(CASE WHEN type = 'earn' THEN amount ELSE -amount END),
      0
    ) as total
    FROM point_events
  `);
  return Math.max(0, result?.total ?? 0);
}

/** 直近のポイントイベント履歴を取得 */
export async function getRecentPointEvents(
  db: SQLiteDatabase,
  limit = 10
): Promise<PointEvent[]> {
  return db.getAllAsync<PointEvent>(
    `SELECT * FROM point_events ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
}
