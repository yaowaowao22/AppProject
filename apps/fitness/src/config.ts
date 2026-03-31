// ── ストレージキー ───────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  WORKOUTS:        'tanren_workouts',         // DailyWorkout[]
  PERSONAL_RECORDS:'tanren_personal_records', // PersonalRecord[]
  PART_VOLUME_PRS: 'tanren_part_volume_prs',  // PartVolumePR[]
  QUICK_START_IDS: 'tanren_quick_start_ids',  // string[]（カスタマイズ済みクイックスタート）
  LAST_WEIGHTS:    'tanren_last_weights',      // Record<exerciseId, number>（前回重量キャッシュ）
  STREAK_DATA:     'tanren_streak_data',       // { lastDate: string; streakDays: number }
  TEMPLATES:       'tanren_templates',         // WorkoutTemplate[]
  WORKOUT_CONFIG:  'tanren_workout_config',    // WorkoutConfig（ユーザーカスタム設定）
  APP_SETTINGS:    'tanren_app_settings',      // AppSettings
  LAUNCH_DATES:        'tanren_launch_dates',        // string[] (ISO date 'YYYY-MM-DD')
  SUBSCRIPTION_STATUS: 'tanren_subscription_status', // { isPremium: boolean; expiresAt: string | null }
} as const;

// ── アニメーション ────────────────────────────────────────────────────────────
// CSS 変数と1対1で対応する定数（React Native Animated / Reanimated 用）

/** Spring — 弾力感（ボタン押下・数値更新） */
export const SPRING_EASING = {
  damping:  12,
  stiffness: 180,
  mass:     0.8,
} as const;

/** Ease-out — 素直な退場（タブ切り替え・hover） */
export const EASE_OUT_DURATION = 180; // ms

// 各インタラクションのデュレーション（ms）
export const ANIMATION = {
  tabSwitch:       180,   // fade + translateY — --ez
  buttonPress:     300,   // scale(0.97) — --sp
  numberBump:      260,   // scale(1.1 → 1) — --sp
  setComplete:     360,   // bg: --ac → --ok + scale — --sp
  setCompletePause: 1000, // セット完了後にボタンをリセットするまでの待機
  bottomSheet:     300,   // translateY(100% → 0) — ease
  historyBar:      450,   // 棒グラフ height — cubic-bezier
} as const;

// ── ワークアウト設定 ──────────────────────────────────────────────────────────
export const WORKOUT = {
  DEFAULT_SETS:     5,     // デフォルトセット数
  DEFAULT_WEIGHT:   80,    // kg
  DEFAULT_REPS:     8,
  WEIGHT_STEP:      2.5,   // kg 増減ステップ
  REPS_STEP:        1,
  MIN_WEIGHT:       0,     // kg
  MIN_REPS:         1,
} as const;

// ── アプリ設定 ────────────────────────────────────────────────────────────────
export const APP = {
  NAME:     'TANREN',
  VERSION:  '1.0.0',
  // スパークチャートに表示する最大セッション数
  SPARK_MAX_SESSIONS: 6,
  // Progress 画面の棒グラフ表示日数
  VOLUME_CHART_DAYS: 7,
  DEFAULT_APP_SETTINGS: { showCalendar: true, showQuickStart: false },
} as const;

// ── バージョンチェック設定 ────────────────────────────────────────────────────
export const VERSION_CHECK = {
  /** 最小バージョンを取得するリモート設定 JSON の URL */
  CONFIG_URL: 'https://raw.githubusercontent.com/massapp/tanren-config/main/version.json',
  /** iOS App Store URL（リモート設定に含まれない場合のフォールバック） */
  IOS_STORE_URL:     'https://apps.apple.com/jp/app/id000000000',
  /** Google Play Store URL（リモート設定に含まれない場合のフォールバック） */
  ANDROID_STORE_URL: 'https://play.google.com/store/apps/details?id=com.massapp.fitness',
  /** fetch タイムアウト (ms) */
  FETCH_TIMEOUT_MS: 5000,
} as const;

// ── カレンダー設定 ────────────────────────────────────────────────────────────
export const CALENDAR = {
  WEEKS_TO_SHOW: 5, // カレンダーに表示する週数
  WEEK_START:    1, // 0=日曜, 1=月曜
} as const;
