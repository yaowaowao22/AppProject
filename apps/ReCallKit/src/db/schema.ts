import type { SQLiteDatabase } from 'expo-sqlite';

// ============================================================
// スキーマバージョン管理
// ============================================================
const SCHEMA_VERSION = 1;

const CREATE_TABLES_SQL = `
  -- アイテム（URL・テキスト・メモ）
  CREATE TABLE IF NOT EXISTS items (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    type          TEXT    NOT NULL DEFAULT 'text',
    title         TEXT    NOT NULL,
    content       TEXT    NOT NULL,
    source_url    TEXT,
    excerpt       TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    archived      INTEGER NOT NULL DEFAULT 0
  );

  -- SM-2 復習スケジュール
  CREATE TABLE IF NOT EXISTS reviews (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id           INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    repetitions       INTEGER NOT NULL DEFAULT 0,
    easiness_factor   REAL    NOT NULL DEFAULT 2.5,
    interval_days     INTEGER NOT NULL DEFAULT 0,
    next_review_at    TEXT    NOT NULL,
    last_reviewed_at  TEXT,
    quality_history   TEXT    NOT NULL DEFAULT '[]'
  );
  CREATE INDEX IF NOT EXISTS idx_reviews_next ON reviews(next_review_at);
  CREATE INDEX IF NOT EXISTS idx_reviews_item ON reviews(item_id);

  -- タグマスタ
  CREATE TABLE IF NOT EXISTS tags (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT    NOT NULL UNIQUE
  );

  -- アイテム×タグ 多対多
  CREATE TABLE IF NOT EXISTS item_tags (
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    tag_id  INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
    PRIMARY KEY (item_id, tag_id)
  );

  -- 学びジャーナル
  CREATE TABLE IF NOT EXISTS journals (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id    INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    note       TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_journals_item ON journals(item_id);

  -- アプリ設定（KVS）
  CREATE TABLE IF NOT EXISTS app_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  INSERT OR IGNORE INTO app_settings (key, value) VALUES
    ('review_time', '08:00'),
    ('daily_review_count', '5'),
    ('theme', 'system'),
    ('onboarding_completed', 'false');
`;

// ============================================================
// スキーマバージョン取得/設定
// ============================================================
async function getSchemaVersion(db: SQLiteDatabase): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version'
    );
    return result?.user_version ?? 0;
  } catch {
    return 0;
  }
}

async function setSchemaVersion(db: SQLiteDatabase, version: number): Promise<void> {
  await db.execAsync(`PRAGMA user_version = ${version}`);
}

// ============================================================
// マイグレーション本体
// ============================================================
export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  // PRAGMA foreign_keys は全プラットフォームで有効化
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // WAL モードはネイティブのみ。Web の sql.js ではサポートされないため try-catch で囲む
  try {
    await db.execAsync('PRAGMA journal_mode = WAL;');
  } catch {
    // Web (sql.js) では WAL 非対応 — 無視して続行
  }

  const currentVersion = await getSchemaVersion(db);

  if (currentVersion < 1) {
    await db.execAsync(CREATE_TABLES_SQL);
    await setSchemaVersion(db, 1);
  }

  // 将来のマイグレーション例:
  // if (currentVersion < 2) {
  //   await db.execAsync(`ALTER TABLE items ADD COLUMN difficulty INTEGER DEFAULT 0`);
  //   await setSchemaVersion(db, 2);
  // }
}

export { SCHEMA_VERSION };
