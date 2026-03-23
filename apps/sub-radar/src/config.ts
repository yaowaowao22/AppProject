// ── アプリバージョン ───────────────────────────────
export const APP_VERSION = '0.1.0';
export const APP_NAME = 'SubRadar';

// ── AsyncStorage キー ──────────────────────────────
export const STORE_KEYS = {
  subscriptions:      'subradar_subscriptions',
  notificationConfig: 'subradar_notification_config',
  isPremium:          'subradar_is_premium',
  themeMode:          'subradar_theme_mode',
  monthlySnapshot:    'subradar_monthly_snapshot',
} as const;

// ── 通貨→JPY 固定レート ───────────────────────────
export const FX_RATES: Record<string, number> = {
  JPY: 1,
  USD: 150,
  EUR: 163,
} as const;

// ── プレミアム価格 ────────────────────────────────
export const PREMIUM_PRICE_JPY = 480;

// ── 通知デフォルト設定 ────────────────────────────
export const DEFAULT_DAYS_BEFORE = [1, 3]; // 前日・3日前
