// ============================================================
// AnalysisProfile — モデル・プロバイダーごとのチャンク/生成パラメータ
//
// ReCallKit の URL解析パイプラインは「プロンプト + 本文チャンク → LLM → JSON」
// の繰り返しで動くが、最適なチャンクサイズ・最大QA数・生成トークン上限は
// モデルの context ウィンドウと出力品質特性に依存する。
//
// このインターフェースをモデル定義 (modelCatalog / GROQ_MODELS) に埋め込み、
// 解析サービスが実行時にプロファイルを読んで挙動を切り替える。
// ============================================================

export interface AnalysisProfile {
  /** 本文チャンクの最大文字数。split時の区切り目安 */
  chunkSize: number;
  /** 1URLあたり生成するQ&Aペアの最大数。超えるとチャンク処理を打ち切る */
  maxQaTotal: number;
  /** 第1チャンク (メタ情報 + QA を含む) の max_tokens / n_predict */
  maxTokensFirst: number;
  /** 継続チャンク (QAのみ) の max_tokens / n_predict */
  maxTokensChunk: number;
}

/**
 * ローカル4k context モデル用のデフォルトプロファイル。
 * modelCatalog の各エントリで profile を指定しなかった場合のフォールバック。
 * (これまでの localAnalysisService の挙動と互換)
 */
export const DEFAULT_LOCAL_PROFILE: AnalysisProfile = {
  chunkSize: 1_500,
  maxQaTotal: 50,
  maxTokensFirst: 3_000,
  maxTokensChunk: 3_000,
};
