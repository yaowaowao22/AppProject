// ============================================================
// ReCallKit settingsRepository
// app_settings テーブルの KVS アクセス
// ============================================================

import type { SQLiteDatabase } from 'expo-sqlite';

// LLMプロバイダー識別子（URL解析の実行経路）
export type LlmProvider = 'local' | 'bedrock' | 'groq';

// 設定キーの一覧（型安全）
export type SettingKey =
  | 'review_time'           // "08:00"
  | 'daily_review_count'    // "5"
  | 'theme'                 // "system" | "light" | "dark"
  | 'onboarding_completed'  // "true" | "false"
  | 'notifications_enabled' // "true" | "false"
  | 'llm_provider'          // "local" | "bedrock" | "groq"
  | 'groq_api_key'          // Groq API key (gsk_...)
  | 'groq_model';           // "llama-3.3-70b-versatile" | "llama-3.1-8b-instant"

// デフォルト値
export const SETTING_DEFAULTS: Record<SettingKey, string> = {
  review_time: '08:00',
  daily_review_count: '5',
  theme: 'system',
  onboarding_completed: 'false',
  notifications_enabled: 'false',
  llm_provider: '',  // 空文字 = DB未設定 → pipeline 側で LOCAL_AI_ENABLED にフォールバック
  groq_api_key: '',
  groq_model: 'llama-3.3-70b-versatile',
};

// 全設定をまとめた型
export interface AppSettings {
  review_time: string;
  daily_review_count: string;
  theme: 'system' | 'light' | 'dark';
  onboarding_completed: string;
  notifications_enabled: string;
  llm_provider: string;  // '' | 'local' | 'bedrock' | 'groq'
  groq_api_key: string;
  groq_model: string;
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
    llm_provider: map.llm_provider ?? SETTING_DEFAULTS.llm_provider,
    groq_api_key: map.groq_api_key ?? SETTING_DEFAULTS.groq_api_key,
    groq_model: map.groq_model ?? SETTING_DEFAULTS.groq_model,
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
