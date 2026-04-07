// ============================================================
// deepDiveRepository - AI深掘りキューのDB操作
// ============================================================

import type { SQLiteDatabase } from 'expo-sqlite';
import type { DeepDive } from '../types';

/** 深掘りリクエストをキューに追加 */
export async function createDeepDive(
  db: SQLiteDatabase,
  itemId: number,
  question: string,
  answer: string,
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO deep_dives (item_id, service, prompt, question, answer, status, created_at)
     VALUES (?, 'local', '', ?, ?, 'queued', datetime('now','localtime'))`,
    [itemId, question, answer],
  );
  return result.lastInsertRowId;
}

/** 次の未処理キューを1件取得 */
export async function getNextQueued(db: SQLiteDatabase): Promise<DeepDive | null> {
  const row = await db.getFirstAsync<DeepDive>(
    `SELECT * FROM deep_dives WHERE status = 'queued' ORDER BY created_at ASC LIMIT 1`,
  );
  return row ?? null;
}

/** ステータスを更新 */
export async function updateDeepDiveStatus(
  db: SQLiteDatabase,
  id: number,
  status: DeepDive['status'],
  result?: string | null,
  errorMsg?: string | null,
): Promise<void> {
  const completedAt = (status === 'done' || status === 'failed')
    ? "datetime('now','localtime')"
    : 'NULL';
  await db.runAsync(
    `UPDATE deep_dives
     SET status       = ?,
         result       = ?,
         error_msg    = ?,
         completed_at = ${completedAt}
     WHERE id = ?`,
    [status, result ?? null, errorMsg ?? null, id],
  );
}

/** アイテムに紐づく深掘り結果を取得（完了済みのみ） */
export async function getDeepDivesForItem(
  db: SQLiteDatabase,
  itemId: number,
): Promise<DeepDive[]> {
  return db.getAllAsync<DeepDive>(
    `SELECT * FROM deep_dives
     WHERE item_id = ? AND status = 'done'
     ORDER BY completed_at DESC`,
    [itemId],
  );
}

/** アイテムに紐づく全深掘り（ステータス問わず） */
export async function getAllDeepDivesForItem(
  db: SQLiteDatabase,
  itemId: number,
): Promise<DeepDive[]> {
  return db.getAllAsync<DeepDive>(
    `SELECT * FROM deep_dives WHERE item_id = ? ORDER BY created_at DESC`,
    [itemId],
  );
}

/** 未処理キューの件数 */
export async function getPendingCount(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM deep_dives WHERE status IN ('queued', 'processing')`,
  );
  return row?.count ?? 0;
}

/** アイテムの完了済み深掘り件数 */
export async function getDeepDiveCountForItem(
  db: SQLiteDatabase,
  itemId: number,
): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM deep_dives WHERE item_id = ? AND status = 'done'`,
    [itemId],
  );
  return row?.count ?? 0;
}
