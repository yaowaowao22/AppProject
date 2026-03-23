// ── 課金サイクル ───────────────────────────────────
export type BillingCycle = 'monthly' | 'yearly' | 'weekly' | 'quarterly';

export const BILLING_CYCLE_LABEL: Record<BillingCycle, string> = {
  monthly:   '月次',
  yearly:    '年次',
  weekly:    '週次',
  quarterly: '四半期',
};

// ── カテゴリ ───────────────────────────────────────
export type SubscriptionCategory = 'エンタメ' | '仕事' | '生活' | '学習' | 'その他';

export const CATEGORY_COLORS: Record<SubscriptionCategory, string> = {
  'エンタメ': '#E91E63',
  '仕事':     '#2196F3',
  '生活':     '#FF9800',
  '学習':     '#9C27B0',
  'その他':   '#78909C',
};

// ── 通貨 ──────────────────────────────────────────
export type Currency = 'JPY' | 'USD' | 'EUR';

// ── サブスクリプション ──────────────────────────────
export interface Subscription {
  id: string;
  name: string;
  amount: number;             // 請求額（billingCycle 単位）
  currency: Currency;
  billingCycle: BillingCycle;
  billingDay: number;         // 毎月の請求日（1〜31）
  category: SubscriptionCategory;
  color: string;              // カード表示色（16進カラーコード）
  iconName?: string;          // @expo/vector-icons の Ionicons 名
  isActive: boolean;
  lastTappedAt?: string;      // ISO datetime。30日超で未使用フラグ
  createdAt: string;          // ISO datetime
  note?: string;
}

// ── 通知設定 ──────────────────────────────────────
export interface NotificationTiming {
  daysBefore: number;
  enabled: boolean;
}

// ── 無料版制限 ────────────────────────────────────
export const FREE_LIMIT = 3;

// ── 未使用判定しきい値 ────────────────────────────
export const UNUSED_THRESHOLD_DAYS = 30;

// ── 月次スナップショット ──────────────────────────
export interface MonthlySnapshot {
  yearMonth: string;          // 'YYYY-MM' 形式
  totalMonthlyJPY: number;    // 月額合計（JPY換算）
  totalYearlyJPY: number;     // 年額合計（JPY換算）
  count: number;              // アクティブなサブスク数
  savedAt: string;            // ISO datetime
}

// ── 前月比データ ──────────────────────────────────
export interface MomData {
  diff: number;                           // 差分（JPY）
  pct: number;                            // 変化率（%）
  direction: 'up' | 'down' | 'neutral';  // 増減方向
}
