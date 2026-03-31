import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWorkout } from '../WorkoutContext';
import { STORAGE_KEYS } from '../config';

// ── 型 ────────────────────────────────────────────────────────────────────────

export interface UsageStats {
  /** 累計ワークアウト完了数（DailyWorkout の件数） */
  totalWorkouts: number;
  /** 起動した日数の累計 */
  launchDays: number;
  /** 今日すでに起動済みか */
  launchedToday: boolean;
}

// ── ヘルパー ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function recordLaunchDate(today: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LAUNCH_DATES);
    const dates: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (dates.includes(today)) return dates;
    const updated = [...dates, today];
    await AsyncStorage.setItem(STORAGE_KEYS.LAUNCH_DATES, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('[useUsageStats] recordLaunchDate failed:', e);
    return [today];
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useUsageStats(): UsageStats {
  const { workouts } = useWorkout();
  const [launchDates, setLaunchDates] = useState<string[]>([]);

  useEffect(() => {
    const today = toDateStr(new Date());
    recordLaunchDate(today).then(setLaunchDates);
  }, []);

  const today = toDateStr(new Date());

  return {
    totalWorkouts: workouts.length,
    launchDays:    launchDates.length,
    launchedToday: launchDates.includes(today),
  };
}
