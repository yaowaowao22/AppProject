import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { APP, VERSION_CHECK } from '../config';

// ── 型 ────────────────────────────────────────────────────────────────────────

export interface VersionCheckResult {
  /** アップデートが必要か */
  needsUpdate: boolean;
  /** ストアの URL（プラットフォームに応じて iOS / Android を自動選択） */
  storeUrl: string;
  /** 取得中フラグ（結果が確定していない間は true） */
  isLoading: boolean;
}

/** リモート設定 JSON のスキーマ */
interface RemoteVersionConfig {
  minimumVersion: string;
  iosStoreUrl?: string;
  androidStoreUrl?: string;
}

// ── ヘルパー ──────────────────────────────────────────────────────────────────

/** "1.2.3" → [1, 2, 3] */
function parseVersion(v: string): number[] {
  return v.split('.').map(n => parseInt(n, 10) || 0);
}

/**
 * current が minimum より古い場合 true を返す。
 * 例: isOutdated('1.0.0', '1.1.0') → true
 */
function isOutdated(current: string, minimum: string): boolean {
  const c = parseVersion(current);
  const m = parseVersion(minimum);
  const len = Math.max(c.length, m.length);
  for (let i = 0; i < len; i++) {
    const cv = c[i] ?? 0;
    const mv = m[i] ?? 0;
    if (cv < mv) return true;
    if (cv > mv) return false;
  }
  return false; // 同一バージョン = アップデート不要
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * アプリ起動時にリモート設定を取得し、現在のバージョンが最小要件を
 * 満たしているかを確認する。
 *
 * - ネットワークエラーや fetch タイムアウトの場合は needsUpdate: false を返す
 *   （ユーザーをブロックしない安全側フォールバック）
 * - CONFIG_URL のレスポンス例:
 *   { "minimumVersion": "1.2.0", "iosStoreUrl": "...", "androidStoreUrl": "..." }
 */
export function useVersionCheck(): VersionCheckResult {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [storeUrl, setStoreUrl] = useState<string>(
    Platform.OS === 'ios'
      ? VERSION_CHECK.IOS_STORE_URL
      : VERSION_CHECK.ANDROID_STORE_URL,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      VERSION_CHECK.FETCH_TIMEOUT_MS,
    );

    async function check() {
      try {
        const res = await fetch(VERSION_CHECK.CONFIG_URL, {
          cache: 'no-cache',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as RemoteVersionConfig;
        if (cancelled) return;

        const url =
          (Platform.OS === 'ios' ? data.iosStoreUrl : data.androidStoreUrl) ??
          storeUrl;

        setStoreUrl(url);
        setNeedsUpdate(isOutdated(APP.VERSION, data.minimumVersion));
      } catch {
        // fetch 失敗はアップデート不要として扱い、静かに終了
      } finally {
        clearTimeout(timer);
        if (!cancelled) setIsLoading(false);
      }
    }

    check();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  // storeUrl を依存に含めると無限ループになるため除外
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { needsUpdate, storeUrl, isLoading };
}
