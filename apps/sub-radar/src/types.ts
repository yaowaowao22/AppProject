export type Currency = 'JPY' | 'USD' | 'EUR' | 'GBP';
export type Category = '仕事' | 'エンタメ' | '健康' | 'ニュース' | 'ユーティリティ' | 'その他';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  billingDay: number; // 1-28
  category: Category;
  createdAt: string;
  lastTappedAt: string;
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  JPY: '¥',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

// 概算レート（JPY換算）
export const CURRENCY_TO_JPY: Record<Currency, number> = {
  JPY: 1,
  USD: 150,
  EUR: 163,
  GBP: 190,
};

export const CURRENCIES: Currency[] = ['JPY', 'USD', 'EUR', 'GBP'];
export const CATEGORIES: Category[] = ['仕事', 'エンタメ', '健康', 'ニュース', 'ユーティリティ', 'その他'];

export const FREE_LIMIT = 3;
export const UNUSED_DAYS_THRESHOLD = 30;

export function toJPY(amount: number, currency: Currency): number {
  return Math.round(amount * CURRENCY_TO_JPY[currency]);
}

export function daysUntilBilling(billingDay: number): number {
  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const targetDay = Math.min(billingDay, daysInMonth);
  if (targetDay >= currentDay) {
    return targetDay - currentDay;
  }
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const daysInNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
  return daysInMonth - currentDay + Math.min(billingDay, daysInNextMonth);
}

export function isUnused(lastTappedAt: string): boolean {
  const last = new Date(lastTappedAt);
  const diffMs = Date.now() - last.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= UNUSED_DAYS_THRESHOLD;
}
