import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './config';

// ── 型 ────────────────────────────────────────────────────────────────────────

interface SubscriptionState {
  isPremium: boolean;
  /** ISO timestamp。null = 無期限。設定されている場合は期限切れチェックを行う */
  expiresAt: string | null;
}

export interface SubscriptionContextValue {
  isPremium: boolean;
  isLoading: boolean;
  /** プレミアム購入（RevenueCat 実装前のモック） */
  subscribe(): Promise<boolean>;
  /** 購入リストア（RevenueCat 実装前のモック） */
  restorePurchases(): Promise<boolean>;
}

// ── デフォルト値 ──────────────────────────────────────────────────────────────

const DEFAULT_STATE: SubscriptionState = { isPremium: false, expiresAt: null };

const SubscriptionContext = createContext<SubscriptionContextValue>({
  isPremium: false,
  isLoading: true,
  subscribe: async () => false,
  restorePurchases: async () => false,
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SubscriptionState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(true);

  // 起動時にストレージから購読状態を復元
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_STATUS);
        if (raw) {
          const parsed: SubscriptionState = JSON.parse(raw);
          // 有効期限チェック
          if (parsed.isPremium && parsed.expiresAt !== null) {
            const expired = new Date(parsed.expiresAt) < new Date();
            setState(expired ? DEFAULT_STATE : parsed);
          } else {
            setState(parsed);
          }
        }
      } catch (e) {
        console.warn('[SubscriptionContext] load failed:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // プレミアム購入（モック実装 — RevenueCat 導入時に置き換える）
  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      const next: SubscriptionState = { isPremium: true, expiresAt: null };
      await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_STATUS, JSON.stringify(next));
      setState(next);
      return true;
    } catch (e) {
      console.warn('[SubscriptionContext] subscribe failed:', e);
      return false;
    }
  }, []);

  // 購入リストア（モック実装 — RevenueCat 導入時に置き換える）
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_STATUS);
      if (raw) {
        const parsed: SubscriptionState = JSON.parse(raw);
        if (parsed.isPremium && parsed.expiresAt !== null) {
          const expired = new Date(parsed.expiresAt) < new Date();
          const effective = expired ? DEFAULT_STATE : parsed;
          setState(effective);
          return effective.isPremium;
        }
        setState(parsed);
        return parsed.isPremium;
      }
      return false;
    } catch (e) {
      console.warn('[SubscriptionContext] restorePurchases failed:', e);
      return false;
    }
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{ isPremium: state.isPremium, isLoading, subscribe, restorePurchases }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSubscription(): SubscriptionContextValue {
  return useContext(SubscriptionContext);
}
