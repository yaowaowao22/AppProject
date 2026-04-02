import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

export function PersistentHeaderProvider({
  children,
  initialConfig,
}: {
  children: ReactNode;
  initialConfig?: HeaderConfig;
}) {
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>(initialConfig ?? { title: '' });

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

  // ref に最新 config を保持し、フォーカスハンドラが常に最新値を読めるようにする
  const configRef = useRef(config);
  configRef.current = config;

  // フォーカス時にヘッダーを適用（ref 経由で常に最新）
  useFocusEffect(
    useCallback(() => {
      setHeaderConfig(configRef.current);
    }, [setHeaderConfig]),
  );

  // マウント時・config変更時に即時適用（フォーカス状態に依存しない）
  useEffect(() => {
    setHeaderConfig(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    setHeaderConfig,
    config.title,
    config.subtitle,
    config.showBack,
    config.onBack,
    config.showHamburger,
    config.rightAction,
    config.visible,
  ]);
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
