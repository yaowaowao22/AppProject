import type { CellState, Board, Position, Difficulty } from '../types';

export const BOARD_SIZE = 13;

const DIRECTIONS: [number, number][] = [
  [0, 1],   // horizontal
  [1, 0],   // vertical
  [1, 1],   // diagonal down-right
  [1, -1],  // diagonal down-left
];

export function createInitialBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

export function placeStone(board: Board, row: number, col: number, color: CellState): Board {
  const newBoard = cloneBoard(board);
  newBoard[row][col] = color;
  return newBoard;
}

export function isValidMove(board: Board, row: number, col: number): boolean {
  if (!inBounds(row, col)) return false;
  return board[row][col] === null;
}

export function checkWin(board: Board, row: number, col: number): boolean {
  const color = board[row][col];
  if (!color) return false;

  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;
    // Count forward
    let r = row + dr;
    let c = col + dc;
    while (inBounds(r, c) && board[r][c] === color) {
      count++;
      r += dr;
      c += dc;
    }
    // Count backward
    r = row - dr;
    c = col - dc;
    while (inBounds(r, c) && board[r][c] === color) {
      count++;
      r -= dr;
      c -= dc;
    }
    if (count >= 5) return true;
  }
  return false;
}

export function isBoardFull(board: Board): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === null) return false;
    }
  }
  return true;
}

export function countStones(board: Board): { black: number; white: number } {
  let black = 0;
  let white = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 'black') black++;
      else if (board[r][c] === 'white') white++;
    }
  }
  return { black, white };
}

export function getEmptyCells(board: Board): Position[] {
  const cells: Position[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === null) cells.push([r, c]);
    }
  }
  return cells;
}

function getNeighborCells(board: Board, distance: number): Position[] {
  const candidates = new Set<string>();
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== null) {
        for (let dr = -distance; dr <= distance; dr++) {
          for (let dc = -distance; dc <= distance; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (inBounds(nr, nc) && board[nr][nc] === null) {
              candidates.add(`${nr},${nc}`);
            }
          }
        }
      }
    }
  }
  return Array.from(candidates).map((key) => {
    const [r, c] = key.split(',').map(Number);
    return [r, c] as Position;
  });
}

// Count consecutive stones in a line from a position
function countLine(
  board: Board,
  row: number,
  col: number,
  dr: number,
  dc: number,
  color: CellState,
): { count: number; openEnds: number } {
  let count = 1;
  let openEnds = 0;

  // Forward
  let r = row + dr;
  let c = col + dc;
  while (inBounds(r, c) && board[r][c] === color) {
    count++;
    r += dr;
    c += dc;
  }
  if (inBounds(r, c) && board[r][c] === null) openEnds++;

  // Backward
  r = row - dr;
  c = col - dc;
  while (inBounds(r, c) && board[r][c] === color) {
    count++;
    r -= dr;
    c -= dc;
  }
  if (inBounds(r, c) && board[r][c] === null) openEnds++;

  return { count, openEnds };
}

// Evaluate a position's score for a given color
function evaluatePosition(board: Board, row: number, col: number, color: CellState): number {
  if (board[row][col] !== null) return 0;

  const testBoard = cloneBoard(board);
  testBoard[row][col] = color;

  let score = 0;
  for (const [dr, dc] of DIRECTIONS) {
    const { count, openEnds } = countLine(testBoard, row, col, dr, dc, color);

    if (count >= 5) {
      score += 100000;
    } else if (count === 4) {
      if (openEnds === 2) score += 10000;
      else if (openEnds === 1) score += 1000;
    } else if (count === 3) {
      if (openEnds === 2) score += 1000;
      else if (openEnds === 1) score += 100;
    } else if (count === 2) {
      if (openEnds === 2) score += 100;
      else if (openEnds === 1) score += 10;
    } else if (count === 1) {
      if (openEnds === 2) score += 10;
      else if (openEnds === 1) score += 1;
    }
  }

  return score;
}

// Evaluate board state for minimax
function evaluateBoard(board: Board, aiColor: CellState): number {
  const playerColor = aiColor === 'black' ? 'white' : 'black';
  let score = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === null) continue;

      const color = board[r][c];
      const mult = color === aiColor ? 1 : -1;

      for (const [dr, dc] of DIRECTIONS) {
        const { count, openEnds } = countLine(board, r, c, dr, dc, color);
        if (count >= 5) {
          score += mult * 100000;
        } else if (count === 4 && openEnds === 2) {
          score += mult * 10000;
        } else if (count === 4 && openEnds === 1) {
          score += mult * 1000;
        } else if (count === 3 && openEnds === 2) {
          score += mult * 1000;
        } else if (count === 3 && openEnds === 1) {
          score += mult * 100;
        } else if (count === 2 && openEnds === 2) {
          score += mult * 50;
        }
      }
    }
  }

  // Center preference
  const center = Math.floor(BOARD_SIZE / 2);
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== null) {
        const dist = Math.abs(r - center) + Math.abs(c - center);
        const mult = board[r][c] === aiColor ? 1 : -1;
        score += mult * Math.max(0, (BOARD_SIZE - dist));
      }
    }
  }

  return score;
}

// Find immediate threats (positions where a player can win)
function findThreats(board: Board, color: CellState): Position[] {
  const threats: Position[] = [];
  const neighbors = getNeighborCells(board, 1);

  for (const [r, c] of neighbors) {
    const testBoard = cloneBoard(board);
    testBoard[r][c] = color;
    if (checkWin(testBoard, r, c)) {
      threats.push([r, c]);
    }
  }
  return threats;
}

// ========== AI Difficulty Levels ==========

// Easy: random move near existing stones
function getEasyMove(board: Board): Position {
  const neighbors = getNeighborCells(board, 2);
  if (neighbors.length === 0) {
    const center = Math.floor(BOARD_SIZE / 2);
    return [center, center];
  }
  return neighbors[Math.floor(Math.random() * neighbors.length)];
}

// Medium: score-based evaluation
function getMediumMove(board: Board, aiColor: CellState): Position {
  const playerColor = aiColor === 'black' ? 'white' : 'black';
  const neighbors = getNeighborCells(board, 1);

  if (neighbors.length === 0) {
    const center = Math.floor(BOARD_SIZE / 2);
    return [center, center];
  }

  let bestMove = neighbors[0];
  let bestScore = -Infinity;

  for (const [r, c] of neighbors) {
    // Offensive score (AI's advantage)
    const offenseScore = evaluatePosition(board, r, c, aiColor);
    // Defensive score (blocking player)
    const defenseScore = evaluatePosition(board, r, c, playerColor);
    const totalScore = offenseScore + defenseScore * 0.9;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMove = [r, c];
    }
  }

  return bestMove;
}

// Hard: threat detection + minimax depth 3
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiColor: CellState,
  lastMove: Position | null,
): number {
  // Check if last move resulted in a win
  if (lastMove) {
    const [lr, lc] = lastMove;
    if (checkWin(board, lr, lc)) {
      const winner = board[lr][lc];
      if (winner === aiColor) return 100000 + depth;
      return -100000 - depth;
    }
  }

  if (depth === 0) {
    return evaluateBoard(board, aiColor);
  }

  const neighbors = getNeighborCells(board, 1);
  if (neighbors.length === 0) {
    return evaluateBoard(board, aiColor);
  }

  // Limit search to most promising moves
  const currentColor = isMaximizing ? aiColor : (aiColor === 'black' ? 'white' : 'black');
  const oppColor = isMaximizing ? (aiColor === 'black' ? 'white' : 'black') : aiColor;

  // Score and sort candidates
  const scored = neighbors.map(([r, c]) => {
    const offScore = evaluatePosition(board, r, c, currentColor);
    const defScore = evaluatePosition(board, r, c, oppColor);
    return { pos: [r, c] as Position, score: offScore + defScore };
  });
  scored.sort((a, b) => b.score - a.score);
  const candidates = scored.slice(0, 12).map((s) => s.pos);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const [r, c] of candidates) {
      const newBoard = placeStone(board, r, c, aiColor);
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, aiColor, [r, c]);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    const playerColor = aiColor === 'black' ? 'white' : 'black';
    let minEval = Infinity;
    for (const [r, c] of candidates) {
      const newBoard = placeStone(board, r, c, playerColor);
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, aiColor, [r, c]);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function getHardMove(board: Board, aiColor: CellState): Position {
  const playerColor = aiColor === 'black' ? 'white' : 'black';

  // 1. Check if AI can win immediately
  const aiThreats = findThreats(board, aiColor);
  if (aiThreats.length > 0) return aiThreats[0];

  // 2. Block player's winning move
  const playerThreats = findThreats(board, playerColor);
  if (playerThreats.length > 0) return playerThreats[0];

  // 3. Check for open-four threats (must block/create)
  const neighbors = getNeighborCells(board, 1);
  if (neighbors.length === 0) {
    const center = Math.floor(BOARD_SIZE / 2);
    return [center, center];
  }

  // Score candidates for pruning
  const scored = neighbors.map(([r, c]) => {
    const offScore = evaluatePosition(board, r, c, aiColor);
    const defScore = evaluatePosition(board, r, c, playerColor);
    return { pos: [r, c] as Position, score: offScore + defScore };
  });
  scored.sort((a, b) => b.score - a.score);
  const candidates = scored.slice(0, 15).map((s) => s.pos);

  // 4. Minimax with depth 3
  let bestMove = candidates[0];
  let bestScore = -Infinity;

  for (const [r, c] of candidates) {
    const newBoard = placeStone(board, r, c, aiColor);
    const score = minimax(newBoard, 2, -Infinity, Infinity, false, aiColor, [r, c]);
    if (score > bestScore) {
      bestScore = score;
      bestMove = [r, c];
    }
  }

  return bestMove;
}

// ========== Public API ==========

export function getAIMove(board: Board, aiColor: CellState, difficulty: Difficulty): Position {
  // First move: always center or near center
  const stones = countStones(board);
  if (stones.black + stones.white === 0) {
    const center = Math.floor(BOARD_SIZE / 2);
    return [center, center];
  }
  if (stones.black + stones.white === 1) {
    const center = Math.floor(BOARD_SIZE / 2);
    if (board[center][center] !== null) {
      const offsets: Position[] = [[0, 1], [1, 0], [1, 1], [-1, 1]];
      const offset = offsets[Math.floor(Math.random() * offsets.length)];
      return [center + offset[0], center + offset[1]];
    }
    return [center, center];
  }

  switch (difficulty) {
    case 'easy':
      return getEasyMove(board);
    case 'medium':
      return getMediumMove(board, aiColor);
    case 'hard':
      return getHardMove(board, aiColor);
    default:
      return getEasyMove(board);
  }
}

export function getBestMove(board: Board, color: CellState): Position | null {
  const neighbors = getNeighborCells(board, 1);
  if (neighbors.length === 0) {
    const center = Math.floor(BOARD_SIZE / 2);
    if (board[center][center] === null) return [center, center];
    return null;
  }
  return getHardMove(board, color);
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
