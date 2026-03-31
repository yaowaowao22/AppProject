// ============================================================
// ReCallKit 共通型定義
// ============================================================

export type ItemType = 'url' | 'text' | 'screenshot';

export interface Item {
  id: number;
  type: ItemType;
  title: string;
  content: string;
  source_url: string | null;
  excerpt: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
  archived: 0 | 1;
}

export interface Review {
  id: number;
  item_id: number;
  repetitions: number;
  easiness_factor: number;
  interval_days: number;
  next_review_at: string;
  last_reviewed_at: string | null;
  quality_history: string; // JSON配列
}

export interface Tag {
  id: number;
  name: string;
}

export interface Journal {
  id: number;
  item_id: number;
  note: string;
  created_at: string;
}

export interface AppSetting {
  key: string;
  value: string;
}

// アイテム + タグ + 復習状態をまとめた表示用型
export interface ItemWithMeta extends Item {
  tags: Tag[];
  review: Review | null;
}

// サイドバーフィルター型
export type SidebarFilter =
  | { kind: 'smart'; id: 'today' | 'overdue' | 'recent' }
  | { kind: 'tag'; tagId: number; tagName: string }
  | { kind: 'collection'; collectionId: string; collectionName: string };

export interface ReviewGroup {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ReviewGroupItem {
  group_id: number;
  item_id: number;
  added_at: string;
}

export interface PointEvent {
  id: number;
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
  item_id: number | null;
  created_at: string;
}

// Bedrock URL解析結果
export type { QAPair, AnalysisResult } from './analysis';
