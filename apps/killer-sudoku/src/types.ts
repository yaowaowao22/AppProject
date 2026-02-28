export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Cage {
  sum: number;
  cells: [number, number][];
}

export interface KillerPuzzle {
  id: string;
  difficulty: Difficulty;
  grid: number[][];
  given: number[][];
  cages: Cage[];
}

export interface GameResult {
  id: string;
  date: string;
  difficulty: Difficulty;
  puzzleId: string;
  timeSeconds: number;
  completed: boolean;
}

export type Board = number[][];
export type NotesBoard = Set<number>[][];
