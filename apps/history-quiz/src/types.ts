import type { QuizCount } from './data/questions';

export type { QuizCount } from './data/questions';

export interface QuizResult {
  id: string;
  date: string;
  era: string;
  correct: number;
  total: number;
  timeSeconds: number;
}
