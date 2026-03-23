import React, { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '@massapp/hooks';
import type { Subscription } from './types';
import { FREE_LIMIT } from './types';
import { STORE_KEYS } from './config';

// ── Context 型 ─────────────────────────────────────
interface SubscriptionContextValue {
  subscriptions: Subscription[];
  isPremium: boolean;
  addSubscription: (sub: Subscription) => boolean; // false = 無料版制限
  updateSubscription: (id: string, patch: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  totalMonthly: number;  // 全サブスクの月額合計（JPY換算）
  totalYearly: number;   // 年間合計
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
});

// ── Provider ───────────────────────────────────────
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscriptions, setSubscriptions] = useLocalStorage<Subscription[]>(
    STORE_KEYS.subscriptions,
    [],
  );
  const [isPremium] = useLocalStorage<boolean>(STORE_KEYS.isPremium, false);

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

  // 月額合計（billingCycle に応じて月換算）
  const totalMonthly = subscriptions
    .filter((s) => s.isActive)
    .reduce((sum, s) => {
      switch (s.billingCycle) {
        case 'monthly':   return sum + s.amount;
        case 'yearly':    return sum + s.amount / 12;
        case 'quarterly': return sum + s.amount / 3;
        case 'weekly':    return sum + s.amount * 4.33;
        default:          return sum;
      }
    }, 0);

  const totalYearly = totalMonthly * 12;

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
