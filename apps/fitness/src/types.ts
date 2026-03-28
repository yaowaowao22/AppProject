// ── 部位 ──────────────────────────────────────────────────────────────────────
export type BodyPart = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';

// ── 器具種別 ──────────────────────────────────────────────────────────────────
export type EquipmentType =
  | 'バーベル'
  | 'ダンベル'
  | 'マシン'
  | 'ケーブル'
  | '自重'
  | 'ローラー'
  | 'ツール';

// ── 種目マスタ ──────────────────────────────────────────────────────────────
export interface Exercise {
  id: string;
  name: string;          // 種目名（日本語）
  nameEn: string;        // 種目名（英語）
  bodyPart: BodyPart;
  icon: string;          // Ionicons アイコン名
  equipment: EquipmentType;
  muscleDetail?: string; // 補助筋群テキスト（例: "胸・肩・上腕三頭筋"）
}

// ── セット記録 ────────────────────────────────────────────────────────────────
export interface WorkoutSet {
  id: string;
  weight: number | null; // kg（自重種目は null）
  reps: number | null;   // 回数（プランク等は null）
  completedAt: string;   // ISO timestamp
  isPersonalRecord?: boolean;
}

// ── 種目別セッション記録 ──────────────────────────────────────────────────────
export interface WorkoutSession {
  id: string;
  exerciseId: string;
  sets: WorkoutSet[];
  startedAt: string;     // ISO timestamp
  completedAt?: string;  // ISO timestamp
  notes?: string;
}

// ── 1日のワークアウト ────────────────────────────────────────────────────────
export interface DailyWorkout {
  id: string;
  date: string;          // ISO date（例: "2026-03-29"）
  sessions: WorkoutSession[];
  totalVolume: number;   // kg（重量 × 回数 の合計）
  duration: number;      // 秒
}

// ── 種目別PR ──────────────────────────────────────────────────────────────────
export interface PersonalRecord {
  exerciseId: string;
  maxWeight: number | null; // null = 自重種目
  maxReps: number | null;
  maxVolume: number;        // 1セッション内の最大総ボリューム
  achievedAt: string;       // ISO timestamp
}

// ── 部位別最大1日ボリューム ────────────────────────────────────────────────
export interface PartVolumePR {
  bodyPart: BodyPart;
  volume: number;  // kg
  achievedAt: string; // ISO date
}

// ── 今週統計 ──────────────────────────────────────────────────────────────────
export interface WeeklyStats {
  workoutCount: number;  // 今週のトレーニング回数
  totalVolume: number;   // 今週の総ボリューム（kg）
  streakDays: number;    // 現在の連続記録日数
}

// ── スパークチャート用 ────────────────────────────────────────────────────────
export interface ExerciseHistoryEntry {
  date: string;             // 例: "3/8"
  weight: number | null;    // null = 自重
}

// ── 部位設定（UI表示用） ──────────────────────────────────────────────────────
export interface BodyPartConfig {
  id: BodyPart;
  label: string;     // 日本語名
  labelEn: string;   // 英語名
  icon: string;      // Ionicons アイコン名
  exerciseCount: number;
}
