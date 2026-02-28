import { useCallback, useEffect, useRef, useState } from "react";

interface UseTimerResult {
  timeLeft: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  isFinished: boolean;
}

export function useTimer(durationMs: number): UseTimerResult {
  const [timeLeft, setTimeLeft] = useState<number>(durationMs);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    setIsRunning(true);
    lastTickRef.current = Date.now();
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  const reset = useCallback(() => {
    setIsRunning(false);
    clearTimer();
    setTimeLeft(durationMs);
  }, [durationMs, clearTimer]);

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    lastTickRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;

      setTimeLeft((prev) => {
        const next = prev - elapsed;
        if (next <= 0) {
          return 0;
        }
        return next;
      });
    }, 100);

    return () => {
      clearTimer();
    };
  }, [isRunning, clearTimer]);

  useEffect(() => {
    if (timeLeft <= 0 && isRunning) {
      setIsRunning(false);
      clearTimer();
    }
  }, [timeLeft, isRunning, clearTimer]);

  const isFinished = timeLeft <= 0;

  return { timeLeft, isRunning, start, pause, reset, isFinished };
}
