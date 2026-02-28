import type { Cell, Difficulty } from '../types';

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { rows: number; cols: number; mines: number; label: string }
> = {
  easy: { rows: 9, cols: 9, mines: 10, label: '初級' },
  medium: { rows: 12, cols: 12, mines: 30, label: '中級' },
  hard: { rows: 14, cols: 14, mines: 50, label: '上級' },
};

export function createEmptyGrid(rows: number, cols: number): Cell[][] {
  const grid: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        isMine: false,
        adjacentMines: 0,
        revealed: false,
        flagged: false,
      });
    }
    grid.push(row);
  }
  return grid;
}

function getNeighbors(
  row: number,
  col: number,
  rows: number,
  cols: number
): [number, number][] {
  const neighbors: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push([nr, nc]);
      }
    }
  }
  return neighbors;
}

export function placeMines(
  grid: Cell[][],
  rows: number,
  cols: number,
  mineCount: number,
  safeRow: number,
  safeCol: number
): Cell[][] {
  const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));

  const safeCells = new Set<string>();
  safeCells.add(`${safeRow},${safeCol}`);
  for (const [nr, nc] of getNeighbors(safeRow, safeCol, rows, cols)) {
    safeCells.add(`${nr},${nc}`);
  }

  let placed = 0;
  while (placed < mineCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!newGrid[r][c].isMine && !safeCells.has(`${r},${c}`)) {
      newGrid[r][c].isMine = true;
      placed++;
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (newGrid[r][c].isMine) continue;
      let count = 0;
      for (const [nr, nc] of getNeighbors(r, c, rows, cols)) {
        if (newGrid[nr][nc].isMine) count++;
      }
      newGrid[r][c].adjacentMines = count;
    }
  }

  return newGrid;
}

export function revealCell(
  grid: Cell[][],
  row: number,
  col: number,
  rows: number,
  cols: number
): Cell[][] {
  const newGrid = grid.map((r) => r.map((c) => ({ ...c })));
  const cell = newGrid[row][col];

  if (cell.revealed || cell.flagged) return newGrid;

  cell.revealed = true;

  if (cell.isMine) return newGrid;

  if (cell.adjacentMines === 0) {
    const stack: [number, number][] = [[row, col]];
    while (stack.length > 0) {
      const [cr, cc] = stack.pop()!;
      for (const [nr, nc] of getNeighbors(cr, cc, rows, cols)) {
        const neighbor = newGrid[nr][nc];
        if (!neighbor.revealed && !neighbor.flagged && !neighbor.isMine) {
          neighbor.revealed = true;
          if (neighbor.adjacentMines === 0) {
            stack.push([nr, nc]);
          }
        }
      }
    }
  }

  return newGrid;
}

export function toggleFlag(
  grid: Cell[][],
  row: number,
  col: number
): Cell[][] {
  const newGrid = grid.map((r) => r.map((c) => ({ ...c })));
  const cell = newGrid[row][col];
  if (cell.revealed) return newGrid;
  cell.flagged = !cell.flagged;
  return newGrid;
}

export function checkWin(grid: Cell[][]): boolean {
  for (const row of grid) {
    for (const cell of row) {
      if (!cell.isMine && !cell.revealed) return false;
    }
  }
  return true;
}

export function revealAllMines(grid: Cell[][]): Cell[][] {
  return grid.map((row) =>
    row.map((cell) => ({
      ...cell,
      revealed: cell.isMine ? true : cell.revealed,
    }))
  );
}

export function countFlags(grid: Cell[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.flagged) count++;
    }
  }
  return count;
}

export function findSafeUnrevealedCell(
  grid: Cell[][]
): [number, number] | null {
  const candidates: [number, number][] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const cell = grid[r][c];
      if (!cell.isMine && !cell.revealed && !cell.flagged) {
        candidates.push([r, c]);
      }
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
