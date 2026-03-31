// ── Firebase Crashlytics ラッパー ────────────────────────────────────────────
//
// @react-native-firebase/crashlytics は EAS ビルド環境（Native モジュール必須）
// でのみ動作する。Expo Go や Web では NativeModule が存在しないため、
// 安全にフォールバックするラッパーを提供する。

interface CrashlyticsModule {
  setCrashlyticsCollectionEnabled(enabled: boolean): Promise<void>;
  log(message: string): Promise<void>;
  recordError(error: Error, jsErrorContext?: Record<string, unknown>): Promise<void>;
  setUserId(userId: string): Promise<void>;
}

let crashlytics: CrashlyticsModule | null = null;

function getModule() {
  if (crashlytics !== null) return crashlytics;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-firebase/crashlytics').default;
    crashlytics = mod();
    return crashlytics;
  } catch {
    return null;
  }
}

/** アプリ起動時に呼び出す初期化処理 */
export function initCrashlytics(): void {
  const mod = getModule();
  if (!mod) return;
  try {
    mod.setCrashlyticsCollectionEnabled(true);
  } catch (e) {
    console.warn('[Crashlytics] init failed:', e);
  }
}

/** JS エラーを Crashlytics に記録する（ErrorBoundary の componentDidCatch から呼ぶ） */
export function recordError(error: Error, context?: string): void {
  const mod = getModule();
  if (!mod) {
    console.error('[Crashlytics fallback]', context ?? '', error);
    return;
  }
  try {
    if (context) mod.log(context);
    mod.recordError(error);
  } catch (e) {
    console.warn('[Crashlytics] recordError failed:', e);
  }
}

/** 任意ログを Crashlytics に送る */
export function log(message: string): void {
  const mod = getModule();
  if (!mod) return;
  try {
    mod.log(message);
  } catch {
    // ignore
  }
}

/** ユーザー識別子をセット（ログイン後など） */
export function setUserId(uid: string): void {
  const mod = getModule();
  if (!mod) return;
  try {
    mod.setUserId(uid);
  } catch {
    // ignore
  }
}
