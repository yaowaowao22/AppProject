import React, { createContext, useContext, useCallback, useEffect, useMemo } from 'react';
import { useLocalStorage } from '@massapp/hooks';
import type { Subscription, MonthlySnapshot, MomData } from './types';
import { FREE_LIMIT } from './types';
import { STORE_KEYS } from './config';
import { calcMonthlyAmountJPY, calcMonthOverMonth } from './utils/subscriptionUtils';

/** 'YYYY-MM' 形式の文字列を返す */
function toYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// ── Context 型 ─────────────────────────────────────
interface SubscriptionContextValue {
  subscriptions: Subscription[];
  isPremium: boolean;
  addSubscription: (sub: Subscription) => boolean; // false = 無料版制限
  updateSubscription: (id: string, patch: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  totalMonthly: number;       // 全サブスクの月額合計（旧互換・非JPY換算）
  totalYearly: number;        // 年間合計（旧互換・非JPY換算）
  totalMonthlyJPY: number;    // 月額合計（JPY換算）
  totalYearlyJPY: number;     // 年額合計（JPY換算）
  momData: MomData | null;    // 前月比データ
}

// ── Context 生成 ───────────────────────────────────
const SubscriptionContext = createContext<SubscriptionContextValue>({
  subscriptions: [],
  isPremium: false,
  addSubscription: () => false,
  updateSubscription: () => undefined,
  deleteSubscription: () => undefined,
  totalMonthly: 0,
  totalYearly: 0,
  totalMonthlyJPY: 0,
  totalYearlyJPY: 0,
  momData: null,
});

// ── Provider ───────────────────────────────────────
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscriptions, setSubscriptions] = useLocalStorage<Subscription[]>(
    STORE_KEYS.subscriptions,
    [],
  );
  const [isPremium] = useLocalStorage<boolean>(STORE_KEYS.isPremium, false);
  const [monthlySnapshot, setMonthlySnapshot] = useLocalStorage<MonthlySnapshot | null>(
    STORE_KEYS.monthlySnapshot,
    null,
  );

  const addSubscription = useCallback(
    (sub: Subscription): boolean => {
      if (!isPremium && subscriptions.length >= FREE_LIMIT) {
        return false; // 無料版制限
      }
      setSubscriptions([...subscriptions, sub]);
      return true;
    },
    [subscriptions, isPremium, setSubscriptions],
  );

  const updateSubscription = useCallback(
    (id: string, patch: Partial<Subscription>) => {
      setSubscriptions(
        subscriptions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      );
    },
    [subscriptions, setSubscriptions],
  );

  const deleteSubscription = useCallback(
    (id: string) => {
      setSubscriptions(subscriptions.filter((s) => s.id !== id));
    },
    [subscriptions, setSubscriptions],
  );

  // 月額合計（旧互換：billingCycle 月換算のみ、通貨換算なし）
  const totalMonthly = useMemo(
    () =>
      subscriptions
        .filter((s) => s.isActive)
        .reduce((sum, s) => {
          switch (s.billingCycle) {
            case 'monthly':   return sum + s.amount;
            case 'yearly':    return sum + s.amount / 12;
            case 'quarterly': return sum + s.amount / 3;
            case 'weekly':    return sum + s.amount * 4.33;
            default:          return sum;
          }
        }, 0),
    [subscriptions],
  );

  const totalYearly = useMemo(() => totalMonthly * 12, [totalMonthly]);

  // 月額合計（JPY換算）
  const totalMonthlyJPY = useMemo(
    () =>
      subscriptions
        .filter((s) => s.isActive)
        .reduce((sum, s) => sum + calcMonthlyAmountJPY(s), 0),
    [subscriptions],
  );

  const totalYearlyJPY = useMemo(() => totalMonthlyJPY * 12, [totalMonthlyJPY]);

  // 月初チェック：先月分スナップショットがなければ保存
  // subscriptions を deps に含めることで、AsyncStorage からのロード完了後に実行される
  // （[] だと初期値 [] のまま totalMonthlyJPY=0 でスナップショットを保存してしまう）
  useEffect(() => {
    const currentYearMonth = toYearMonth(new Date());

    if (monthlySnapshot?.yearMonth !== currentYearMonth) {
      const activeCount = subscriptions.filter((s) => s.isActive).length;
      const snapshot: MonthlySnapshot = {
        yearMonth: currentYearMonth,
        totalMonthlyJPY,
        totalYearlyJPY,
        count: activeCount,
        savedAt: new Date().toISOString(),
      };
      setMonthlySnapshot(snapshot);
    }
  }, [subscriptions]); // eslint-disable-line react-hooks/exhaustive-deps

  // 前月比データ
  const momData: MomData | null = useMemo(() => {
    if (!monthlySnapshot) return null;
    // 今月のスナップショットしかない場合は比較不可
    if (monthlySnapshot.yearMonth === toYearMonth(new Date())) return null;
    return calcMonthOverMonth(totalMonthlyJPY, monthlySnapshot.totalMonthlyJPY);
  }, [monthlySnapshot, totalMonthlyJPY]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptions,
        isPremium,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        totalMonthly,
        totalYearly,
        totalMonthlyJPY,
        totalYearlyJPY,
        momData,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

// ── カスタムフック ─────────────────────────────────
export function useSubscriptions(): SubscriptionContextValue {
  return useContext(SubscriptionContext);
}
