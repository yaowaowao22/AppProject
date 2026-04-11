// ============================================================
// ReCallKit usageRepository
//
// URL 解析の日次使用量 (usage_log テーブル) を管理する。
// Gemini API の使用量制限を実装するため、ローカル SQLite で当日の
// 合計入力文字数と URL 数を記録する。
//
// 日付キーはローカルタイムの YYYY-MM-DD 形式 (日本国内ユーザー前提)。
// 海外ユーザーでも「日付が変わった = ローカル 0:00」で制限がリセットされる。
// ============================================================

import type { SQLiteDatabase } from 'expo-sqlite';

export interface DailyUsage {
  date: string;         // YYYY-MM-DD
  inputChars: number;   // 本文合計文字数 (≒ input tokens)
  urlCount: number;     // 処理した URL 数
  updatedAt: string;    // 最終更新時刻
}

/** ローカルタイムの YYYY-MM-DD を返す */
function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 今日の使用量を取得。レコードが無ければ 0 で返す (INSERT は行わない)。
 */
export async function getTodayUsage(db: SQLiteDatabase): Promise<DailyUsage> {
  const date = todayKey();
  const row = await db.getFirstAsync<{
    date: string;
    input_chars: number;
    url_count: number;
    updated_at: string;
  }>(
    `SELECT date, input_chars, url_count, updated_at FROM usage_log WHERE date = ?`,
    [date],
  );
  if (!row) {
    return { date, inputChars: 0, urlCount: 0, updatedAt: '' };
  }
  return {
    date: row.date,
    inputChars: row.input_chars,
    urlCount: row.url_count,
    updatedAt: row.updated_at,
  };
}

/**
 * 今日の使用量を加算する (UPSERT)。
 * 解析成功後に呼ぶ。呼び出し側で commit タイミングを制御するため、
 * 失敗時はこの関数を呼ばないこと (加算しない = 制限消費しない)。
 */
export async function incrementTodayUsage(
  db: SQLiteDatabase,
  chars: number,
  urlDelta: number = 1,
): Promise<void> {
  const date = todayKey();
  await db.runAsync(
    `INSERT INTO usage_log (date, input_chars, url_count, updated_at)
     VALUES (?, ?, ?, datetime('now', 'localtime'))
     ON CONFLICT(date) DO UPDATE SET
       input_chars = input_chars + excluded.input_chars,
       url_count = url_count + excluded.url_count,
       updated_at = datetime('now', 'localtime')`,
    [date, chars, urlDelta],
  );
}

/**
 * 当日の使用量が制限を超えていないか確認する。
 * 超えていれば Error を throw する (UI 側で catch して「今日は上限です」を表示)。
 *
 * @param limit 1日あたりの合計入力文字数上限 (例: 100_000)
 */
export async function assertWithinDailyLimit(
  db: SQLiteDatabase,
  limit: number,
): Promise<void> {
  const usage = await getTodayUsage(db);
  if (usage.inputChars >= limit) {
    throw new Error(
      `今日の使用量上限 (${limit.toLocaleString()} 文字) に達しました。\n` +
        `本日の使用量: ${usage.inputChars.toLocaleString()} 文字 / ${usage.urlCount} URL\n` +
        `明日 0:00 にリセットされます。`,
    );
  }
}

/**
 * 古い使用量ログを削除する (定期メンテナンス用)。
 * デフォルトで 90 日より古いレコードを削除する。
 */
export async function cleanupOldUsage(
  db: SQLiteDatabase,
  keepDays: number = 90,
): Promise<number> {
  const result = await db.runAsync(
    `DELETE FROM usage_log WHERE date < date('now', 'localtime', ?)`,
    [`-${keepDays} days`],
  );
  return result.changes ?? 0;
}
