// ============================================================
// Groq API 設定
// BYOK (Bring Your Own Key): ユーザーが設定画面で API キーを入力する
// 保存先: SQLite app_settings テーブル (groq_api_key キー)
// ============================================================

/** Groq OpenAI互換 chat completions エンドポイント */
export const GROQ_API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

/** リクエストタイムアウト (ms) */
export const GROQ_TIMEOUT_MS = 60_000;

/** 選択可能なモデル一覧 (Groq公式モデルのうち、日本語精度と速度を基準に選定) */
export interface GroqModelDef {
  id: string;
  name: string;
  description: string;
  /** 目安: 1M tokens あたりの USD 価格 (入力/出力, Groq公式ページより) */
  priceNote: string;
}

export const GROQ_MODELS: GroqModelDef[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    description: '高品質・日本語◯ (推奨)',
    priceNote: '高精度',
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    description: '高速・軽量 (8Bパラ)',
    priceNote: '高速',
  },
];

export const GROQ_DEFAULT_MODEL_ID = 'llama-3.3-70b-versatile';

/** チャンクあたり最大生成トークン数 (第1チャンク: メタ情報 + QA) */
export const GROQ_MAX_TOKENS_FIRST = 3000;

/** チャンクあたり最大生成トークン数 (継続チャンク: QAのみ) */
export const GROQ_MAX_TOKENS_CONTINUATION = 2000;

/** URLあたりQA上限 (超過時はチャンク処理を打ち切り — localと揃える) */
export const GROQ_MAX_QA_TOTAL = 50;

/** APIキーの形式検証 (Groq のキーは gsk_ で始まる) */
export function isValidGroqApiKey(key: string): boolean {
  return /^gsk_[A-Za-z0-9]{20,}$/.test(key.trim());
}
