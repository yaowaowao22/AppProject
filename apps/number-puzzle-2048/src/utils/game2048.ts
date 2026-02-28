import type { Grid } from '../types';

export function createEmptyGrid(): Grid {
  return Array.from({ length: 4 }, () => Array(4).fill(null));
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

function getEmptyCells(grid: Grid): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (grid[row][col] === null) {
        cells.push({ row, col });
      }
    }
  }
  return cells;
}

export function addRandomTile(grid: Grid): Grid {
  const newGrid = cloneGrid(grid);
  const emptyCells = getEmptyCells(newGrid);
  if (emptyCells.length === 0) return newGrid;

  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  const cell = emptyCells[randomIndex];
  newGrid[cell.row][cell.col] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
}

export function initializeGrid(): Grid {
  let grid = createEmptyGrid();
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return grid;
}

function slideLine(line: (number | null)[]): { newLine: (number | null)[]; score: number } {
  const filtered = line.filter((v): v is number => v !== null);
  const merged: (number | null)[] = [];
  let score = 0;
  let skip = false;

  for (let i = 0; i < filtered.length; i++) {
    if (skip) {
      skip = false;
      continue;
    }
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const mergedValue = filtered[i] * 2;
      merged.push(mergedValue);
      score += mergedValue;
      skip = true;
    } else {
      merged.push(filtered[i]);
    }
  }

  while (merged.length < 4) {
    merged.push(null);
  }

  return { newLine: merged, score };
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export function move(
  grid: Grid,
  direction: Direction
): { newGrid: Grid; score: number; moved: boolean } {
  const newGrid = cloneGrid(grid);
  let totalScore = 0;

  if (direction === 'left') {
    for (let row = 0; row < 4; row++) {
      const { newLine, score } = slideLine(newGrid[row]);
      newGrid[row] = newLine;
      totalScore += score;
    }
  } else if (direction === 'right') {
    for (let row = 0; row < 4; row++) {
      const reversed = [...newGrid[row]].reverse();
      const { newLine, score } = slideLine(reversed);
      newGrid[row] = newLine.reverse();
      totalScore += score;
    }
  } else if (direction === 'up') {
    for (let col = 0; col < 4; col++) {
      const column = [newGrid[0][col], newGrid[1][col], newGrid[2][col], newGrid[3][col]];
      const { newLine, score } = slideLine(column);
      for (let row = 0; row < 4; row++) {
        newGrid[row][col] = newLine[row];
      }
      totalScore += score;
    }
  } else if (direction === 'down') {
    for (let col = 0; col < 4; col++) {
      const column = [newGrid[3][col], newGrid[2][col], newGrid[1][col], newGrid[0][col]];
      const { newLine, score } = slideLine(column);
      const reversed = newLine.reverse();
      for (let row = 0; row < 4; row++) {
        newGrid[row][col] = reversed[row];
      }
      totalScore += score;
    }
  }

  const moved = !gridsEqual(grid, newGrid);
  return { newGrid, score: totalScore, moved };
}

function gridsEqual(a: Grid, b: Grid): boolean {
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (a[row][col] !== b[row][col]) return false;
    }
  }
  return true;
}

export function hasValidMoves(grid: Grid): boolean {
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (grid[row][col] === null) return true;
      if (col + 1 < 4 && grid[row][col] === grid[row][col + 1]) return true;
      if (row + 1 < 4 && grid[row][col] === grid[row + 1][col]) return true;
    }
  }
  return false;
}

export function getHighestTile(grid: Grid): number {
  let max = 0;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const val = grid[row][col];
      if (val !== null && val > max) {
        max = val;
      }
    }
  }
  return max;
}

export function hasWon(grid: Grid): boolean {
  return getHighestTile(grid) >= 2048;
}

export const TILE_COLORS: Record<number, string> = {
  2: '#eee4da',
  4: '#ede0c8',
  8: '#f2b179',
  16: '#f59563',
  32: '#f67c5f',
  64: '#f65e3b',
  128: '#edcf72',
  256: '#edcc61',
  512: '#edc850',
  1024: '#edc53f',
  2048: '#edc22e',
};

export function getTileColor(value: number | null): string {
  if (value === null) return 'transparent';
  return TILE_COLORS[value] || '#3c3a32';
}

export function getTileTextColor(value: number | null): string {
  if (value === null) return 'transparent';
  if (value <= 4) return '#776e65';
  return '#f9f6f2';
}

export function getTileFontSize(value: number | null, tileSize: number): number {
  if (value === null) return 0;
  if (value < 100) return tileSize * 0.4;
  if (value < 1000) return tileSize * 0.33;
  return tileSize * 0.26;
}
