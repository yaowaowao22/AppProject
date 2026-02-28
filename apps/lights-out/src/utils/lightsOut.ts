import type { Difficulty, DifficultyConfig } from '../types';

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { label: '初級 (3x3)', size: 3 },
  medium: { label: '中級 (5x5)', size: 5 },
  hard: { label: '上級 (7x7)', size: 7 },
};

/** Create an NxN grid filled with false (all lights off) */
export function createEmptyGrid(size: number): boolean[][] {
  return Array.from({ length: size }, () => Array(size).fill(false));
}

/** Toggle a cell and its 4 neighbors. Returns a new grid. */
export function toggleCell(grid: boolean[][], row: number, col: number): boolean[][] {
  const size = grid.length;
  const newGrid = grid.map((r) => [...r]);

  const targets: [number, number][] = [
    [row, col],
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ];

  for (const [r, c] of targets) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      newGrid[r][c] = !newGrid[r][c];
    }
  }

  return newGrid;
}

/** Check if all lights are off (win condition) */
export function checkWin(grid: boolean[][]): boolean {
  return grid.every((row) => row.every((cell) => !cell));
}

/** Count the number of lights currently on */
export function countLightsOn(grid: boolean[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell) count++;
    }
  }
  return count;
}

/**
 * Generate a solvable puzzle by working backwards from solved state.
 * We start with all lights off and apply random toggles.
 * The resulting grid is guaranteed solvable because every toggle is reversible.
 */
export function generateSolvablePuzzle(size: number, numToggles?: number): {
  grid: boolean[][];
  solution: [number, number][];
} {
  const toggleCount = numToggles ?? Math.max(size, Math.floor(size * size * 0.4));
  let grid = createEmptyGrid(size);
  const solution: [number, number][] = [];

  for (let i = 0; i < toggleCount; i++) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    grid = toggleCell(grid, r, c);
    solution.push([r, c]);
  }

  // If we ended up with all lights off, add one more toggle
  if (checkWin(grid)) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    grid = toggleCell(grid, r, c);
    solution.push([r, c]);
  }

  return { grid, solution };
}

/**
 * Build a grid from a toggle sequence (used for pre-made levels).
 * Starting from all-off, apply each toggle in sequence.
 */
export function buildGridFromSequence(size: number, toggleSequence: [number, number][]): boolean[][] {
  let grid = createEmptyGrid(size);
  for (const [r, c] of toggleSequence) {
    grid = toggleCell(grid, r, c);
  }
  return grid;
}

/**
 * Solve a Lights Out puzzle using Gaussian elimination over GF(2).
 * Returns an array of [row, col] cells to press, or null if unsolvable.
 */
export function solvePuzzle(grid: boolean[][]): [number, number][] | null {
  const n = grid.length;
  const total = n * n;

  // Build augmented matrix [A | b] over GF(2)
  // Each variable corresponds to pressing cell (r, c), index = r * n + c
  // Each equation corresponds to cell (r, c) that must end up off
  const matrix: number[][] = [];

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const row = new Array(total + 1).fill(0);

      // Pressing cell (pr, pc) affects cell (r, c) if they are neighbors or same
      const neighbors: [number, number][] = [
        [r, c],
        [r - 1, c],
        [r + 1, c],
        [r, c - 1],
        [r, c + 1],
      ];

      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
          row[nr * n + nc] = 1;
        }
      }

      // Right-hand side: current state of cell (r, c)
      row[total] = grid[r][c] ? 1 : 0;
      matrix.push(row);
    }
  }

  // Gaussian elimination over GF(2)
  const pivotCol = new Array(total).fill(-1);
  let pivotRow = 0;

  for (let col = 0; col < total && pivotRow < total; col++) {
    // Find pivot
    let found = -1;
    for (let r = pivotRow; r < total; r++) {
      if (matrix[r][col] === 1) {
        found = r;
        break;
      }
    }
    if (found === -1) continue;

    // Swap rows
    [matrix[pivotRow], matrix[found]] = [matrix[found], matrix[pivotRow]];
    pivotCol[col] = pivotRow;

    // Eliminate
    for (let r = 0; r < total; r++) {
      if (r !== pivotRow && matrix[r][col] === 1) {
        for (let j = 0; j <= total; j++) {
          matrix[r][j] ^= matrix[pivotRow][j];
        }
      }
    }

    pivotRow++;
  }

  // Check consistency
  for (let r = pivotRow; r < total; r++) {
    if (matrix[r][total] === 1) return null; // No solution
  }

  // Extract solution (set free variables to 0)
  const solution = new Array(total).fill(0);
  for (let col = 0; col < total; col++) {
    if (pivotCol[col] !== -1) {
      solution[col] = matrix[pivotCol[col]][total];
    }
  }

  // Convert to [row, col] pairs
  const moves: [number, number][] = [];
  for (let i = 0; i < total; i++) {
    if (solution[i] === 1) {
      moves.push([Math.floor(i / n), i % n]);
    }
  }

  return moves;
}

/**
 * Get one optimal hint: find a cell from the solution that should be pressed.
 * Returns [row, col] or null if already solved.
 */
export function getHint(grid: boolean[][]): [number, number] | null {
  if (checkWin(grid)) return null;

  const solution = solvePuzzle(grid);
  if (!solution || solution.length === 0) return null;

  // Return a random cell from the solution for variety
  const idx = Math.floor(Math.random() * solution.length);
  return solution[idx];
}
