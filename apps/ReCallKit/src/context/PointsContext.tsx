// ============================================================
// PointsContext - ポイント残高・獲得・消費を管理するContext
// ============================================================

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { earnPoints, spendPoints, getTotalPoints } from '../db/pointsRepository';

interface PointsContextValue {
  totalPoints: number;
  earn: (amount: number, reason: string, itemId?: number) => Promise<void>;
  spend: (amount: number, reason: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const PointsContext = createContext<PointsContextValue>({
  totalPoints: 0,
  earn: async () => {},
  spend: async () => {},
  refresh: async () => {},
});

export function PointsProvider({ children }: { children: ReactNode }) {
  const { db, isReady } = useDatabase();
  const [totalPoints, setTotalPoints] = useState(0);

  const refresh = useCallback(async () => {
    if (!db || !isReady) return;
    const total = await getTotalPoints(db);
    setTotalPoints(total);
  }, [db, isReady]);

  useEffect(() => {
    if (isReady && db) {
      refresh();
    }
  }, [isReady, db, refresh]);

  const earn = useCallback(
    async (amount: number, reason: string, itemId?: number) => {
      if (!db || !isReady) return;
      await earnPoints(db, amount, reason, itemId);
      setTotalPoints((prev) => prev + amount);
    },
    [db, isReady]
  );

  const spend = useCallback(
    async (amount: number, reason: string) => {
      if (!db || !isReady) return;
      await spendPoints(db, amount, reason);
      setTotalPoints((prev) => Math.max(0, prev - amount));
    },
    [db, isReady]
  );

  return (
    <PointsContext.Provider value={{ totalPoints, earn, spend, refresh }}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  return useContext(PointsContext);
}
