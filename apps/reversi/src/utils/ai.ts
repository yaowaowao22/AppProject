import type { CellState, Board, Position, Difficulty } from '../types';
import { getValidMoves, applyMove, countStones, isGameOver } from './reversi';

const POSITION_WEIGHTS: number[][] = [
  [100, -20,  10,   5,   5,  10, -20, 100],
  [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
  [ 10,  -2,   1,   1,   1,   1,  -2,  10],
  [  5,  -2,   1,   0,   0,   1,  -2,   5],
  [  5,  -2,   1,   0,   0,   1,  -2,   5],
  [ 10,  -2,   1,   1,   1,   1,  -2,  10],
  [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
  [100, -20,  10,   5,   5,  10, -20, 100],
];

function evaluateBoard(board: Board, aiColor: CellState): number {
  const oppColor = aiColor === 'black' ? 'white' : 'black';
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === aiColor) {
        score += POSITION_WEIGHTS[r][c];
      } else if (board[r][c] === oppColor) {
        score -= POSITION_WEIGHTS[r][c];
      }
    }
  }

  const aiMoves = getValidMoves(board, aiColor).length;
  const oppMoves = getValidMoves(board, oppColor).length;
  score += (aiMoves - oppMoves) * 5;

  return score;
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiColor: CellState,
  playerColor: CellState,
): number {
  if (depth === 0 || isGameOver(board)) {
    if (isGameOver(board)) {
      const { black, white } = countStones(board);
      const aiCount = aiColor === 'black' ? black : white;
      const playerCount = aiColor === 'black' ? white : black;
      if (aiCount > playerCount) return 10000 + aiCount - playerCount;
      if (playerCount > aiCount) return -10000 - (playerCount - aiCount);
      return 0;
    }
    return evaluateBoard(board, aiColor);
  }

  const currentColor = isMaximizing ? aiColor : playerColor;
  const moves = getValidMoves(board, currentColor);

  if (moves.length === 0) {
    return minimax(board, depth - 1, alpha, beta, !isMaximizing, aiColor, playerColor);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const [r, c] of moves) {
      const newBoard = applyMove(board, r, c, currentColor);
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, aiColor, playerColor);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const [r, c] of moves) {
      const newBoard = applyMove(board, r, c, currentColor);
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, aiColor, playerColor);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function getRandomMove(moves: Position[]): Position {
  return moves[Math.floor(Math.random() * moves.length)];
}

function getMediumMove(board: Board, moves: Position[], aiColor: CellState): Position {
  const corners: Position[] = [[0, 0], [0, 7], [7, 0], [7, 7]];
  const cornerMoves = moves.filter(
    ([r, c]) => corners.some(([cr, cc]) => cr === r && cc === c)
  );
  if (cornerMoves.length > 0) return getRandomMove(cornerMoves);

  const edgeMoves = moves.filter(
    ([r, c]) => r === 0 || r === 7 || c === 0 || c === 7
  );
  if (edgeMoves.length > 0) return getRandomMove(edgeMoves);

  let bestMove = moves[0];
  let bestScore = -Infinity;
  for (const [r, c] of moves) {
    const score = POSITION_WEIGHTS[r][c];
    if (score > bestScore) {
      bestScore = score;
      bestMove = [r, c];
    }
  }
  return bestMove;
}

function getHardMove(board: Board, moves: Position[], aiColor: CellState, playerColor: CellState): Position {
  let bestMove = moves[0];
  let bestScore = -Infinity;
  const depth = moves.length > 10 ? 3 : 4;

  for (const [r, c] of moves) {
    const newBoard = applyMove(board, r, c, aiColor);
    const score = minimax(newBoard, depth - 1, -Infinity, Infinity, false, aiColor, playerColor);
    if (score > bestScore) {
      bestScore = score;
      bestMove = [r, c];
    }
  }

  return bestMove;
}

export function getAIMove(
  board: Board,
  aiColor: CellState,
  difficulty: Difficulty,
): Position | null {
  const playerColor = aiColor === 'black' ? 'white' : 'black';
  const moves = getValidMoves(board, aiColor);
  if (moves.length === 0) return null;

  switch (difficulty) {
    case 'easy':
      return getRandomMove(moves);
    case 'medium':
      return getMediumMove(board, moves, aiColor);
    case 'hard':
      return getHardMove(board, moves, aiColor, playerColor);
    default:
      return getRandomMove(moves);
  }
}

export function getBestMove(board: Board, color: CellState): Position | null {
  const playerColor = color === 'black' ? 'white' : 'black';
  const moves = getValidMoves(board, color);
  if (moves.length === 0) return null;
  return getHardMove(board, moves, color, playerColor);
}
