export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Puzzle {
  id: string;
  difficulty: Difficulty;
  scenario: string;
  categories: string[];
  items: string[][];
  clues: string[];
  solution: Record<string, Record<string, string>>;
}

export type CellValue = 'empty' | 'circle' | 'cross';

export interface PuzzleResult {
  id: string;
  puzzleId: string;
  puzzleName: string;
  difficulty: Difficulty;
  date: string;
  timeSeconds: number;
}

export interface DifficultyInfo {
  key: Difficulty;
  label: string;
  description: string;
  gridSize: string;
}
