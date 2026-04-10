import { useCallback, useEffect, useState } from 'react';
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
      const updated = [newRecord, ...records];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setRecords(updated);
    },
    [records],
  );

  const deleteRecord = useCallback(
    async (id: string) => {
      const target = records.find(r => r.id === id);
      const updated = records.filter(r => r.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setRecords(updated);

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
    [records],
  );

  return { records, loading, addRecord, deleteRecord, refresh };
}
