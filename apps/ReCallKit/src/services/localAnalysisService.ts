// ============================================================
// ローカルAI解析サービス（llama.rn + Gemma 4 on-device）
//
// データフロー:
//   初回: HuggingFace → ~2.3GB GGUF をデバイスに保存
//   毎回: fetch(URL) → HTML抽出 → llama.rn推論 → JSON解析
//
// 必要条件:
//   - EAS Build（llama.rn はネイティブモジュール）
//   - iPhone 15 Pro / 16 系推奨（8GB RAM）
// ============================================================

import * as FileSystem from 'expo-file-system';
import { initLlama, LlamaContext } from 'llama.rn';

import {
  LOCAL_AI_MODEL_URL,
  LOCAL_AI_MODEL_FILENAME,
  LOCAL_AI_TIMEOUT_MS,
  LOCAL_AI_N_CTX,
  LOCAL_AI_N_GPU_LAYERS,
  LOCAL_AI_MAX_TEXT_LENGTH,
} from '../config/localAI';
import { fetchAndExtractText } from './htmlExtractorService';
import type { AnalysisResult } from '../types/analysis';

// ============================================================
// モデルパス管理
// ============================================================

const MODEL_DIR = `${FileSystem.documentDirectory}localai/`;
const MODEL_PATH = `${MODEL_DIR}${LOCAL_AI_MODEL_FILENAME}`;

/** progress: 0.0〜1.0、bytesWrittenMB: 実際に書き込んだMB数 */
export type DownloadProgressCallback = (progress: number, bytesWrittenMB: number) => void;

// HuggingFace は Content-Length を返さないことがある。その場合の推定サイズ（~2.35GB）
const ESTIMATED_MODEL_BYTES = 2_468_000_000;

/** モデルファイルがデバイスに存在するか確認する */
export async function isModelDownloaded(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(MODEL_PATH);
  return info.exists;
}

/**
 * モデルをHuggingFaceからダウンロードする（初回のみ、約2.3GB）。
 * @param onProgress 進捗コールバック（progress: 0〜1、bytesWrittenMB: 書き込み済みMB）
 */
export async function downloadModel(
  onProgress?: DownloadProgressCallback,
): Promise<void> {
  await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });

  const downloadResumable = FileSystem.createDownloadResumable(
    LOCAL_AI_MODEL_URL,
    MODEL_PATH,
    {},
    (dp) => {
      const bytesWrittenMB = Math.round(dp.totalBytesWritten / 1_000_000);
      // totalBytesExpectedToWrite が 0（Content-Length なし）の場合は推定サイズで計算
      const total =
        dp.totalBytesExpectedToWrite > 0
          ? dp.totalBytesExpectedToWrite
          : ESTIMATED_MODEL_BYTES;
      const p = Math.min(dp.totalBytesWritten / total, 0.99);
      onProgress?.(p, bytesWrittenMB);
    },
  );

  const result = await downloadResumable.downloadAsync();
  if (!result?.uri) {
    throw new Error('モデルのダウンロードに失敗しました');
  }
}

// ============================================================
// LlamaContext シングルトン管理
// ============================================================

let llamaContext: LlamaContext | null = null;
let isInitializing = false;

async function getLlamaContext(): Promise<LlamaContext> {
  if (llamaContext) return llamaContext;

  if (isInitializing) {
    // 別の呼び出しが初期化中なら完了まで待機
    await new Promise<void>((resolve) => {
      const timer = setInterval(() => {
        if (!isInitializing) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
    if (llamaContext) return llamaContext;
  }

  const downloaded = await isModelDownloaded();
  if (!downloaded) {
    throw new Error('MODEL_NOT_DOWNLOADED');
  }

  isInitializing = true;
  try {
    llamaContext = await initLlama({
      model: MODEL_PATH,
      n_gpu_layers: LOCAL_AI_N_GPU_LAYERS, // 99 = 全レイヤーをMetal GPUに載せる
      n_ctx: LOCAL_AI_N_CTX,
    });
    return llamaContext;
  } finally {
    isInitializing = false;
  }
}

/** ロード済みコンテキストを解放する（バックグラウンド移行時などに呼ぶ） */
export async function releaseModel(): Promise<void> {
  if (llamaContext) {
    await llamaContext.release();
    llamaContext = null;
  }
}

// ============================================================
// プロンプト生成（Lambda の build_prompt() と同等）
// Gemma 4 の ChatML フォーマット（<start_of_turn>）を使用
// ============================================================

function buildPrompt(url: string, text: string): string {
  const truncated =
    text.length > LOCAL_AI_MAX_TEXT_LENGTH
      ? `${text.slice(0, 6000)}\n...[中略]...\n${text.slice(-6000)}`
      : text;

  return `<start_of_turn>user
以下はWebページの本文テキストです。
このページの内容を分析し、学習カード用のデータをJSON形式で生成してください。

【出力形式】
JSONオブジェクトのみを出力してください（説明文・マークダウン不要）:
{
  "title": "ページタイトル（30文字以内）",
  "summary": "1〜2行の要約（内容を端的に説明）",
  "qa_pairs": [
    {"question": "問い（?で終わる）", "answer": "答え（3文以内）"}
  ],
  "category": "技術 or ビジネス or 科学 or 語学 or 一般教養 or その他"
}

【Q&Aペアの要件】
- 短い記事: 10〜15個、中程度の記事: 15〜25個、長い記事: 25〜40個
- ページの全セクション・全トピックを網羅すること
- 1問1答で簡潔に（Aは3文以内）
- 日本語で生成すること

URL: ${url}
本文:
${truncated}
<end_of_turn>
<start_of_turn>model
`;
}

// ============================================================
// JSON パース（2段階: 直接 → 正規表現抽出）
// ============================================================

function parseAnalysisResult(raw: string): AnalysisResult {
  let text = raw.trim();

  // ```json ... ``` ブロックを除去
  if (text.startsWith('```')) {
    const lines = text.split('\n');
    const endIdx = lines.findLastIndex((l) => l.trim() === '```');
    text = lines.slice(1, endIdx > 0 ? endIdx : undefined).join('\n').trim();
  }

  // 1. そのままパース
  try {
    return normalize(JSON.parse(text) as Partial<AnalysisResult>);
  } catch {
    // fall through
  }

  // 2. 最初の {...} を正規表現で抽出
  const match = /\{[\s\S]*\}/.exec(text);
  if (match) {
    try {
      return normalize(JSON.parse(match[0]) as Partial<AnalysisResult>);
    } catch {
      // fall through
    }
  }

  throw new Error('AIの出力をJSONとして解析できませんでした。再試行してください');
}

function normalize(parsed: Partial<AnalysisResult>): AnalysisResult {
  return {
    title: parsed.title ?? '無題',
    summary: parsed.summary ?? '',
    qa_pairs: Array.isArray(parsed.qa_pairs) ? parsed.qa_pairs : [],
    category: parsed.category ?? 'その他',
  };
}

// ============================================================
// Public API: URL解析（bedrockAnalysisService.analyzeUrl と同一シグネチャ）
// ============================================================

/**
 * URLを解析してAnalysisResultを返す。
 * モデル未ダウンロードの場合は専用エラーをスロー（呼び出し元でダウンロードUIを表示）。
 */
export async function analyzeUrlLocal(url: string): Promise<AnalysisResult> {
  // 1. HTML取得・テキスト抽出
  const text = await fetchAndExtractText(url);

  // 2. モデルロード（初回ロードは数秒かかる）
  let context: LlamaContext;
  try {
    context = await getLlamaContext();
  } catch (err) {
    if (err instanceof Error && err.message === 'MODEL_NOT_DOWNLOADED') {
      throw new Error(
        'AIモデルが未ダウンロードです。設定画面からダウンロードしてください（約2.3GB）',
      );
    }
    throw err;
  }

  // 3. 推論（タイムアウト付き）
  const prompt = buildPrompt(url, text);
  let aborted = false;
  const timeoutId = setTimeout(() => {
    aborted = true;
  }, LOCAL_AI_TIMEOUT_MS);

  let resultText: string;
  try {
    const completion = await context.completion(
      {
        prompt,
        n_predict: 2048,
        temperature: 0,
        stop: ['<end_of_turn>', '<eos>', '</s>'],
      },
      (_token: string) => !aborted, // false を返すと生成を中断
    );
    if (aborted) {
      throw new Error('AI解析がタイムアウトしました（3分）');
    }
    resultText = completion.text;
  } finally {
    clearTimeout(timeoutId);
  }

  // 4. JSONパース
  return parseAnalysisResult(resultText);
}
