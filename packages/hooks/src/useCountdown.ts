import { useEffect, useState } from "react";

interface UseCountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function computeTimeLeft(targetDate: Date): UseCountdownResult {
  const now = Date.now();
  const target = targetDate.getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, isExpired: false };
}

export function useCountdown(targetDate: Date): UseCountdownResult {
  const [timeLeft, setTimeLeft] = useState<UseCountdownResult>(() =>
    computeTimeLeft(targetDate)
  );

  useEffect(() => {
    const update = () => {
      const result = computeTimeLeft(targetDate);
      setTimeLeft(result);
      return result;
    };

    // Compute immediately in case targetDate changed
    const initial = update();
    if (initial.isExpired) {
      return;
    }

    const interval = setInterval(() => {
      const result = update();
      if (result.isExpired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [targetDate]);

  return timeLeft;
}
