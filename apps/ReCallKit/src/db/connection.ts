import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';
import { migrateDatabase } from './schema';

const DB_NAME = 'recallkit.db';

let _db: SQLiteDatabase | null = null;
let _opening: Promise<SQLiteDatabase> | null = null;

/** Web: OPFS 上の DB ファイルを削除してロック/破損状態を解除する */
async function clearOPFSFile(): Promise<void> {
  if (typeof navigator?.storage?.getDirectory !== 'function') return;
  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry(DB_NAME);
  } catch {
    // ファイルが存在しない場合はスルー
  }
}

// ============================================================
// DB オープン（Web は段階的フォールバック付き）
// 1) 通常オープン
// 2) OPFS ファイル削除 → 再オープン（ロック残留/破損対策）
// 3) インメモリ DB（OPFS が使えない環境でも動作を継続）
// ============================================================
async function openDatabaseWithFallback(): Promise<SQLiteDatabase> {
  // Native はそのまま開くだけ
  if (Platform.OS !== 'web') {
    const db = await openDatabaseAsync(DB_NAME);
    await migrateDatabase(db);
    return db;
  }

  // Web: 段階的フォールバック
  try {
    const db = await openDatabaseAsync(DB_NAME);
    await migrateDatabase(db);
    return db;
  } catch { /* 次のステップへ */ }

  await clearOPFSFile();
  try {
    const db = await openDatabaseAsync(DB_NAME);
    await migrateDatabase(db);
    return db;
  } catch { /* 次のステップへ */ }

  // インメモリ DB にフォールバック（セッション間でデータは消えるが動作は継続）
  const db = await openDatabaseAsync(':memory:');
  await migrateDatabase(db);
  return db;
}

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
      _db = await openDatabaseWithFallback();
      return _db;
    } catch (err) {
      _opening = null;
      throw err;
    }
  })();

  return _opening;
}

export async function closeDatabase(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
    _opening = null;
  }
}
