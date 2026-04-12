import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { HistoryRecord } from '../types/history';

const STORAGE_KEY = '@ratio_history';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export type UseHistoryResult = {
  records: HistoryRecord[];
  loading: boolean;
  addRecord: (record: Omit<HistoryRecord, 'id' | 'createdAt'>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useHistory(): UseHistoryResult {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const recordsRef = useRef<HistoryRecord[]>([]);

  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        try {
          const parsed: unknown = JSON.parse(raw);
          setRecords(Array.isArray(parsed) ? (parsed as HistoryRecord[]) : []);
        } catch {
          // JSON破損時は空配列にフォールバック
          setRecords([]);
        }
      } else {
        setRecords([]);
      }
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初回マウント時に自動読み込み
  useEffect(() => {
    refresh();
  }, [refresh]);

  const addRecord = useCallback(
    async (record: Omit<HistoryRecord, 'id' | 'createdAt'>) => {
      const newRecord: HistoryRecord = {
        ...record,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      // setState updater は純関数でなければならない（React 19 Strict Mode では複数回呼ばれる可能性あり）
      // AsyncStorage 書き込みは updater の外で行う
      let updated: HistoryRecord[] = [];
      setRecords(prev => {
        updated = [newRecord, ...prev];
        return updated;
      });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },
    [],
  );

  const deleteRecord = useCallback(
    async (id: string) => {
      // prev から target を取得（recordsRef 経由だとレンダー前の stale 値を読む可能性がある）
      let target: HistoryRecord | undefined;
      let updated: HistoryRecord[] = [];
      setRecords(prev => {
        target = prev.find(r => r.id === id);
        updated = prev.filter(r => r.id !== id);
        return updated;
      });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      if (target) {
        const deleteIfExists = async (path: string) => {
          if (!path) return;
          try {
            const info = await FileSystem.getInfoAsync(path);
            if (info.exists) {
              await FileSystem.deleteAsync(path, { idempotent: true });
            }
          } catch {
            // ファイル削除失敗はストレージ更新完了後のため無視
          }
        };
        await Promise.all([
          deleteIfExists(target.thumbnailPath),
          deleteIfExists(target.processedPath),
        ]);
      }
    },
    [],
  );

  return { records, loading, addRecord, deleteRecord, refresh };
}
