import { useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

interface UseAppStateOptions {
  onForeground?: () => void;
  onBackground?: () => void;
}

interface UseAppStateResult {
  appState: AppStateStatus;
}

export function useAppState(options?: UseAppStateOptions): UseAppStateResult {
  const { onForeground, onBackground } = options ?? {};
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  );
  const previousState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        const prevState = previousState.current;

        if (
          prevState.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          onForeground?.();
        }

        if (
          prevState === "active" &&
          nextAppState.match(/inactive|background/)
        ) {
          onBackground?.();
        }

        previousState.current = nextAppState;
        setAppState(nextAppState);
      }
    );

    return () => {
      subscription.remove();
    };
  }, [onForeground, onBackground]);

  return { appState };
}
