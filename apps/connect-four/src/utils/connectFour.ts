export type CellState = null | 'player' | 'ai';
export type Board = CellState[][];
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Position = [number, number]; // [row, col]

export const ROWS = 6;
export const COLS = 7;

export interface GameResult {
  id: string;
  date: string;
  difficulty: Difficulty;
  won: boolean;
  draw: boolean;
  moves: number;
}

export function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null)
  );
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/** Find the lowest empty row in a column. Returns -1 if the column is full. */
export function getDropRow(board: Board, col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) return row;
  }
  return -1;
}

/** Drop a piece into the given column. Returns a new board or null if invalid. */
export function dropPiece(board: Board, col: number, piece: CellState): Board | null {
  const row = getDropRow(board, col);
  if (row === -1) return null;
  const newBoard = cloneBoard(board);
  newBoard[row][col] = piece;
  return newBoard;
}

/** Get all columns that are not full. */
export function getValidColumns(board: Board): number[] {
  const cols: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === null) cols.push(c);
  }
  return cols;
}

/**
 * Check for a win. Returns the winning positions (4 cells) or null.
 * Checks horizontal, vertical, and both diagonals.
 */
export function checkWin(board: Board): Position[] | null {
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const cell = board[r][c];
      if (
        cell !== null &&
        cell === board[r][c + 1] &&
        cell === board[r][c + 2] &&
        cell === board[r][c + 3]
      ) {
        return [[r, c], [r, c + 1], [r, c + 2], [r, c + 3]];
      }
    }
  }

  // Vertical
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = board[r][c];
      if (
        cell !== null &&
        cell === board[r + 1][c] &&
        cell === board[r + 2][c] &&
        cell === board[r + 3][c]
      ) {
        return [[r, c], [r + 1, c], [r + 2, c], [r + 3, c]];
      }
    }
  }

  // Diagonal (top-left to bottom-right)
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const cell = board[r][c];
      if (
        cell !== null &&
        cell === board[r + 1][c + 1] &&
        cell === board[r + 2][c + 2] &&
        cell === board[r + 3][c + 3]
      ) {
        return [[r, c], [r + 1, c + 1], [r + 2, c + 2], [r + 3, c + 3]];
      }
    }
  }

  // Diagonal (bottom-left to top-right)
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const cell = board[r][c];
      if (
        cell !== null &&
        cell === board[r - 1][c + 1] &&
        cell === board[r - 2][c + 2] &&
        cell === board[r - 3][c + 3]
      ) {
        return [[r, c], [r - 1, c + 1], [r - 2, c + 2], [r - 3, c + 3]];
      }
    }
  }

  return null;
}

/** Check if the board is completely full (draw). */
export function isBoardFull(board: Board): boolean {
  return board[0].every((cell) => cell !== null);
}

/** Check if the game is over. */
export function isGameOver(board: Board): boolean {
  return checkWin(board) !== null || isBoardFull(board);
}

export function getDifficultyLabel(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'easy':
      return '初級';
    case 'medium':
      return '中級';
    case 'hard':
      return '上級';
    default:
      return difficulty;
  }
}

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------

function getRandomMove(validCols: number[]): number {
  return validCols[Math.floor(Math.random() * validCols.length)];
}

/**
 * Count the number of "windows" (groups of 4 consecutive cells) that match
 * a given criteria for scoring.
 */
function evaluateWindow(window: CellState[], piece: CellState, oppPiece: CellState): number {
  const countPiece = window.filter((c) => c === piece).length;
  const countOpp = window.filter((c) => c === oppPiece).length;
  const countEmpty = window.filter((c) => c === null).length;

  if (countPiece === 4) return 100;
  if (countPiece === 3 && countEmpty === 1) return 5;
  if (countPiece === 2 && countEmpty === 2) return 2;
  if (countOpp === 3 && countEmpty === 1) return -4;
  return 0;
}

function scoreBoard(board: Board, piece: CellState): number {
  const oppPiece: CellState = piece === 'ai' ? 'player' : 'ai';
  let score = 0;

  // Center column preference
  const centerCol = Math.floor(COLS / 2);
  const centerCount = board.reduce((acc, row) => acc + (row[centerCol] === piece ? 1 : 0), 0);
  score += centerCount * 3;

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]];
      score += evaluateWindow(window, piece, oppPiece);
    }
  }

  // Vertical
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c < COLS; c++) {
      const window = [board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]];
      score += evaluateWindow(window, piece, oppPiece);
    }
  }

  // Diagonal (top-left to bottom-right)
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [
        board[r][c],
        board[r + 1][c + 1],
        board[r + 2][c + 2],
        board[r + 3][c + 3],
      ];
      score += evaluateWindow(window, piece, oppPiece);
    }
  }

  // Diagonal (bottom-left to top-right)
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [
        board[r][c],
        board[r - 1][c + 1],
        board[r - 2][c + 2],
        board[r - 3][c + 3],
      ];
      score += evaluateWindow(window, piece, oppPiece);
    }
  }

  return score;
}

/** Check if placing a piece in this column wins immediately. */
function wouldWin(board: Board, col: number, piece: CellState): boolean {
  const newBoard = dropPiece(board, col, piece);
  if (!newBoard) return false;
  return checkWin(newBoard) !== null;
}

/** Medium AI: block opponent wins, take own wins, prefer center. */
function getMediumMove(board: Board, validCols: number[]): number {
  // Take immediate win
  for (const col of validCols) {
    if (wouldWin(board, col, 'ai')) return col;
  }

  // Block opponent win
  for (const col of validCols) {
    if (wouldWin(board, col, 'player')) return col;
  }

  // Prefer center column
  const centerCol = Math.floor(COLS / 2);
  if (validCols.includes(centerCol)) return centerCol;

  // Prefer columns adjacent to center
  const preferredOrder = [3, 2, 4, 1, 5, 0, 6];
  for (const col of preferredOrder) {
    if (validCols.includes(col)) return col;
  }

  return getRandomMove(validCols);
}

/** Minimax with alpha-beta pruning at depth 5. */
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
): number {
  const winPositions = checkWin(board);
  if (winPositions) {
    const winner = board[winPositions[0][0]][winPositions[0][1]];
    if (winner === 'ai') return 100000 + depth;
    if (winner === 'player') return -100000 - depth;
  }
  if (isBoardFull(board)) return 0;
  if (depth === 0) return scoreBoard(board, 'ai');

  const validCols = getValidColumns(board);
  // Order columns from center outward for better pruning
  const orderedCols = [...validCols].sort(
    (a, b) => Math.abs(a - 3) - Math.abs(b - 3)
  );

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const col of orderedCols) {
      const newBoard = dropPiece(board, col, 'ai')!;
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const col of orderedCols) {
      const newBoard = dropPiece(board, col, 'player')!;
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function getHardMove(board: Board, validCols: number[]): number {
  // Check for immediate wins first (optimization)
  for (const col of validCols) {
    if (wouldWin(board, col, 'ai')) return col;
  }
  for (const col of validCols) {
    if (wouldWin(board, col, 'player')) return col;
  }

  const orderedCols = [...validCols].sort(
    (a, b) => Math.abs(a - 3) - Math.abs(b - 3)
  );

  let bestCol = orderedCols[0];
  let bestScore = -Infinity;

  for (const col of orderedCols) {
    const newBoard = dropPiece(board, col, 'ai')!;
    const score = minimax(newBoard, 4, -Infinity, Infinity, false);
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }

  return bestCol;
}

export function getAIMove(board: Board, difficulty: Difficulty): number {
  const validCols = getValidColumns(board);
  if (validCols.length === 0) return -1;

  switch (difficulty) {
    case 'easy':
      return getRandomMove(validCols);
    case 'medium':
      return getMediumMove(board, validCols);
    case 'hard':
      return getHardMove(board, validCols);
    default:
      return getRandomMove(validCols);
  }
}
