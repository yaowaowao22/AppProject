// ============================================================
// Bedrock URL解析結果の型定義
// ============================================================

export interface QAPair {
  question: string;
  answer: string;
}

/** AIが生成する詳細タグ（名前＋説明） */
export interface TagSuggestion {
  name: string;
  description: string;
}

export interface AnalysisResult {
  title: string;
  summary: string;
  qa_pairs: QAPair[];
  category: string;
  /** AIが提案する詳細タグ一覧（2〜5個） */
  tags: TagSuggestion[];
}
