/**
 * Pipe Puzzle - Core game logic
 *
 * Pipe types and their connections:
 * - straight: connects two opposite sides (vertical or horizontal)
 * - corner: connects two adjacent sides
 * - tee: connects three sides
 * - cross: connects all four sides
 * - source: water origin (connects specific sides)
 * - drain: water destination (connects specific sides)
 * - empty: no connections
 */

export type PipeType =
  | 'straight'
  | 'corner'
  | 'tee'
  | 'cross'
  | 'source'
  | 'drain'
  | 'empty';

export interface Connections {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

export interface PipeCell {
  type: PipeType;
  connections: Connections;
  row: number;
  col: number;
  fixed: boolean; // source and drain are fixed (cannot rotate)
}

export interface PipeGrid {
  cells: PipeCell[][];
  rows: number;
  cols: number;
  sourceRow: number;
  sourceCol: number;
  drainRow: number;
  drainCol: number;
}

export interface LevelDefinition {
  id: number;
  difficulty: Difficulty;
  rows: number;
  cols: number;
  /** Grid layout: S=source, D=drain, ─=straight-h, │=straight-v,
   *  ┐┘└┌=corners, ┬┤┴├=tees, ┼=cross, .=empty */
  layout: string[];
  /** Number of random rotations to scramble */
  scrambleCount: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameResult {
  id: string;
  levelId: number;
  difficulty: Difficulty;
  taps: number;
  timeSeconds: number;
  date: string;
}

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; size: string }
> = {
  easy: { label: 'かんたん', size: '4x4' },
  medium: { label: 'ふつう', size: '5x5' },
  hard: { label: 'むずかしい', size: '6x6' },
};

/**
 * Parse a layout character into a PipeCell
 */
function parsePipeChar(
  char: string,
  row: number,
  col: number
): PipeCell {
  switch (char) {
    case '│':
      return {
        type: 'straight',
        connections: { top: true, right: false, bottom: true, left: false },
        row,
        col,
        fixed: false,
      };
    case '─':
      return {
        type: 'straight',
        connections: { top: false, right: true, bottom: false, left: true },
        row,
        col,
        fixed: false,
      };
    case '┐':
      return {
        type: 'corner',
        connections: { top: false, right: false, bottom: true, left: true },
        row,
        col,
        fixed: false,
      };
    case '┘':
      return {
        type: 'corner',
        connections: { top: true, right: false, bottom: false, left: true },
        row,
        col,
        fixed: false,
      };
    case '└':
      return {
        type: 'corner',
        connections: { top: true, right: true, bottom: false, left: false },
        row,
        col,
        fixed: false,
      };
    case '┌':
      return {
        type: 'corner',
        connections: { top: false, right: true, bottom: true, left: false },
        row,
        col,
        fixed: false,
      };
    case '┬':
      return {
        type: 'tee',
        connections: { top: false, right: true, bottom: true, left: true },
        row,
        col,
        fixed: false,
      };
    case '┤':
      return {
        type: 'tee',
        connections: { top: true, right: false, bottom: true, left: true },
        row,
        col,
        fixed: false,
      };
    case '┴':
      return {
        type: 'tee',
        connections: { top: true, right: true, bottom: false, left: true },
        row,
        col,
        fixed: false,
      };
    case '├':
      return {
        type: 'tee',
        connections: { top: true, right: true, bottom: true, left: false },
        row,
        col,
        fixed: false,
      };
    case '┼':
      return {
        type: 'cross',
        connections: { top: true, right: true, bottom: true, left: true },
        row,
        col,
        fixed: false,
      };
    case 'S':
      return {
        type: 'source',
        connections: { top: false, right: true, bottom: true, left: false },
        row,
        col,
        fixed: true,
      };
    case 'D':
      return {
        type: 'drain',
        connections: { top: true, right: false, bottom: false, left: true },
        row,
        col,
        fixed: true,
      };
    case '.':
    default:
      return {
        type: 'empty',
        connections: { top: false, right: false, bottom: false, left: false },
        row,
        col,
        fixed: true,
      };
  }
}

/**
 * Build a PipeGrid from a LevelDefinition
 */
export function buildGridFromLevel(level: LevelDefinition): PipeGrid {
  const cells: PipeCell[][] = [];
  let sourceRow = 0;
  let sourceCol = 0;
  let drainRow = 0;
  let drainCol = 0;

  for (let r = 0; r < level.rows; r++) {
    cells[r] = [];
    const rowChars = [...level.layout[r]];
    for (let c = 0; c < level.cols; c++) {
      const char = rowChars[c] || '.';
      const cell = parsePipeChar(char, r, c);

      // Detect source/drain with specific connection patterns from layout context
      if (char === 'S') {
        sourceRow = r;
        sourceCol = c;
        // Determine source connections based on position
        const conns = getSourceConnections(r, c, level);
        cell.connections = conns;
      }
      if (char === 'D') {
        drainRow = r;
        drainCol = c;
        const conns = getDrainConnections(r, c, level);
        cell.connections = conns;
      }

      cells[r][c] = cell;
    }
  }

  return { cells, rows: level.rows, cols: level.cols, sourceRow, sourceCol, drainRow, drainCol };
}

/**
 * Determine source connections based on adjacent pipes in the layout
 */
function getSourceConnections(
  row: number,
  col: number,
  level: LevelDefinition
): Connections {
  const conns: Connections = { top: false, right: false, bottom: false, left: false };
  // Check adjacent cells for pipe characters
  if (row > 0 && level.layout[row - 1][col] !== '.') conns.top = true;
  if (row < level.rows - 1 && level.layout[row + 1][col] !== '.') conns.bottom = true;
  if (col > 0 && level.layout[row][col - 1] !== '.') conns.left = true;
  if (col < level.cols - 1 && level.layout[row][col + 1] !== '.') conns.right = true;
  return conns;
}

/**
 * Determine drain connections based on adjacent pipes in the layout
 */
function getDrainConnections(
  row: number,
  col: number,
  level: LevelDefinition
): Connections {
  return getSourceConnections(row, col, level);
}

/**
 * Rotate a pipe cell 90 degrees clockwise
 */
export function rotatePipe(cell: PipeCell): PipeCell {
  if (cell.fixed || cell.type === 'empty' || cell.type === 'cross') {
    return cell;
  }

  const { top, right, bottom, left } = cell.connections;
  return {
    ...cell,
    connections: {
      top: left,
      right: top,
      bottom: right,
      left: bottom,
    },
  };
}

/**
 * Scramble the grid by randomly rotating pipes
 */
export function scrambleGrid(grid: PipeGrid, count: number): PipeGrid {
  const newCells = grid.cells.map((row) => row.map((cell) => ({ ...cell })));

  for (let i = 0; i < count; i++) {
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const cell = newCells[r][c];
        if (!cell.fixed && cell.type !== 'empty' && cell.type !== 'cross') {
          const rotations = Math.floor(Math.random() * 3) + 1; // 1-3 rotations
          let rotated = cell;
          for (let rot = 0; rot < rotations; rot++) {
            rotated = rotatePipe(rotated);
          }
          newCells[r][c] = rotated;
        }
      }
    }
  }

  return { ...grid, cells: newCells };
}

/**
 * Check if two adjacent cells are connected
 */
function areCellsConnected(
  cell1: PipeCell,
  cell2: PipeCell,
  direction: 'top' | 'right' | 'bottom' | 'left'
): boolean {
  const opposites: Record<string, keyof Connections> = {
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right',
  };

  return cell1.connections[direction] && cell2.connections[opposites[direction]];
}

/**
 * Find all cells connected to the source via water flow (BFS)
 */
export function findConnectedCells(grid: PipeGrid): Set<string> {
  const connected = new Set<string>();
  const queue: [number, number][] = [[grid.sourceRow, grid.sourceCol]];
  connected.add(`${grid.sourceRow},${grid.sourceCol}`);

  const directions: { dr: number; dc: number; dir: 'top' | 'right' | 'bottom' | 'left' }[] = [
    { dr: -1, dc: 0, dir: 'top' },
    { dr: 0, dc: 1, dir: 'right' },
    { dr: 1, dc: 0, dir: 'bottom' },
    { dr: 0, dc: -1, dir: 'left' },
  ];

  while (queue.length > 0) {
    const [cr, cc] = queue.shift()!;
    const currentCell = grid.cells[cr][cc];

    for (const { dr, dc, dir } of directions) {
      const nr = cr + dr;
      const nc = cc + dc;

      if (nr < 0 || nr >= grid.rows || nc < 0 || nc >= grid.cols) continue;

      const key = `${nr},${nc}`;
      if (connected.has(key)) continue;

      const neighborCell = grid.cells[nr][nc];
      if (neighborCell.type === 'empty') continue;

      if (areCellsConnected(currentCell, neighborCell, dir)) {
        connected.add(key);
        queue.push([nr, nc]);
      }
    }
  }

  return connected;
}

/**
 * Check if water flows from source to drain
 */
export function isLevelSolved(grid: PipeGrid): boolean {
  const connected = findConnectedCells(grid);
  return connected.has(`${grid.drainRow},${grid.drainCol}`);
}

/**
 * Get the Unicode character for displaying a pipe cell
 */
export function getPipeDisplayChar(cell: PipeCell): string {
  if (cell.type === 'source') return 'S';
  if (cell.type === 'drain') return 'D';
  if (cell.type === 'empty') return ' ';
  if (cell.type === 'cross') return '\u253C'; // ┼

  const { top, right, bottom, left } = cell.connections;

  // Straight pieces
  if (top && bottom && !left && !right) return '\u2502'; // │
  if (!top && !bottom && left && right) return '\u2500'; // ─

  // Corner pieces
  if (!top && right && bottom && !left) return '\u250C'; // ┌
  if (!top && !right && bottom && left) return '\u2510'; // ┐
  if (top && !right && !bottom && left) return '\u2518'; // ┘
  if (top && right && !bottom && !left) return '\u2514'; // └

  // T-pieces
  if (!top && right && bottom && left) return '\u252C'; // ┬
  if (top && !right && bottom && left) return '\u2524'; // ┤
  if (top && right && !bottom && left) return '\u2534'; // ┴
  if (top && right && bottom && !left) return '\u251C'; // ├

  return ' ';
}

/**
 * Format time in seconds to MM:SS
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Provide a hint: find one pipe that needs rotation and return how many
 * rotations it needs (1, 2, or 3). Returns null if already solved.
 */
export function getHint(
  currentGrid: PipeGrid,
  solvedGrid: PipeGrid
): { row: number; col: number; rotations: number } | null {
  for (let r = 0; r < currentGrid.rows; r++) {
    for (let c = 0; c < currentGrid.cols; c++) {
      const current = currentGrid.cells[r][c];
      const solved = solvedGrid.cells[r][c];

      if (current.fixed || current.type === 'empty' || current.type === 'cross')
        continue;

      const cc = current.connections;
      const sc = solved.connections;

      if (
        cc.top !== sc.top ||
        cc.right !== sc.right ||
        cc.bottom !== sc.bottom ||
        cc.left !== sc.left
      ) {
        // Figure out how many rotations needed
        let test = { ...current };
        for (let rot = 1; rot <= 3; rot++) {
          test = rotatePipe(test);
          if (
            test.connections.top === sc.top &&
            test.connections.right === sc.right &&
            test.connections.bottom === sc.bottom &&
            test.connections.left === sc.left
          ) {
            return { row: r, col: c, rotations: rot };
          }
        }
        return { row: r, col: c, rotations: 1 };
      }
    }
  }
  return null;
}
