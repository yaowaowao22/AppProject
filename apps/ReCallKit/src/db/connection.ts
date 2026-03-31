import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { migrateDatabase } from './schema';

const DB_NAME = 'recallkit.db';

let _db: SQLiteDatabase | null = null;

// ============================================================
// DB接続シングルトン
// ============================================================
export async function getDatabase(): Promise<SQLiteDatabase> {
  if (_db) return _db;

  _db = await openDatabaseAsync(DB_NAME);
  await migrateDatabase(_db);
  return _db;
}

export async function closeDatabase(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
  }
}
