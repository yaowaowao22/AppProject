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
    // ⚠️ Groq Free Tier の TPM 6000 制限に収める設計:
    //    1 req の (input + max_tokens) 合計が 6000 tokens を超えると
    //    Groq が **即座に HTTP 413 (Request too large)** を返す (待機でも回復しない)。
    //
    // 日本語は ~1 tok/char のため以下の token 予算で組む:
    //   - system prompt + QA_RULES + 観点リスト   ~ 500 tok
    //   - 第1チャンク user prompt テンプレ         ~ 300 tok
    //   - 本文チャンク (chunkSize=3000)            ~3000 tok
    //   - 継続チャンク用既出質問リスト (多段補填時) ~ 700 tok
    //   = 入力合計 ~4500 tok
    //   + maxTokensFirst 1500  → 合計 6000 tok (ぎりぎり)
    //   + maxTokensChunk 1200  → 合計 5700 tok (余裕)
    //
    // 1 call あたり生成 QA = 1200-1500 tok ÷ ~70 tok/QA ≒ 17-21 件
    // 多段補填ループで 3 call 走れば合計 30-50 件に到達する見込み。
    //
    // BYOK (Dev Tier, TPM 300,000+) なら制限が 50 倍以上なので
    // maxTokens / chunkSize を大きくしてもよいが、ここでは Free Tier を前提に統一。
    profile: {
      chunkSize: 3_000,
      maxQaTotal: 60,
      maxTokensFirst: 1_500,
      maxTokensChunk: 1_200,
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
