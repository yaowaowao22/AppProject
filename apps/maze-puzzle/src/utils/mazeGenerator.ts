export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Cell {
  row: number;
  col: number;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
}

export interface Maze {
  cells: Cell[][];
  rows: number;
  cols: number;
}

export interface MazeResult {
  id: string;
  difficulty: Difficulty;
  timeSeconds: number;
  moves: number;
  date: string;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, { size: number; label: string }> = {
  easy: { size: 7, label: '7x7 かんたん' },
  medium: { size: 11, label: '11x11 ふつう' },
  hard: { size: 15, label: '15x15 むずかしい' },
};

export function getMazeSize(difficulty: Difficulty): number {
  return DIFFICULTY_CONFIG[difficulty].size;
}

export function generateMaze(rows: number, cols: number): Maze {
  const cells: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    cells[r] = [];
    for (let c = 0; c < cols; c++) {
      cells[r][c] = {
        row: r,
        col: c,
        walls: { top: true, right: true, bottom: true, left: true },
      };
    }
  }

  const visited: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );

  const stack: [number, number][] = [];
  visited[0][0] = true;
  stack.push([0, 0]);

  while (stack.length > 0) {
    const [cr, cc] = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(cr, cc, rows, cols, visited);

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const [nr, nc] = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWall(cells, cr, cc, nr, nc);
      visited[nr][nc] = true;
      stack.push([nr, nc]);
    }
  }

  return { cells, rows, cols };
}

function getUnvisitedNeighbors(
  row: number,
  col: number,
  rows: number,
  cols: number,
  visited: boolean[][]
): [number, number][] {
  const neighbors: [number, number][] = [];
  const directions: [number, number][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (const [dr, dc] of directions) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
      neighbors.push([nr, nc]);
    }
  }

  return neighbors;
}

function removeWall(
  cells: Cell[][],
  r1: number,
  c1: number,
  r2: number,
  c2: number
): void {
  if (r2 === r1 - 1) {
    cells[r1][c1].walls.top = false;
    cells[r2][c2].walls.bottom = false;
  } else if (r2 === r1 + 1) {
    cells[r1][c1].walls.bottom = false;
    cells[r2][c2].walls.top = false;
  } else if (c2 === c1 - 1) {
    cells[r1][c1].walls.left = false;
    cells[r2][c2].walls.right = false;
  } else if (c2 === c1 + 1) {
    cells[r1][c1].walls.right = false;
    cells[r2][c2].walls.left = false;
  }
}

export function findShortestPath(maze: Maze): [number, number][] {
  const { rows, cols, cells } = maze;
  const visited: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );
  const parent: Map<string, [number, number] | null> = new Map();
  const queue: [number, number][] = [[0, 0]];
  visited[0][0] = true;
  parent.set('0,0', null);

  const directions: { dr: number; dc: number; wall: keyof Cell['walls']; opposite: keyof Cell['walls'] }[] = [
    { dr: -1, dc: 0, wall: 'top', opposite: 'bottom' },
    { dr: 0, dc: 1, wall: 'right', opposite: 'left' },
    { dr: 1, dc: 0, wall: 'bottom', opposite: 'top' },
    { dr: 0, dc: -1, wall: 'left', opposite: 'right' },
  ];

  while (queue.length > 0) {
    const [cr, cc] = queue.shift()!;

    if (cr === rows - 1 && cc === cols - 1) {
      const path: [number, number][] = [];
      let current: [number, number] | null = [cr, cc];
      while (current !== null) {
        path.unshift(current);
        const key = `${current[0]},${current[1]}`;
        current = parent.get(key) ?? null;
      }
      return path;
    }

    for (const dir of directions) {
      if (!cells[cr][cc].walls[dir.wall]) {
        const nr = cr + dir.dr;
        const nc = cc + dir.dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
          visited[nr][nc] = true;
          parent.set(`${nr},${nc}`, [cr, cc]);
          queue.push([nr, nc]);
        }
      }
    }
  }

  return [];
}

export function canMove(
  maze: Maze,
  row: number,
  col: number,
  direction: 'up' | 'down' | 'left' | 'right'
): boolean {
  const cell = maze.cells[row][col];
  const wallMap: Record<string, keyof Cell['walls']> = {
    up: 'top',
    down: 'bottom',
    left: 'left',
    right: 'right',
  };
  return !cell.walls[wallMap[direction]];
}

export function getNextPosition(
  row: number,
  col: number,
  direction: 'up' | 'down' | 'left' | 'right'
): [number, number] {
  switch (direction) {
    case 'up':
      return [row - 1, col];
    case 'down':
      return [row + 1, col];
    case 'left':
      return [row, col - 1];
    case 'right':
      return [row, col + 1];
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
