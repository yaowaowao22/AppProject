import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── 型定義 ────────────────────────────────────────────────────────────────────
export type UIVariant = 'original' | 'premium' | 'minimal' | 'analytics';

interface UIVariantContextValue {
  variant: UIVariant;
  setVariant: (v: UIVariant) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────
const UIVariantContext = createContext<UIVariantContextValue>({
  variant: 'original',
  setVariant: () => {},
});

const STORAGE_KEY = 'subradar_ui_variant';

const VALID_VARIANTS: UIVariant[] = ['original', 'premium', 'minimal', 'analytics'];

// ── Provider ──────────────────────────────────────────────────────────────────
export function UIVariantProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariantState] = useState<UIVariant>('original');

  // 起動時に AsyncStorage から復元
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw && (VALID_VARIANTS as string[]).includes(raw)) {
          setVariantState(raw as UIVariant);
        }
      })
      .catch(() => {});
  }, []);

  const setVariant = (v: UIVariant) => {
    setVariantState(v);
    AsyncStorage.setItem(STORAGE_KEY, v).catch(() => {});
  };

  return (
    <UIVariantContext.Provider value={{ variant, setVariant }}>
      {children}
    </UIVariantContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useUIVariant(): UIVariantContextValue {
  return useContext(UIVariantContext);
}
