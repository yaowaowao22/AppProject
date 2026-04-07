import { SystemColors } from '../theme/colors';

// ============================================================
// カテゴリ定義（共通）
// AddItemScreen / QAPreviewScreen / URLImportListScreen 等で共有
// ============================================================

export interface CategoryDef {
  key: string;
  icon: string;
  color: string;
  label: string;
}

/** プリセットカテゴリ一覧（UIピッカー用） */
export const CATEGORIES: CategoryDef[] = [
  { key: '技術',     icon: '💻', color: SystemColors.blue,   label: '技術' },
  { key: 'ビジネス', icon: '📈', color: SystemColors.green,  label: 'ビジネス' },
  { key: '科学',     icon: '🔬', color: SystemColors.teal,   label: '科学' },
  { key: '語学',     icon: '🗣', color: SystemColors.indigo, label: '語学' },
  { key: '一般教養', icon: '📜', color: SystemColors.orange, label: '一般教養' },
  { key: 'その他',   icon: '📚', color: SystemColors.blue,   label: 'その他' },
];

/** AI応答の英語キーを日本語ラベルにマッピング */
const EN_TO_JP: Record<string, string> = {
  technology: '技術',
  science: '科学',
  business: 'ビジネス',
  language: '語学',
};

const CATEGORY_MAP = new Map<string, CategoryDef>(
  CATEGORIES.map((c) => [c.key, c]),
);

const DEFAULT_CATEGORY: CategoryDef = { key: 'その他', icon: '📚', color: SystemColors.blue, label: 'その他' };

/** キー（日本語 or 英語）からカテゴリ定義を取得 */
export function getCategoryConfig(raw: string): CategoryDef {
  const trimmed = raw.trim();
  const mapped = EN_TO_JP[trimmed.toLowerCase()] ?? trimmed;
  return CATEGORY_MAP.get(mapped) ?? { ...DEFAULT_CATEGORY, label: trimmed || 'その他' };
}
