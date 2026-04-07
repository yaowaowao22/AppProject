// ============================================================
// ローカルAI解析サービス（llama.rn + Gemma 4 on-device）
//
// データフロー:
//   初回: HuggingFace → GGUF をデバイスに保存
//   毎回: fetch(URL) → HTML抽出 → llama.rn推論 → JSON解析
//
// マルチモデル対応:
//   MODEL_CATALOG から選択してインストール可能
//   アクティブモデルは localai/active_model.json に永続化
// ============================================================

import * as FileSystem from 'expo-file-system';
import { initLlama, LlamaContext } from 'llama.rn';

import {
  LOCAL_AI_TIMEOUT_MS,
  LOCAL_AI_MAX_TEXT_LENGTH,
} from '../config/localAI';
import {
  MODEL_CATALOG,
  DEFAULT_MODEL_ID,
  getModelById,
  type ModelDefinition,
} from '../config/modelCatalog';
import { fetchAndExtractText } from './htmlExtractorService';
import type { AnalysisResult } from '../types/analysis';

// ============================================================
// パス管理
// ============================================================

const MODEL_DIR = `${FileSystem.documentDirectory}localai/`;
const ACTIVE_MODEL_JSON = `${MODEL_DIR}active_model.json`;
const RESUME_DATA_PATH = `${MODEL_DIR}download_resume.json`;

function modelPath(filename: string): string {
  return `${MODEL_DIR}${filename}`;
}

// ============================================================
// グローバルダウンロード状態（全コンポーネントが購読可能）
// ============================================================

export interface ModelDownloadState {
  modelId: string;
  modelName: string;
  progress: number;      // 0.0 〜 1.0
  bytesWrittenMB: number;
  totalMB: number;
  isPaused: boolean;
  error: string | null;
}

type DownloadListener = (state: ModelDownloadState | null) => void;

let _downloadState: ModelDownloadState | null = null;
const _listeners = new Set<DownloadListener>();

function setDownloadState(state: ModelDownloadState | null): void {
  _downloadState = state;
  _listeners.forEach((l) => l(state));
}

/** ダウンロード状態を購読。返り値はunsubscribe関数 */
export function subscribeDownloadState(listener: DownloadListener): () => void {
  _listeners.add(listener);
  listener(_downloadState); // 即座に現在の状態を通知
  return () => _listeners.delete(listener);
}

/** 現在のダウンロード状態を同期的に取得 */
export function getDownloadState(): ModelDownloadState | null {
  return _downloadState;
}

// ============================================================
// アクティブモデル管理
// ============================================================

export async function getActiveModelId(): Promise<string> {
  try {
    const info = await FileSystem.getInfoAsync(ACTIVE_MODEL_JSON);
    if (!info.exists) return DEFAULT_MODEL_ID;
    const raw = await FileSystem.readAsStringAsync(ACTIVE_MODEL_JSON);
    const { modelId } = JSON.parse(raw) as { modelId: string };
    return getModelById(modelId) ? modelId : DEFAULT_MODEL_ID;
  } catch {
    return DEFAULT_MODEL_ID;
  }
}

async function persistActiveModel(modelId: string): Promise<void> {
  await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
  await FileSystem.writeAsStringAsync(ACTIVE_MODEL_JSON, JSON.stringify({ modelId }));
}

/** アクティブモデルを切り替える（ロード済みコンテキストを解放） */
export async function setActiveModelId(modelId: string): Promise<void> {
  await persistActiveModel(modelId);
  await releaseModel();
}

// ============================================================
// モデル状態確認 / 削除
// ============================================================

export async function isModelInstalled(modelId: string): Promise<boolean> {
  const model = getModelById(modelId);
  if (!model) return false;
  const info = await FileSystem.getInfoAsync(modelPath(model.filename));
  return info.exists;
}

/** 全モデルのインストール状態を一括取得 */
export async function getAllModelStatuses(): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  await Promise.all(
    MODEL_CATALOG.map(async (m) => {
      const info = await FileSystem.getInfoAsync(modelPath(m.filename));
      results[m.id] = info.exists;
    }),
  );
  return results;
}

export async function deleteModel(modelId: string): Promise<void> {
  const model = getModelById(modelId);
  if (!model) return;

  const activeId = await getActiveModelId();
  if (activeId === modelId) {
    await FileSystem.deleteAsync(ACTIVE_MODEL_JSON, { idempotent: true });
    await releaseModel();
  }
  await FileSystem.deleteAsync(modelPath(model.filename), { idempotent: true });
}

// ============================================================
// モデルインストール（ダウンロード）
// ============================================================

let activeDownload: FileSystem.DownloadResumable | null = null;

/** バックグラウンド移行時に呼ぶ。resumeData を保存して一時停止 */
export async function pauseDownload(): Promise<void> {
  if (!activeDownload) return;
  try {
    const state = await activeDownload.pauseAsync();
    if (state?.resumeData) {
      await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
      await FileSystem.writeAsStringAsync(RESUME_DATA_PATH, JSON.stringify(state));
    }
    if (_downloadState) {
      setDownloadState({ ..._downloadState, isPaused: true });
    }
  } catch {
    // 完了済みなど、失敗は無視
  }
  activeDownload = null;
}

/**
 * 指定モデルをインストール（ダウンロード）する。
 * 途中で pauseDownload() を呼ぶと一時停止、再度 installModel() で再開。
 */
export async function installModel(modelId: string): Promise<void> {
  const model = getModelById(modelId);
  if (!model) throw new Error(`モデル ${modelId} が見つかりません`);

  await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
  const destPath = modelPath(model.filename);
  const totalMB = Math.round(model.sizeBytesEstimate / 1_000_000);

  setDownloadState({
    modelId,
    modelName: model.name,
    progress: _downloadState?.modelId === modelId ? _downloadState.progress : 0,
    bytesWrittenMB: _downloadState?.modelId === modelId ? _downloadState.bytesWrittenMB : 0,
    totalMB,
    isPaused: false,
    error: null,
  });

  const onProgress = (dp: FileSystem.DownloadProgressData) => {
    const bytesWrittenMB = Math.round(dp.totalBytesWritten / 1_000_000);
    const total = dp.totalBytesExpectedToWrite > 0
      ? dp.totalBytesExpectedToWrite
      : model.sizeBytesEstimate;
    const progress = Math.min(dp.totalBytesWritten / total, 0.99);
    setDownloadState({
      modelId,
      modelName: model.name,
      progress,
      bytesWrittenMB,
      totalMB,
      isPaused: false,
      error: null,
    });
  };

  // 前回の中断データがあれば再開
  const resumeInfo = await FileSystem.getInfoAsync(RESUME_DATA_PATH);
  if (resumeInfo.exists) {
    try {
      const raw = await FileSystem.readAsStringAsync(RESUME_DATA_PATH);
      const saved = JSON.parse(raw) as FileSystem.DownloadPauseState;
      if (saved.url === model.url) {
        activeDownload = FileSystem.createDownloadResumable(
          saved.url, saved.fileUri, saved.options ?? {}, onProgress, saved.resumeData,
        );
        await FileSystem.deleteAsync(RESUME_DATA_PATH, { idempotent: true });
        const result = await activeDownload.resumeAsync();
        activeDownload = null;
        if (result?.uri) {
          await persistActiveModel(modelId);
          setDownloadState(null);
          return;
        }
      }
    } catch {
      await FileSystem.deleteAsync(RESUME_DATA_PATH, { idempotent: true });
    }
  }

  // 新規ダウンロード
  activeDownload = FileSystem.createDownloadResumable(model.url, destPath, {}, onProgress);
  try {
    const result = await activeDownload.downloadAsync();
    activeDownload = null;
    if (!result?.uri) throw new Error('ダウンロードに失敗しました');
    await persistActiveModel(modelId);
    setDownloadState(null);
  } catch (err) {
    activeDownload = null;
    // isPaused 中の中断はエラー扱いしない
    if (_downloadState && !_downloadState.isPaused) {
      setDownloadState({
        ..._downloadState,
        error: err instanceof Error ? err.message : 'ダウンロードに失敗しました',
      });
    }
    throw err;
  }
}

// ============================================================
// LlamaContext シングルトン管理
// ============================================================

let llamaContext: LlamaContext | null = null;
let isInitializing = false;
let loadedModelId: string | null = null;

async function getLlamaContext(): Promise<LlamaContext> {
  const activeModelId = await getActiveModelId();
  const model = getModelById(activeModelId);
  if (!model) throw new Error('アクティブなモデルが見つかりません');

  // 同じモデルがロード済みならそのまま返す
  if (llamaContext && loadedModelId === activeModelId) return llamaContext;

  // 別モデルがロード済みなら解放
  if (llamaContext) {
    await llamaContext.release();
    llamaContext = null;
    loadedModelId = null;
  }

  if (isInitializing) {
    await new Promise<void>((resolve) => {
      const timer = setInterval(() => {
        if (!isInitializing) { clearInterval(timer); resolve(); }
      }, 200);
    });
    if (llamaContext) return llamaContext;
  }

  const installed = await isModelInstalled(activeModelId);
  if (!installed) throw new Error('MODEL_NOT_DOWNLOADED');

  isInitializing = true;
  try {
    llamaContext = await initLlama({
      model: modelPath(model.filename),
      n_gpu_layers: model.nGpuLayers,
      n_ctx: model.nCtx,
    });
    loadedModelId = activeModelId;
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
    loadedModelId = null;
  }
}

// ============================================================
// 後方互換: isModelDownloaded / downloadModel
// URLImportListScreen から呼ばれる既存コード用
// ============================================================

export async function isModelDownloaded(): Promise<boolean> {
  const activeId = await getActiveModelId();
  return isModelInstalled(activeId);
}

export async function downloadModel(): Promise<void> {
  const activeId = await getActiveModelId();
  await installModel(activeId);
}

// ============================================================
// プロンプト生成（Gemma 4 ChatML フォーマット）
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
// JSON パース
// ============================================================

function parseAnalysisResult(raw: string): AnalysisResult {
  let text = raw.trim();
  if (text.startsWith('```')) {
    const lines = text.split('\n');
    const endIdx = lines.findLastIndex((l) => l.trim() === '```');
    text = lines.slice(1, endIdx > 0 ? endIdx : undefined).join('\n').trim();
  }
  try { return normalize(JSON.parse(text) as Partial<AnalysisResult>); } catch { /* fall */ }
  const match = /\{[\s\S]*\}/.exec(text);
  if (match) {
    try { return normalize(JSON.parse(match[0]) as Partial<AnalysisResult>); } catch { /* fall */ }
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
// Public API: URL解析
// ============================================================

export async function analyzeUrlLocal(url: string): Promise<AnalysisResult> {
  const text = await fetchAndExtractText(url);

  let context: LlamaContext;
  try {
    context = await getLlamaContext();
  } catch (err) {
    if (err instanceof Error && err.message === 'MODEL_NOT_DOWNLOADED') {
      throw new Error('AIモデルが未インストールです。設定 → AIモデル からインストールしてください');
    }
    throw err;
  }

  const prompt = buildPrompt(url, text);
  let aborted = false;
  const timeoutId = setTimeout(() => { aborted = true; }, LOCAL_AI_TIMEOUT_MS);

  let resultText: string;
  try {
    const completion = await context.completion(
      { prompt, n_predict: 2048, temperature: 0, stop: ['<end_of_turn>', '<eos>', '</s>'] },
      (_token: string) => !aborted,
    );
    if (aborted) throw new Error('AI解析がタイムアウトしました（3分）');
    resultText = completion.text;
  } finally {
    clearTimeout(timeoutId);
  }

  return parseAnalysisResult(resultText);
}
