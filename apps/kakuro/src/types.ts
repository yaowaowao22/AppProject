/** Cell type in a Kakuro grid */
export type CellType = 'blocked' | 'clue' | 'empty';

/** A clue cell showing sum targets for down and/or right runs */
export interface ClueCell {
  type: 'clue';
  right?: number;  // sum target for the run going right
  down?: number;   // sum target for the run going down
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

/** A complete Kakuro puzzle definition */
export interface KakuroPuzzle {
  id: string;
  name: string;
  rows: number;
  cols: number;
  difficulty: 'easy' | 'medium' | 'hard';
  grid: KakuroCellDef[][];
  solution: number[][];  // 0 for blocked/clue cells, 1-9 for empty cells
}

/** Result of a completed puzzle */
export interface PuzzleResult {
  id: string;
  puzzleId: string;
  puzzleName: string;
  difficulty: string;
  size: string;
  date: string;
  timeSeconds: number;
}
