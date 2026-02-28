/**
 * Word Search grid generation utilities.
 * Places katakana words in horizontal, vertical, and diagonal (forward-only) directions,
 * then fills remaining cells with random katakana.
 */

export type Direction = 'horizontal' | 'vertical' | 'diagonal';

export interface PlacedWord {
  word: string;
  startRow: number;
  startCol: number;
  direction: Direction;
}

export interface WordSearchGrid {
  grid: string[][];
  size: number;
  placedWords: PlacedWord[];
}

/** All katakana characters used for random fill */
const KATAKANA =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

const DIRECTION_DELTAS: Record<Direction, { dr: number; dc: number }> = {
  horizontal: { dr: 0, dc: 1 },
  vertical: { dr: 1, dc: 0 },
  diagonal: { dr: 1, dc: 1 },
};

const ALL_DIRECTIONS: Direction[] = ['horizontal', 'vertical', 'diagonal'];

function getRandomKatakana(): string {
  return KATAKANA[Math.floor(Math.random() * KATAKANA.length)];
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Check whether a word can be placed at the given position and direction.
 */
function canPlace(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: Direction,
  size: number,
): boolean {
  const { dr, dc } = DIRECTION_DELTAS[direction];
  const endRow = row + dr * (word.length - 1);
  const endCol = col + dc * (word.length - 1);

  if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) {
    return false;
  }

  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    const existing = grid[r][c];
    if (existing !== '' && existing !== word[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Place a word on the grid.
 */
function placeWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: Direction,
): void {
  const { dr, dc } = DIRECTION_DELTAS[direction];
  for (let i = 0; i < word.length; i++) {
    grid[row + dr * i][col + dc * i] = word[i];
  }
}

/**
 * Select words that fit within the grid size.
 * For 8x8 pick 5 words, for 10x10 pick 7, for 12x12 pick 9.
 */
function selectWords(words: string[], gridSize: number): string[] {
  const maxWordLen = gridSize;
  const eligible = words.filter((w) => w.length <= maxWordLen);
  const shuffled = shuffleArray(eligible);

  let count: number;
  if (gridSize <= 8) {
    count = 5;
  } else if (gridSize <= 10) {
    count = 7;
  } else {
    count = 9;
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Generate a complete word search grid.
 */
export function generateGrid(
  wordPool: string[],
  size: number,
): WordSearchGrid {
  const grid: string[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ''),
  );

  const selectedWords = selectWords(wordPool, size);
  const placedWords: PlacedWord[] = [];

  for (const word of selectedWords) {
    let placed = false;
    const directions = shuffleArray(ALL_DIRECTIONS);

    // Try up to 100 random placements per word
    for (let attempt = 0; attempt < 100 && !placed; attempt++) {
      const dir = directions[attempt % directions.length];
      const { dr, dc } = DIRECTION_DELTAS[dir];

      const maxRow = size - (dr * (word.length - 1));
      const maxCol = size - (dc * (word.length - 1));

      const row = Math.floor(Math.random() * maxRow);
      const col = Math.floor(Math.random() * maxCol);

      if (canPlace(grid, word, row, col, dir, size)) {
        placeWord(grid, word, row, col, dir);
        placedWords.push({ word, startRow: row, startCol: col, direction: dir });
        placed = true;
      }
    }
  }

  // Fill empty cells with random katakana
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = getRandomKatakana();
      }
    }
  }

  return { grid, size, placedWords };
}

/**
 * Get the cells occupied by a placed word.
 */
export function getWordCells(pw: PlacedWord): { row: number; col: number }[] {
  const { dr, dc } = DIRECTION_DELTAS[pw.direction];
  const cells: { row: number; col: number }[] = [];
  for (let i = 0; i < pw.word.length; i++) {
    cells.push({ row: pw.startRow + dr * i, col: pw.startCol + dc * i });
  }
  return cells;
}

/**
 * Check if user selection (start -> end) matches any unfound word.
 * Returns the matching PlacedWord or null.
 */
export function checkSelection(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  placedWords: PlacedWord[],
  foundWords: Set<string>,
): PlacedWord | null {
  for (const pw of placedWords) {
    if (foundWords.has(pw.word)) continue;

    const cells = getWordCells(pw);
    const first = cells[0];
    const last = cells[cells.length - 1];

    if (
      (startRow === first.row &&
        startCol === first.col &&
        endRow === last.row &&
        endCol === last.col) ||
      (startRow === last.row &&
        startCol === last.col &&
        endRow === first.row &&
        endCol === first.col)
    ) {
      return pw;
    }
  }
  return null;
}

/**
 * Get cells between start and end (inclusive) if they form a valid line.
 * Returns null if the selection is not a straight line (horizontal, vertical, or diagonal).
 */
export function getSelectionCells(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
): { row: number; col: number }[] | null {
  const dr = endRow - startRow;
  const dc = endCol - startCol;

  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);

  // Must be on a straight line
  if (absDr !== 0 && absDc !== 0 && absDr !== absDc) {
    return null;
  }

  const steps = Math.max(absDr, absDc);
  if (steps === 0) return [{ row: startRow, col: startCol }];

  const stepR = dr / steps;
  const stepC = dc / steps;

  const cells: { row: number; col: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    cells.push({
      row: startRow + stepR * i,
      col: startCol + stepC * i,
    });
  }
  return cells;
}

/**
 * Format seconds to mm:ss display string.
 */
export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export type GridSize = 8 | 10 | 12;

export interface GridSizeOption {
  size: GridSize;
  label: string;
  difficulty: string;
}

export const GRID_SIZES: GridSizeOption[] = [
  { size: 8, label: '8×8', difficulty: '初級' },
  { size: 10, label: '10×10', difficulty: '中級' },
  { size: 12, label: '12×12', difficulty: '上級' },
];
