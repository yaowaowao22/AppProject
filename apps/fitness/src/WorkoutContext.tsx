import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyWorkout, PersonalRecord, WeeklyStats, WorkoutSession, WorkoutSet, WorkoutTemplate } from './types';
import { loadPersonalRecords, loadWorkouts, loadTemplates, savePersonalRecords, saveWorkouts, saveTemplates } from './utils/storage';
import { STORAGE_KEYS, WORKOUT } from './config';

// ── ワークアウト設定型 ─────────────────────────────────────────────────────────

export interface WorkoutConfig {
  weightStep: number;
  defaultSets: number;
  defaultWeight: number;
  defaultReps: number;
}

const DEFAULT_WORKOUT_CONFIG: WorkoutConfig = {
  weightStep:    WORKOUT.WEIGHT_STEP,
  defaultSets:   WORKOUT.DEFAULT_SETS,
  defaultWeight: WORKOUT.DEFAULT_WEIGHT,
  defaultReps:   WORKOUT.DEFAULT_REPS,
};

// ── 型 ────────────────────────────────────────────────────────────────────────

interface WorkoutContextValue {
  workouts: DailyWorkout[];
  personalRecords: PersonalRecord[];
  currentSession: WorkoutSession | null;
  weeklyStats: WeeklyStats;
  templates: WorkoutTemplate[];
  startSession: (exerciseId: string) => void;
  addSet: (weight: number | null, reps: number | null) => void;
  completeSession: () => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  deleteSessionFromWorkout: (workoutId: string, exerciseId: string) => Promise<void>;
  saveTemplate: (name: string, exerciseIds: string[]) => Promise<void>;
  updateTemplate: (id: string, name: string, exerciseIds: string[]) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  workoutConfig: WorkoutConfig;
  updateWorkoutConfig: (partial: Partial<WorkoutConfig>) => Promise<void>;
  updateSession: (workoutId: string, session: WorkoutSession) => Promise<void>;
  resetAll: () => Promise<void>;
}

// ── ヘルパー ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function computeWeeklyStats(workouts: DailyWorkout[]): WeeklyStats {
  const today = new Date();
  const todayStr = toDateStr(today);

  // 直近7日間（今日含む）
  const since = new Date(today);
  since.setDate(today.getDate() - 6);
  const sinceStr = toDateStr(since);

  const recentWorkouts = workouts.filter(w => w.date >= sinceStr && w.date <= todayStr);
  const workoutCount = recentWorkouts.length;
  const totalVolume = recentWorkouts.reduce((sum, w) => sum + w.totalVolume, 0);

  // 連続トレーニング日数: 今日から遡って連続する日を数える
  const workoutDates = new Set(workouts.map(w => w.date));
  let streakDays = 0;
  const cursor = new Date(today);
  while (workoutDates.has(toDateStr(cursor))) {
    streakDays++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { workoutCount, totalVolume, streakDays };
}

// ── Context ───────────────────────────────────────────────────────────────────

const DEFAULT_WEEKLY_STATS: WeeklyStats = { workoutCount: 0, totalVolume: 0, streakDays: 0 };

const WorkoutContext = createContext<WorkoutContextValue>({
  workouts: [],
  personalRecords: [],
  currentSession: null,
  weeklyStats: DEFAULT_WEEKLY_STATS,
  templates: [],
  startSession: () => {},
  addSet: () => {},
  completeSession: async () => {},
  deleteWorkout: async () => {},
  deleteSessionFromWorkout: async () => {},
  saveTemplate: async () => {},
  updateTemplate: async () => {},
  deleteTemplate: async () => {},
  workoutConfig: DEFAULT_WORKOUT_CONFIG,
  updateWorkoutConfig: async () => {},
  updateSession: async () => {},
  resetAll: async () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [workouts, setWorkouts] = useState<DailyWorkout[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>(DEFAULT_WEEKLY_STATS);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [workoutConfig, setWorkoutConfig] = useState<WorkoutConfig>(DEFAULT_WORKOUT_CONFIG);

  // 起動時にストレージからロード
  useEffect(() => {
    (async () => {
      const [loadedWorkouts, loadedRecords, loadedTemplates, savedConfig] = await Promise.all([
        loadWorkouts(),
        loadPersonalRecords(),
        loadTemplates(),
        AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_CONFIG),
      ]);
      setWorkouts(loadedWorkouts);
      setPersonalRecords(loadedRecords);
      setWeeklyStats(computeWeeklyStats(loadedWorkouts));
      setTemplates(loadedTemplates);
      if (savedConfig) {
        setWorkoutConfig({ ...DEFAULT_WORKOUT_CONFIG, ...JSON.parse(savedConfig) });
      }
    })();
  }, []);

  // セッション開始
  const startSession = useCallback((exerciseId: string) => {
    setCurrentSession({
      id: newId(),
      exerciseId,
      sets: [],
      startedAt: new Date().toISOString(),
    });
  }, []);

  // セット追加 + PR判定
  const addSet = useCallback((weight: number | null, reps: number | null) => {
    setCurrentSession(prev => {
      if (!prev) return prev;

      // 同種目の既存PRと比較して最大重量超えならPRフラグを立てる
      const pr = personalRecords.find(r => r.exerciseId === prev.exerciseId);
      const isPersonalRecord =
        weight !== null && (pr === undefined || pr.maxWeight === null || weight > pr.maxWeight);

      const newSet: WorkoutSet = {
        id: newId(),
        weight,
        reps,
        completedAt: new Date().toISOString(),
        isPersonalRecord,
      };

      return { ...prev, sets: [...prev.sets, newSet] };
    });
  }, [personalRecords]);

  // セッション完了: volume計算 → DailyWorkout更新 → PR更新 → 永続化
  const completeSession = useCallback(async () => {
    if (!currentSession) return;

    const now = new Date().toISOString();
    const todayStr = toDateStr(new Date());

    const completedSession: WorkoutSession = { ...currentSession, completedAt: now };

    // セッションのtotalVolume（weight × reps の合計）
    const sessionVolume = completedSession.sets.reduce((sum, s) => {
      return sum + (s.weight !== null && s.reps !== null ? s.weight * s.reps : 0);
    }, 0);

    // PR更新
    const sessionMaxWeight = completedSession.sets.reduce<number | null>((max, s) => {
      if (s.weight === null) return max;
      return max === null ? s.weight : Math.max(max, s.weight);
    }, null);
    const sessionMaxReps = completedSession.sets.reduce<number | null>((max, s) => {
      if (s.reps === null) return max;
      return max === null ? s.reps : Math.max(max, s.reps);
    }, null);

    const updatedRecords = [...personalRecords];
    const prIdx = updatedRecords.findIndex(r => r.exerciseId === currentSession.exerciseId);

    if (prIdx >= 0) {
      const ex = updatedRecords[prIdx];
      updatedRecords[prIdx] = {
        ...ex,
        maxWeight:
          sessionMaxWeight !== null
            ? ex.maxWeight !== null ? Math.max(ex.maxWeight, sessionMaxWeight) : sessionMaxWeight
            : ex.maxWeight,
        maxReps:
          sessionMaxReps !== null
            ? ex.maxReps !== null ? Math.max(ex.maxReps, sessionMaxReps) : sessionMaxReps
            : ex.maxReps,
        maxVolume: Math.max(ex.maxVolume, sessionVolume),
        achievedAt: now,
      };
    } else {
      updatedRecords.push({
        exerciseId: currentSession.exerciseId,
        maxWeight: sessionMaxWeight,
        maxReps: sessionMaxReps,
        maxVolume: sessionVolume,
        achievedAt: now,
      });
    }

    // DailyWorkoutに追加（同日があればマージ、なければ新規作成）
    const updatedWorkouts = [...workouts];
    const todayIdx = updatedWorkouts.findIndex(w => w.date === todayStr);

    if (todayIdx >= 0) {
      const existing = updatedWorkouts[todayIdx];
      const firstStartedAt = existing.sessions[0]?.startedAt ?? now;
      const duration = Math.floor((Date.now() - new Date(firstStartedAt).getTime()) / 1000);
      updatedWorkouts[todayIdx] = {
        ...existing,
        sessions: [...existing.sessions, completedSession],
        totalVolume: existing.totalVolume + sessionVolume,
        duration,
      };
    } else {
      const duration = Math.floor(
        (Date.now() - new Date(completedSession.startedAt).getTime()) / 1000,
      );
      updatedWorkouts.push({
        id: newId(),
        date: todayStr,
        sessions: [completedSession],
        totalVolume: sessionVolume,
        duration,
      });
    }

    setWorkouts(updatedWorkouts);
    setPersonalRecords(updatedRecords);
    setCurrentSession(null);
    setWeeklyStats(computeWeeklyStats(updatedWorkouts));

    await Promise.all([
      saveWorkouts(updatedWorkouts),
      savePersonalRecords(updatedRecords),
    ]);
  }, [currentSession, workouts, personalRecords]);

  // ワークアウト設定更新
  const updateWorkoutConfig = useCallback(async (partial: Partial<WorkoutConfig>) => {
    const next = { ...workoutConfig, ...partial };
    setWorkoutConfig(next);
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_CONFIG, JSON.stringify(next));
  }, [workoutConfig]);

  // セッション更新（セット内容の編集）
  const updateSession = useCallback(async (workoutId: string, session: WorkoutSession) => {
    const updatedWorkouts = workouts.map(w => {
      if (w.id !== workoutId) return w;
      const sessions = w.sessions.map(s => s.exerciseId === session.exerciseId ? session : s);
      const totalVolume = sessions.reduce((sum, s) =>
        sum + s.sets.reduce((sv, set) =>
          sv + (set.weight !== null && set.reps !== null ? set.weight * set.reps : 0), 0), 0);
      return { ...w, sessions, totalVolume };
    });
    setWorkouts(updatedWorkouts);
    setWeeklyStats(computeWeeklyStats(updatedWorkouts));
    await saveWorkouts(updatedWorkouts);
  }, [workouts]);

  // テンプレート保存
  const saveTemplate = useCallback(async (name: string, exerciseIds: string[]) => {
    const newTemplate: WorkoutTemplate = {
      id: newId(),
      name,
      exerciseIds,
      createdAt: new Date().toISOString(),
    };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    await saveTemplates(updated);
  }, [templates]);

  // テンプレート更新
  const updateTemplate = useCallback(async (id: string, name: string, exerciseIds: string[]) => {
    const updated = templates.map(t =>
      t.id === id ? { ...t, name, exerciseIds } : t
    );
    setTemplates(updated);
    await saveTemplates(updated);
  }, [templates]);

  // テンプレート削除
  const deleteTemplate = useCallback(async (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    await saveTemplates(updated);
  }, [templates]);

  // 全データリセット
  const resetAll = useCallback(async () => {
    await AsyncStorage.clear();
    setWorkouts([]);
    setPersonalRecords([]);
    setCurrentSession(null);
    setWeeklyStats(DEFAULT_WEEKLY_STATS);
    setTemplates([]);
    setWorkoutConfig(DEFAULT_WORKOUT_CONFIG);
  }, []);

  // ワークアウト削除
  const deleteWorkout = useCallback(async (id: string) => {
    const updatedWorkouts = workouts.filter(w => w.id !== id);
    setWorkouts(updatedWorkouts);
    setWeeklyStats(computeWeeklyStats(updatedWorkouts));
    await saveWorkouts(updatedWorkouts);
  }, [workouts]);

  // 特定ワークアウト内の種目セッション削除（セッションが0になったらワークアウトごと削除）
  const deleteSessionFromWorkout = useCallback(async (workoutId: string, exerciseId: string) => {
    const updatedWorkouts = workouts
      .map(w => {
        if (w.id !== workoutId) return w;
        const sessions = w.sessions.filter(s => s.exerciseId !== exerciseId);
        if (sessions.length === 0) return null;
        const totalVolume = sessions.reduce((sum, s) =>
          sum + s.sets.reduce((sv, set) =>
            sv + (set.weight !== null && set.reps !== null ? set.weight * set.reps : 0), 0), 0);
        return { ...w, sessions, totalVolume };
      })
      .filter((w): w is DailyWorkout => w !== null);
    setWorkouts(updatedWorkouts);
    setWeeklyStats(computeWeeklyStats(updatedWorkouts));
    await saveWorkouts(updatedWorkouts);
  }, [workouts]);

  return (
    <WorkoutContext.Provider
      value={{ workouts, personalRecords, currentSession, weeklyStats, templates, startSession, addSet, completeSession, deleteWorkout, deleteSessionFromWorkout, saveTemplate, updateTemplate, deleteTemplate, workoutConfig, updateWorkoutConfig, updateSession, resetAll }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWorkout(): WorkoutContextValue {
  return useContext(WorkoutContext);
}
