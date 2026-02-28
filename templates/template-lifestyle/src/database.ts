import { Database } from '@massapp/storage';
import type { Migration } from '@massapp/storage';

const migrations: Migration[] = [
  {
    version: 1,
    up: [
      `CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`,
    ],
  },
];

export const db = new Database('__APP_NAME__.db', migrations);
