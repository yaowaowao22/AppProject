import * as SQLite from "expo-sqlite";

export interface Migration {
  version: number;
  up: string[];
}

export class Database {
  private readonly dbName: string;
  private readonly migrations: Migration[];
  private db: SQLite.SQLiteDatabase | null = null;

  constructor(dbName: string, migrations: Migration[]) {
    this.dbName = dbName;
    this.migrations = [...migrations].sort((a, b) => a.version - b.version);
  }

  async open(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync(this.dbName);

    await this.db.execAsync(
      `CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`
    );

    await this.runMigrations();
  }

  private async runMigrations(): Promise<void> {
    const db = this.getDb();

    const applied = await db.getAllAsync<{ version: number }>(
      "SELECT version FROM _migrations ORDER BY version ASC"
    );
    const appliedVersions = new Set(applied.map((row) => row.version));

    const pending = this.migrations.filter(
      (m) => !appliedVersions.has(m.version)
    );

    for (const migration of pending) {
      await db.withTransactionAsync(async () => {
        for (const statement of migration.up) {
          await db.execAsync(statement);
        }
        await db.runAsync(
          "INSERT INTO _migrations (version) VALUES (?)",
          [migration.version]
        );
      });
    }
  }

  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const db = this.getDb();
    return db.getAllAsync<T>(sql, params ?? []);
  }

  async run(sql: string, params?: unknown[]): Promise<SQLite.SQLiteRunResult> {
    const db = this.getDb();
    return db.runAsync(sql, params ?? []);
  }

  async getFirst<T>(sql: string, params?: unknown[]): Promise<T | null> {
    const db = this.getDb();
    const result = await db.getFirstAsync<T>(sql, params ?? []);
    return result ?? null;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }

  private getDb(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error(
        "Database is not open. Call open() before performing queries."
      );
    }
    return this.db;
  }
}
