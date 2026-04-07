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

import * as FileSystem from 'expo-file-system/legacy';
import type { DownloadProgressData, DownloadPauseState } from 'expo-file-system/legacy';
import { AppState } from 'react-native';
import type { TokenData, LlamaContext } from 'llama.rn';

import { LOCAL_AI_TIMEOUT_MS } from '../config/localAI';
import {
  MODEL_CATALOG,
  DEFAULT_MODEL_ID,
  getModelById,
  type ModelDefinition,
} from '../config/modelCatalog';
import { fetchAndExtractText } from './htmlExtractorService';
import type { AnalysisResult, QAPair } from '../types/analysis';

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

  const totalMB = Math.round(model.sizeBytesEstimate / 1_000_000);

  // UI更新を先に行い、以降の失敗は必ずerrorとして表示できるようにする
  setDownloadState({
    modelId,
    modelName: model.name,
    progress: _downloadState?.modelId === modelId ? (_downloadState.progress ?? 0) : 0,
    bytesWrittenMB: _downloadState?.modelId === modelId ? (_downloadState.bytesWrittenMB ?? 0) : 0,
    totalMB,
    isPaused: false,
    error: null,
  });

  try {
    await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
  } catch (err) {
    setDownloadState({ ...(_downloadState ?? { modelId, modelName: model.name, progress: 0, bytesWrittenMB: 0, totalMB, isPaused: false }), error: 'ディレクトリ作成に失敗しました' });
    throw err;
  }

  const destPath = modelPath(model.filename);

  const onProgress = (dp: DownloadProgressData) => {
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
      const saved = JSON.parse(raw) as DownloadPauseState;
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

// iOSメモリ警告時にコンテキストを解放してOSによるアプリ強制終了を防ぐ
// AppStateがbackground/inactiveになった際の解放はアプリ側で別途呼ばれる想定
AppState.addEventListener('memoryWarning' as never, () => {
  if (llamaContext) {
    console.warn('[localAnalysis] メモリ警告受信 → コンテキストを解放します');
    llamaContext.release().catch(() => {});
    llamaContext = null;
    loadedModelId = null;
  }
});

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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { initLlama } = require('llama.rn') as typeof import('llama.rn');

    // GPU全乗せで試み、VRAMが足りなければCPU推論にフォールバック
    // （遅くなるがクラッシュしない）
    const fallbackSteps: Array<{ n_gpu_layers: number; n_ctx: number }> = [
      { n_gpu_layers: model.nGpuLayers, n_ctx: model.nCtx },
      { n_gpu_layers: 0,                n_ctx: model.nCtx },
    ];

    let lastError: unknown;
    for (const params of fallbackSteps) {
      try {
        console.log(`[localAnalysis] initLlama: n_gpu_layers=${params.n_gpu_layers} n_ctx=${params.n_ctx}`);
        llamaContext = await initLlama({
          model: modelPath(model.filename),
          n_gpu_layers: params.n_gpu_layers,
          n_ctx: params.n_ctx,
        });
        loadedModelId = activeModelId;
        return llamaContext;
      } catch (err) {
        console.warn(`[localAnalysis] initLlama失敗 (n_gpu_layers=${params.n_gpu_layers}):`, err);
        lastError = err;
        llamaContext = null;
      }
    }

    throw lastError;
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
// テキスト分割（nCtx=4096 対応）
// ============================================================

/** チャンクあたりの文字数。プロンプト指示 + テキスト + 出力が 4096 トークン内に収まるよう設定 */
const CHUNK_SIZE = 1_500;

/**
 * 自然な区切りが見つからないときのフォールバック重複文字数。
 * 自然な区切り（。？！\n）で分割できた場合は重複ゼロ。
 */
const CHUNK_OVERLAP_FALLBACK = 50;

/**
 * 段落・文末で分割するパラグラフアウェアチャンキング。
 *
 * 戦略:
 *   1. チャンク末尾 35% の範囲で日本語・英語の文末（。？！\n . ! ?）を後ろから探す
 *   2. 見つかった場合 → その位置で分割し、オーバーラップなし（重複ゼロ）
 *   3. 見つからない場合 → hardEnd で分割し、CHUNK_OVERLAP_FALLBACK 文字だけ重複
 *
 * 効果:
 *   - 文中断ちきれ削減 → LLM が断片を補完する無駄トークンを削減
 *   - オーバーラップ 200 → 0〜50 に削減 → チャンク数・入力トークン削減
 */
function splitTextIntoChunks(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text];

  const chunks: string[] = [];
  let pos = 0;

  while (pos < text.length) {
    const hardEnd = Math.min(pos + CHUNK_SIZE, text.length);

    if (hardEnd === text.length) {
      chunks.push(text.slice(pos));
      break;
    }

    // チャンク末尾 35% の範囲で自然な区切りを後ろから探す
    const searchStart = pos + Math.floor(CHUNK_SIZE * 0.65);
    let naturalEnd = -1;

    for (let i = hardEnd - 1; i >= searchStart; i--) {
      const ch = text[i];
      // 日本語文末
      if (ch === '。' || ch === '？' || ch === '！' || ch === '\n') {
        naturalEnd = i + 1;
        break;
      }
      // 英語文末（次の文字が空白か行末）
      if (ch === '.' || ch === '!' || ch === '?') {
        const next = text[i + 1];
        if (!next || next === ' ' || next === '\n') {
          naturalEnd = i + 1;
          break;
        }
      }
    }

    if (naturalEnd > 0) {
      // 自然な区切り → オーバーラップ不要
      chunks.push(text.slice(pos, naturalEnd));
      pos = naturalEnd;
    } else {
      // フォールバック → 小さいオーバーラップ
      chunks.push(text.slice(pos, hardEnd));
      pos = hardEnd - CHUNK_OVERLAP_FALLBACK;
    }
  }

  return chunks;
}

// ============================================================
// セッションキャッシュ（同一URLの二重推論を防ぐ）
// ============================================================

/**
 * セッション中にすでに解析済みのURLをキャッシュ（最大10件）。
 * 再試行・同一URLの複数登録で推論コストをゼロにする。
 */
const _sessionCache = new Map<string, AnalysisResult>();
const SESSION_CACHE_MAX = 10;

function getCachedResult(url: string): AnalysisResult | null {
  return _sessionCache.get(url) ?? null;
}

function setCachedResult(url: string, result: AnalysisResult): void {
  if (_sessionCache.size >= SESSION_CACHE_MAX) {
    // 最も古いエントリを削除
    const firstKey = _sessionCache.keys().next().value;
    if (firstKey !== undefined) _sessionCache.delete(firstKey);
  }
  _sessionCache.set(url, result);
}

/** テスト用：キャッシュをクリアする */
export function clearAnalysisCache(): void {
  _sessionCache.clear();
}

// ============================================================
// プロンプト生成（Gemma 4 ChatML フォーマット）
// ============================================================

/** 第1チャンク: title / summary / category / tags + Q&A を生成 */
function buildFirstChunkPrompt(url: string, text: string, totalChunks: number): string {
  const chunkNote = totalChunks > 1 ? `（第1部 / 全${totalChunks}部）` : '';
  return `<start_of_turn>user
以下はWebページの本文テキスト${chunkNote}です。
このページの内容を分析し、学習カード用のデータをJSON形式で生成してください。

【出力形式】
JSONオブジェクトのみを出力してください（説明文・マークダウン不要）:
{
  "title": "ページタイトル（30文字以内）",
  "summary": "2〜3行の要約（主要ポイントを網羅）",
  "qa_pairs": [
    {"question": "問い（?で終わる）", "answer": "答え（3文以内）"}
  ],
  "category": "技術 or ビジネス or 科学 or 語学 or 一般教養 or その他",
  "tags": [
    {"name": "タグ名（10文字以内）", "description": "このタグが何を意味するか1文で説明"}
  ]
}

【Q&Aペアの要件】
- このセクションの重要な概念・事実・手順から10〜15個のQ&Aを生成すること
- 1問1答で簡潔に（答えは1文・句点ひとつで終わること）
- 日本語で生成すること

【タグの要件】
- 2〜5個のタグを生成すること
- ページの主要トピック・技術・概念を具体的に表すキーワード
- 各タグに1文（30文字以内）の説明を付けること

【カテゴリ判定基準】
- 技術: プログラミング、AI/ML、クラウド、ソフトウェア開発、エンジニアリング
- ビジネス: 経営、マーケティング、起業、投資、マネジメント
- 科学: 自然科学、医学、物理、化学、生物
- 語学: 英語学習、翻訳、言語習得、外国語
- 一般教養: 歴史、哲学、文化、社会、教育
- その他: 上記に当てはまらない場合

URL: ${url}
本文:
${text}
<end_of_turn>
<start_of_turn>model
`;
}

/** 第2チャンク以降: Q&Aペアのみを追加生成 */
function buildChunkPrompt(url: string, text: string, chunkIndex: number, totalChunks: number): string {
  return `<start_of_turn>user
以下はWebページの本文テキスト（第${chunkIndex + 1}部 / 全${totalChunks}部）の続きです。
このセクションの内容から学習カード用のQ&AペアをJSONで生成してください。

【出力形式】
JSONオブジェクトのみ（説明文・マークダウン不要）:
{
  "qa_pairs": [
    {"question": "問い（?で終わる）", "answer": "答え（3文以内）"}
  ]
}

【Q&Aペアの要件】
- このセクションの重要な概念・事実・手順から10〜15個のQ&Aを生成すること
- 1問1答で簡潔に（答えは1文・句点ひとつで終わること）
- 日本語で生成すること

URL: ${url}
本文:
${text}
<end_of_turn>
<start_of_turn>model
`;
}

// ============================================================
// JSON パース
// ============================================================

/**
 * JSON が途中で切れていても完結しているペアだけを抽出するフォールバック。
 * "question": "..." , "answer": "..." の組をすべて拾う。
 */
function extractQaPairsFromRaw(text: string): QAPair[] {
  const pairs: QAPair[] = [];
  const pattern = /"question"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"answer"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    pairs.push({
      question: m[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
      answer:   m[2].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
    });
  }
  return pairs;
}

function stripCodeBlock(raw: string): string {
  const text = raw.trim();
  if (!text.startsWith('```')) return text;
  const lines = text.split('\n');
  const endIdx = lines.findLastIndex((l) => l.trim() === '```');
  return lines.slice(1, endIdx > 0 ? endIdx : undefined).join('\n').trim();
}

function parseAnalysisResult(raw: string): AnalysisResult {
  const text = stripCodeBlock(raw);

  // 1. 直接パース
  try { return normalize(JSON.parse(text) as Partial<AnalysisResult>); } catch { /* fall */ }

  // 2. JSON ブロック抽出してパース
  const match = /\{[\s\S]*\}/.exec(text);
  if (match) {
    try { return normalize(JSON.parse(match[0]) as Partial<AnalysisResult>); } catch { /* fall */ }
  }

  // 3. JSON が途中で切れた場合 → ペアだけ回収して最低限の結果を返す
  const qa_pairs = extractQaPairsFromRaw(text);
  if (qa_pairs.length > 0) {
    console.warn('[localAnalysis] JSONパース失敗。ペア個別抽出にフォールバック:', qa_pairs.length, '件');
    return normalize({ qa_pairs });
  }

  throw new Error('AIの出力をJSONとして解析できませんでした。再試行してください');
}

/** チャンクの Q&A のみパース。失敗時は空配列を返して処理を継続する */
function parseChunkQaPairs(raw: string): QAPair[] {
  const text = stripCodeBlock(raw);
  const tryParse = (s: string): QAPair[] | null => {
    try {
      const parsed = JSON.parse(s) as { qa_pairs?: QAPair[] };
      return Array.isArray(parsed.qa_pairs) ? parsed.qa_pairs : null;
    } catch { return null; }
  };
  return (
    tryParse(text) ??
    tryParse(/\{[\s\S]*\}/.exec(text)?.[0] ?? '') ??
    extractQaPairsFromRaw(text)  // JSON切れでも完結したペアを回収
  );
}

function normalize(parsed: Partial<AnalysisResult>): AnalysisResult {
  return {
    title: parsed.title ?? '無題',
    summary: parsed.summary ?? '',
    qa_pairs: Array.isArray(parsed.qa_pairs) ? parsed.qa_pairs : [],
    category: parsed.category ?? 'その他',
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
  };
}

// ============================================================
// LLM推論ヘルパー（タイムアウト付き）
// ============================================================

/**
 * n_ctx=4096、入力プロンプト ~700トークンの場合、出力上限は ~3300トークン。
 * モデルは <end_of_turn> で自然に止まるため n_predict を大きく設定してもコストゼロ。
 * JSON が途中で切れないよう n_ctx の実質上限に合わせる。
 */
const N_PREDICT_FIRST        = 3000;
const N_PREDICT_CONTINUATION = 3000;

/** 1URL あたりの Q&A 上限。超えたらチャンク処理を打ち切る */
const MAX_QA_TOTAL = 50;

async function runCompletion(
  context: LlamaContext,
  prompt: string,
  nPredict: number = N_PREDICT_FIRST,
): Promise<string> {
  let aborted = false;
  const timeoutId = setTimeout(() => {
    aborted = true;
    context.stopCompletion().catch(() => {});
  }, LOCAL_AI_TIMEOUT_MS);

  try {
    const completion = await context.completion(
      {
        prompt,
        n_predict: nPredict,
        temperature: 0,
        stop: ['<end_of_turn>', '<eos>', '</s>'],
      },
      (_data: TokenData) => {},
    );
    if (aborted) throw new Error('AI解析がタイムアウトしました（3分）');
    return completion.text;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================
// Public API: URL解析（チャンク分割・複数回推論）
// ============================================================

/**
 * URLのテキストを段落境界で分割し、チャンクごとに推論を実行して Q&A を蓄積する。
 *
 * 最適化ポイント:
 *   - セッションキャッシュ: 同一URLは推論をスキップしてキャッシュ結果を返す
 *   - パラグラフアウェアチャンキング: 自然な区切りで分割してオーバーラップを最小化
 *   - 継続チャンクの n_predict 削減: 2048 → 1536（Q&Aのみ生成のため）
 *
 * @param onProgress 進捗コールバック（省略可）
 *   - currentChunk: 処理中チャンク番号（0始まり）
 *   - totalChunks:  全チャンク数
 */
export async function analyzeUrlLocal(
  url: string,
  onProgress?: (currentChunk: number, totalChunks: number) => void,
): Promise<AnalysisResult> {
  // ---- セッションキャッシュチェック ----
  const cached = getCachedResult(url);
  if (cached) {
    console.log('[localAnalysis] キャッシュヒット（推論スキップ）:', url);
    return cached;
  }

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

  const chunks = splitTextIntoChunks(text);
  console.log(
    `[localAnalysis] ${chunks.length}チャンク / ${text.length}文字 / URL: ${url}`,
  );

  // ---- 第1チャンク: title / summary / category / tags + Q&A ----
  onProgress?.(0, chunks.length);
  const firstRaw = await runCompletion(
    context,
    buildFirstChunkPrompt(url, chunks[0], chunks.length),
    N_PREDICT_FIRST,
  );
  const baseResult = parseAnalysisResult(firstRaw);

  let finalResult: AnalysisResult;

  if (chunks.length === 1) {
    finalResult = baseResult;
  } else {
    // ---- 第2チャンク以降: Q&A のみ追加生成（n_predict 削減） ----
    const allQaPairs: QAPair[] = [...baseResult.qa_pairs];

    for (let i = 1; i < chunks.length; i++) {
      if (allQaPairs.length >= MAX_QA_TOTAL) break;
      onProgress?.(i, chunks.length);
      const chunkRaw = await runCompletion(
        context,
        buildChunkPrompt(url, chunks[i], i, chunks.length),
        N_PREDICT_CONTINUATION,
      );
      allQaPairs.push(...parseChunkQaPairs(chunkRaw));
    }

    finalResult = { ...baseResult, qa_pairs: allQaPairs };
  }

  // ---- セッションキャッシュに保存 ----
  setCachedResult(url, finalResult);

  return finalResult;
}
