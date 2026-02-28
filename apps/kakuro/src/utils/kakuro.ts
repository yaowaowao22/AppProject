import { KakuroPuzzle, KakuroCellDef } from '../types';

/**
 * A "run" is a consecutive sequence of empty cells in a row or column,
 * preceded by a clue cell that specifies the target sum.
 */
interface Run {
  targetSum: number;
  cells: { row: number; col: number }[];
}

/**
 * Extract all horizontal runs from the puzzle grid.
 */
export function getHorizontalRuns(grid: KakuroCellDef[][]): Run[] {
  const runs: Run[] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const cell = grid[r][c];
      if (cell.type === 'clue' && cell.right !== undefined) {
        const cells: { row: number; col: number }[] = [];
        let cc = c + 1;
        while (cc < grid[r].length && grid[r][cc].type === 'empty') {
          cells.push({ row: r, col: cc });
          cc++;
        }
        if (cells.length > 0) {
          runs.push({ targetSum: cell.right, cells });
        }
      }
    }
  }
  return runs;
}

/**
 * Extract all vertical runs from the puzzle grid.
 */
export function getVerticalRuns(grid: KakuroCellDef[][]): Run[] {
  const runs: Run[] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const cell = grid[r][c];
      if (cell.type === 'clue' && cell.down !== undefined) {
        const cells: { row: number; col: number }[] = [];
        let rr = r + 1;
        while (rr < grid.length && grid[rr][c].type === 'empty') {
          cells.push({ row: rr, col: c });
          rr++;
        }
        if (cells.length > 0) {
          runs.push({ targetSum: cell.down, cells });
        }
      }
    }
  }
  return runs;
}

/**
 * Get all runs (both horizontal and vertical) for a puzzle.
 */
export function getAllRuns(grid: KakuroCellDef[][]): Run[] {
  return [...getHorizontalRuns(grid), ...getVerticalRuns(grid)];
}

/**
 * Validate a single run: check no repeats and sum matches target.
 * Returns { valid, complete } where:
 * - valid: no duplicates among filled cells, partial sum does not exceed target
 * - complete: all cells are filled, sum equals target, no duplicates
 */
export function validateRun(
  run: Run,
  playerGrid: number[][]
): { valid: boolean; complete: boolean } {
  const values: number[] = [];
  let sum = 0;
  let allFilled = true;

  for (const cell of run.cells) {
    const val = playerGrid[cell.row][cell.col];
    if (val === 0) {
      allFilled = false;
    } else {
      if (val < 1 || val > 9) {
        return { valid: false, complete: false };
      }
      values.push(val);
      sum += val;
    }
  }

  // Check for duplicates
  const uniqueValues = new Set(values);
  if (uniqueValues.size !== values.length) {
    return { valid: false, complete: false };
  }

  // If partial, check that sum does not already exceed target
  if (!allFilled) {
    return { valid: sum <= run.targetSum, complete: false };
  }

  // All filled: check sum matches target
  return { valid: sum === run.targetSum, complete: sum === run.targetSum };
}

/**
 * Check if the entire puzzle is correctly completed.
 */
export function checkCompletion(
  puzzle: KakuroPuzzle,
  playerGrid: number[][]
): boolean {
  const runs = getAllRuns(puzzle.grid);
  for (const run of runs) {
    const result = validateRun(run, playerGrid);
    if (!result.complete) {
      return false;
    }
  }
  return true;
}

/**
 * Get runs that contain errors (duplicates or wrong sum).
 * Returns an array of runs that have validation errors.
 */
export function getErrorRuns(
  puzzle: KakuroPuzzle,
  playerGrid: number[][]
): Run[] {
  const runs = getAllRuns(puzzle.grid);
  return runs.filter((run) => {
    const values: number[] = [];
    let sum = 0;
    let allFilled = true;

    for (const cell of run.cells) {
      const val = playerGrid[cell.row][cell.col];
      if (val === 0) {
        allFilled = false;
      } else {
        values.push(val);
        sum += val;
      }
    }

    const uniqueValues = new Set(values);
    // Duplicate in filled values
    if (uniqueValues.size !== values.length) return true;
    // If all filled and sum doesn't match
    if (allFilled && sum !== run.targetSum) return true;
    // If partial sum already exceeds
    if (sum > run.targetSum) return true;

    return false;
  });
}

/**
 * Get all error cell positions from error runs.
 */
export function getErrorCells(
  puzzle: KakuroPuzzle,
  playerGrid: number[][]
): Set<string> {
  const errorRuns = getErrorRuns(puzzle, playerGrid);
  const errorSet = new Set<string>();
  for (const run of errorRuns) {
    for (const cell of run.cells) {
      if (playerGrid[cell.row][cell.col] !== 0) {
        errorSet.add(`${cell.row}-${cell.col}`);
      }
    }
  }
  return errorSet;
}

/**
 * Create an empty player grid (all zeros) for the given puzzle.
 */
export function createEmptyPlayerGrid(puzzle: KakuroPuzzle): number[][] {
  return Array.from({ length: puzzle.rows }, () =>
    Array.from({ length: puzzle.cols }, () => 0)
  );
}

/**
 * Find an empty cell that is not yet correctly filled and reveal its solution value.
 * Returns the cell coordinates and value, or null if all cells are correct.
 */
export function findHintCell(
  puzzle: KakuroPuzzle,
  playerGrid: number[][]
): { row: number; col: number; value: number } | null {
  const incorrectCells: { row: number; col: number; value: number }[] = [];

  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      if (puzzle.grid[r][c].type === 'empty') {
        if (playerGrid[r][c] !== puzzle.solution[r][c]) {
          incorrectCells.push({ row: r, col: c, value: puzzle.solution[r][c] });
        }
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
