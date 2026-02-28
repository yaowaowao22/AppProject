export type Difficulty = 'easy' | 'medium' | 'hard';

export interface LevelDef {
  id: string;
  name: string;
  difficulty: Difficulty;
  size: number;
  /** Cells to toggle from solved (all-off) state to create the puzzle */
  toggleSequence: [number, number][];
}

export interface GameResult {
  id: string;
  date: string;
  levelId: string;
  levelName: string;
  difficulty: Difficulty;
  moves: number;
  gridSize: number;
}

export interface DifficultyConfig {
  label: string;
  size: number;
}
