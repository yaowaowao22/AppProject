export type CellState = null | 'player' | 'ai';
export type Board = CellState[];
export type Difficulty = 'easy' | 'medium' | 'hard';

export type WinLine = [number, number, number];

export interface GameResult {
  id: string;
  date: string;
  difficulty: Difficulty;
  result: 'win' | 'loss' | 'draw';
}
