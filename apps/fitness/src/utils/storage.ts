import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config';
import type { DailyWorkout, PersonalRecord } from '../types';

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
