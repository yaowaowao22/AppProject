export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameResult {
  id: string;
  date: string;
  difficulty: Difficulty;
  timeSeconds: number;
  completed: boolean;
}

export type Board = number[][];
export type CellNotes = Set<number>;
