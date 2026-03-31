// ============================================================
// URL解析統合パイプライン
// extractBodyText → analyzeUrl を1呼び出しで完結させる
// ============================================================

import { isAwsConfigured } from '../config/aws';
import { analyzeUrl } from './bedrockAnalysisService';
import type { AnalysisResult } from '../types/analysis';

export type PipelineResult = AnalysisResult & { sourceUrl: string };

/**
 * URLを受け取り、Lambda経由でページ取得・AI解析・結果返却を一括で行う。
 * HTML取得はLambda側で実行するためCORS・Botブロックの影響を受けない。
 */
export async function analyzeUrlPipeline(url: string): Promise<PipelineResult> {
  if (!isAwsConfigured()) {
    throw new Error(
      'AWS設定が未完了です。Cognito Identity Pool IDとLambda Function URLを設定してください',
    );
  }

  const result = await analyzeUrl(url);
  return { ...result, sourceUrl: url };
}
