import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { migrateDatabase } from './schema';

const DB_NAME = 'recallkit.db';

let _db: SQLiteDatabase | null = null;
let _opening: Promise<SQLiteDatabase> | null = null;

// ============================================================
// DB接続シングルトン
// 複数の呼び出し元が同時に getDatabase() を呼んでも openDatabaseAsync は
// 1度しか実行されない（Web の OPFS SyncAccessHandle 重複エラーを防ぐ）
// ============================================================
export async function getDatabase(): Promise<SQLiteDatabase> {
  if (_db) return _db;
  if (_opening) return _opening;

  _opening = (async () => {
    try {
      _db = await openDatabaseAsync(DB_NAME);
      await migrateDatabase(_db);
      return _db;
    } catch (err) {
      _opening = null; // 失敗時はリセットして次回呼び出しで再試行できるようにする
      throw err;
    }
  })();

  return _opening;
}

export async function closeDatabase(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
  }
}
