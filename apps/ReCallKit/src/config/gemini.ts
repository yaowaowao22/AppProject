// ============================================================
// Gemini API 設定
//
// 月 400 円サブスクの最安 API 構成 (Groq Dev Tier が申請不可のため代替)。
// 1 URL あたり ~10,000 tokens 前提で:
//   Gemini 1.5 Flash-8B    → 0.14 円/URL → 150 URL/月/人 で 21 円
// というコスト感。
//
// BYOK モード: ユーザーが自前の AIza... キーを Keychain に保存 (groq と同パターン)。
// 保存先: SecureStore の 'gemini_api_key' キー (src/services/secureStorage.ts)
// ============================================================

import type { AnalysisProfile } from './analysisProfile';

/** Gemini generateContent エンドポイントのベース URL */
export const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/** リクエストタイムアウト (ms) */
export const GEMINI_TIMEOUT_MS = 60_000;

/** 選択可能な Gemini モデル一覧 (Lambda proxy 側の allow-list と同期させること) */
export interface GeminiModelDef {
  id: string;
  name: string;
  description: string;
  /** 目安: 1M tokens あたりの USD 価格 (入力/出力, Google AI Studio Paid) */
  priceNote: string;
  /** URL解析のチャンク/生成パラメータ */
  profile: AnalysisProfile;
}

export const GEMINI_MODELS: GeminiModelDef[] = [
  {
    id: 'gemini-1.5-flash-8b',
    name: 'Gemini 1.5 Flash 8B',
    description: '最安・高速 (8B)',
    priceNote: '$0.0375/$0.15 per 1M tok (約 0.14 円/URL)',
    // Gemini は TPM 4,000,000 なので Groq Free Tier (TPM 6,000) の 666 倍余裕。
    // chunkSize を大きくし 1 call で多くの QA を生成できる設計にする。
    // 日本語 ~1 tok/char 前提:
    //   入力: chunkSize 6000 (6000 tok) + prompt ~1000 tok = 7000 tok
    //   出力: 3000 tok (= 40-50 QA)
    //   合計 10000 tok → TPM 4M に余裕
    profile: {
      chunkSize: 6_000,
      maxQaTotal: 100,
      maxTokensFirst: 3_000,
      maxTokensChunk: 2_500,
    },
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'バランス型 (1.5 系)',
    priceNote: '$0.075/$0.30 per 1M tok (約 0.28 円/URL)',
    profile: {
      chunkSize: 6_000,
      maxQaTotal: 100,
      maxTokensFirst: 3_000,
      maxTokensChunk: 2_500,
    },
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: '最新 (2.0 系)',
    priceNote: '$0.10/$0.40 per 1M tok (約 0.38 円/URL)',
    profile: {
      chunkSize: 6_000,
      maxQaTotal: 100,
      maxTokensFirst: 3_000,
      maxTokensChunk: 2_500,
    },
  },
];

export const GEMINI_DEFAULT_MODEL_ID = 'gemini-1.5-flash-8b';

/** Gemini モデルIDからプロファイルを取得。未知IDならデフォルトモデルにフォールバック */
export function getGeminiProfile(modelId: string): AnalysisProfile {
  const def =
    GEMINI_MODELS.find((m) => m.id === modelId) ??
    GEMINI_MODELS.find((m) => m.id === GEMINI_DEFAULT_MODEL_ID);
  // GEMINI_MODELS が空でない限り必ずヒットする
  return def!.profile;
}

/** APIキーの形式検証 (Gemini のキーは AIza で始まる、39 文字程度) */
export function isValidGeminiApiKey(key: string): boolean {
  return /^AIza[A-Za-z0-9_-]{30,}$/.test(key.trim());
}
