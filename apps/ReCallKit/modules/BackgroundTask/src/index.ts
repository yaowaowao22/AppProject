import { Platform } from 'react-native';
import { requireNativeModule, EventEmitter } from 'expo-modules-core';

const NativeModule = Platform.OS === 'ios'
  ? (() => { try { return requireNativeModule('BackgroundTask'); } catch { return null; } })()
  : null;

type BackgroundTaskEvents = { onProcessingTaskFired: () => void };
const emitter = NativeModule ? new EventEmitter<BackgroundTaskEvents>(NativeModule) : null;

/**
 * iOS バックグラウンドタスクを開始する。
 * システムがアプリを一時停止しないよう実行時間を要求する（通常 30 秒程度）。
 * 時間切れになると expiration handler が発火し、BGProcessingTask を自動スケジュールする。
 * 戻り値のキーを endBackgroundTask に渡すこと。
 */
export async function beginBackgroundTask(name: string): Promise<string> {
  if (!NativeModule) return '';
  try {
    return await NativeModule.beginBackgroundTask(name);
  } catch {
    return '';
  }
}

/**
 * iOS バックグラウンドタスクを終了する。
 * 解析完了・エラー時の finally で必ず呼ぶこと。
 */
export function endBackgroundTask(key: string): void {
  if (!NativeModule || !key) return;
  try { NativeModule.endBackgroundTask(key); } catch { /* ignore */ }
}

/**
 * BGProcessingTask が完了したことを iOS に通知する。
 * onProcessingTaskFired リスナー内の処理が終わったら必ず呼ぶこと。
 * @param success 解析が成功したか
 */
export function completeProcessingTask(success: boolean): void {
  if (!NativeModule) return;
  try { NativeModule.completeProcessingTask(success); } catch { /* ignore */ }
}

/**
 * BGProcessingTask が発火したとき（iOS がバックグラウンド処理を許可したとき）に呼ばれる。
 * リスナー内で解析を再実行し、完了後に completeProcessingTask() を呼ぶこと。
 * 返り値は unsubscribe 関数。
 */
export function subscribeProcessingTaskFired(listener: () => void): () => void {
  if (!emitter) return () => {};
  const sub = emitter.addListener('onProcessingTaskFired', listener);
  return () => sub.remove();
}

/**
 * 残りバックグラウンド実行時間（秒）。ログ・デバッグ用。
 */
export function getBackgroundTimeRemaining(): number {
  if (!NativeModule) return Infinity;
  try { return NativeModule.backgroundTimeRemaining(); } catch { return Infinity; }
}
