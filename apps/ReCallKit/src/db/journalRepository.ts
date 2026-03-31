// ============================================================
// ReCallKit journalRepository
// 学びジャーナル関連のDB操作
// ============================================================

import type { SQLiteDatabase } from 'expo-sqlite';

// DB行の型（items との JOIN 結果）
interface JournalRow {
  id: number;
  item_id: number;
  note: string;
  created_at: string;
  item_title: string;
}

// 日付別グループの1エントリー
export interface JournalEntry {
  id: number;
  itemId: number;
  itemTitle: string;
  note: string;
  createdAt: string;
  timeLabel: string; // "14:32" 形式
}

// SectionList 用のセクション型
export interface JournalSection {
  dateLabel: string; // "2024年3月31日" 形式
  dateKey: string;   // "2024-03-31" ソート用
  data: JournalEntry[];
}

/**
 * 全ジャーナルを取得して日付別にグループ化する
 */
export async function getJournalsGroupedByDate(
  db: SQLiteDatabase
): Promise<JournalSection[]> {
  const rows = await db.getAllAsync<JournalRow>(`
    SELECT
      j.id,
      j.item_id,
      j.note,
      j.created_at,
      i.title AS item_title
    FROM journals j
    JOIN items i ON i.id = j.item_id
    ORDER BY j.created_at DESC
  `);

  // 日付 → エントリー[] のマップ
  const sectionMap = new Map<string, { label: string; entries: JournalEntry[] }>();

  for (const row of rows) {
    // "2024-03-31 14:32:00" → dateKey "2024-03-31", timeLabel "14:32"
    const [datePart, timePart] = row.created_at.split(' ');
    const dateKey = datePart ?? row.created_at.substring(0, 10);
    const timeLabel = timePart ? timePart.substring(0, 5) : '';

    const dateLabel = formatDateLabel(dateKey);

    if (!sectionMap.has(dateKey)) {
      sectionMap.set(dateKey, { label: dateLabel, entries: [] });
    }

    sectionMap.get(dateKey)!.entries.push({
      id: row.id,
      itemId: row.item_id,
      itemTitle: row.item_title,
      note: row.note,
      createdAt: row.created_at,
      timeLabel,
    });
  }

  // Map を配列化（降順はクエリで保証済み）
  const sections: JournalSection[] = [];
  for (const [dateKey, { label, entries }] of sectionMap) {
    sections.push({ dateLabel: label, dateKey, data: entries });
  }

  return sections;
}

/**
 * ジャーナルエントリーを追加する
 */
export async function addJournalEntry(
  db: SQLiteDatabase,
  itemId: number,
  note: string
): Promise<void> {
  await db.runAsync(
    `INSERT INTO journals (item_id, note) VALUES (?, ?)`,
    [itemId, note]
  );
}

/**
 * ジャーナルエントリーを削除する
 */
export async function deleteJournalEntry(
  db: SQLiteDatabase,
  journalId: number
): Promise<void> {
  await db.runAsync(`DELETE FROM journals WHERE id = ?`, [journalId]);
}

// ---- ヘルパー ----

/**
 * "2024-03-31" → "2024年3月31日（月）"
 */
function formatDateLabel(dateKey: string): string {
  const d = new Date(dateKey + 'T00:00:00');
  if (isNaN(d.getTime())) return dateKey;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) return '今日';
  if (target.getTime() === yesterday.getTime()) return '昨日';

  const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
  const day = DAY_NAMES[d.getDay()];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${day}）`;
}
