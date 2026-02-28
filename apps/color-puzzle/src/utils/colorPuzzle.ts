import type { Difficulty, PuzzleColor } from '../types';

export const PUZZLE_COLORS: string[] = [
  '#E53935', // red
  '#1E88E5', // blue
  '#43A047', // green
  '#FDD835', // yellow
  '#8E24AA', // purple
  '#FB8C00', // orange
];

export const COLOR_LABELS: string[] = [
  '赤',
  '青',
  '緑',
  '黄',
  '紫',
  '橙',
];

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { size: number; colorCount: number; targetMoves: number; label: string }
> = {
  easy: { size: 6, colorCount: 4, targetMoves: 12, label: '初級' },
  medium: { size: 8, colorCount: 5, targetMoves: 18, label: '中級' },
  hard: { size: 10, colorCount: 6, targetMoves: 25, label: '上級' },
};

export function generateGrid(size: number, colorCount: number): PuzzleColor[][] {
  const grid: PuzzleColor[][] = [];
  for (let r = 0; r < size; r++) {
    const row: PuzzleColor[] = [];
    for (let c = 0; c < size; c++) {
      row.push(Math.floor(Math.random() * colorCount) as PuzzleColor);
    }
    grid.push(row);
  }
  return grid;
}

export function getFloodRegion(grid: PuzzleColor[][], size: number): boolean[][] {
  const visited: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );
  const originColor = grid[0][0];
  const stack: [number, number][] = [[0, 0]];
  visited[0][0] = true;

  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const neighbors: [number, number][] = [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ];
    for (const [nr, nc] of neighbors) {
      if (
        nr >= 0 &&
        nr < size &&
        nc >= 0 &&
        nc < size &&
        !visited[nr][nc] &&
        grid[nr][nc] === originColor
      ) {
        visited[nr][nc] = true;
        stack.push([nr, nc]);
      }
    }
  }

  return visited;
}

export function applyFloodFill(
  grid: PuzzleColor[][],
  size: number,
  newColor: PuzzleColor
): PuzzleColor[][] {
  if (grid[0][0] === newColor) return grid;

  const region = getFloodRegion(grid, size);
  const newGrid = grid.map((row) => [...row]);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (region[r][c]) {
        newGrid[r][c] = newColor;
      }
    }
  }

  return newGrid;
}

export function checkWin(grid: PuzzleColor[][], size: number): boolean {
  const color = grid[0][0];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== color) return false;
    }
  }
  return true;
}

export function calculateStars(moves: number, targetMoves: number): number {
  if (moves < targetMoves) return 3;
  if (moves === targetMoves) return 2;
  return 1;
}

export function countFloodRegionSize(grid: PuzzleColor[][], size: number): number {
  const region = getFloodRegion(grid, size);
  let count = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (region[r][c]) count++;
    }
  }
  return count;
}
