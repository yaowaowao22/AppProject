import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Listener = (value: unknown) => void;

// 同じキーを使う全インスタンス間で値を同期するためのリスナー管理
const listeners = new Map<string, Set<Listener>>();

function emit(key: string, value: unknown) {
  const set = listeners.get(key);
  if (set) {
    for (const fn of set) fn(value);
  }
}

function subscribe(key: string, fn: Listener) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(fn);
  return () => {
    listeners.get(key)?.delete(fn);
  };
}

type UseLocalStorageReturn<T> = [value: T, setValue: (v: T | ((prev: T) => T)) => void, loading: boolean];

export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): UseLocalStorageReturn<T> {
  const [value, setValueState] = useState<T>(defaultValue);
  const [loading, setLoading] = useState<boolean>(true);
  const isInitializedRef = useRef<boolean>(false);
  const valueRef = useRef<T>(defaultValue);

  // AsyncStorage読込完了前に呼ばれた関数型更新を記録し、
  // 読込完了時に正しいベース値（保存済みデータ）の上に再適用する
  const pendingFnsRef = useRef<Array<(prev: T) => T>>([]);

  // Load value from AsyncStorage on mount
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (!cancelled) {
          let loaded = raw !== null ? (JSON.parse(raw) as T) : defaultValue;

          // 読込前にsetValueが呼ばれていた場合、保存済みデータをベースに再適用
          // 例: 通知タップ→アプリ起動時にhandlerが先に発火し、
          //      空配列ベースで追加されていたデータを、保存済み配列ベースでやり直す
          if (pendingFnsRef.current.length > 0) {
            for (const fn of pendingFnsRef.current) {
              loaded = fn(loaded);
            }
            pendingFnsRef.current = [];
            // マージ結果を永続化 & 他インスタンスに通知
            AsyncStorage.setItem(key, JSON.stringify(loaded)).catch(() => {});
            emit(key, loaded);
          }

          valueRef.current = loaded;
          setValueState(loaded);
          isInitializedRef.current = true;
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          isInitializedRef.current = true;
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [key]);

  // 他のインスタンスからの更新を受け取る
  useEffect(() => {
    const unsub = subscribe(key, (newValue) => {
      valueRef.current = newValue as T;
      setValueState(newValue as T);
    });
    return unsub;
  }, [key]);

  const setValue = useCallback(
    (newValueOrFn: T | ((prev: T) => T)) => {
      if (typeof newValueOrFn === 'function') {
        const fn = newValueOrFn as (prev: T) => T;

        // AsyncStorage未読込の場合、関数を記録（読込完了時に正しいベースで再適用される）
        if (!isInitializedRef.current) {
          pendingFnsRef.current.push(fn);
        }

        // 現在のvalueRefに即座に適用（UIをブロックしない）
        const newValue = fn(valueRef.current);
        valueRef.current = newValue;
        setValueState(newValue);
        emit(key, newValue);
        AsyncStorage.setItem(key, JSON.stringify(newValue)).catch(() => {});
      } else {
        // 値の直接セット：pending関数をクリア（完全上書きなので再適用不要）
        if (!isInitializedRef.current) {
          pendingFnsRef.current = [];
        }

        valueRef.current = newValueOrFn;
        setValueState(newValueOrFn);
        emit(key, newValueOrFn);
        AsyncStorage.setItem(key, JSON.stringify(newValueOrFn)).catch(() => {});
      }
    },
    [key]
  );

  return [value, setValue, loading];
}
