import { CellValue, Puzzle } from '../types';

/**
 * Creates an empty grid for the logic puzzle.
 * The grid tracks relationships between items of different categories.
 * For N categories with M items each, we need C(N,2) sub-grids of MxM.
 * Each sub-grid represents one pair of categories.
 */
export function createEmptyGrid(puzzle: Puzzle): CellValue[][][] {
  const numCategories = puzzle.categories.length;
  const size = puzzle.items[0].length;
  const numPairs = (numCategories * (numCategories - 1)) / 2;
  const grid: CellValue[][][] = [];
  for (let i = 0; i < numPairs; i++) {
    const subGrid: CellValue[][] = [];
    for (let r = 0; r < size; r++) {
      const row: CellValue[] = [];
      for (let c = 0; c < size; c++) {
        row.push('empty');
      }
      subGrid.push(row);
    }
    grid.push(subGrid);
  }
  return grid;
}

/**
 * Get the index of a category pair in the flat grid array.
 * Pairs are ordered: (0,1), (0,2), (1,2) for 3 categories.
 * For N categories: (0,1), (0,2), ..., (0,N-1), (1,2), ..., (N-2,N-1)
 */
export function getPairIndex(cat1: number, cat2: number, numCategories: number): number {
  const a = Math.min(cat1, cat2);
  const b = Math.max(cat1, cat2);
  let index = 0;
  for (let i = 0; i < a; i++) {
    index += numCategories - 1 - i;
  }
  index += b - a - 1;
  return index;
}

/**
 * Get all category pairs for display purposes.
 * Returns array of [cat1Index, cat2Index] pairs.
 */
export function getCategoryPairs(numCategories: number): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < numCategories; i++) {
    for (let j = i + 1; j < numCategories; j++) {
      pairs.push([i, j]);
    }
  }
  return pairs;
}

/**
 * Toggle a cell value in the grid: empty -> circle -> cross -> empty
 */
export function toggleCellValue(current: CellValue): CellValue {
  switch (current) {
    case 'empty':
      return 'circle';
    case 'circle':
      return 'cross';
    case 'cross':
      return 'empty';
  }
}

/**
 * Check if the player's grid matches the puzzle's solution.
 * Only checks the circles (positive matches) against the expected solution.
 */
export function checkSolution(grid: CellValue[][][], puzzle: Puzzle): boolean {
  const size = puzzle.items[0].length;
  const numCategories = puzzle.categories.length;
  const firstCategoryItems = puzzle.items[0];

  for (let itemIdx = 0; itemIdx < size; itemIdx++) {
    const itemName = firstCategoryItems[itemIdx];
    const expected = puzzle.solution[itemName];
    if (!expected) return false;

    for (let catIdx = 1; catIdx < numCategories; catIdx++) {
      const expectedValue = expected[puzzle.categories[catIdx]];
      const expectedCol = puzzle.items[catIdx].indexOf(expectedValue);
      if (expectedCol === -1) return false;

      const pairIdx = getPairIndex(0, catIdx, numCategories);

      for (let col = 0; col < size; col++) {
        const cellValue = grid[pairIdx][itemIdx][col];
        if (col === expectedCol) {
          if (cellValue !== 'circle') return false;
        } else {
          if (cellValue === 'circle') return false;
        }
      }
    }
  }

  // Also check pairs not involving category 0
  for (let cat1 = 1; cat1 < numCategories; cat1++) {
    for (let cat2 = cat1 + 1; cat2 < numCategories; cat2++) {
      const pairIdx = getPairIndex(cat1, cat2, numCategories);

      for (let row = 0; row < size; row++) {
        const cat1ItemName = puzzle.items[cat1][row];
        // Find which first-category item maps to this cat1 item
        let expectedCat2Item: string | null = null;
        for (const [firstItem, mapping] of Object.entries(puzzle.solution)) {
          if (mapping[puzzle.categories[cat1]] === cat1ItemName) {
            expectedCat2Item = mapping[puzzle.categories[cat2]];
            break;
          }
        }
        if (!expectedCat2Item) return false;

        const expectedCol = puzzle.items[cat2].indexOf(expectedCat2Item);
        if (expectedCol === -1) return false;

        for (let col = 0; col < size; col++) {
          const cellValue = grid[pairIdx][row][col];
          if (col === expectedCol) {
            if (cellValue !== 'circle') return false;
          } else {
            if (cellValue === 'circle') return false;
          }
        }
      }
    }
  }

  return true;
}

/**
 * Find a random cell that is incorrectly filled (for hint).
 * Returns the pairIndex, row, col, and correct value.
 */
export function findHintCell(
  grid: CellValue[][][],
  puzzle: Puzzle,
): { pairIdx: number; row: number; col: number; value: CellValue } | null {
  const size = puzzle.items[0].length;
  const incorrectCells: { pairIdx: number; row: number; col: number; value: CellValue }[] = [];

  // Build the full expected grid from the solution
  const expectedGrid = buildExpectedGrid(puzzle);

  for (let pairIdx = 0; pairIdx < grid.length; pairIdx++) {
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const current = grid[pairIdx][row][col];
        const expected = expectedGrid[pairIdx][row][col];
        if (current !== expected) {
          incorrectCells.push({ pairIdx, row, col, value: expected });
        }
      }
    }
  }

  if (incorrectCells.length === 0) return null;

  // Prefer revealing a circle (positive match) over a cross
  const circles = incorrectCells.filter((c) => c.value === 'circle');
  if (circles.length > 0) {
    return circles[Math.floor(Math.random() * circles.length)];
  }

  return incorrectCells[Math.floor(Math.random() * incorrectCells.length)];
}

/**
 * Build the expected complete grid from the solution.
 */
export function buildExpectedGrid(puzzle: Puzzle): CellValue[][][] {
  const size = puzzle.items[0].length;
  const numCategories = puzzle.categories.length;
  const pairs = getCategoryPairs(numCategories);

  const grid: CellValue[][][] = [];
  for (let p = 0; p < pairs.length; p++) {
    const subGrid: CellValue[][] = [];
    for (let r = 0; r < size; r++) {
      const row: CellValue[] = [];
      for (let c = 0; c < size; c++) {
        row.push('cross');
      }
      subGrid.push(row);
    }
    grid.push(subGrid);
  }

  // Fill in circles based on solution
  for (let pairIdx = 0; pairIdx < pairs.length; pairIdx++) {
    const [cat1, cat2] = pairs[pairIdx];

    if (cat1 === 0) {
      // Direct mapping from first category
      for (let row = 0; row < size; row++) {
        const itemName = puzzle.items[0][row];
        const mapping = puzzle.solution[itemName];
        if (mapping) {
          const expectedValue = mapping[puzzle.categories[cat2]];
          const col = puzzle.items[cat2].indexOf(expectedValue);
          if (col !== -1) {
            grid[pairIdx][row][col] = 'circle';
          }
        }
      }
    } else {
      // Indirect mapping through first category
      for (let row = 0; row < size; row++) {
        const cat1Item = puzzle.items[cat1][row];
        for (const [firstItem, mapping] of Object.entries(puzzle.solution)) {
          if (mapping[puzzle.categories[cat1]] === cat1Item) {
            const expectedValue = mapping[puzzle.categories[cat2]];
            const col = puzzle.items[cat2].indexOf(expectedValue);
            if (col !== -1) {
              grid[pairIdx][row][col] = 'circle';
            }
            break;
          }
        }
      }
    }
  }

  return grid;
}

/**
 * Format seconds to mm:ss string.
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Get display symbol for a cell value.
 */
export function getCellSymbol(value: CellValue): string {
  switch (value) {
    case 'empty':
      return '';
    case 'circle':
      return '\u25CB';
    case 'cross':
      return '\u00D7';
  }
}

/**
 * Get the difficulty display label.
 */
export function getDifficultyLabel(difficulty: string): string {
  switch (difficulty) {
    case 'easy':
      return '初級 (3x3)';
    case 'medium':
      return '中級 (4x4)';
    case 'hard':
      return '上級 (5x5)';
    default:
      return difficulty;
  }
}
