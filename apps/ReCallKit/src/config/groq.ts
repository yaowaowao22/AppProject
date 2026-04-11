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
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    description: '高速・軽量 (8Bパラ)',
    priceNote: '高速',
    // 8B は指示追従が弱く 1 call で 12-15 件しか作らないことがあるため、
    // max_tokens を output context (8192) 近くまで広げ、groqAnalysisService 側の
    // 多段補填ループで目標件数 (30+) まで追加生成する設計にする。
    // llama-3.1-8b-instant は ~500 tok/sec なので 5500 tok でも ~11 秒 = Lambda 55s の中に 3 call 収まる。
    //
    // 日本語は ~1 tok/char のため chunkSize=4500 で入力 ~4500 tok。
    // 1 call = 入力 ~5000 tok (prompt込) + 出力 5500 tok = 10500 tok。
    // Free Tier TPM 6000 では 1 req / min に絞られる可能性があるため、
    // 大量生成には BYOK Dev Tier (TPM 30000) を強く推奨。
    profile: {
      chunkSize: 4_500,
      maxQaTotal: 80,
      maxTokensFirst: 5_500,
      maxTokensChunk: 4_500,
    },
  },
];

export const GROQ_DEFAULT_MODEL_ID = 'llama-3.1-8b-instant';

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
