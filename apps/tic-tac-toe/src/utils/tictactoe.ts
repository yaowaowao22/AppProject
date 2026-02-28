import type { Board, CellState, Difficulty, WinLine } from '../types';

/** All possible winning lines (indices into the flat 3x3 board) */
export const WIN_LINES: WinLine[] = [
  // Rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diagonals
  [0, 4, 8],
  [2, 4, 6],
];

/** Create an empty 3x3 board (flat array of 9 cells) */
export function createEmptyBoard(): Board {
  return Array(9).fill(null);
}

/** Get empty cell indices */
export function getEmptyCells(board: Board): number[] {
  const cells: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      cells.push(i);
    }
  }
  return cells;
}

/** Check if a specific player has won, returning the winning line or null */
export function getWinLine(board: Board, who: CellState): WinLine | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] === who && board[b] === who && board[c] === who) {
      return line;
    }
  }
  return null;
}

/** Check if the board is a draw (full with no winner) */
export function isDraw(board: Board): boolean {
  if (getWinLine(board, 'player') !== null) return false;
  if (getWinLine(board, 'ai') !== null) return false;
  return getEmptyCells(board).length === 0;
}

/** Check if the game is over */
export function isGameOver(board: Board): boolean {
  return (
    getWinLine(board, 'player') !== null ||
    getWinLine(board, 'ai') !== null ||
    getEmptyCells(board).length === 0
  );
}

/** Place a stone on the board, returning a new board */
export function placeStone(board: Board, index: number, who: CellState): Board {
  const newBoard = [...board];
  newBoard[index] = who;
  return newBoard;
}

/** Get difficulty label in Japanese */
export function getDifficultyLabel(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'easy':
      return '初級';
    case 'medium':
      return '中級';
    case 'hard':
      return '上級';
  }
}

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------

/** Easy AI: picks a random empty cell */
function getEasyMove(board: Board): number {
  const empty = getEmptyCells(board);
  return empty[Math.floor(Math.random() * empty.length)];
}

/**
 * Medium AI:
 * 1. If AI can win in one move, take it.
 * 2. If player can win in one move, block it.
 * 3. Otherwise, pick randomly.
 */
function getMediumMove(board: Board): number {
  const empty = getEmptyCells(board);

  // Try to win
  for (const idx of empty) {
    const test = placeStone(board, idx, 'ai');
    if (getWinLine(test, 'ai') !== null) {
      return idx;
    }
  }

  // Block player from winning
  for (const idx of empty) {
    const test = placeStone(board, idx, 'player');
    if (getWinLine(test, 'player') !== null) {
      return idx;
    }
  }

  // Random
  return empty[Math.floor(Math.random() * empty.length)];
}

/**
 * Hard AI: minimax algorithm (unbeatable).
 */
function minimax(board: Board, isMaximizing: boolean): number {
  if (getWinLine(board, 'ai') !== null) return 10;
  if (getWinLine(board, 'player') !== null) return -10;
  if (getEmptyCells(board).length === 0) return 0;

  const empty = getEmptyCells(board);

  if (isMaximizing) {
    let best = -Infinity;
    for (const idx of empty) {
      const newBoard = placeStone(board, idx, 'ai');
      const score = minimax(newBoard, false);
      best = Math.max(best, score);
    }
    return best;
  } else {
    let best = Infinity;
    for (const idx of empty) {
      const newBoard = placeStone(board, idx, 'player');
      const score = minimax(newBoard, true);
      best = Math.min(best, score);
    }
    return best;
  }
}

function getHardMove(board: Board): number {
  const empty = getEmptyCells(board);
  let bestScore = -Infinity;
  let bestMove = empty[0];

  for (const idx of empty) {
    const newBoard = placeStone(board, idx, 'ai');
    const score = minimax(newBoard, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
  }

  return bestMove;
}

/** Get the AI move based on difficulty */
export function getAIMove(board: Board, difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':
      return getEasyMove(board);
    case 'medium':
      return getMediumMove(board);
    case 'hard':
      return getHardMove(board);
  }
}
