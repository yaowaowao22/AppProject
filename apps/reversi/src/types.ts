export type CellState = null | 'black' | 'white';
export type Board = CellState[][];
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Position = [number, number];

export interface GameResult {
  id: string;
  date: string;
  difficulty: Difficulty;
  playerScore: number;
  aiScore: number;
  won: boolean;
  draw: boolean;
}
