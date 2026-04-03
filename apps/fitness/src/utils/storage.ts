import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, APP } from '../config';
import type { DailyWorkout, Exercise, PersonalRecord, WorkoutTemplate, AppSettings } from '../types';

export async function saveWorkouts(workouts: DailyWorkout[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
  } catch (e) {
    console.warn('[storage] saveWorkouts failed:', e);
  }
}

export async function loadWorkouts(): Promise<DailyWorkout[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUTS);
    if (!raw) return [];
    return JSON.parse(raw) as DailyWorkout[];
  } catch (e) {
    console.warn('[storage] loadWorkouts failed:', e);
    return [];
  }
}

export async function savePersonalRecords(records: PersonalRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PERSONAL_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.warn('[storage] savePersonalRecords failed:', e);
  }
}

export async function loadPersonalRecords(): Promise<PersonalRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PERSONAL_RECORDS);
    if (!raw) return [];
    return JSON.parse(raw) as PersonalRecord[];
  } catch (e) {
    console.warn('[storage] loadPersonalRecords failed:', e);
    return [];
  }
}

export async function saveTemplates(templates: WorkoutTemplate[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.warn('[storage] saveTemplates failed:', e);
  }
}

export async function loadTemplates(): Promise<WorkoutTemplate[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (!raw) return [];
    return JSON.parse(raw) as WorkoutTemplate[];
  } catch (e) {
    console.warn('[storage] loadTemplates failed:', e);
    return [];
  }
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.warn('[storage] saveAppSettings failed:', e);
  }
}

export async function saveCustomExercises(exercises: Exercise[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_EXERCISES, JSON.stringify(exercises));
  } catch (e) {
    console.warn('[storage] saveCustomExercises failed:', e);
  }
}

export async function loadCustomExercises(): Promise<Exercise[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_EXERCISES);
    if (!raw) return [];
    return JSON.parse(raw) as Exercise[];
  } catch (e) {
    console.warn('[storage] loadCustomExercises failed:', e);
    return [];
  }
}

export async function saveHiddenExerciseIds(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.HIDDEN_EXERCISES, JSON.stringify(ids));
  } catch (e) {
    console.warn('[storage] saveHiddenExerciseIds failed:', e);
  }
}

export async function loadHiddenExerciseIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.HIDDEN_EXERCISES);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch (e) {
    console.warn('[storage] loadHiddenExerciseIds failed:', e);
    return [];
  }
}

export async function loadAppSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
    if (!raw) return { ...APP.DEFAULT_APP_SETTINGS };
    const saved = JSON.parse(raw) as Partial<AppSettings>;
    // マイグレーション: 既存データに未定義のキーをデフォルト値で補完
    return {
      ...APP.DEFAULT_APP_SETTINGS,
      ...saved,
    };
  } catch (e) {
    console.warn('[storage] loadAppSettings failed:', e);
    return { ...APP.DEFAULT_APP_SETTINGS };
  }
}
