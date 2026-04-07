// ============================================================
// URL解析統合パイプライン
// LOCAL_AI_ENABLED = true  → llama.rn（デバイス内Gemma 4 on-device）
// LOCAL_AI_ENABLED = false → Bedrock（Claude 3 Haiku via Lambda）
// ============================================================

import { isAwsConfigured } from '../config/aws';
import { LOCAL_AI_ENABLED } from '../config/localAI';
import { analyzeUrl } from './bedrockAnalysisService';
import { analyzeUrlLocal } from './localAnalysisService';
import type { AnalysisResult } from '../types/analysis';

export type PipelineResult = AnalysisResult & { sourceUrl: string };

/**
 * URLを受け取り、設定に応じてローカルAIまたはBedrock経由でQ&A解析する。
 *
 * LOCAL_AI_ENABLED = true の場合:
 *   App → HTML取得 → Ollama（Gemma 4）→ JSON
 * LOCAL_AI_ENABLED = false の場合:
 *   App → Lambda → Bedrock（Claude 3 Haiku）→ JSON
 */
export async function analyzeUrlPipeline(url: string): Promise<PipelineResult> {
  try {
    let result: AnalysisResult;

    if (LOCAL_AI_ENABLED) {
      console.log('[urlAnalysisPipeline] ローカルAI（llama.rn + Gemma 4）モードで解析:', url);
      result = await analyzeUrlLocal(url);
    } else {
      if (!isAwsConfigured()) {
        throw new Error(
          'AWS設定が未完了です。Cognito Identity Pool IDとLambda Function URLを設定してください',
        );
      }
      console.log('[urlAnalysisPipeline] Bedrock（Lambda）モードで解析:', url);
      result = await analyzeUrl(url);
    }

    return { ...result, sourceUrl: url };
  } catch (err) {
    console.error('[urlAnalysisPipeline] 解析エラー:', err);
    const message = err instanceof Error ? err.message : 'AI解析に失敗しました';
    return {
      title: '',
      summary: message,
      qa_pairs: [],
      category: '',
      sourceUrl: url,
    };
  }
}
