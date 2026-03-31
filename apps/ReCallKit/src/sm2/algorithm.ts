// ============================================================
// SM-2（SuperMemo 2）間隔反復アルゴリズム
// ============================================================

/**
 * SM-2 品質評価
 * 0: 完全に忘れた（Blackout）
 * 1: 間違えた（Incorrect）
 * 2: 間違えたが見たら思い出した
 * 3: 思い出すのに苦労した（正解）
 * 4: 少し迷ったが正解
 * 5: 完璧に覚えていた（Perfect response）
 */
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SM2State {
  repetitions: number;     // 連続正答回数
  easinessFactor: number;  // EF値（最小1.3）
  intervalDays: number;    // 次回までの間隔（日）
}

export interface SM2Result extends SM2State {
  nextReviewAt: Date;      // 次回復習日時
}

const MIN_EF = 1.3;
const DEFAULT_REVIEW_HOUR = 8; // 翌朝8時

/**
 * SM-2アルゴリズム本体
 * @param state 現在の復習状態
 * @param quality ユーザーの自己評価（0-5）
 * @returns 更新後の状態 + 次回復習日
 */
export function sm2(state: SM2State, quality: Quality): SM2Result {
  let { repetitions, easinessFactor, intervalDays } = state;

  // EF更新: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  const newEF = Math.max(
    MIN_EF,
    easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  if (quality < 3) {
    // 不正解 → リセット（次回は翌日から）
    repetitions = 0;
    intervalDays = 1;
  } else {
    // 正解 → 間隔延長
    repetitions += 1;
    switch (repetitions) {
      case 1:
        intervalDays = 1;
        break;
      case 2:
        intervalDays = 6;
        break;
      default:
        intervalDays = Math.round(intervalDays * newEF);
        break;
    }
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);
  nextReviewAt.setHours(DEFAULT_REVIEW_HOUR, 0, 0, 0);

  return {
    repetitions,
    easinessFactor: Math.round(newEF * 100) / 100, // 小数2桁
    intervalDays,
    nextReviewAt,
  };
}

/**
 * 新規アイテムの初期SM2状態
 */
export function createInitialSM2State(): SM2State {
  return {
    repetitions: 0,
    easinessFactor: 2.5,
    intervalDays: 0,
  };
}

/**
 * UI用3段階評価 → SM-2品質値マッピング
 * ユーザーには「忘れた / 難しかった / 覚えてた」の3ボタンを表示
 */
export const SIMPLE_RATINGS = {
  forgot: 1 as Quality,  // 「忘れた」
  hard:   3 as Quality,  // 「難しかった」
  easy:   5 as Quality,  // 「覚えてた」
} as const;

export type SimpleRating = keyof typeof SIMPLE_RATINGS;

function toSQLiteDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * SM-2状態をDB保存用フラットオブジェクトに変換
 */
export function sm2ResultToDBParams(result: SM2Result): {
  repetitions: number;
  easiness_factor: number;
  interval_days: number;
  next_review_at: string;
} {
  return {
    repetitions: result.repetitions,
    easiness_factor: result.easinessFactor,
    interval_days: result.intervalDays,
    next_review_at: toSQLiteDateTime(result.nextReviewAt),
  };
}
