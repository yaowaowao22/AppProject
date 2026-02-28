import { KakuroPuzzle, KakuroCellDef } from '../types';

// Helper constructors
const B: KakuroCellDef = { type: 'blocked' };
const E: KakuroCellDef = { type: 'empty' };
function C(down?: number, right?: number): KakuroCellDef {
  const cell: KakuroCellDef = { type: 'clue' };
  if (down !== undefined) (cell as any).down = down;
  if (right !== undefined) (cell as any).right = right;
  return cell;
}

// ============================================================
// MEDIUM PUZZLES (8x8)
// ============================================================

const medium1: KakuroPuzzle = {
  id: 'med-1',
  name: '中級 1',
  rows: 8,
  cols: 8,
  difficulty: 'medium',
  grid: [
    [B,         B,         C(17),     C(24),     B,         B,         C(11),     C(7)      ],
    [B,         C(16,16),  E,         E,         C(17,17),  C(15,3),   E,         E         ],
    [C(undefined,23), E,   E,         E,         E,         E,         C(7),      C(undefined,9)],
    [C(undefined,16), E,   E,         C(17,24),  E,         E,         E,         E         ],
    [B,         C(undefined,20),E,    E,         E,         E,         C(9),      B         ],
    [B,         B,         C(undefined,6),E,     E,         C(3,10),   E,         E         ],
    [B,         C(undefined,14),E,    E,         C(undefined,3),E,     E,         B         ],
    [C(undefined,10),E,    E,         B,         C(undefined,4),E,     E,         B         ],
  ],
  solution: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 9, 7, 0, 0, 1, 2],
    [0, 8, 6, 4, 3, 2, 0, 0],
    [0, 7, 9, 0, 8, 5, 6, 3],
    [0, 0, 5, 8, 6, 1, 0, 0],
    [0, 0, 0, 2, 4, 0, 3, 7],
    [0, 0, 6, 8, 0, 2, 1, 0],
    [0, 3, 7, 0, 0, 1, 3, 0],
  ],
};

const medium2: KakuroPuzzle = {
  id: 'med-2',
  name: '中級 2',
  rows: 8,
  cols: 8,
  difficulty: 'medium',
  grid: [
    [B,         C(23),     C(11),     B,         B,         C(16),     C(3)  ,    B         ],
    [C(undefined,16),E,    E,         C(10,17),  C(24),     E,         E,         B         ],
    [C(undefined,17),E,    E,         E,         E,         E,         C(14),     C(6)      ],
    [C(undefined,7), E,    E,         E,         B,         C(undefined,15),E,    E         ],
    [B,         C(3,4),    E,         E,         C(24,17),  E,         E,         E         ],
    [C(undefined,23),E,    E,         E,         E,         E,         B,         B         ],
    [C(undefined,10),E,    E,         B,         C(undefined,16),E,    E,         C(11)     ],
    [B,         B,         C(undefined,6),E,     E,         C(undefined,3),E,     E         ],
  ],
  solution: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 9, 7, 0, 0, 8, 1, 0],
    [0, 8, 2, 3, 1, 3, 0, 0],
    [0, 1, 2, 4, 0, 0, 9, 6],
    [0, 0, 1, 3, 0, 9, 5, 3],
    [0, 5, 3, 8, 6, 1, 0, 0],
    [0, 4, 6, 0, 0, 7, 2, 0],
    [0, 0, 0, 2, 4, 0, 1, 2],
  ],
};

const medium3: KakuroPuzzle = {
  id: 'med-3',
  name: '中級 3',
  rows: 8,
  cols: 8,
  difficulty: 'medium',
  grid: [
    [B,         B,         C(16),     C(10),     B,         C(7),      C(17),     B         ],
    [B,         C(3,7),    E,         E,         C(16,10),  E,         E,         B         ],
    [C(undefined,22),E,    E,         E,         E,         E,         B,         B         ],
    [C(undefined,10),E,    E,         C(4,13),   E,         E,         C(30),     C(4)      ],
    [B,         C(16,17),  E,         E,         E,         C(undefined,4),E,     E         ],
    [C(undefined,20),E,    E,         E,         E,         E,         E,         E         ],
    [C(undefined,11),E,    E,         B,         C(undefined,7),E,     E,         B         ],
    [B,         C(undefined,3),E,     E,         B,         C(undefined,6),E,     E         ],
  ],
  solution: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 3, 4, 0, 2, 8, 0],
    [0, 7, 9, 1, 3, 2, 0, 0],
    [0, 6, 4, 0, 4, 8, 0, 0],
    [0, 0, 8, 7, 2, 0, 3, 1],
    [0, 3, 1, 5, 7, 1, 2, 1],
    [0, 2, 9, 0, 0, 3, 4, 0],
    [0, 0, 1, 2, 0, 0, 4, 2],
  ],
};

const medium4: KakuroPuzzle = {
  id: 'med-4',
  name: '中級 4',
  rows: 8,
  cols: 8,
  difficulty: 'medium',
  grid: [
    [B,         C(16),     C(23),     B,         B,         C(17),     C(15),     B         ],
    [C(undefined,12),E,    E,         B,         C(undefined,9),E,     E,         C(4)      ],
    [C(undefined,27),E,    E,         C(11,7),   E,         E,         E,         E         ],
    [B,         C(6,16),   E,         E,         E,         B,         C(16),     C(17)     ],
    [C(undefined,7), E,    E,         C(3),      B,         C(11,14),  E,         E         ],
    [C(undefined,21),E,    E,         E,         C(undefined,16),E,    E,         E         ],
    [B,         C(undefined,3),E,     E,         C(undefined,6),E,     E,         B         ],
    [B,         B,         C(undefined,8),E,     E,         E,         B,         B         ],
  ],
  solution: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 3, 9, 0, 0, 8, 1, 0],
    [0, 9, 8, 0, 1, 2, 6, 1],
    [0, 0, 7, 5, 4, 0, 0, 0],
    [0, 4, 3, 0, 0, 0, 5, 9],
    [0, 6, 8, 7, 0, 9, 3, 4],
    [0, 0, 1, 2, 0, 2, 4, 0],
    [0, 0, 0, 3, 1, 4, 0, 0],
  ],
};

const medium5: KakuroPuzzle = {
  id: 'med-5',
  name: '中級 5',
  rows: 8,
  cols: 8,
  difficulty: 'medium',
  grid: [
    [B,         B,         C(10),     C(3),      B,         C(3),      C(16),     B         ],
    [B,         C(17,4),   E,         E,         C(10,12),  E,         E,         B         ],
    [C(undefined,16),E,    E,         E,         E,         E,         B,         C(11)     ],
    [C(undefined,3), E,    E,         B,         C(12,16),  E,         E,         E         ],
    [B,         C(3),      B,         C(21,11),  E,         E,         E,         E         ],
    [C(undefined,22),E,    C(16,12),  E,         E,         E,         B,         B         ],
    [C(undefined,13),E,    E,         E,         C(undefined,6),E,     E,         B         ],
    [B,         C(undefined,11),E,    E,         E,         B,         B,         B         ],
  ],
  solution: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 3, 0, 2, 9, 0],
    [0, 7, 2, 4, 1, 2, 0, 0],
    [0, 1, 2, 0, 0, 7, 3, 6],
    [0, 0, 0, 0, 2, 1, 4, 4],
    [0, 9, 0, 5, 3, 4, 0, 0],
    [0, 4, 6, 3, 0, 2, 4, 0],
    [0, 0, 2, 1, 8, 0, 0, 0],
  ],
};

// ============================================================
// HARD PUZZLES (10x10)
// ============================================================

const hard1: KakuroPuzzle = {
  id: 'hard-1',
  name: '上級 1',
  rows: 10,
  cols: 10,
  difficulty: 'hard',
  grid: [
    [B,         C(17),     C(24),     B,         B,         B,         C(11),     C(16),     B,         B         ],
    [C(undefined,16),E,    E,         B,         B,         C(6,17),   E,         E,         C(3),      B         ],
    [C(undefined,17),E,    E,         C(23),     C(10,15),  E,         E,         E,         E,         B         ],
    [B,         C(undefined,3),E,     E,         E,         B,         B,         C(11,16),  E,         E         ],
    [B,         B,         C(6,7),    E,         E,         C(24),     C(undefined,8),E,     E,         E         ],
    [B,         C(17,22),  E,         E,         E,         E,         C(undefined,6),E,     E,         B         ],
    [C(undefined,16),E,    E,         E,         B,         C(3,3),    E,         E,         B,         B         ],
    [C(undefined,7), E,    E,         C(undefined,4),E,     E,         B,         B,         C(4),      B         ],
    [B,         C(undefined,14),E,    E,         E,         B,         B,         C(undefined,3),E,     E         ],
    [B,         B,         C(undefined,3),E,     E,         B,         B,         C(undefined,4),E,     E         ],
  ],
  solution: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 9, 7, 0, 0, 0, 8, 9, 0, 0],
    [0, 8, 9, 0, 0, 2, 1, 3, 1, 0],
    [0, 0, 1, 2, 3, 0, 0, 0, 9, 7],
    [0, 0, 0, 3, 4, 0, 0, 1, 2, 5],
    [0, 0, 5, 8, 6, 3, 0, 4, 2, 0],
    [0, 7, 3, 6, 0, 0, 2, 1, 0, 0],
    [0, 3, 4, 0, 1, 3, 0, 0, 0, 0],
    [0, 0, 8, 5, 1, 0, 0, 0, 1, 2],
    [0, 0, 0, 1, 2, 0, 0, 0, 1, 3],
  ],
};

const hard2: KakuroPuzzle = {
  id: 'hard-2',
  name: '上級 2',
  rows: 10,
  cols: 10,
  difficulty: 'hard',
  grid: [
    [B,         B,         C(23),     C(16),     B,         C(17),     C(10),     B,         C(3),      B         ],
    [B,         C(3,16),   E,         E,         C(7,10),   E,         E,         C(16,4),   E,         E         ],
    [C(undefined,17),E,    E,         E,         E,         E,         B,         C(undefined,6),E,     E         ],
    [C(undefined,23),E,    E,         E,         E,         E,         C(17),     C(undefined,16),E,    E         ],
    [B,         C(undefined,14),E,    E,         E,         B,         C(undefined,11),E,    E,         E         ],
    [B,         B,         C(4,11),   E,         E,         C(16,4),   E,         E,         B,         B         ],
    [B,         C(24,6),   E,         E,         C(undefined,17),E,    E,         E,         C(4),      B         ],
    [C(undefined,21),E,    E,         E,         E,         E,         E,         B,         C(undefined,3),E     ],
    [C(undefined,16),E,    E,         E,         E,         E,         B,         B,         C(undefined,4),E     ],
    [B,         C(undefined,3),E,     E,         B,         C(undefined,6),E,     E,         B,         B         ],
  ],
  solution: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 9, 7, 0, 8, 2, 0, 1, 3],
    [0, 8, 2, 3, 1, 3, 0, 0, 2, 4],
    [0, 9, 6, 1, 2, 5, 0, 0, 9, 7],
    [0, 0, 8, 5, 1, 0, 0, 2, 4, 5],
    [0, 0, 0, 4, 7, 0, 1, 3, 0, 0],
    [0, 0, 2, 4, 0, 9, 5, 3, 0, 0],
    [0, 7, 3, 2, 1, 4, 4, 0, 0, 2],
    [0, 1, 4, 8, 2, 1, 0, 0, 0, 1],
    [0, 0, 1, 2, 0, 0, 2, 4, 0, 0],
  ],
};

const hard3: KakuroPuzzle = {
  id: 'hard-3',
  name: '上級 3',
  rows: 10,
  cols: 10,
  difficulty: 'hard',
  grid: [
    [B,         C(16),     C(10),     B,         B,         C(24),     C(17),     B,         C(11),     C(4)      ],
    [C(undefined,11),E,    E,         C(23),     C(undefined,16),E,    E,         C(6,3),    E,         E         ],
    [C(undefined,16),E,    E,         E,         C(undefined,7),E,    E,          B,         C(undefined,10),E    ],
    [B,         C(undefined,22),E,    E,         E,         E,         B,         C(3,17),   E,         E         ],
    [B,         B,         C(6,4),    E,         E,         C(16,3),   E,         E,         B,         B         ],
    [B,         C(17,16),  E,         E,         C(undefined,11),E,    E,         C(24),     B,         B         ],
    [C(undefined,14),E,    E,         E,         C(undefined,17),E,    E,         E,         C(4),      B         ],
    [C(undefined,3), E,    E,         B,         B,         C(6,6),    E,         E,         E,         C(3)      ],
    [B,         C(undefined,10),E,    E,         B,         C(undefined,7),E,     E,         C(undefined,3),E     ],
    [B,         B,         C(undefined,3),E,     E,         B,         C(undefined,4),E,     E,         E         ],
  ],
  solution: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 9, 2, 0, 0, 8, 8, 0, 2, 1],
    [0, 7, 3, 6, 0, 3, 4, 0, 0, 3],
    [0, 0, 5, 9, 1, 7, 0, 0, 8, 9],
    [0, 0, 0, 1, 3, 0, 1, 2, 0, 0],
    [0, 0, 9, 4, 0, 2, 7, 0, 0, 0],
    [0, 3, 2, 9, 0, 8, 3, 6, 0, 0],
    [0, 1, 2, 0, 0, 0, 1, 2, 3, 0],
    [0, 0, 4, 6, 0, 0, 3, 4, 0, 1],
    [0, 0, 0, 1, 2, 0, 0, 1, 1, 2],
  ],
};

const hard4: KakuroPuzzle = {
  id: 'hard-4',
  name: '上級 4',
  rows: 10,
  cols: 10,
  difficulty: 'hard',
  grid: [
    [B,         B,         C(17),     C(3),      B,         B,         C(11),     C(24),     B,         B         ],
    [B,         C(10,4),   E,         E,         B,         C(16,16),  E,         E,         C(10),     B         ],
    [C(undefined,22),E,    E,         E,         C(17,6),   E,         E,         E,         E,         B         ],
    [C(undefined,17),E,    E,         E,         E,         E,         B,         C(4,4),    E,         E         ],
    [B,         C(23,16),  E,         E,         E,         B,         C(16,11),  E,         E,         E         ],
    [C(undefined,3), E,    E,         B,         C(6,12),   E,         E,         E,         B,         B         ],
    [C(undefined,17),E,    E,         C(17,7),   E,         E,         E,         C(3),      C(24),     B         ],
    [B,         C(undefined,21),E,    E,         E,         E,         E,         C(undefined,16),E,    E         ],
    [B,         B,         C(undefined,14),E,    E,         E,         B,         C(undefined,10),E,    E         ],
    [B,         B,         B,         C(undefined,6),E,     E,         B,         B,         C(undefined,7),E     ],
  ],
  solution: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 3, 0, 0, 7, 9, 0, 0],
    [0, 8, 9, 5, 0, 3, 1, 2, 4, 0],
    [0, 2, 8, 1, 3, 3, 0, 0, 1, 3],
    [0, 0, 7, 4, 5, 0, 0, 3, 2, 6],
    [0, 1, 2, 0, 0, 4, 6, 2, 0, 0],
    [0, 9, 3, 0, 1, 2, 4, 0, 0, 0],
    [0, 0, 3, 8, 2, 1, 7, 0, 9, 7],
    [0, 0, 0, 9, 4, 1, 0, 0, 3, 7],
    [0, 0, 0, 0, 2, 4, 0, 0, 0, 2],
  ],
};

const hard5: KakuroPuzzle = {
  id: 'hard-5',
  name: '上級 5',
  rows: 10,
  cols: 10,
  difficulty: 'hard',
  grid: [
    [B,         C(16),     C(24),     B,         C(17),     C(3),      B,         B,         C(11),     C(10)     ],
    [C(undefined,7), E,    E,         C(undefined,16),E,    E,         B,         C(6,4),    E,         E         ],
    [C(undefined,30),E,    E,         E,         E,         E,         C(16,3),   E,         E,         B         ],
    [C(undefined,10),E,    E,         E,         B,         C(23,6),   E,         E,         C(23),     B         ],
    [B,         C(17),     B,         C(undefined,17),E,    E,         E,         B,         C(undefined,9),E     ],
    [C(undefined,16),E,    C(16,13),  E,         E,         E,         B,         C(undefined,17),E,    E         ],
    [C(undefined,7), E,    E,         E,         B,         C(undefined,16),E,    E,         E,         E         ],
    [B,         C(3,11),   E,         E,         C(10,7),   E,         E,         B,         C(undefined,6),E     ],
    [B,         C(undefined,6),E,     E,         E,         B,         C(undefined,4),E,     E,         B         ],
    [B,         B,         C(undefined,3),E,     E,         B,         B,         C(undefined,10),E,    E         ],
  ],
  solution: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 3, 4, 0, 9, 2, 0, 0, 3, 1],
    [0, 9, 8, 7, 3, 1, 0, 2, 1, 0],
    [0, 4, 3, 3, 0, 0, 2, 4, 0, 0],
    [0, 0, 0, 0, 8, 5, 4, 0, 0, 3],
    [0, 7, 0, 6, 4, 3, 0, 0, 9, 8],
    [0, 1, 3, 3, 0, 0, 9, 2, 1, 4],
    [0, 0, 5, 6, 0, 3, 4, 0, 0, 2],
    [0, 0, 2, 1, 3, 0, 0, 1, 3, 0],
    [0, 0, 0, 1, 2, 0, 0, 0, 4, 6],
  ],
};

// ============================================================
// EXPERT PUZZLES (12x12)
// ============================================================

const expert1: KakuroPuzzle = {
  id: 'exp-1',
  name: '達人 1',
  rows: 12,
  cols: 12,
  difficulty: 'expert',
  grid: [
    [B,        C(16),     C(24),     B,         B,         C(17),     C(10),     B,         B,         C(11),     C(16),     B         ],
    [C(undefined,7),E,    E,         B,         C(24,16),  E,         E,         C(3),      C(6,4),    E,         E,         B         ],
    [C(undefined,30),E,   E,         C(23,17),  E,         E,         E,         E,         C(undefined,6),E,     E,         B         ],
    [C(undefined,10),E,   E,         E,         B,         C(17),     B,         C(undefined,17),E,    E,         E,         C(4)      ],
    [B,        C(undefined,3),E,     E,         C(16,7),   E,         C(24,11),  E,         E,         E,         B,         C(undefined,3)],
    [B,        B,         C(4,16),   E,         E,         E,         E,         B,         C(undefined,11),E,    C(16,4),   E         ],
    [B,        C(17,12),  E,         E,         E,         B,         C(3,3),    E,         E,         B,         C(undefined,10),E    ],
    [C(undefined,22),E,   E,         E,         E,         C(10,6),   E,         E,         B,         C(11,7),   E,         E         ],
    [C(undefined,10),E,   E,         B,         C(undefined,11),E,    E,         C(17),     C(undefined,17),E,    E,         E         ],
    [B,        C(undefined,16),E,    C(23,6),   E,         E,         B,         C(undefined,24),E,    E,         E,         E         ],
    [B,        B,         C(undefined,3),E,     E,         C(undefined,3),E,     E,         C(undefined,3),E,     E,         B         ],
    [B,        B,         B,         C(undefined,4),E,     E,         B,         C(undefined,3),E,     E,         B,         B         ],
  ],
  solution: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 3, 4, 0, 0, 9, 7, 0, 0, 1, 3, 0],
    [0, 9, 8, 0, 7, 3, 1, 6, 0, 2, 4, 0],
    [0, 4, 3, 3, 0, 0, 0, 0, 8, 5, 1, 0],
    [0, 0, 1, 2, 0, 3, 0, 4, 1, 6, 0, 0],
    [0, 0, 0, 7, 4, 2, 3, 0, 0, 2, 0, 1],
    [0, 0, 5, 1, 6, 0, 0, 2, 1, 0, 0, 3],
    [0, 7, 9, 5, 1, 0, 3, 3, 0, 0, 4, 3],
    [0, 3, 7, 0, 0, 2, 4, 0, 0, 8, 6, 3],
    [0, 0, 8, 0, 1, 3, 0, 0, 9, 7, 2, 6],
    [0, 0, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0],
    [0, 0, 0, 0, 1, 3, 0, 0, 1, 2, 0, 0],
  ],
};

const expert2: KakuroPuzzle = {
  id: 'exp-2',
  name: '達人 2',
  rows: 12,
  cols: 12,
  difficulty: 'expert',
  grid: [
    [B,        B,         C(23),     C(17),     B,         C(16),     C(3),      B,         B,         C(10),     C(24),     B         ],
    [B,        C(10,16),  E,         E,         C(3,10),   E,         E,         B,         C(17,16),  E,         E,         C(4)      ],
    [C(undefined,23),E,   E,         E,         E,         E,         B,         C(undefined,17),E,    E,         E,         E         ],
    [C(undefined,16),E,   E,         E,         B,         C(24,16),  E,         E,         E,         E,         B,         C(undefined,3)],
    [B,        C(17),     B,         C(3,3),    E,         E,         E,         B,         C(undefined,22),E,    C(11,6),   E         ],
    [C(undefined,11),E,   C(11,16),  E,         E,         E,         B,         C(16,6),   E,         E,         E,         B         ],
    [C(undefined,7), E,   E,         E,         C(3),      B,         C(10,14),  E,         E,         E,         C(undefined,17),E    ],
    [B,        C(undefined,16),E,    E,         E,         C(10,10),  E,         E,         E,         B,         C(undefined,3),E     ],
    [B,        C(undefined,17),E,    E,         E,         E,         E,         B,         C(6,3),    E,         E,         B         ],
    [C(undefined,24),E,   E,         E,         E,         E,         B,         C(undefined,16),E,    E,         E,         C(3)      ],
    [C(undefined,3), E,   E,         B,         C(undefined,4),E,     E,         C(undefined,3),E,     E,         B,         C(undefined,4)],
    [B,        B,         C(undefined,10),E,    E,         E,         B,         B,         C(undefined,7),E,     E,         E         ],
  ],
  solution: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 9, 7, 0, 1, 2, 0, 0, 9, 7, 0],
    [0, 8, 5, 4, 3, 3, 0, 0, 8, 1, 4, 4],
    [0, 7, 2, 7, 0, 0, 9, 8, 6, 1, 0, 0],
    [0, 0, 0, 0, 1, 2, 3, 0, 0, 6, 0, 2],
    [0, 2, 0, 8, 5, 3, 0, 0, 3, 2, 1, 0],
    [0, 3, 1, 3, 0, 0, 0, 7, 4, 3, 0, 9],
    [0, 0, 9, 2, 5, 0, 4, 3, 3, 0, 0, 1],
    [0, 0, 1, 5, 3, 6, 2, 0, 0, 1, 2, 0],
    [0, 9, 7, 1, 4, 3, 0, 0, 8, 3, 2, 0],
    [0, 1, 2, 0, 0, 1, 3, 0, 2, 1, 0, 0],
    [0, 0, 0, 4, 2, 4, 0, 0, 0, 3, 1, 3],
  ],
};

const expert3: KakuroPuzzle = {
  id: 'exp-3',
  name: '達人 3',
  rows: 12,
  cols: 12,
  difficulty: 'expert',
  grid: [
    [B,        C(17),     C(16),     B,         B,         C(23),     C(10),     B,         C(3),      B,         C(4),      B         ],
    [C(undefined,10),E,   E,         C(16),     C(undefined,7),E,     E,         C(undefined,3),E,    E,          B,         B         ],
    [C(undefined,24),E,   E,         E,         C(undefined,16),E,    E,         E,         B,         C(17,6),   E,         E         ],
    [C(undefined,3), E,   E,         B,         C(6,23),   E,        E,          E,         C(16,8),   E,         E,         E         ],
    [B,        C(24,17),  E,         E,         E,         E,        E,          B,         C(undefined,10),E,    E,         B         ],
    [C(undefined,3), E,   E,         B,         C(undefined,11),E,   E,          C(10,16),  E,         E,         E,         C(11)     ],
    [C(undefined,16),E,   E,         C(17,3),   E,         E,        B,          C(undefined,14),E,    E,         E,         E         ],
    [B,        C(3,11),   E,         E,         E,         B,        C(23,10),   E,         E,         E,         B,         C(undefined,4)],
    [B,        C(undefined,6),E,     E,         C(undefined,17),E,   E,          E,         B,         C(undefined,4),E,     E         ],
    [C(undefined,16),E,   E,         E,         C(undefined,3),E,    E,          C(3),      C(undefined,7),E,     E,         B         ],
    [C(undefined,17),E,   E,         E,         B,         C(undefined,4),E,     E,         C(undefined,3),E,     E,         B         ],
    [B,        C(undefined,3),E,     E,         B,         B,        C(undefined,6),E,      E,         B,         B,         B         ],
  ],
  solution: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 9, 0, 0, 4, 3, 0, 1, 2, 0, 0],
    [0, 8, 3, 7, 0, 9, 2, 5, 0, 0, 2, 4],
    [0, 1, 2, 0, 0, 6, 8, 9, 0, 3, 1, 4],
    [0, 0, 2, 9, 3, 1, 2, 0, 0, 7, 3, 0],
    [0, 1, 2, 0, 0, 3, 1, 0, 7, 4, 2, 0],
    [0, 7, 9, 0, 2, 1, 0, 0, 8, 1, 2, 3],
    [0, 0, 3, 4, 4, 0, 0, 5, 1, 4, 0, 0],
    [0, 0, 4, 2, 0, 8, 5, 4, 0, 0, 1, 3],
    [0, 9, 1, 6, 0, 2, 1, 0, 0, 3, 4, 0],
    [0, 8, 6, 3, 0, 0, 1, 3, 0, 1, 2, 0],
    [0, 0, 2, 1, 0, 0, 0, 4, 2, 0, 0, 0],
  ],
};

const expert4: KakuroPuzzle = {
  id: 'exp-4',
  name: '達人 4',
  rows: 12,
  cols: 12,
  difficulty: 'expert',
  grid: [
    [B,        B,         C(10),     C(17),     B,         B,         C(24),     C(16),     B,         C(3),      B,         B         ],
    [B,        C(16,4),   E,         E,         B,         C(23,16),  E,         E,         C(4,4),    E,         E,         B         ],
    [C(undefined,23),E,   E,         E,         C(10,7),   E,         E,         E,         C(undefined,6),E,     E,         C(11)     ],
    [C(undefined,17),E,   E,         E,         E,         E,         B,         C(3,17),   E,         E,         E,         E         ],
    [B,        C(undefined,6),E,     E,         B,         C(17,6),   E,         E,         E,         B,         C(undefined,3),E     ],
    [B,        B,         C(10,10),  E,         E,         E,         B,         C(16),     C(undefined,7),E,     E,         B         ],
    [B,        C(24,17),  E,         E,         E,         B,         C(4,3),    E,         C(undefined,16),E,    E,         C(17)     ],
    [C(undefined,16),E,   E,         E,         C(11),     C(undefined,11),E,    E,         C(undefined,23),E,    E,         E         ],
    [C(undefined,3), E,   E,         B,         C(undefined,17),E,    E,         E,         C(undefined,10),E,    E,         E         ],
    [B,        C(24,11),  E,         E,         E,         E,         B,         C(6,4),    E,         E,         B,         C(undefined,10)],
    [C(undefined,16),E,   E,         E,         E,         B,         C(undefined,7),E,     E,         C(undefined,16),E,    E         ],
    [B,        C(undefined,3),E,     E,         B,         B,         C(undefined,3),E,     E,         B,         C(undefined,6),E     ],
  ],
  solution: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 3, 0, 0, 9, 7, 0, 1, 3, 0],
    [0, 8, 6, 9, 0, 3, 1, 2, 0, 2, 4, 0],
    [0, 2, 4, 8, 1, 2, 0, 0, 9, 3, 1, 4],
    [0, 0, 2, 4, 0, 0, 2, 1, 3, 0, 0, 1],
    [0, 0, 0, 5, 1, 4, 0, 0, 0, 4, 3, 0],
    [0, 0, 8, 3, 6, 0, 0, 2, 0, 7, 2, 0],
    [0, 7, 3, 6, 0, 0, 5, 6, 0, 9, 8, 6],
    [0, 1, 2, 0, 0, 9, 4, 4, 0, 3, 1, 6],
    [0, 0, 2, 1, 5, 3, 0, 0, 1, 3, 0, 0],
    [0, 9, 3, 2, 2, 0, 0, 3, 4, 0, 8, 8],
    [0, 0, 1, 2, 0, 0, 0, 1, 2, 0, 0, 2],
  ],
};

const expert5: KakuroPuzzle = {
  id: 'exp-5',
  name: '達人 5',
  rows: 12,
  cols: 12,
  difficulty: 'expert',
  grid: [
    [B,        C(23),     C(16),     B,         C(17),     C(3),      B,         B,         C(10),     C(24),     B,         B         ],
    [C(undefined,16),E,   E,         C(undefined,11),E,    E,         B,         C(23,7),   E,         E,         C(4),      B         ],
    [C(undefined,24),E,   E,         E,         E,         E,         C(16,16),  E,         E,         E,         E,         B         ],
    [C(undefined,10),E,   E,         E,         B,         C(17),     C(undefined,3),E,     E,         B,         C(undefined,3),E     ],
    [B,        C(3),      B,         C(3,10),   E,         E,         C(undefined,17),E,    B,         C(11,4),   E,         E         ],
    [C(undefined,16),E,   C(24,11),  E,         E,         E,         C(undefined,24),E,    C(23,16),  E,         E,         E         ],
    [C(undefined,3), E,   E,         B,         C(16,6),   E,         E,         C(undefined,16),E,    E,         E,         B         ],
    [B,        C(17,17),  E,         E,         E,         E,         B,         C(undefined,4),E,     E,         C(3),      B         ],
    [C(undefined,10),E,   E,         E,         E,         B,         C(10,10),  E,         E,         E,         C(undefined,6),E     ],
    [C(undefined,7), E,   E,         B,         C(undefined,17),E,    E,         E,         E,         B,         C(undefined,4),E     ],
    [B,        C(undefined,3),E,     E,         C(undefined,3),E,     E,         B,         C(undefined,3),E,     E,         B         ],
    [B,        B,         C(undefined,4),E,     E,         B,         C(undefined,10),E,    E,         E,         B,         B         ],
  ],
  solution: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 9, 7, 0, 8, 3, 0, 0, 3, 4, 0, 0],
    [0, 8, 5, 4, 3, 1, 0, 9, 2, 1, 4, 0],
    [0, 4, 3, 3, 0, 0, 0, 1, 2, 0, 0, 1],
    [0, 0, 0, 0, 4, 6, 0, 8, 0, 0, 1, 3],
    [0, 7, 0, 5, 3, 3, 0, 9, 0, 8, 5, 3],
    [0, 2, 1, 0, 0, 2, 4, 0, 7, 6, 2, 0],
    [0, 0, 8, 3, 2, 4, 0, 0, 1, 3, 0, 0],
    [0, 3, 2, 1, 4, 0, 0, 4, 2, 4, 0, 2],
    [0, 1, 6, 0, 0, 9, 5, 1, 2, 0, 0, 1],
    [0, 0, 1, 2, 0, 1, 2, 0, 0, 2, 1, 0],
    [0, 0, 0, 1, 3, 0, 0, 3, 4, 3, 0, 0],
  ],
};

export const PUZZLES: KakuroPuzzle[] = [
  medium1,
  medium2,
  medium3,
  medium4,
  medium5,
  hard1,
  hard2,
  hard3,
  hard4,
  hard5,
  expert1,
  expert2,
  expert3,
  expert4,
  expert5,
];

export const DIFFICULTY_LABELS: Record<string, string> = {
  medium: '中級 (8x8)',
  hard: '上級 (10x10)',
  expert: '達人 (12x12)',
};

export function getPuzzlesByDifficulty(difficulty: string): KakuroPuzzle[] {
  return PUZZLES.filter((p) => p.difficulty === difficulty);
}
