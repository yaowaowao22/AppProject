import type { Board, Cage, Difficulty, NotesBoard } from '../types';

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

export function createNotesBoard(): NotesBoard {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set<number>()),
  );
}

export function cloneNotesBoard(notes: NotesBoard): NotesBoard {
  return notes.map((row) =>
    row.map((cell) => new Set(cell)),
  );
}

export function findConflicts(board: Board, cages: Cage[]): Set<string> {
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

  for (const cage of cages) {
    const values: number[] = [];
    const cellKeys: string[] = [];
    let allFilled = true;

    for (const [r, c] of cage.cells) {
      const val = board[r][c];
      cellKeys.push(`${r},${c}`);
      if (val === 0) {
        allFilled = false;
      } else {
        values.push(val);
      }
    }

    const seen = new Set<number>();
    for (let i = 0; i < values.length; i++) {
      if (seen.has(values[i])) {
        for (let j = 0; j < cage.cells.length; j++) {
          const [r, c] = cage.cells[j];
          if (board[r][c] === values[i]) {
            conflicts.add(`${r},${c}`);
          }
        }
      }
      seen.add(values[i]);
    }

    if (allFilled) {
      const sum = values.reduce((a, b) => a + b, 0);
      if (sum !== cage.sum) {
        for (const key of cellKeys) {
          conflicts.add(key);
        }
      }
    }
  }

  return conflicts;
}

export function isBoardComplete(board: Board, cages: Cage[]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) return false;
    }
  }
  return findConflicts(board, cages).size === 0;
}

export function findHintCell(
  currentBoard: Board,
  givenBoard: Board,
  solution: Board,
): [number, number] | null {
  const candidates: [number, number][] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (givenBoard[row][col] === 0 && currentBoard[row][col] !== solution[row][col]) {
        candidates.push([row, col]);
      }
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getDifficultyLabel(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'easy':
      return '\u521D\u7D1A';
    case 'medium':
      return '\u4E2D\u7D1A';
    case 'hard':
      return '\u4E0A\u7D1A';
  }
}

const CAGE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F0B27A', '#82E0AA',
  '#F1948A', '#AED6F1', '#D5DBDB', '#FAD7A0',
  '#A3E4D7', '#D2B4DE', '#A9DFBF', '#F9E79F',
  '#ABEBC6', '#D6EAF8', '#FADBD8', '#E8DAEF',
  '#D5F5E3', '#FCF3CF', '#D4E6F1', '#FDEBD0',
  '#E8F8F5', '#FEF9E7', '#EBF5FB', '#F4ECF7',
];

export function getCageColor(index: number): string {
  return CAGE_COLORS[index % CAGE_COLORS.length];
}

export function getCageForCell(
  row: number,
  col: number,
  cages: Cage[],
): { cage: Cage; index: number } | null {
  for (let i = 0; i < cages.length; i++) {
    for (const [r, c] of cages[i].cells) {
      if (r === row && c === col) {
        return { cage: cages[i], index: i };
      }
    }
  }
  return null;
}

export function isFirstCellInCage(row: number, col: number, cage: Cage): boolean {
  return cage.cells[0][0] === row && cage.cells[0][1] === col;
}

export function getCageBorders(
  row: number,
  col: number,
  cage: Cage,
): { top: boolean; bottom: boolean; left: boolean; right: boolean } {
  const cellSet = new Set(cage.cells.map(([r, c]) => `${r},${c}`));
  return {
    top: !cellSet.has(`${row - 1},${col}`),
    bottom: !cellSet.has(`${row + 1},${col}`),
    left: !cellSet.has(`${row},${col - 1}`),
    right: !cellSet.has(`${row},${col + 1}`),
  };
}
