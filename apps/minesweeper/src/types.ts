export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Cell {
  isMine: boolean;
  adjacentMines: number;
  revealed: boolean;
  flagged: boolean;
}

export interface GameResult {
  id: string;
  date: string;
  difficulty: Difficulty;
  timeSeconds: number;
  won: boolean;
}
