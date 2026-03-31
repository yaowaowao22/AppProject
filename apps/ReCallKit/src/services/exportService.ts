import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Item, Review, Tag, Journal } from '../types';

// ============================================================
// エクスポート用型
// ============================================================
interface ExportItem extends Item {
  tags: string[];
  review: Review | null;
  journals: Journal[];
}

interface ExportData {
  version: 1;
  exported_at: string;
  app: 'ReCallKit';
  items: ExportItem[];
}

// ============================================================
// DBからデータ取得してJSONエクスポート
// ============================================================
export async function exportAllDataAsJSON(db: SQLiteDatabase): Promise<void> {
  // 全アイテム取得
  const items = await db.getAllAsync<Item>(`
    SELECT * FROM items ORDER BY created_at DESC
  `);

  // 各アイテムにタグ・レビュー・ジャーナルを付与
  const exportItems: ExportItem[] = await Promise.all(
    items.map(async (item) => {
      const tags = await db.getAllAsync<Tag>(
        `SELECT t.name FROM tags t
         JOIN item_tags it ON it.tag_id = t.id
         WHERE it.item_id = ?`,
        [item.id]
      );

      const review = await db.getFirstAsync<Review>(
        `SELECT * FROM reviews WHERE item_id = ?`,
        [item.id]
      );

      const journals = await db.getAllAsync<Journal>(
        `SELECT * FROM journals WHERE item_id = ? ORDER BY created_at ASC`,
        [item.id]
      );

      return {
        ...item,
        tags: tags.map((t) => t.name),
        review: review ?? null,
        journals,
      };
    })
  );

  const exportData: ExportData = {
    version: 1,
    exported_at: new Date().toISOString(),
    app: 'ReCallKit',
    items: exportItems,
  };

  // ファイルに書き出し
  const fileName = `recallkit_export_${formatDate(new Date())}.json`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
  const json = JSON.stringify(exportData, null, 2);

  await FileSystem.writeAsStringAsync(fileUri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // シェア
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('この端末ではファイル共有が利用できません');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/json',
    dialogTitle: 'ReCallKitデータをエクスポート',
    UTI: 'public.json',
  });
}

// ============================================================
// ヘルパー
// ============================================================
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}
