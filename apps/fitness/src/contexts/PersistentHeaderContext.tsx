import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useFocusEffect } from '@react-navigation/native';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HeaderConfig {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showHamburger?: boolean;
  rightAction?: ReactNode;
  visible?: boolean;
}

interface PersistentHeaderContextValue {
  headerConfig: HeaderConfig;
  setHeaderConfig: (config: HeaderConfig) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const PersistentHeaderContext = createContext<PersistentHeaderContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function PersistentHeaderProvider({ children }: { children: ReactNode }) {
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>({ title: '' });

  const value = useMemo(
    () => ({ headerConfig, setHeaderConfig }),
    [headerConfig],
  );

  return (
    <PersistentHeaderContext.Provider value={value}>
      {children}
    </PersistentHeaderContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * 画面コンポーネントで呼び出す Hook。
 * フォーカス時に永続ヘッダーの設定を更新する。
 */
export function usePersistentHeader(config: HeaderConfig) {
  const ctx = useContext(PersistentHeaderContext);
  if (!ctx) {
    throw new Error('usePersistentHeader must be used within PersistentHeaderProvider');
  }
  const { setHeaderConfig } = ctx;

  const applyConfig = useCallback(() => {
    setHeaderConfig(config);
  }, [
    setHeaderConfig,
    config.title,
    config.subtitle,
    config.showBack,
    config.onBack,
    config.showHamburger,
    config.rightAction,
    config.visible,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);

  useFocusEffect(applyConfig);
}

/**
 * StackWithHeader 内部で現在のヘッダー設定を取得する Hook。
 */
export function useHeaderConfig(): HeaderConfig {
  const ctx = useContext(PersistentHeaderContext);
  if (!ctx) {
    throw new Error('useHeaderConfig must be used within PersistentHeaderProvider');
  }
  return ctx.headerConfig;
}
