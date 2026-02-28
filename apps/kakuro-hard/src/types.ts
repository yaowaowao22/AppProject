/** Cell type in a Kakuro grid */
export type CellType = 'blocked' | 'clue' | 'empty';

/** A clue cell showing sum targets for down and/or right runs */
export interface ClueCell {
  type: 'clue';
  right?: number;
  down?: number;
}

/** A blocked cell (solid black, no interaction) */
export interface BlockedCell {
  type: 'blocked';
}

/** An empty cell that the player fills in (1-9) */
export interface EmptyCell {
  type: 'empty';
}

/** Union type for any cell in a Kakuro grid definition */
export type KakuroCellDef = ClueCell | BlockedCell | EmptyCell;

/** Difficulty levels for advanced kakuro */
export type Difficulty = 'medium' | 'hard' | 'expert';

/** A complete Kakuro puzzle definition */
export interface KakuroPuzzle {
  id: string;
  name: string;
  rows: number;
  cols: number;
  difficulty: Difficulty;
  grid: KakuroCellDef[][];
  solution: number[][];
}

/** Result of a completed puzzle */
export interface PuzzleResult {
  id: string;
  puzzleId: string;
  puzzleName: string;
  difficulty: Difficulty;
  size: string;
  date: string;
  timeSeconds: number;
}
