import { CellState } from '../types';

/**
 * Generate clues for a single line (row or column).
 * Consecutive filled cells form a group, and the clue is the length of each group.
 * If no cells are filled, the clue is [0].
 */
export function generateLineClues(line: boolean[]): number[] {
  const clues: number[] = [];
  let count = 0;

  for (let i = 0; i < line.length; i++) {
    if (line[i]) {
      count++;
    } else {
      if (count > 0) {
        clues.push(count);
        count = 0;
      }
    }
  }

  if (count > 0) {
    clues.push(count);
  }

  return clues.length > 0 ? clues : [0];
}

/**
 * Generate row clues for the entire grid.
 */
export function generateRowClues(grid: boolean[][]): number[][] {
  return grid.map((row) => generateLineClues(row));
}

/**
 * Generate column clues for the entire grid.
 */
export function generateColClues(grid: boolean[][]): number[][] {
  if (grid.length === 0) return [];

  const cols = grid[0].length;
  const clues: number[][] = [];

  for (let c = 0; c < cols; c++) {
    const column: boolean[] = [];
    for (let r = 0; r < grid.length; r++) {
      column.push(grid[r][c]);
    }
    clues.push(generateLineClues(column));
  }

  return clues;
}

/**
 * Create an empty player grid of the given size.
 */
export function createEmptyGrid(size: number): CellState[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => 'empty' as CellState)
  );
}

/**
 * Toggle a cell state: empty -> filled -> marked -> empty
 */
export function toggleCell(current: CellState): CellState {
  switch (current) {
    case 'empty':
      return 'filled';
    case 'filled':
      return 'marked';
    case 'marked':
      return 'empty';
  }
}

/**
 * Check if the player's grid matches the solution.
 * A cell is correct if:
 * - Solution is true and player is 'filled'
 * - Solution is false and player is NOT 'filled' (empty or marked both ok)
 */
export function checkSolution(
  playerGrid: CellState[][],
  solution: boolean[][]
): boolean {
  for (let r = 0; r < solution.length; r++) {
    for (let c = 0; c < solution[r].length; c++) {
      const shouldBeFilled = solution[r][c];
      const isFilled = playerGrid[r][c] === 'filled';
      if (shouldBeFilled !== isFilled) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Count the number of incorrect cells in the player's grid.
 */
export function countErrors(
  playerGrid: CellState[][],
  solution: boolean[][]
): number {
  let errors = 0;
  for (let r = 0; r < solution.length; r++) {
    for (let c = 0; c < solution[r].length; c++) {
      const shouldBeFilled = solution[r][c];
      const isFilled = playerGrid[r][c] === 'filled';
      if (shouldBeFilled !== isFilled) {
        errors++;
      }
    }
  }
  return errors;
}

/**
 * Find a random incorrect cell and return its coordinates.
 * Returns null if the grid is already correct.
 */
export function findRandomIncorrectCell(
  playerGrid: CellState[][],
  solution: boolean[][]
): { row: number; col: number } | null {
  const incorrectCells: { row: number; col: number }[] = [];

  for (let r = 0; r < solution.length; r++) {
    for (let c = 0; c < solution[r].length; c++) {
      const shouldBeFilled = solution[r][c];
      const isFilled = playerGrid[r][c] === 'filled';
      if (shouldBeFilled !== isFilled) {
        incorrectCells.push({ row: r, col: c });
      }
    }
  }

  if (incorrectCells.length === 0) return null;

  const index = Math.floor(Math.random() * incorrectCells.length);
  return incorrectCells[index];
}

/**
 * Format seconds into mm:ss string.
 */
export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
