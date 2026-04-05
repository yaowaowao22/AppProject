// ============================================================
// useKnowledgeMap — 知識マップ用データフック
// アイテム（最大80件）とタグを一括取得する
// ============================================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { useDB } from './useDatabase';
import type { ItemWithMeta, ItemType, Tag, Review } from '../types';

interface ItemRow {
  id: number;
  type: string;
  title: string;
  content: string;
  source_url: string | null;
  excerpt: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
  archived: 0 | 1;
  review_id: number | null;
  next_review_at: string | null;
  last_reviewed_at: string | null;
  repetitions: number | null;
  easiness_factor: number | null;
  interval_days: number | null;
  quality_history: string | null;
}

interface ItemTagRow {
  item_id: number;
  tag_id: number;
  tag_name: string;
}

export function useKnowledgeMap() {
  const db = useDB();
  const [items, setItems] = useState<ItemWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await db.getAllAsync<ItemRow>(`
        SELECT i.*,
          r.id AS review_id,
          r.next_review_at, r.last_reviewed_at,
          r.repetitions, r.easiness_factor,
          r.interval_days, r.quality_history
        FROM items i
        LEFT JOIN reviews r ON r.item_id = i.id
        WHERE i.archived = 0
        ORDER BY i.created_at DESC
        LIMIT 80
      `);

      if (!rows.length) {
        if (mounted.current) setItems([]);
        return;
      }

      const ids = rows.map((r) => r.id);
      const ph = ids.map(() => '?').join(',');
      const tagRows = await db.getAllAsync<ItemTagRow>(
        `SELECT it.item_id, t.id AS tag_id, t.name AS tag_name
         FROM item_tags it
         JOIN tags t ON t.id = it.tag_id
         WHERE it.item_id IN (${ph})`,
        ids,
      );

      if (!mounted.current) return;

      const tagMap = new Map<number, Tag[]>();
      for (const tr of tagRows) {
        if (!tagMap.has(tr.item_id)) tagMap.set(tr.item_id, []);
        tagMap.get(tr.item_id)!.push({ id: tr.tag_id, name: tr.tag_name });
      }

      setItems(
        rows.map((row) => ({
          id: row.id,
          type: row.type as ItemType,
          title: row.title,
          content: row.content,
          source_url: row.source_url,
          excerpt: row.excerpt,
          category: row.category,
          created_at: row.created_at,
          updated_at: row.updated_at,
          archived: row.archived,
          tags: tagMap.get(row.id) ?? [],
          review: row.review_id
            ? ({
                id: row.review_id,
                item_id: row.id,
                repetitions: row.repetitions ?? 0,
                easiness_factor: row.easiness_factor ?? 2.5,
                interval_days: row.interval_days ?? 0,
                next_review_at: row.next_review_at ?? '',
                last_reviewed_at: row.last_reviewed_at,
                quality_history: row.quality_history ?? '[]',
              } as Review)
            : null,
        })),
      );
    } catch (e) {
      console.error('[useKnowledgeMap]', e);
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    mounted.current = true;
    fetchData();
    return () => {
      mounted.current = false;
    };
  }, [fetchData]);

  return { items, isLoading, refresh: fetchData };
}
