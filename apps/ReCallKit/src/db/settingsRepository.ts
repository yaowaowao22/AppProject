// ============================================================
// ReCallKit settingsRepository
// app_settings テーブルの KVS アクセス
// ============================================================

import type { SQLiteDatabase } from 'expo-sqlite';

// 設定キーの一覧（型安全）
export type SettingKey =
  | 'review_time'           // "08:00"
  | 'daily_review_count'    // "5"
  | 'theme'                 // "system" | "light" | "dark"
  | 'onboarding_completed'  // "true" | "false"
  | 'notifications_enabled'; // "true" | "false"

// デフォルト値
export const SETTING_DEFAULTS: Record<SettingKey, string> = {
  review_time: '08:00',
  daily_review_count: '5',
  theme: 'system',
  onboarding_completed: 'false',
  notifications_enabled: 'false',
};

// 全設定をまとめた型
export interface AppSettings {
  review_time: string;
  daily_review_count: string;
  theme: 'system' | 'light' | 'dark';
  onboarding_completed: string;
  notifications_enabled: string;
}

/**
 * 全設定を取得する
 */
export async function getAllSettings(db: SQLiteDatabase): Promise<AppSettings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    `SELECT key, value FROM app_settings`
  );

  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }

  return {
    review_time: map.review_time ?? SETTING_DEFAULTS.review_time,
    daily_review_count: map.daily_review_count ?? SETTING_DEFAULTS.daily_review_count,
    theme: (map.theme as 'system' | 'light' | 'dark') ?? SETTING_DEFAULTS.theme,
    onboarding_completed: map.onboarding_completed ?? SETTING_DEFAULTS.onboarding_completed,
    notifications_enabled: map.notifications_enabled ?? SETTING_DEFAULTS.notifications_enabled,
  };
}

/**
 * 特定のキーの設定を取得する
 */
export async function getSetting(
  db: SQLiteDatabase,
  key: SettingKey
): Promise<string> {
  const result = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_settings WHERE key = ?`,
    [key]
  );
  return result?.value ?? SETTING_DEFAULTS[key];
}

/**
 * 設定を保存する（UPSERT）
 */
export async function setSetting(
  db: SQLiteDatabase,
  key: SettingKey,
  value: string
): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}
