import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from '../db/connection';

// ============================================================
// DatabaseContext
// ============================================================
interface DatabaseContextValue {
  db: SQLiteDatabase | null;
  isReady: boolean;
  error: Error | null;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  isReady: false,
  error: null,
});

// ============================================================
// DatabaseProvider
// DBの初期化・マイグレーション完了を管理する
// RootNavigatorはisReady=trueになるまでローディングを表示する
// ============================================================
interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const database = await getDatabase();
        if (!cancelled) {
          setDb(database);
          setIsReady(true);
        }
      } catch (err) {
        console.error('[DatabaseProvider] DB initialization failed:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isReady, error }}>
      {children}
    </DatabaseContext.Provider>
  );
}

// ============================================================
// useDatabase フック
// ============================================================
export function useDatabase(): DatabaseContextValue {
  return useContext(DatabaseContext);
}

/**
 * DBが準備完了していることを前提とするフック
 * isReady前に呼び出すとnullを返すため、
 * 呼び出し元でisReadyを確認すること
 */
export function useDB(): SQLiteDatabase {
  const { db, isReady, error } = useContext(DatabaseContext);
  if (error) throw error;
  if (!isReady || !db) throw new Error('Database is not ready yet');
  return db;
}
