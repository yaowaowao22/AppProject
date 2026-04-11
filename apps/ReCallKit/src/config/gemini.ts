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

// 2026年時点のモデル一覧 + Free Tier 実測結果 (Lambda 経由で invoke smoke test):
//
//   | モデル                  | Free Tier | 料金 (paid)          |
//   | gemini-2.5-flash-lite  | ✓ 200     | $0.10/$0.40 per 1M  |  ★Free Tier 対応の最安
//   | gemini-2.5-flash       | ✓ 200     | $0.30/$2.50 per 1M  |
//   | gemini-2.0-flash-lite  | ✗ 429     | $0.075/$0.30 per 1M |  ←Free Tier 対象外
//   | gemini-2.0-flash       | ✗ 429     | $0.10/$0.40 per 1M  |  ←Free Tier 対象外
//
// 2.0 系は Free Tier から外れたため、Free Tier 運用では 2.5 系しか使えない。
// Paid 料金は 2.0-lite が最安だが、個人アプリの小規模運用では Free Tier 内に
// 収まるケースがほとんどで、実質ゼロコストになる。
// alias (gemini-flash-latest 等) ではなく固定バージョンを使う (モデル挙動変化を防ぐ)。
// Gemini 2.5 系は 1M input / 65k output tokens context。
// Qiita 記事 3,934 文字を 1 call で処理して 50 QA 生成した実測より、
// chunkSize を実質制限なしに拡大、1 call で記事全文を処理する設計にする。
//   chunkSize: 60,000 文字 (≈60,000 tok、ほぼ全ての Web 記事が 1 call で入る)
//   maxTokensFirst: 5,000 (≈50-70 QA 分)
//   maxTokensChunk: 3,000 (滅多に発動しないが念のため)
export const GEMINI_MODELS: GeminiModelDef[] = [
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    description: '★Free Tier 対応の最安',
    priceNote: '$0.10/$0.40 per 1M tok (Free Tier 内なら無料)',
    profile: {
      chunkSize: 60_000,
      maxQaTotal: 100,
      maxTokensFirst: 5_000,
      maxTokensChunk: 3_000,
    },
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: '精度重視 (Free Tier 対応)',
    priceNote: '$0.30/$2.50 per 1M tok',
    profile: {
      chunkSize: 60_000,
      maxQaTotal: 100,
      maxTokensFirst: 5_000,
      maxTokensChunk: 3_000,
    },
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite',
    description: 'Paid 最安 (要課金登録)',
    priceNote: '$0.075/$0.30 per 1M tok (Free Tier 除外)',
    profile: {
      chunkSize: 60_000,
      maxQaTotal: 100,
      maxTokensFirst: 5_000,
      maxTokensChunk: 3_000,
    },
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Paid バランス (要課金登録)',
    priceNote: '$0.10/$0.40 per 1M tok (Free Tier 除外)',
    profile: {
      chunkSize: 60_000,
      maxQaTotal: 100,
      maxTokensFirst: 5_000,
      maxTokensChunk: 3_000,
    },
  },
];

export const GEMINI_DEFAULT_MODEL_ID = 'gemini-2.5-flash-lite';

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
