import type { Board, Difficulty } from '../types';

/**
 * Create an empty 9x9 board filled with zeros.
 */
export function createEmptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

/**
 * Deep clone a board.
 */
export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/**
 * Check if placing `num` at (row, col) is valid on the board.
 */
export function isValidPlacement(
  board: Board,
  row: number,
  col: number,
  num: number,
): boolean {
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c] === num) return false;
  }

  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col] === num) return false;
  }

  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (r !== row || c !== col) {
        if (board[r][c] === num) return false;
      }
    }
  }

  return true;
}

/**
 * Shuffle an array in-place using Fisher-Yates.
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Fill the board completely using backtracking with randomized candidates.
 * Returns true if successful.
 */
function fillBoard(board: Board): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const candidates = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of candidates) {
          if (isValidPlacement(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/**
 * Count the number of solutions for a board (stops at 2 for efficiency).
 */
function countSolutions(board: Board, limit: number = 2): number {
  let count = 0;

  function solve(b: Board): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (b[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(b, row, col, num)) {
              b[row][col] = num;
              if (solve(b)) return true;
              b[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    count++;
    return count >= limit;
  }

  const copy = cloneBoard(board);
  solve(copy);
  return count;
}

/**
 * Get the number of cells to remove based on difficulty.
 */
function getCellsToRemove(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':
      return 30;
    case 'medium':
      return 45;
    case 'hard':
      return 55;
  }
}

/**
 * Generate a sudoku puzzle with a unique solution.
 * Returns [puzzle, solution].
 */
export function generatePuzzle(difficulty: Difficulty): {
  puzzle: Board;
  solution: Board;
} {
  const solution = createEmptyBoard();
  fillBoard(solution);

  const puzzle = cloneBoard(solution);
  const cellsToRemove = getCellsToRemove(difficulty);

  const positions: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  shuffle(positions);

  let removed = 0;
  for (const [row, col] of positions) {
    if (removed >= cellsToRemove) break;

    const backup = puzzle[row][col];
    puzzle[row][col] = 0;

    if (countSolutions(puzzle) === 1) {
      removed++;
    } else {
      puzzle[row][col] = backup;
    }
  }

  return { puzzle, solution };
}

/**
 * Find all conflicts for the current board state.
 * Returns a set of "row,col" strings that are in conflict.
 */
export function findConflicts(board: Board): Set<string> {
  const conflicts = new Set<string>();

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const num = board[row][col];
      if (num === 0) continue;

      for (let c = 0; c < 9; c++) {
        if (c !== col && board[row][c] === num) {
          conflicts.add(`${row},${col}`);
          conflicts.add(`${row},${c}`);
        }
      }

      for (let r = 0; r < 9; r++) {
        if (r !== row && board[r][col] === num) {
          conflicts.add(`${row},${col}`);
          conflicts.add(`${r},${col}`);
        }
      }

      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
          if ((r !== row || c !== col) && board[r][c] === num) {
            conflicts.add(`${row},${col}`);
            conflicts.add(`${r},${c}`);
          }
        }
      }
    }
  }

  return conflicts;
}

/**
 * Check if the board is completely and correctly filled.
 */
export function isBoardComplete(board: Board): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) return false;
    }
  }
  return findConflicts(board).size === 0;
}

/**
 * Find the first empty cell that could use a hint.
 * Returns [row, col] or null.
 */
export function findHintCell(
  currentBoard: Board,
  initialBoard: Board,
  solution: Board,
): [number, number] | null {
  const emptyCells: [number, number][] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (initialBoard[row][col] === 0 && currentBoard[row][col] !== solution[row][col]) {
        emptyCells.push([row, col]);
      }
    }
  }
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

/**
 * Format seconds into MM:SS string.
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get difficulty label in Japanese.
 */
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
