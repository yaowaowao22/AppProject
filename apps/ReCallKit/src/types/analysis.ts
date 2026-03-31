// ============================================================
// Bedrock URL解析結果の型定義
// ============================================================

export interface QAPair {
  question: string;
  answer: string;
}

export interface AnalysisResult {
  title: string;
  summary: string;
  qa_pairs: QAPair[];
  category: string;
}
