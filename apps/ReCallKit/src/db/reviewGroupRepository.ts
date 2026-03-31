// ============================================================
// reviewGroupRepository — 復習グループ CRUD
// ============================================================
import type { SQLiteDatabase } from 'expo-sqlite';
import type { ReviewGroup } from '../types';

export interface ReviewGroupWithCount extends ReviewGroup {
  item_count: number;
}

// ---- グループ一覧（アイテム件数付き）------------------------
export async function getReviewGroups(
  db: SQLiteDatabase
): Promise<ReviewGroupWithCount[]> {
  return db.getAllAsync<ReviewGroupWithCount>(
    `SELECT g.id, g.name, g.description, g.created_at,
            COUNT(gi.item_id) AS item_count
     FROM review_groups g
     LEFT JOIN review_group_items gi ON gi.group_id = g.id
     GROUP BY g.id
     ORDER BY g.created_at DESC`
  );
}

// ---- グループ作成 + アイテム一括登録 -----------------------
export async function createReviewGroup(
  db: SQLiteDatabase,
  name: string,
  description: string | null,
  itemIds: number[]
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO review_groups (name, description, created_at)
     VALUES (?, ?, datetime('now', 'localtime'))`,
    [name, description ?? null]
  );
  const groupId = result.lastInsertRowId;

  if (itemIds.length > 0) {
    const placeholders = itemIds.map(() => '(?, ?, datetime(\'now\', \'localtime\'))').join(',');
    const params: number[] = [];
    for (const id of itemIds) {
      params.push(groupId, id);
    }
    await db.runAsync(
      `INSERT OR IGNORE INTO review_group_items (group_id, item_id, added_at)
       VALUES ${placeholders}`,
      params
    );
  }

  return groupId;
}

// ---- グループ削除 -------------------------------------------
export async function deleteReviewGroup(
  db: SQLiteDatabase,
  groupId: number
): Promise<void> {
  await db.runAsync('DELETE FROM review_groups WHERE id = ?', [groupId]);
}

// ---- グループ内アイテムID一覧 --------------------------------
export async function getItemIdsByGroup(
  db: SQLiteDatabase,
  groupId: number
): Promise<number[]> {
  const rows = await db.getAllAsync<{ item_id: number }>(
    'SELECT item_id FROM review_group_items WHERE group_id = ?',
    [groupId]
  );
  return rows.map((r) => r.item_id);
}
