// ============================================================
// URL解析統合パイプライン
// extractBodyText → analyzeUrl を1呼び出しで完結させる
// ============================================================

import { isAwsConfigured } from '../config/aws';
import { extractBodyText } from './urlMetadataService';
import { analyzeUrl } from './bedrockAnalysisService';
import type { AnalysisResult } from '../types/analysis';

export type PipelineResult = AnalysisResult & { sourceUrl: string };

/**
 * URLを受け取り、本文抽出 → Bedrock AI解析 → 結果返却を一括で行う。
 *
 * エラー時は日本語のユーザー向けメッセージでスローする:
 * - AWS未設定: "AWS設定が未完了です…"
 * - HTML取得失敗: "ページの読み込みに失敗しました"
 * - AI解析失敗: bedrockAnalysisService のメッセージをそのまま再スロー
 */
export async function analyzeUrlPipeline(url: string): Promise<PipelineResult> {
  // AWSの設定値がプレースホルダのままの場合は早期終了
  if (!isAwsConfigured()) {
    throw new Error(
      'AWS設定が未完了です。Cognito Identity Pool IDとLambda Function URLを設定してください',
    );
  }

  // Step 1: HTMLの取得と本文抽出
  let text: string;
  try {
    const extracted = await extractBodyText(url);
    text = extracted.text;
  } catch {
    throw new Error('ページの読み込みに失敗しました');
  }

  // Step 2: Bedrock AI解析（タイムアウト・認証エラーは bedrockAnalysisService 側のメッセージを維持）
  const result = await analyzeUrl(url, text);

  return { ...result, sourceUrl: url };
}
