import type { Subscription, Currency, MomData } from '../types';
import { UNUSED_THRESHOLD_DAYS } from '../types';
import { FX_RATES } from '../config';

/**
 * サブスクリプションの月額換算金額を返す
 * （通貨換算は行わず、登録通貨のまま計算）
 */
export function calcMonthlyAmount(sub: Subscription): number {
  switch (sub.billingCycle) {
    case 'monthly':   return sub.amount;
    case 'yearly':    return sub.amount / 12;
    case 'quarterly': return sub.amount / 3;
    case 'weekly':    return sub.amount * 4.33;
    default:          return sub.amount;
  }
}

/**
 * 次回請求日（Date）を返す
 * billingDay を基準に当月または翌月の請求日を算出
 */
export function getNextBillingDate(sub: Subscription): Date {
  const today = new Date();
  const day = Math.min(sub.billingDay, 28); // 2月考慮で28日上限

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), day);

  if (thisMonth >= today) {
    return thisMonth;
  }

  // 今月分はすでに過ぎているので翌月
  const next = new Date(today.getFullYear(), today.getMonth() + 1, day);
  return next;
}

/**
 * 次回請求日までの残り日数を返す（当日 = 0）
 */
export function getDaysUntilBilling(sub: Subscription): number {
  const nextDate = getNextBillingDate(sub);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  nextDate.setHours(0, 0, 0, 0);
  const diffMs = nextDate.getTime() - today.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * 未使用フラグ判定
 * lastTappedAt が存在しない、または UNUSED_THRESHOLD_DAYS 日以上更新されていない場合 true
 */
export function isUnused(sub: Subscription): boolean {
  if (!sub.lastTappedAt) return true;
  const diffMs = Date.now() - new Date(sub.lastTappedAt).getTime();
  return diffMs > UNUSED_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * 金額を JPY に換算する（FX_RATES 使用）
 */
export function toJPY(amount: number, currency: Currency): number {
  const rate = FX_RATES[currency] ?? 1;
  return Math.round(amount * rate);
}

/**
 * サブスクリプションの月額 JPY 換算金額を返す
 */
export function calcMonthlyAmountJPY(sub: Subscription): number {
  const monthlyInCurrency = calcMonthlyAmount(sub);
  return toJPY(monthlyInCurrency, sub.currency);
}

/**
 * 前月比データを計算する
 */
export function calcMonthOverMonth(
  current: number,
  previous: number | null,
): MomData {
  if (previous === null || previous === 0) {
    return { diff: 0, pct: 0, direction: 'neutral' };
  }
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);
  const direction: MomData['direction'] =
    diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';
  return { diff, pct, direction };
}

/**
 * 金額を通貨記号付きでフォーマット
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const rounded = Math.round(amount);
  switch (currency) {
    case 'JPY':
      return `¥${rounded.toLocaleString('ja-JP')}`;
    case 'USD':
      return `$${(amount).toFixed(2)}`;
    case 'EUR':
      return `€${(amount).toFixed(2)}`;
    default:
      return `${rounded}`;
  }
}
