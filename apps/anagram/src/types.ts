export type GameMode = 'normal' | 'timeAttack';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameResult {
  id: string;
  date: string;
  mode: GameMode;
  difficulty: Difficulty;
  score: number;
  solved: number;
  total: number;
  timeSeconds: number;
}
