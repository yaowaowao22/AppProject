// ============================================================
// useLibrary — ライブラリ一覧・タグ取得フック
// ============================================================
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useDB } from './useDatabase';
import type { ItemWithMeta, Tag, ItemType, Review } from '../types';

export type LibraryFilterType = ItemType | 'all';
export type ReviewStatusFilter = 'all' | 'pending' | 'done';
export type DateRangeFilter = 'all' | '7d' | '30d';

export interface LibraryFilter {
  search: string;
  type: LibraryFilterType;
  tagIds: number[];
  reviewStatus: ReviewStatusFilter;
  dateRange: DateRangeFilter;
  category: string | null;
  flaggedOnly: boolean;
}

export const DEFAULT_FILTER: LibraryFilter = {
  search: '',
  type: 'all',
  tagIds: [],
  reviewStatus: 'all',
  dateRange: 'all',
  category: null,
  flaggedOnly: false,
};

export interface TagWithCount extends Tag {
  count: number;
}

// ---- useItems -----------------------------------------------
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
  flagged: 0 | 1;
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

export function useItems(filter: LibraryFilter) {
  const db = useDB();
  const [items, setItems] = useState<ItemWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // tagIdsをシリアライズして依存関係に使う
  const tagIdsKey = filter.tagIds.join(',');

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const whereClauses: string[] = ['i.archived = 0'];
      const params: (string | number)[] = [];

      if (filter.search.trim()) {
        whereClauses.push('(i.title LIKE ? OR i.content LIKE ? OR i.excerpt LIKE ?)');
        const q = `%${filter.search.trim()}%`;
        params.push(q, q, q);
      }
      if (filter.type !== 'all') {
        whereClauses.push('i.type = ?');
        params.push(filter.type);
      }
      if (filter.reviewStatus === 'pending') {
        whereClauses.push(
          "(r.next_review_at IS NULL OR r.next_review_at <= datetime('now', 'localtime'))"
        );
      } else if (filter.reviewStatus === 'done') {
        whereClauses.push("r.next_review_at > datetime('now', 'localtime')");
      }
      if (filter.dateRange === '7d') {
        whereClauses.push("i.created_at >= datetime('now', 'localtime', '-7 days')");
      } else if (filter.dateRange === '30d') {
        whereClauses.push("i.created_at >= datetime('now', 'localtime', '-30 days')");
      }
      if (filter.category !== null) {
        whereClauses.push('i.category = ?');
        params.push(filter.category);
      }
      if (filter.flaggedOnly) {
        whereClauses.push('i.flagged = 1');
      }

      const where = `WHERE ${whereClauses.join(' AND ')}`;

      const rows = await db.getAllAsync<ItemRow>(
        `SELECT i.*,
           r.id          AS review_id,
           r.next_review_at,
           r.last_reviewed_at,
           r.repetitions,
           r.easiness_factor,
           r.interval_days,
           r.quality_history
         FROM items i
         LEFT JOIN reviews r ON r.item_id = i.id
         ${where}
         ORDER BY i.created_at DESC`,
        params
      );

      if (rows.length === 0) {
        setItems([]);
        return;
      }

      // タグフィルタ（選択タグをすべて持つアイテムのみ残す）
      let filteredRows = rows;
      if (filter.tagIds.length > 0) {
        const idPlaceholders = rows.map(() => '?').join(',');
        const tagPlaceholders = filter.tagIds.map(() => '?').join(',');
        const taggedRows = await db.getAllAsync<{ item_id: number }>(
          `SELECT item_id
           FROM item_tags
           WHERE tag_id   IN (${tagPlaceholders})
             AND item_id  IN (${idPlaceholders})
           GROUP BY item_id
           HAVING COUNT(DISTINCT tag_id) = ?`,
          [...filter.tagIds, ...rows.map((r) => r.id), filter.tagIds.length]
        );
        const taggedIds = new Set(taggedRows.map((r) => r.item_id));
        filteredRows = rows.filter((r) => taggedIds.has(r.id));
      }

      if (filteredRows.length === 0) {
        setItems([]);
        return;
      }

      // バッチでタグを取得（N+1回避）
      const itemIds = filteredRows.map((r) => r.id);
      const idPlaceholders = itemIds.map(() => '?').join(',');
      const tagRows = await db.getAllAsync<ItemTagRow>(
        `SELECT it.item_id, t.id AS tag_id, t.name AS tag_name
         FROM item_tags it
         JOIN tags t ON t.id = it.tag_id
         WHERE it.item_id IN (${idPlaceholders})`,
        itemIds
      );

      // item_id → Tag[] のマップ構築
      const tagsByItem = new Map<number, Tag[]>();
      for (const row of tagRows) {
        if (!tagsByItem.has(row.item_id)) tagsByItem.set(row.item_id, []);
        tagsByItem.get(row.item_id)!.push({ id: row.tag_id, name: row.tag_name, description: null });
      }

      // ItemWithMeta に変換
      const result: ItemWithMeta[] = filteredRows.map((row) => ({
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
        flagged: row.flagged,
        tags: tagsByItem.get(row.id) ?? [],
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
      }));

      setItems(result);
    } catch (err) {
      console.error('[useItems] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, filter.search, filter.type, tagIdsKey, filter.reviewStatus, filter.dateRange, filter.category]);

  useFocusEffect(useCallback(() => {
    fetchItems();
  }, [fetchItems]));

  return { items, isLoading, refresh: fetchItems };
}

// ---- useTags ------------------------------------------------
export function useTags() {
  const db = useDB();
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await db.getAllAsync<TagWithCount>(
        `SELECT t.id, t.name, t.description, COUNT(DISTINCT it.item_id) AS count
         FROM tags t
         LEFT JOIN item_tags it ON it.tag_id = t.id
         LEFT JOIN items i ON i.id = it.item_id AND i.archived = 0
         GROUP BY t.id
         ORDER BY count DESC, t.name ASC`
      );
      setTags(rows);
    } catch (err) {
      console.error('[useTags] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useFocusEffect(useCallback(() => {
    fetchTags();
  }, [fetchTags]));

  return { tags, isLoading, refresh: fetchTags };
}

// ---- ヘルパー ------------------------------------------------
export function hasActiveFilters(filter: LibraryFilter): boolean {
  return (
    filter.type !== 'all' ||
    filter.tagIds.length > 0 ||
    filter.reviewStatus !== 'all' ||
    filter.dateRange !== 'all' ||
    filter.category !== null
  );
}

export function useMemoFilter(
  search: string,
  type: LibraryFilterType,
  tagIds: number[],
  reviewStatus: ReviewStatusFilter,
  dateRange: DateRangeFilter,
  category: string | null = null,
  flaggedOnly: boolean = false
): LibraryFilter {
  // tagIdsの参照が変わるたびに再生成しないようにメモ化
  const tagIdsKey = tagIds.join(',');
  return useMemo(
    () => ({ search, type, tagIds, reviewStatus, dateRange, category, flaggedOnly }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search, type, tagIdsKey, reviewStatus, dateRange, category, flaggedOnly]
  );
}

// ---- useCategories ------------------------------------------
export function useCategories() {
  const db = useDB();
  const [categories, setCategories] = useState<string[]>([]);

  const fetchCategories = useCallback(async () => {
    try {
      const rows = await db.getAllAsync<{ category: string }>(
        `SELECT DISTINCT category FROM items
         WHERE category IS NOT NULL AND category != '' AND archived = 0
         ORDER BY category ASC`
      );
      setCategories(rows.map((r) => r.category));
    } catch (err) {
      console.error('[useCategories] fetch error:', err);
    }
  }, [db]);

  useFocusEffect(useCallback(() => {
    fetchCategories();
  }, [fetchCategories]));

  return { categories, refresh: fetchCategories };
}
