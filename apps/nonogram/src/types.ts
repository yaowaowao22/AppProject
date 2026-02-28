export interface Puzzle {
  id: string;
  name: string;
  size: number;
  grid: boolean[][];
}

export interface PuzzleResult {
  id: string;
  puzzleId: string;
  puzzleName: string;
  size: number;
  date: string;
  timeSeconds: number;
}

export type CellState = 'empty' | 'filled' | 'marked';
