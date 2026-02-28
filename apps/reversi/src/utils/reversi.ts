import type { CellState, Board, Position } from '../types';

const DIRECTIONS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null)
  );
  board[3][3] = 'white';
  board[3][4] = 'black';
  board[4][3] = 'black';
  board[4][4] = 'white';
  return board;
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

function opponent(color: CellState): CellState {
  if (color === 'black') return 'white';
  if (color === 'white') return 'black';
  return null;
}

export function getFlips(board: Board, row: number, col: number, color: CellState): Position[] {
  if (color === null || board[row][col] !== null) return [];

  const opp = opponent(color);
  const allFlips: Position[] = [];

  for (const [dr, dc] of DIRECTIONS) {
    const flips: Position[] = [];
    let r = row + dr;
    let c = col + dc;

    while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === opp) {
      flips.push([r, c]);
      r += dr;
      c += dc;
    }

    if (flips.length > 0 && r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === color) {
      allFlips.push(...flips);
    }
  }

  return allFlips;
}

export function isValidMove(board: Board, row: number, col: number, color: CellState): boolean {
  if (row < 0 || row >= 8 || col < 0 || col >= 8) return false;
  if (board[row][col] !== null) return false;
  return getFlips(board, row, col, color).length > 0;
}

export function getValidMoves(board: Board, color: CellState): Position[] {
  const moves: Position[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (isValidMove(board, r, c, color)) {
        moves.push([r, c]);
      }
    }
  }
  return moves;
}

export function applyMove(board: Board, row: number, col: number, color: CellState): Board {
  const newBoard = cloneBoard(board);
  const flips = getFlips(board, row, col, color);
  newBoard[row][col] = color;
  for (const [fr, fc] of flips) {
    newBoard[fr][fc] = color;
  }
  return newBoard;
}

export function countStones(board: Board): { black: number; white: number } {
  let black = 0;
  let white = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === 'black') black++;
      else if (board[r][c] === 'white') white++;
    }
  }
  return { black, white };
}

export function isGameOver(board: Board): boolean {
  const blackMoves = getValidMoves(board, 'black');
  const whiteMoves = getValidMoves(board, 'white');
  return blackMoves.length === 0 && whiteMoves.length === 0;
}

export function getWinner(board: Board): CellState | 'draw' {
  const { black, white } = countStones(board);
  if (black > white) return 'black';
  if (white > black) return 'white';
  return 'draw';
}

export function getDifficultyLabel(difficulty: string): string {
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
