// ============================================================
// Groq API 設定
// BYOK (Bring Your Own Key): ユーザーが設定画面で API キーを入力する
// 保存先: SQLite app_settings テーブル (groq_api_key キー)
// ============================================================

import type { AnalysisProfile } from './analysisProfile';

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
  /** URL解析のチャンク/生成パラメータ */
  profile: AnalysisProfile;
}

export const GROQ_MODELS: GroqModelDef[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    description: '高品質・日本語◯ (推奨)',
    priceNote: '高精度',
    // 131k context & 70B。1万文字なら1チャンクで完結可能。
    // max_tokens は 70B の最大 32k を活かして多めに確保。
    profile: {
      chunkSize: 10_000,
      maxQaTotal: 50,
      maxTokensFirst: 4_000,
      maxTokensChunk: 3_000,
    },
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    description: '高速・軽量 (8Bパラ)',
    priceNote: '高速',
    // 131k context だが 8B なので一括生成の品質がやや不安。
    // 1万文字を ~2 チャンクで割って QA を安定生成する設定。
    profile: {
      chunkSize: 8_000,
      maxQaTotal: 40,
      maxTokensFirst: 3_500,
      maxTokensChunk: 2_500,
    },
  },
];

export const GROQ_DEFAULT_MODEL_ID = 'llama-3.3-70b-versatile';

/** Groq モデルIDからプロファイルを取得。未知IDならデフォルトモデルにフォールバック */
export function getGroqProfile(modelId: string): AnalysisProfile {
  const def = GROQ_MODELS.find((m) => m.id === modelId)
    ?? GROQ_MODELS.find((m) => m.id === GROQ_DEFAULT_MODEL_ID);
  // GROQ_MODELS が空でない限り必ずヒットする
  return def!.profile;
}

/** APIキーの形式検証 (Groq のキーは gsk_ で始まる) */
export function isValidGroqApiKey(key: string): boolean {
  return /^gsk_[A-Za-z0-9]{20,}$/.test(key.trim());
}
