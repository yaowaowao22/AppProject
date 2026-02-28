export type GridSize = 3 | 4 | 5;

export type Board = number[];

export interface Position {
  row: number;
  col: number;
}

export interface GameResult {
  id: string;
  date: string;
  gridSize: GridSize;
  moves: number;
  timeSeconds: number;
}

/**
 * Create the solved board for a given grid size.
 * Tiles are numbered 1..N*N-1, with 0 representing the empty space at the end.
 */
export function createSolvedBoard(size: GridSize): Board {
  const total = size * size;
  const board: Board = [];
  for (let i = 1; i < total; i++) {
    board.push(i);
  }
  board.push(0);
  return board;
}

/**
 * Check if the board is in the solved state.
 */
export function isSolved(board: Board, size: GridSize): boolean {
  const total = size * size;
  for (let i = 0; i < total - 1; i++) {
    if (board[i] !== i + 1) return false;
  }
  return board[total - 1] === 0;
}

/**
 * Get the index of the empty space (0) in the board.
 */
export function getEmptyIndex(board: Board): number {
  return board.indexOf(0);
}

/**
 * Convert a flat index to row/col position.
 */
export function indexToPosition(index: number, size: GridSize): Position {
  return {
    row: Math.floor(index / size),
    col: index % size,
  };
}

/**
 * Convert row/col position to a flat index.
 */
export function positionToIndex(pos: Position, size: GridSize): number {
  return pos.row * size + pos.col;
}

/**
 * Get the indices of tiles adjacent to the empty space.
 */
export function getMovableTiles(board: Board, size: GridSize): number[] {
  const emptyIdx = getEmptyIndex(board);
  const emptyPos = indexToPosition(emptyIdx, size);
  const movable: number[] = [];

  const directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];

  for (const dir of directions) {
    const newRow = emptyPos.row + dir.row;
    const newCol = emptyPos.col + dir.col;
    if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
      movable.push(positionToIndex({ row: newRow, col: newCol }, size));
    }
  }

  return movable;
}

/**
 * Check if a tile at the given index can be moved (is adjacent to empty).
 */
export function canMove(board: Board, tileIndex: number, size: GridSize): boolean {
  const movable = getMovableTiles(board, size);
  return movable.includes(tileIndex);
}

/**
 * Move a tile at the given index to the empty space.
 * Returns the new board, or null if the move is invalid.
 */
export function moveTile(board: Board, tileIndex: number, size: GridSize): Board | null {
  if (!canMove(board, tileIndex, size)) return null;

  const newBoard = [...board];
  const emptyIdx = getEmptyIndex(newBoard);
  newBoard[emptyIdx] = newBoard[tileIndex];
  newBoard[tileIndex] = 0;
  return newBoard;
}

/**
 * Shuffle the board by making random valid moves from the solved state.
 * This ensures the puzzle is always solvable.
 */
export function shuffleBoard(size: GridSize): Board {
  let board = createSolvedBoard(size);
  const numMoves = size * size * 40;
  let lastEmptyIdx = getEmptyIndex(board);

  for (let i = 0; i < numMoves; i++) {
    const movable = getMovableTiles(board, size);
    // Avoid moving back to the same position
    const filtered = movable.filter((idx) => idx !== lastEmptyIdx);
    const candidates = filtered.length > 0 ? filtered : movable;
    const randomIdx = candidates[Math.floor(Math.random() * candidates.length)];
    lastEmptyIdx = getEmptyIndex(board);
    board = moveTile(board, randomIdx, size)!;
  }

  // Make sure the board is not already solved
  if (isSolved(board, size)) {
    return shuffleBoard(size);
  }

  return board;
}

/**
 * Find the next optimal move using a simple heuristic.
 * Returns the index of the tile to move, or -1 if already solved.
 */
export function findHintMove(board: Board, size: GridSize): number {
  if (isSolved(board, size)) return -1;

  const movable = getMovableTiles(board, size);
  let bestIdx = movable[0];
  let bestScore = Infinity;

  for (const tileIdx of movable) {
    const newBoard = moveTile(board, tileIdx, size)!;
    const score = calculateManhattanDistance(newBoard, size);
    if (score < bestScore) {
      bestScore = score;
      bestIdx = tileIdx;
    }
  }

  return bestIdx;
}

/**
 * Calculate the total Manhattan distance of all tiles from their goal positions.
 */
function calculateManhattanDistance(board: Board, size: GridSize): number {
  let distance = 0;
  const total = size * size;

  for (let i = 0; i < total; i++) {
    const value = board[i];
    if (value === 0) continue;

    const currentPos = indexToPosition(i, size);
    const goalIndex = value - 1;
    const goalPos = indexToPosition(goalIndex, size);

    distance += Math.abs(currentPos.row - goalPos.row) + Math.abs(currentPos.col - goalPos.col);
  }

  return distance;
}

/**
 * Get a color for a tile based on its number.
 * Creates a gradient effect from warm to cool colors.
 */
export function getTileColor(value: number, total: number): string {
  if (value === 0) return 'transparent';

  const ratio = (value - 1) / (total - 1);

  // HSL gradient from blue (210) to teal (180) to green (120) to yellow (50) to orange (25)
  const hue = 210 - ratio * 185;
  const saturation = 65 + ratio * 15;
  const lightness = 48 + ratio * 8;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Get the text color (white or dark) based on tile color brightness.
 */
export function getTileTextColor(value: number, total: number): string {
  if (value === 0) return 'transparent';
  const ratio = (value - 1) / (total - 1);
  return ratio > 0.75 ? '#1a1a2e' : '#ffffff';
}

/**
 * Format seconds into mm:ss string.
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Get the display label for a grid size.
 */
export function getGridSizeLabel(size: GridSize): string {
  return `${size}x${size}`;
}

/**
 * Get the puzzle name for a grid size.
 */
export function getPuzzleName(size: GridSize): string {
  switch (size) {
    case 3:
      return '8パズル';
    case 4:
      return '15パズル';
    case 5:
      return '24パズル';
  }
}
