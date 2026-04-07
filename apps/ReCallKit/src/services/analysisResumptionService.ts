// ============================================================
// 解析レジューム（途中保存・再開）サービス
//
// クラッシュ / バックグラウンド強制終了後に、処理済みチャンクの
// Q&A ペアと基本情報を保存して途中から再開するための永続化レイヤー。
//
// 保存先: <documentDirectory>/localai/resume_<urlHash>.json
// ============================================================

import * as FileSystem from 'expo-file-system/legacy';
import type { QAPair } from '../types/analysis';

const RESUME_DIR = `${FileSystem.documentDirectory}localai/`;

/** 2時間以上経過したレジューム状態は陳腐化とみなして破棄 */
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

export interface ResumableBaseResult {
  title: string;
  summary: string;
  category: string;
  tags: { name: string; description: string }[];
}

export interface AnalysisResumptionState {
  version: 1;
  url: string;
  jobId: number;
  savedAt: number;          // Date.now()
  text: string;             // フェッチ済みテキスト全文
  chunks: string[];         // 分割済みチャンク配列
  processedCount: number;   // 完了済みチャンク数（次はこのインデックスから再開）
  baseResult: ResumableBaseResult; // 第1チャンクから得たメタ情報
  accumulatedQaPairs: QAPair[];    // これまでに蓄積したQ&Aペア
}

// ---- ユーティリティ ----

/** URL を 36進数ハッシュにしてファイル名に使う */
function urlHash(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = (Math.imul(31, h) + url.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function resumeFilePath(url: string): string {
  return `${RESUME_DIR}resume_${urlHash(url)}.json`;
}

// ---- Public API ----

/** チャンク完了後にレジューム状態を保存する */
export async function saveResumptionState(state: AnalysisResumptionState): Promise<void> {
  try {
    await FileSystem.makeDirectoryAsync(RESUME_DIR, { intermediates: true });
    await FileSystem.writeAsStringAsync(resumeFilePath(state.url), JSON.stringify(state));
    console.log(
      `[resumption] 保存: チャンク ${state.processedCount}/${state.chunks.length}`,
      `Q&A ${state.accumulatedQaPairs.length}件`,
    );
  } catch (err) {
    console.warn('[resumption] 保存失敗（無視）:', err);
  }
}

/**
 * 指定 URL のレジューム状態を読み込む。
 * 存在しない・古すぎる・形式不正の場合は null を返す。
 */
export async function loadResumptionState(url: string): Promise<AnalysisResumptionState | null> {
  const path = resumeFilePath(url);
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;

    const raw = await FileSystem.readAsStringAsync(path);
    const state = JSON.parse(raw) as AnalysisResumptionState;

    if (state.version !== 1) {
      await clearResumptionState(url);
      return null;
    }
    if (Date.now() - state.savedAt > MAX_AGE_MS) {
      console.log('[resumption] レジューム状態が古すぎるため破棄します');
      await clearResumptionState(url);
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

/** 解析完了・不要になったレジューム状態を削除する */
export async function clearResumptionState(url: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(resumeFilePath(url), { idempotent: true });
  } catch { /* ignore */ }
}

/** 指定 URL のレジューム状態が存在するか確認する */
export async function hasResumptionState(url: string): Promise<boolean> {
  const state = await loadResumptionState(url);
  return state !== null;
}
