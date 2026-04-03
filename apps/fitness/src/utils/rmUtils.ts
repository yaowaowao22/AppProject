import type { WorkoutSession } from '../types';

/** Epley / Brzycki / Lander 三方式の平均で推定1RMを返す */
export function getEstimated1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  const epley   = weight * (1 + reps / 30);
  const brzycki = weight * 36 / (37 - reps);
  const lander  = (100 * weight) / (101.3 - 2.67123 * reps);
  return (epley + brzycki + lander) / 3;
}

/** セッション内の全セットから最大の推定1RMを返す（自重種目は 0） */
export function getSessionBest1RM(session: WorkoutSession): number {
  let best = 0;
  for (const s of session.sets) {
    if (s.weight !== null && s.weight > 0 && s.reps !== null && s.reps > 0) {
      const rm = getEstimated1RM(s.weight, s.reps);
      if (rm > best) best = rm;
    }
  }
  return best;
}
