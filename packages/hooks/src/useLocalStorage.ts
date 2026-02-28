import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type UseLocalStorageReturn<T> = [value: T, setValue: (v: T) => void, loading: boolean];

export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): UseLocalStorageReturn<T> {
  const [value, setValueState] = useState<T>(defaultValue);
  const [loading, setLoading] = useState<boolean>(true);
  const isInitializedRef = useRef<boolean>(false);

  // Load value from AsyncStorage on mount
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (!cancelled) {
          if (raw !== null) {
            setValueState(JSON.parse(raw) as T);
          }
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

  const setValue = useCallback(
    (newValue: T) => {
      setValueState(newValue);

      // Persist asynchronously; fire-and-forget
      AsyncStorage.setItem(key, JSON.stringify(newValue)).catch(() => {
        // Silently ignore write errors to avoid crashing the app.
        // In production you may want to log this.
      });
    },
    [key]
  );

  return [value, setValue, loading];
}
