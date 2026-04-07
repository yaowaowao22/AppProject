// ============================================================
// URL取り込みジョブ リポジトリ
// url_import_jobs テーブルの CRUD 操作
// ============================================================

import type { SQLiteDatabase } from 'expo-sqlite';

export type JobStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface UrlImportJob {
  id: number;
  url: string;
  status: JobStatus;
  title: string | null;
  error_msg: string | null;
  item_id: number | null;
  result_json: string | null;
  created_at: string;
  updated_at: string;
}

/** ジョブを新規登録（status: pending） */
export async function createJob(db: SQLiteDatabase, url: string): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO url_import_jobs (url, status, created_at, updated_at)
     VALUES (?, 'pending', datetime('now','localtime'), datetime('now','localtime'))`,
    [url],
  );
  return result.lastInsertRowId;
}

/** ジョブのフィールドを更新 */
export async function updateJob(
  db: SQLiteDatabase,
  id: number,
  fields: Partial<{ status: JobStatus; title: string; error_msg: string; item_id: number; result_json: string }>,
): Promise<void> {
  const sets: string[] = ["updated_at = datetime('now','localtime')"];
  const values: (string | number)[] = [];

  if (fields.status !== undefined) { sets.push('status = ?');    values.push(fields.status); }
  if (fields.title !== undefined)  { sets.push('title = ?');     values.push(fields.title); }
  if (fields.error_msg !== undefined) { sets.push('error_msg = ?'); values.push(fields.error_msg); }
  if (fields.item_id !== undefined)   { sets.push('item_id = ?');   values.push(fields.item_id); }
  if (fields.result_json !== undefined) { sets.push('result_json = ?'); values.push(fields.result_json); }

  await db.runAsync(
    `UPDATE url_import_jobs SET ${sets.join(', ')} WHERE id = ?`,
    [...values, id],
  );
}

/** 全ジョブを取得（新しい順） */
export async function listJobs(db: SQLiteDatabase): Promise<UrlImportJob[]> {
  return db.getAllAsync<UrlImportJob>(
    'SELECT * FROM url_import_jobs ORDER BY created_at DESC',
  );
}

/** 単一ジョブを取得 */
export async function getJob(db: SQLiteDatabase, id: number): Promise<UrlImportJob | null> {
  return db.getFirstAsync<UrlImportJob>(
    'SELECT * FROM url_import_jobs WHERE id = ?',
    [id],
  );
}

/** processing のまま残っているジョブを failed に復旧（アプリ異常終了後のリカバリ） */
export async function recoverStaleJobs(db: SQLiteDatabase): Promise<number> {
  const result = await db.runAsync(
    `UPDATE url_import_jobs
        SET status     = 'failed',
            error_msg  = 'アプリが異常終了したため中断されました',
            updated_at = datetime('now','localtime')
      WHERE status = 'processing'`,
  );
  return result.changes;
}

/** ジョブを削除 */
export async function deleteJob(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM url_import_jobs WHERE id = ?', [id]);
}
