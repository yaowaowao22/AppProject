// ============================================================
// deepDiveService - ローカルLLM深掘りバックグラウンドキュー
//
// アーキテクチャ:
//   1. enqueue() でDBキューに追加 → リスナーに即通知
//   2. processQueue() がシングルトンループで1件ずつ処理
//   3. LLM推論完了 → DB保存 → リスナーに通知
//   4. どの画面でも subscribe() で状態変化を購読可能
// ============================================================

import type { SQLiteDatabase } from 'expo-sqlite';
import {
  createDeepDive,
  getNextQueued,
  updateDeepDiveStatus,
} from '../db/deepDiveRepository';
import { runLocalCompletion } from './localAnalysisService';

// ============================================================
// リスナー管理（全画面から購読可能）
// ============================================================

type DeepDiveListener = () => void;
const _listeners = new Set<DeepDiveListener>();

/** 深掘り状態変更を購読。返り値は unsubscribe 関数 */
export function subscribeDeepDive(listener: DeepDiveListener): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

function notifyListeners(): void {
  _listeners.forEach((l) => l());
}

// ============================================================
// キュー処理ステート（シングルトン）
// ============================================================

let _processing = false;
let _dbRef: SQLiteDatabase | null = null;

/**
 * 深掘りリクエストをキューに追加し、バックグラウンド処理を開始する。
 * 即座にリターンし、UIをブロックしない。
 */
export async function enqueueDeepDive(
  db: SQLiteDatabase,
  itemId: number,
  question: string,
  answer: string,
): Promise<number> {
  const id = await createDeepDive(db, itemId, question, answer);
  notifyListeners();
  _dbRef = db;
  startProcessing(db);
  return id;
}

/**
 * キュー処理を開始（既に処理中なら何もしない）
 */
function startProcessing(db: SQLiteDatabase): void {
  if (_processing) return;
  _processing = true;
  processLoop(db).finally(() => {
    _processing = false;
  });
}

async function processLoop(db: SQLiteDatabase): Promise<void> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const job = await getNextQueued(db);
    if (!job) break;

    try {
      await updateDeepDiveStatus(db, job.id, 'processing');
      notifyListeners();

      const prompt = buildDeepDivePrompt(job.question, job.answer);
      const result = await runLocalCompletion(prompt, 3000);

      await updateDeepDiveStatus(db, job.id, 'done', result);
      notifyListeners();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '不明なエラー';
      console.error('[deepDiveService] 処理失敗:', msg);
      await updateDeepDiveStatus(db, job.id, 'failed', null, msg);
      notifyListeners();
    }
  }
}

function buildDeepDivePrompt(question: string, answer: string): string {
  return `<start_of_turn>user
以下の学習カード（Q&A）について、より深く理解できるよう詳細に解説してください。

【問題】
${question}

【回答】
${answer}

---
以下の構成で日本語で解説してください（合計1500〜2000字程度）:

## 背景・なぜそうなるのか
この概念・事実が成り立つ根拠や原理を丁寧に説明してください。

## 関連する重要な概念
この知識を正しく理解するために必要な周辺知識・前提知識を説明してください。

## 具体例・応用
現実世界での具体例、コード例、たとえ話などを使って理解を深めてください。

## よくある誤解・注意点
学習者がはまりやすい誤解や、間違えやすいポイントを挙げてください。

## まとめ
要点を3〜5行でまとめてください。

各セクションは必ず書いてください。<end_of_turn>
<start_of_turn>model
`;
}
