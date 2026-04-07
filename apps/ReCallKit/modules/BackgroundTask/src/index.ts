import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

const NativeModule = Platform.OS === 'ios'
  ? (() => { try { return requireNativeModule('BackgroundTask'); } catch { return null; } })()
  : null;

/**
 * iOS バックグラウンドタスクを開始する。
 * システムがアプリを一時停止しないよう時間を要求する（通常 30 秒程度）。
 * 戻り値のキーを endBackgroundTask に渡すこと。
 * iOS 以外・取得失敗時は空文字列を返す。
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
  try {
    NativeModule.endBackgroundTask(key);
  } catch { /* ignore */ }
}

/**
 * 残りバックグラウンド実行時間（秒）を返す。ログ・デバッグ用。
 * フォアグラウンド時は DBL_MAX に近い大きな値が返る。
 */
export function getBackgroundTimeRemaining(): number {
  if (!NativeModule) return Infinity;
  try {
    return NativeModule.backgroundTimeRemaining();
  } catch {
    return Infinity;
  }
}
