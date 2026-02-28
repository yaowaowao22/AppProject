import { Database } from "./sqlite";

export class CrudRepository<T extends { id?: number }> {
  private readonly db: Database;
  private readonly tableName: string;
  private readonly columns: string[];

  constructor(db: Database, tableName: string, columns: string[]) {
    this.db = db;
    this.tableName = tableName;
    this.columns = columns;
  }

  async getAll(orderBy?: string): Promise<T[]> {
    let sql = `SELECT * FROM ${this.tableName}`;
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }
    return this.db.query<T>(sql);
  }

  async getById(id: number): Promise<T | null> {
    return this.db.getFirst<T>(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
  }

  async insert(item: Omit<T, "id">): Promise<number> {
    const insertColumns = this.columns.filter((col) => col !== "id");
    const record = item as Record<string, unknown>;
    const values = insertColumns.map((col) => record[col]);
    const placeholders = insertColumns.map(() => "?").join(", ");
    const columnList = insertColumns.join(", ");

    const result = await this.db.run(
      `INSERT INTO ${this.tableName} (${columnList}) VALUES (${placeholders})`,
      values
    );

    return result.lastInsertRowId;
  }

  async update(id: number, item: Partial<T>): Promise<void> {
    const record = item as Record<string, unknown>;
    const keys = Object.keys(record).filter(
      (key) => key !== "id" && this.columns.includes(key)
    );

    if (keys.length === 0) {
      return;
    }

    const setClauses = keys.map((key) => `${key} = ?`).join(", ");
    const values = keys.map((key) => record[key]);
    values.push(id);

    await this.db.run(
      `UPDATE ${this.tableName} SET ${setClauses} WHERE id = ?`,
      values
    );
  }

  async delete(id: number): Promise<void> {
    await this.db.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
  }

  async count(): Promise<number> {
    const result = await this.db.getFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName}`
    );
    return result?.count ?? 0;
  }
}
