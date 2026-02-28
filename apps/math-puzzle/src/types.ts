export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Puzzle {
  numbers: number[];
  target: number;
  solution: string;
  difficulty: Difficulty;
}

export interface GameResult {
  id: string;
  date: string;
  difficulty: Difficulty;
  timeSeconds: number;
  solved: boolean;
  target: number;
  expression: string;
}
