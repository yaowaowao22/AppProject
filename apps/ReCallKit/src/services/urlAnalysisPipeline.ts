// ============================================================
// URL解析統合パイプライン
//
// 実行時プロバイダー選択 (DB設定 llm_provider):
//   'local'   → llama.rn (デバイス内 Gemma 4 / Llama 3.2 等)
//   'bedrock' → AWS Lambda + Claude 3 Haiku
//   'groq'    → Groq API + Llama 3.1 8B (BYOK/Lambda proxy)
//   'gemini'  → Google Gemini API + 1.5 Flash-8B (Lambda proxy / 月400円サブスク最安構成)
//   ''        → DB未設定。compile-time LOCAL_AI_ENABLED にフォールバック
//                (既存ユーザーの挙動を変えないための後方互換)
// ============================================================

import { getDatabase } from '../db/connection';
import { getSetting, type LlmProvider } from '../db/settingsRepository';
import { isAwsConfigured } from '../config/aws';
import { LOCAL_AI_ENABLED } from '../config/localAI';
import { analyzeUrl } from './bedrockAnalysisService';
import { analyzeUrlGroq } from './groqAnalysisService';
import { analyzeUrlGemini } from './geminiAnalysisService';
import { analyzeUrlLocal } from './localAnalysisService';
import type { AnalysisResult } from '../types/analysis';

export type PipelineResult = AnalysisResult & { sourceUrl: string };

/**
 * 現在選択されているプロバイダーを解決する。
 * Groq / Bedrock は 2026/04 に UI から撤去したため、DB に残っていたら Gemini に自動移行する。
 * DB未設定 (空文字) なら LOCAL_AI_ENABLED で決定する後方互換。
 */
async function resolveProvider(): Promise<LlmProvider> {
  const db = await getDatabase();
  const raw = (await getSetting(db, 'llm_provider')).trim();
  if (raw === 'local' || raw === 'gemini') {
    return raw;
  }
  // 旧 provider (groq/bedrock) → gemini に自動マイグレーション
  return LOCAL_AI_ENABLED ? 'local' : 'gemini';
}

/**
 * URLを受け取り、設定に応じて local / Bedrock / Groq / Gemini のいずれかで Q&A 解析する。
 */
export async function analyzeUrlPipeline(
  url: string,
  onProgress?: (
    currentChunk: number,
    totalChunks: number,
    chunkQaCount?: number,
    totalQaCount?: number,
  ) => void,
  jobId?: number,
): Promise<PipelineResult> {
  const provider = await resolveProvider();
  let result: AnalysisResult;

  if (provider === 'local') {
    console.log('[urlAnalysisPipeline] ローカルAI（llama.rn）モードで解析:', url);
    result = await analyzeUrlLocal(url, onProgress, jobId);
  } else if (provider === 'groq') {
    console.log('[urlAnalysisPipeline] Groq APIモードで解析:', url);
    result = await analyzeUrlGroq(url, onProgress);
  } else if (provider === 'gemini') {
    console.log('[urlAnalysisPipeline] Gemini APIモードで解析:', url);
    result = await analyzeUrlGemini(url, onProgress);
  } else {
    // bedrock
    if (!isAwsConfigured()) {
      throw new Error(
        'AWS設定が未完了です。Cognito Identity Pool IDとLambda Function URLを設定してください',
      );
    }
    console.log('[urlAnalysisPipeline] Bedrock（Lambda）モードで解析:', url);
    result = await analyzeUrl(url);
  }

  return { ...result, sourceUrl: url };
}
