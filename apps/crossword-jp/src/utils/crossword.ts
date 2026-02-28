import type { CrosswordPuzzle } from '../data/crosswords';

/**
 * Check if a specific cell matches the solution.
 */
export function isCellCorrect(
  puzzle: CrosswordPuzzle,
  row: number,
  col: number,
  value: string,
): boolean {
  return puzzle.solution[row][col] === value;
}

/**
 * Check if the entire board is correctly filled.
 * Returns true only when every active cell matches the solution.
 */
export function isBoardComplete(
  puzzle: CrosswordPuzzle,
  board: string[][],
): boolean {
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      if (puzzle.grid[r][c] === 1) {
        if (board[r][c] !== puzzle.solution[r][c]) {
          return false;
        }
      }
    }
  }
  return true;
}

/**
 * Count how many active cells are filled (non-empty).
 */
export function countFilledCells(
  puzzle: CrosswordPuzzle,
  board: string[][],
): number {
  let count = 0;
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      if (puzzle.grid[r][c] === 1 && board[r][c] !== '') {
        count++;
      }
    }
  }
  return count;
}

/**
 * Count total active (white) cells.
 */
export function countActiveCells(puzzle: CrosswordPuzzle): number {
  let count = 0;
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      if (puzzle.grid[r][c] === 1) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Count how many cells have incorrect (non-empty, wrong) values.
 */
export function countErrors(
  puzzle: CrosswordPuzzle,
  board: string[][],
): number {
  let count = 0;
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      if (puzzle.grid[r][c] === 1 && board[r][c] !== '' && board[r][c] !== puzzle.solution[r][c]) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Create an empty board for a puzzle (empty strings for active, empty for blocked).
 */
export function createEmptyBoard(puzzle: CrosswordPuzzle): string[][] {
  return Array.from({ length: puzzle.rows }, (_, r) =>
    Array.from({ length: puzzle.cols }, (_, c) => ''),
  );
}

/**
 * Deep clone a string board.
 */
export function cloneBoard(board: string[][]): string[][] {
  return board.map((row) => [...row]);
}

export type Direction = 'across' | 'down';

/**
 * Find which clue word a cell belongs to for a given direction.
 * Returns the clue number or null if the cell doesn't belong to a word in that direction.
 */
export function getClueNumberForCell(
  puzzle: CrosswordPuzzle,
  row: number,
  col: number,
  direction: Direction,
): number | null {
  if (puzzle.grid[row][col] === 0) return null;

  if (direction === 'across') {
    // Walk left to find the start of the across word
    let c = col;
    while (c > 0 && puzzle.grid[row][c - 1] === 1) {
      c--;
    }
    // Check if there's actually a word here (at least 2 cells)
    if (c < puzzle.cols - 1 && puzzle.grid[row][c + 1] === 1) {
      const num = puzzle.cellNumbers[row][c];
      if (num > 0 && puzzle.acrossClues.some((cl) => cl.number === num)) {
        return num;
      }
    }
  } else {
    // Walk up to find the start of the down word
    let r = row;
    while (r > 0 && puzzle.grid[r - 1][col] === 1) {
      r--;
    }
    if (r < puzzle.rows - 1 && puzzle.grid[r + 1][col] === 1) {
      const num = puzzle.cellNumbers[r][col];
      if (num > 0 && puzzle.downClues.some((cl) => cl.number === num)) {
        return num;
      }
    }
  }

  return null;
}

/**
 * Get all cells that belong to a word (by clue number and direction).
 */
export function getWordCells(
  puzzle: CrosswordPuzzle,
  clueNumber: number,
  direction: Direction,
): [number, number][] {
  // Find the starting cell with this number
  let startRow = -1;
  let startCol = -1;
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      if (puzzle.cellNumbers[r][c] === clueNumber) {
        startRow = r;
        startCol = c;
        break;
      }
    }
    if (startRow >= 0) break;
  }

  if (startRow < 0) return [];

  const cells: [number, number][] = [];
  if (direction === 'across') {
    let c = startCol;
    while (c < puzzle.cols && puzzle.grid[startRow][c] === 1) {
      cells.push([startRow, c]);
      c++;
    }
  } else {
    let r = startRow;
    while (r < puzzle.rows && puzzle.grid[r][startCol] === 1) {
      cells.push([r, startCol]);
      r++;
    }
  }

  return cells;
}

/**
 * Find a random empty or incorrect cell for hint.
 * Returns [row, col] or null if all cells are correct.
 */
export function findHintCell(
  puzzle: CrosswordPuzzle,
  board: string[][],
): [number, number] | null {
  const candidates: [number, number][] = [];
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      if (puzzle.grid[r][c] === 1 && board[r][c] !== puzzle.solution[r][c]) {
        candidates.push([r, c]);
      }
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Format seconds into MM:SS string.
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Katakana characters for the keyboard.
 */
export const KATAKANA_ROWS: string[][] = [
  ['ア', 'イ', 'ウ', 'エ', 'オ'],
  ['カ', 'キ', 'ク', 'ケ', 'コ'],
  ['サ', 'シ', 'ス', 'セ', 'ソ'],
  ['タ', 'チ', 'ツ', 'テ', 'ト'],
  ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'],
  ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'],
  ['マ', 'ミ', 'ム', 'メ', 'モ'],
  ['ヤ', 'ユ', 'ヨ', 'ラ', 'リ'],
  ['ル', 'レ', 'ロ', 'ワ', 'ン'],
  ['ー', 'ガ', 'ギ', 'グ', 'ゲ'],
  ['ゴ', 'ザ', 'ジ', 'ズ', 'ゼ'],
  ['ゾ', 'ダ', 'ヂ', 'ヅ', 'デ'],
  ['ド', 'バ', 'ビ', 'ブ', 'ベ'],
  ['ボ', 'パ', 'ピ', 'プ', 'ペ'],
  ['ポ', 'ャ', 'ュ', 'ョ', 'ッ'],
];
