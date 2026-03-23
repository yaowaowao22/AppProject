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
  notify3days:        'sub_notify_3days',
  notify1day:         'sub_notify_1day',
  defaultCurrency:    'sub_default_currency',
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

// ── RevenueCat モック購入ガード ───────────────────
// true のときのみモック購入が動作する（本番ビルド誤提出防止）
declare const __DEV__: boolean;
export const USE_MOCK_PURCHASES = __DEV__;
