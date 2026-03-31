import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';
import { migrateDatabase } from './schema';

const DB_NAME = 'recallkit.db';
const LOCK_NAME = 'recallkit-db-lock';
const BC_CHANNEL = 'recallkit-db-channel';

let _db: SQLiteDatabase | null = null;
let _opening: Promise<SQLiteDatabase> | null = null;
/** OPFS ロックを解放するための resolver（ロック取得タブのみセット） */
let _lockReleaseResolver: (() => void) | null = null;
/** true = このタブが OPFS ロックを保持中（クローズ時にブロードキャストが必要） */
let _holdsOPFSLock = false;

// ============================================================
// ユーティリティ
// ============================================================

/** Web: OPFS 上の DB ファイルを削除（Web Locks 非対応ブラウザ専用・破損復旧用） */
async function clearOPFSFile(): Promise<void> {
  if (typeof navigator?.storage?.getDirectory !== 'function') return;
  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry(DB_NAME);
  } catch {
    // ファイルが存在しない場合はスルー
  }
}

/** Web Locks API が利用可能かチェック */
function webLocksAvailable(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof (navigator as { locks?: { request?: unknown } }).locks?.request === 'function'
  );
}

/** 他タブに DB クローズを通知する */
function notifyDBClosed(): void {
  if (typeof (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel === 'undefined') return;
  try {
    const ch = new (globalThis as { BroadcastChannel: typeof BroadcastChannel }).BroadcastChannel(BC_CHANNEL);
    ch.postMessage({ type: 'db-closed' });
    ch.close();
  } catch {
    // BroadcastChannel が使えない場合はスルー
  }
}

// ============================================================
// Web Locks を使った OPFS オープン
// ============================================================

/**
 * Web Locks API で排他ロックを取得し、OPFS で DB を開く。
 * - ロック取得成功 → SQLiteDatabase を返す
 * - ロック取得失敗（他タブが使用中）→ null を返す
 */
async function tryOpenWithLock(): Promise<SQLiteDatabase | null> {
  return new Promise<SQLiteDatabase | null>((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).locks.request(
      LOCK_NAME,
      { ifAvailable: true },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (lock: any) => {
        if (!lock) {
          // 他タブがロックを保持中 → null を返してインメモリ DB へ
          resolve(null);
          return;
        }

        // ロック取得成功 → OPFS で DB を開く
        try {
          const db = await openDatabaseAsync(DB_NAME);
          await migrateDatabase(db);

          // DB がクローズされるまでロックを保持し続ける Promise
          const lockHeld = new Promise<void>((release) => {
            _lockReleaseResolver = release;
          });

          // タブが強制クローズされた場合も通知（ベストエフォート）
          if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', notifyDBClosed, { once: true });
          }

          _holdsOPFSLock = true;
          resolve(db);

          // ここで待機している間、ロックを保持し続ける
          await lockHeld;
        } catch {
          _holdsOPFSLock = false;
          resolve(null);
        }
        // コールバックが return するとロックが自動解放される
      }
    );
  });
}

/**
 * Web Locks 対応ブラウザ用: タブ間排他制御付き DB オープン
 * - ロック取得 → OPFS DB
 * - ロック取得失敗（他タブ使用中）→ インメモリ DB（データ破壊なし）
 */
async function openDatabaseWithLocks(): Promise<SQLiteDatabase> {
  const db = await tryOpenWithLock();
  if (db) return db;

  // ロック取得失敗 → インメモリ DB にフォールバック
  console.warn(
    '[ReCallKit] 別タブが DB を使用中のため、インメモリ DB にフォールバックしました。' +
      'データはこのセッション中のみ保持されます。'
  );

  const memDB = await openDatabaseAsync(':memory:');
  await migrateDatabase(memDB);

  // 他タブが DB を解放した際の通知を受け取る
  if (typeof (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel !== 'undefined') {
    const ch = new (globalThis as { BroadcastChannel: typeof BroadcastChannel }).BroadcastChannel(BC_CHANNEL);
    ch.addEventListener('message', (event: MessageEvent) => {
      if (event.data?.type === 'db-closed') {
        console.info(
          '[ReCallKit] 他タブが DB を解放しました。' +
            'ページをリロードすると OPFS DB を使用できます。'
        );
        ch.close();
      }
    });
  }

  return memDB;
}

// ============================================================
// DB オープン（Web は段階的フォールバック付き）
//
// Web Locks 利用可能:
//   1) ロック取得 → OPFS DB
//   2) ロック取得失敗（他タブ使用中）→ インメモリ DB（OPFS ファイル削除なし）
//
// Web Locks 利用不可（古いブラウザ）:
//   1) 通常オープン
//   2) OPFS ファイル削除 → 再オープン（破損対策）
//   3) インメモリ DB（OPFS が使えない環境でも動作を継続）
// ============================================================
async function openDatabaseWithFallback(): Promise<SQLiteDatabase> {
  // Native はそのまま開くだけ
  if (Platform.OS !== 'web') {
    const db = await openDatabaseAsync(DB_NAME);
    await migrateDatabase(db);
    return db;
  }

  // Web: Web Locks 対応ブラウザはタブ間排他制御付きで開く
  if (webLocksAvailable()) {
    return openDatabaseWithLocks();
  }

  // Web Locks 非対応ブラウザ: 従来の3段階フォールバック
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

  // インメモリ DB（セッション間でデータは消えるが動作は継続）
  const db = await openDatabaseAsync(':memory:');
  await migrateDatabase(db);
  return db;
}

// ============================================================
// DB 接続シングルトン
// 複数の呼び出し元が同時に getDatabase() を呼んでも openDatabaseAsync は
// 1 度しか実行されない（Web の OPFS SyncAccessHandle 重複エラーを防ぐ）
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
  if (!_db) return;

  await _db.closeAsync();

  // OPFS ロックを保持していた場合: ロックを解放し、他タブに通知する
  if (_holdsOPFSLock) {
    _lockReleaseResolver?.();
    _lockReleaseResolver = null;
    _holdsOPFSLock = false;
    notifyDBClosed();
  }

  _db = null;
  _opening = null;
}
