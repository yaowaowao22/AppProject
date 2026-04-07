import type { SQLiteDatabase } from 'expo-sqlite';

// ============================================================
// スキーマバージョン管理
// ============================================================
const SCHEMA_VERSION = 9;

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

  if (currentVersion < 2) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS collections (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT    NOT NULL,
        created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
      );

      CREATE TABLE IF NOT EXISTS item_collections (
        item_id       INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        PRIMARY KEY (item_id, collection_id)
      );
    `);
    await setSchemaVersion(db, 2);
  }

  if (currentVersion < 3) {
    // items テーブルにカテゴリ列を追加
    await db.execAsync(`
      ALTER TABLE items ADD COLUMN category TEXT;
    `);

    // 復習グループテーブル
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS review_groups (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL,
        description TEXT,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
      );

      CREATE TABLE IF NOT EXISTS review_group_items (
        group_id  INTEGER NOT NULL REFERENCES review_groups(id) ON DELETE CASCADE,
        item_id   INTEGER NOT NULL REFERENCES items(id)         ON DELETE CASCADE,
        added_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
        PRIMARY KEY (group_id, item_id)
      );
      CREATE INDEX IF NOT EXISTS idx_rgi_item ON review_group_items(item_id);
    `);

    await setSchemaVersion(db, 3);
  }

  if (currentVersion < 4) {
    // ポイントイベントテーブル
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS point_events (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        type       TEXT    NOT NULL,
        amount     INTEGER NOT NULL,
        reason     TEXT    NOT NULL,
        item_id    INTEGER REFERENCES items(id) ON DELETE SET NULL,
        created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
      CREATE INDEX IF NOT EXISTS idx_point_events_created ON point_events(created_at);
    `);
    await setSchemaVersion(db, 4);
  }

  if (currentVersion < 5) {
    // URL取り込みジョブキュー
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS url_import_jobs (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        url         TEXT    NOT NULL,
        status      TEXT    NOT NULL DEFAULT 'pending',
        title       TEXT,
        error_msg   TEXT,
        item_id     INTEGER REFERENCES items(id) ON DELETE SET NULL,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
      CREATE INDEX IF NOT EXISTS idx_url_jobs_status  ON url_import_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_url_jobs_created ON url_import_jobs(created_at);
    `);
    await setSchemaVersion(db, 5);
  }

  if (currentVersion < 6) {
    // アイテムフラグ機能（学習中に「後で確認」マーク）
    await db.execAsync(`
      ALTER TABLE items ADD COLUMN flagged INTEGER NOT NULL DEFAULT 0;
    `);
    await setSchemaVersion(db, 6);
  }

  if (currentVersion < 7) {
    // 通知ON/OFF設定追加
    await db.execAsync(`
      INSERT OR IGNORE INTO app_settings (key, value) VALUES ('notifications_enabled', 'false');
    `);
    await setSchemaVersion(db, 7);
  }

  if (currentVersion < 8) {
    // AIディープダイブ履歴テーブル
    // service: 'ChatGPT' | 'Gemini' | 'Claude'
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS deep_dives (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id     INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        service     TEXT    NOT NULL,
        prompt      TEXT    NOT NULL,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
      CREATE INDEX IF NOT EXISTS idx_deep_dives_item    ON deep_dives(item_id);
      CREATE INDEX IF NOT EXISTS idx_deep_dives_created ON deep_dives(created_at);
    `);
    await setSchemaVersion(db, 8);
  }

  if (currentVersion < 9) {
    // tagsテーブルにdescription列を追加（AIが生成する説明文）
    await db.execAsync(`
      ALTER TABLE tags ADD COLUMN description TEXT;
    `);
    await setSchemaVersion(db, 9);
  }
}

// ============================================================
// 全データ削除
// app_settings は保持し、ユーザーデータのみ消去する
// ============================================================
export async function deleteAllData(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DELETE FROM deep_dives;
    DELETE FROM items;
    DELETE FROM tags;
    DELETE FROM collections;
    DELETE FROM review_groups;
    DELETE FROM point_events;
  `);
}

// ============================================================
// restore用クエリ
// バックアップからdeep_divesレコードを復元する際に使用する
// ============================================================

/** deep_divesテーブルの全レコードを取得（エクスポート用） */
export const DEEP_DIVES_SELECT_ALL_SQL = `
  SELECT * FROM deep_dives ORDER BY created_at ASC
` as const;

/** deep_divesの1レコードを復元INSERT（重複は無視） */
export const DEEP_DIVES_RESTORE_INSERT_SQL = `
  INSERT OR IGNORE INTO deep_dives (id, item_id, service, prompt, created_at)
  VALUES (?, ?, ?, ?, ?)
` as const;

export { SCHEMA_VERSION };
