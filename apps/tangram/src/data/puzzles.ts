export interface PieceData {
  id: string;
  shape: boolean[][];
  color: string;
}

export interface TangramPuzzle {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  gridSize: number;
  target: boolean[][];
  pieces: PieceData[];
}

export interface PuzzleResult {
  id: string;
  puzzleId: string;
  puzzleName: string;
  difficulty: string;
  date: string;
  timeSeconds: number;
}

function g(rows: number[][]): boolean[][] {
  return rows.map((row) => row.map((v) => v === 1));
}

const C = {
  red: '#E74C3C',
  blue: '#3498DB',
  green: '#2ECC71',
  orange: '#E67E22',
  purple: '#9B59B6',
  teal: '#1ABC9C',
  pink: '#E91E63',
  yellow: '#F1C40F',
};

// =============================================
// EASY: 4x4 grid, 2-3 pieces
// Cell counts verified for each puzzle.
// =============================================

const easyPuzzles: TangramPuzzle[] = [
  {
    // 1___  target=5  p1(3)+p2(2)=5
    // 1___  p1: vertical I-3 at (0,0)
    // 111_  p2: horizontal I-2 at (2,1)
    // ____
    id: 'e01',
    name: 'L字',
    difficulty: 'easy',
    gridSize: 4,
    target: g([[1, 0, 0, 0], [1, 0, 0, 0], [1, 1, 1, 0], [0, 0, 0, 0]]),
    pieces: [
      { id: 'p1', shape: g([[1], [1], [1]]), color: C.red },
      { id: 'p2', shape: g([[1, 1]]), color: C.blue },
    ],
  },
  {
    // 111_  target=5  p1(3)+p2(2)=5
    // _1__  p1: horiz I-3 at (0,0)
    // _1__  p2: vert I-2 at (1,1)
    // ____
    id: 'e02',
    name: 'T字',
    difficulty: 'easy',
    gridSize: 4,
    target: g([[1, 1, 1, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0]]),
    pieces: [
      { id: 'p1', shape: g([[1, 1, 1]]), color: C.green },
      { id: 'p2', shape: g([[1], [1]]), color: C.orange },
    ],
  },
  {
    // 11__  target=4  p1(2)+p2(2)=4
    // 11__  p1: horiz at (0,0), p2: horiz at (1,0)
    // ____
    // ____
    id: 'e03',
    name: '四角',
    difficulty: 'easy',
    gridSize: 4,
    target: g([[1, 1, 0, 0], [1, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]),
    pieces: [
      { id: 'p1', shape: g([[1, 1]]), color: C.purple },
      { id: 'p2', shape: g([[1, 1]]), color: C.teal },
    ],
  },
  {
    // 1___  target=5  p1(3)+p2(2)=5
    // 11__  p1: [10/11] at (0,0) => (0,0)(1,0)(1,1)
    // _11_  p2: [11] at (2,1) => (2,1)(2,2)
    // ____
    id: 'e04',
    name: '階段',
    difficulty: 'easy',
    gridSize: 4,
    target: g([[1, 0, 0, 0], [1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0]]),
    pieces: [
      { id: 'p1', shape: g([[1, 0], [1, 1]]), color: C.red },
      { id: 'p2', shape: g([[1, 1]]), color: C.blue },
    ],
  },
  {
    // _1__  target=5  p1(4)+p2(1)=5
    // 111_  p1: T [010/111] at (0,0) => (0,1)(1,0)(1,1)(1,2)
    // _1__  p2: [1] at (2,1) => (2,1)
    // ____
    id: 'e05',
    name: '十字',
    difficulty: 'easy',
    gridSize: 4,
    target: g([[0, 1, 0, 0], [1, 1, 1, 0], [0, 1, 0, 0], [0, 0, 0, 0]]),
    pieces: [
      { id: 'p1', shape: g([[0, 1, 0], [1, 1, 1]]), color: C.green },
      { id: 'p2', shape: g([[1]]), color: C.orange },
    ],
  },
  {
    // 11__  target=5  p1(3)+p2(2)=5
    // _1__  p1: [11/01] at (0,0) => (0,0)(0,1)(1,1)
    // _11_  p2: [11] at (2,1) => (2,1)(2,2)
    // ____
    id: 'e06',
    name: 'S字',
    difficulty: 'easy',
    gridSize: 4,
    target: g([[1, 1, 0, 0], [0, 1, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0]]),
    pieces: [
      { id: 'p1', shape: g([[1, 1], [0, 1]]), color: C.purple },
      { id: 'p2', shape: g([[1, 1]]), color: C.pink },
    ],
  },
  {
    // 1_1_  target=5  p1(3)+p2(2)=5
    // 111_  p1: [10/11] at (0,0) => (0,0)(1,0)(1,1)
    // ____  p2: [1/1] at (0,2) => (0,2)(1,2)
    // ____
    id: 'e07',
    name: 'コの字',
    difficulty: 'easy',
    gridSize: 4,
    target: g([[1, 0, 1, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]]),
    pieces: [
      { id: 'p1', shape: g([[1, 0], [1, 1]]), color: C.teal },
      { id: 'p2', shape: g([[1], [1]]), color: C.yellow },
    ],
  },
];

// =============================================
// MEDIUM: 5x5 grid, 3-4 pieces
// =============================================

const mediumPuzzles: TangramPuzzle[] = [
  {
    // __1__  target=9  p1(4)+p2(3)+p3(2)=9
    // _111_  (1+3+3+1+1)
    // _111_  p1: T [010/111] at (0,1) => (0,2)(1,1)(1,2)(1,3) = 4
    // __1__  p2: [111] at (2,1) => (2,1)(2,2)(2,3) = 3
    // __1__  p3: [1/1] at (3,2) => (3,2)(4,2) = 2
    id: 'm01',
    name: '矢印',
    difficulty: 'medium',
    gridSize: 5,
    target: g([[0, 0, 1, 0, 0], [0, 1, 1, 1, 0], [0, 1, 1, 1, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0]]),
    pieces: [
      { id: 'p1', shape: g([[0, 1, 0], [1, 1, 1]]), color: C.red },
      { id: 'p2', shape: g([[1, 1, 1]]), color: C.blue },
      { id: 'p3', shape: g([[1], [1]]), color: C.green },
    ],
  },
  {
    // 111__  target=10  p1(3)+p2(4)+p3(3)=10
    // 111__  (3+3+2+2)
    // _11__  p1: [111] at (0,0) => (0,0)(0,1)(0,2) = 3
    // _11__  p2: [11/11] at (1,1) => (1,1)(1,2)(2,1)(2,2) = 4
    // _____  p3: [1/11] at (1,0) => (1,0)(2,0)... wait (2,0)=0 in target. Nope.
    //
    // Re-tile:
    // AAA__
    // ABBB_
    // _CC__
    // _CC__
    // p1: [111/1__] => not rectangular. Need rectangular shapes.
    //
    // p1: [111] at (0,0) => row0: (0,0)(0,1)(0,2) = 3
    // p2: [111/011/011] at (1,0) => (1,0)(1,1)(1,2)(2,1)(2,2)(3,1)(3,2) = 7. Too many.
    //
    // Redesign target to be cleaner:
    // 1110_  (3)
    // 1110_  (3)
    // _110_  (2)
    // _110_  (2)  total=10
    // _____
    //
    // p1: [111] at (0,0) = 3: (0,0)(0,1)(0,2)
    // p2: [111] at (1,0) = 3: (1,0)(1,1)(1,2)
    // p3: [11/11] at (2,1) = 4: (2,1)(2,2)(3,1)(3,2)
    // Total: 3+3+4=10 ✓
    id: 'm02',
    name: '壁',
    difficulty: 'medium',
    gridSize: 5,
    target: g([[1, 1, 1, 0, 0], [1, 1, 1, 0, 0], [0, 1, 1, 0, 0], [0, 1, 1, 0, 0], [0, 0, 0, 0, 0]]),
    pieces: [
      { id: 'p1', shape: g([[1, 1, 1]]), color: C.pink },
      { id: 'p2', shape: g([[1, 1, 1]]), color: C.red },
      { id: 'p3', shape: g([[1, 1], [1, 1]]), color: C.blue },
    ],
  },
  {
    // _111_  target=12  p1(3)+p2(6)+p3(3)=12
    // _111_  (3+3+3+3)
    // _111_  p1: [111] at (0,1) = 3
    // _111_  p2: [111/111] at (1,1) = 6
    // _____  p3: [111] at (3,1) = 3
    id: 'm03',
    name: '塔',
    difficulty: 'medium',
    gridSize: 5,
    target: g([[0, 1, 1, 1, 0], [0, 1, 1, 1, 0], [0, 1, 1, 1, 0], [0, 1, 1, 1, 0], [0, 0, 0, 0, 0]]),
    pieces: [
      { id: 'p1', shape: g([[1, 1, 1]]), color: C.orange },
      { id: 'p2', shape: g([[1, 1, 1], [1, 1, 1]]), color: C.red },
      { id: 'p3', shape: g([[1, 1, 1]]), color: C.purple },
    ],
  },
  {
    // _11__  target=9  p1(3)+p2(3)+p3(3)=9
    // __1__  (2+1+3+1+2)
    // _111_  p1: [11/01] at (0,1) => (0,1)(0,2)(1,2) = 3
    // _1___  p2: [111] at (2,1) => (2,1)(2,2)(2,3) = 3
    // _11__  p3: [10/11] at (3,1) => (3,1)(4,1)(4,2) = 3
    id: 'm04',
    name: '稲妻',
    difficulty: 'medium',
    gridSize: 5,
    target: g([[0, 1, 1, 0, 0], [0, 0, 1, 0, 0], [0, 1, 1, 1, 0], [0, 1, 0, 0, 0], [0, 1, 1, 0, 0]]),
    pieces: [
      { id: 'p1', shape: g([[1, 1], [0, 1]]), color: C.yellow },
      { id: 'p2', shape: g([[1, 1, 1]]), color: C.orange },
      { id: 'p3', shape: g([[1, 0], [1, 1]]), color: C.red },
    ],
  },
  {
    // __1__  target=13  p1(5)+p2(4)+p3(4)=13
    // _111_  (1+3+5+3+1)
    // 11111  p1: [11111] at (2,0) => row2 = 5
    // _111_  p2: T [010/111] at (0,1) => (0,2)(1,1)(1,2)(1,3) = 4
    // __1__  p3: T-inv [111/010] at (3,1) => (3,1)(3,2)(3,3)(4,2) = 4
    id: 'm05',
    name: 'ダイヤ',
    difficulty: 'medium',
    gridSize: 5,
    target: g([[0, 0, 1, 0, 0], [0, 1, 1, 1, 0], [1, 1, 1, 1, 1], [0, 1, 1, 1, 0], [0, 0, 1, 0, 0]]),
    pieces: [
      { id: 'p1', shape: g([[1, 1, 1, 1, 1]]), color: C.blue },
      { id: 'p2', shape: g([[0, 1, 0], [1, 1, 1]]), color: C.teal },
      { id: 'p3', shape: g([[1, 1, 1], [0, 1, 0]]), color: C.green },
    ],
  },
  {
    // __1__  target=13  p1(4)+p2(5)+p3(4)=13
    // _111_  (1+3+5+1+3)
    // 11111  p1: T at (0,1) => (0,2)(1,1)(1,2)(1,3) = 4
    // __1__  p2: [11111] at (2,0) => row2 = 5
    // _111_  p3: T at (3,1) => (3,2)(4,1)(4,2)(4,3) = 4
    id: 'm06',
    name: '飛行機',
    difficulty: 'medium',
    gridSize: 5,
    target: g([[0, 0, 1, 0, 0], [0, 1, 1, 1, 0], [1, 1, 1, 1, 1], [0, 0, 1, 0, 0], [0, 1, 1, 1, 0]]),
    pieces: [
      { id: 'p1', shape: g([[0, 1, 0], [1, 1, 1]]), color: C.blue },
      { id: 'p2', shape: g([[1, 1, 1, 1, 1]]), color: C.teal },
      { id: 'p3', shape: g([[0, 1, 0], [1, 1, 1]]), color: C.purple },
    ],
  },
  {
    // _11__  target=11  p1(3)+p2(5)+p3(3)=11
    // __1__  (2+1+5+1+2)
    // 11111  p1: [11/01] at (0,1) => (0,1)(0,2)(1,2) = 3
    // __1__  p2: [11111] at (2,0) => row2 = 5
    // __11_  p3: [10/11] at (3,2) => (3,2)(4,2)(4,3) = 3
    id: 'm07',
    name: '風車',
    difficulty: 'medium',
    gridSize: 5,
    target: g([[0, 1, 1, 0, 0], [0, 0, 1, 0, 0], [1, 1, 1, 1, 1], [0, 0, 1, 0, 0], [0, 0, 1, 1, 0]]),
    pieces: [
      { id: 'p1', shape: g([[1, 1], [0, 1]]), color: C.red },
      { id: 'p2', shape: g([[1, 1, 1, 1, 1]]), color: C.green },
      { id: 'p3', shape: g([[1, 0], [1, 1]]), color: C.orange },
    ],
  },
];

// =============================================
// HARD: 6x6 grid, 4-5 pieces
// =============================================

const hardPuzzles: TangramPuzzle[] = [
  {
    // __11__  target=20  p1(6)+p2(4)+p3(4)+p4(4)+p5(2)=20
    // _1111_  (2+4+6+4+2+2)
    // 111111
    // _1111_  p1: [111111] at (2,0) = 6
    // __11__  p2: [0110/1111] at (0,1) = 6? No: row0: (0,2)(0,3), row1: (1,1)(1,2)(1,3)(1,4) = 6.
    // __11__  That gives 6 but I want 4 pieces to be 4 each...
    //
    // Let me re-tile:
    // __AA__
    // _ABBC_
    // DDDCCC  Hmm that doesn't work either.
    //
    // Cleaner approach:
    // __AA__   p1: [11] at (0,2) = 2
    // _BBBB_   p2: [1111] at (1,1) = 4
    // CCCCCC   p3: [111111] at (2,0) = 6
    // _DDDD_   p4: [1111] at (3,1) = 4
    // __EE__   p5: [11] at (4,2) = 2
    // __EE__   Hmm p5 needs to also cover (5,2)(5,3), so p5: [11/11] at (4,2) = 4
    //          But wait that's only 2+4+6+4+4=20 with 5 pieces, some having only 2.
    //          Actually 2+4+6+4+4=20 ✓ and 5 pieces ✓
    //
    // Let me adjust: p1(2) too small. Min spec says nothing about piece size.
    // But for better gameplay let me merge p1 and p5:
    //
    // p1: [11/11] at (4,2) = 4: (4,2)(4,3)(5,2)(5,3)
    // p2: [11] at (0,2) = 2: (0,2)(0,3)
    // p3: [1111] at (1,1) = 4: (1,1)(1,2)(1,3)(1,4)
    // p4: [111111] at (2,0) = 6: (2,0)-(2,5)
    // p5: [1111] at (3,1) = 4: (3,1)(3,2)(3,3)(3,4)
    // Total: 4+2+4+6+4=20 ✓, 5 pieces ✓
    id: 'h01',
    name: 'ダイヤ',
    difficulty: 'hard',
    gridSize: 6,
    target: g([[0, 0, 1, 1, 0, 0], [0, 1, 1, 1, 1, 0], [1, 1, 1, 1, 1, 1], [0, 1, 1, 1, 1, 0], [0, 0, 1, 1, 0, 0], [0, 0, 1, 1, 0, 0]]),
    pieces: [
      { id: 'p1', shape: g([[1, 1]]), color: C.red },
      { id: 'p2', shape: g([[1, 1, 1, 1]]), color: C.blue },
      { id: 'p3', shape: g([[1, 1, 1, 1, 1, 1]]), color: C.green },
      { id: 'p4', shape: g([[1, 1, 1, 1]]), color: C.orange },
      { id: 'p5', shape: g([[1, 1], [1, 1]]), color: C.purple },
    ],
  },
  {
    // ___1__  target=15  p1(3)+p2(6)+p3(4)+p4(2)=15
    // ___1__  (1+1+1+6+4+2)
    // ___1__  p1: [1/1/1] at (0,3) = 3
    // 111111  p2: [111111] at (3,0) = 6
    // _1111_  p3: [1111] at (4,1) = 4
    // __11__  p4: [11] at (5,2) = 2
    id: 'h02',
    name: '船',
    difficulty: 'hard',
    gridSize: 6,
    target: g([[0, 0, 0, 1, 0, 0], [0, 0, 0, 1, 0, 0], [0, 0, 0, 1, 0, 0], [1, 1, 1, 1, 1, 1], [0, 1, 1, 1, 1, 0], [0, 0, 1, 1, 0, 0]]),
    pieces: [
      { id: 'p1', shape: g([[1], [1], [1]]), color: C.red },
      { id: 'p2', shape: g([[1, 1, 1, 1, 1, 1]]), color: C.blue },
      { id: 'p3', shape: g([[1, 1, 1, 1]]), color: C.green },
      { id: 'p4', shape: g([[1, 1]]), color: C.orange },
    ],
  },
  {
    // 111111  target=18  p1(6)+p2(3)+p3(3)+p4(3)+p5(3)=18
    // 1____1  (6+2+2+4+2+2)
    // 1____1
    // 11__11  p1: [111111] at (0,0) = 6
    // _1__1_  p2: [1/1/11] at (1,0) => (1,0)(2,0)(3,0)(3,1) = 4. Too many!
    // _1__1_  p2 needs 3 cells: [1/1/1] at (1,0) => (1,0)(2,0)(3,0) = 3
    //         p3: [1] at (3,1) = 1. Too small.
    //
    // Let me re-tile more carefully:
    // AAAAAA   p1: [111111] at (0,0) = 6
    // B____C   p2: [1/1/11/01/01] won't work as rectangular
    // B____C
    // BB__CC   Need to split into rectangular pieces that tile the pillars.
    // _B__C_
    // _B__C_
    //
    // Left pillar cells: (1,0)(2,0)(3,0)(3,1)(4,1)(5,1) = 6
    // Right pillar cells: (1,5)(2,5)(3,4)(3,5)(4,4)(5,4) = 6
    //
    // p2 (left): can be [10/10/11/01/01] but that's not rectangular.
    // As rectangular: 5 rows x 2 cols = [[1,0],[1,0],[1,1],[0,1],[0,1]]
    // That IS rectangular (5x2). = 6 cells
    // p3 (right): [[0,1],[0,1],[1,1],[1,0],[1,0]] = 6 cells
    //
    // p1(6)+p2(6)+p3(6)=18 ✓, but only 3 pieces.
    // Need 4-5. Split p2 into 2 pieces:
    // p2a: [1/1/1] at (1,0) = 3: (1,0)(2,0)(3,0)
    // p2b: [1/1/1] at (3,1) => (3,1)(4,1)(5,1) = 3
    // p3a: [1/1/1] at (1,5) = 3: (1,5)(2,5)(3,5)
    // p3b: [1/1/1] at (3,4) => (3,4)(4,4)(5,4) = 3
    // p1(6)+p2a(3)+p2b(3)+p3a(3)+p3b(3)=18 ✓, 5 pieces ✓
    id: 'h03',
    name: '橋',
    difficulty: 'hard',
    gridSize: 6,
    target: g([[1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 1], [1, 1, 0, 0, 1, 1], [0, 1, 0, 0, 1, 0], [0, 1, 0, 0, 1, 0]]),
    pieces: [
      { id: 'p1', shape: g([[1, 1, 1, 1, 1, 1]]), color: C.blue },
      { id: 'p2', shape: g([[1], [1], [1]]), color: C.red },
      { id: 'p3', shape: g([[1], [1], [1]]), color: C.green },
      { id: 'p4', shape: g([[1], [1], [1]]), color: C.orange },
      { id: 'p5', shape: g([[1], [1], [1]]), color: C.purple },
    ],
  },
  {
    // __1___  target=14  p1(4)+p2(5)+p3(4)+p4(1)=14
    // _111__  (1+3+5+3+1+1)
    // 11111_  p1: T [010/111] at (0,1) => (0,2)(1,1)(1,2)(1,3) = 4
    // _111__  p2: [11111] at (2,0) = 5
    // __1___  p3: T-inv [111/010] at (3,1) => (3,1)(3,2)(3,3)(4,2) = 4
    // __1___  p4: [1] at (5,2) = 1
    id: 'h04',
    name: '木',
    difficulty: 'hard',
    gridSize: 6,
    target: g([[0, 0, 1, 0, 0, 0], [0, 1, 1, 1, 0, 0], [1, 1, 1, 1, 1, 0], [0, 1, 1, 1, 0, 0], [0, 0, 1, 0, 0, 0], [0, 0, 1, 0, 0, 0]]),
    pieces: [
      { id: 'p1', shape: g([[0, 1, 0], [1, 1, 1]]), color: C.green },
      { id: 'p2', shape: g([[1, 1, 1, 1, 1]]), color: C.teal },
      { id: 'p3', shape: g([[1, 1, 1], [0, 1, 0]]), color: C.orange },
      { id: 'p4', shape: g([[1]]), color: C.yellow },
    ],
  },
  {
    // _111__  target=12  p1(3)+p2(3)+p3(3)+p4(3)=12
    // _1_1__  (3+2+3+1+1+2)
    // _111__  p1: [111] at (0,1) => (0,1)(0,2)(0,3) = 3
    // __1___  p2: [101/111] at (1,1) => (1,1)(1,3)(2,1)(2,2)(2,3) = 5. Too many.
    //
    // Re-tile:
    // _AAA__   p1: [111] at (0,1) = 3
    // _B_C__   p2: [1] at (1,1) = 1... too small.
    //
    // Actually, let me think of it as:
    // Cell list: (0,1)(0,2)(0,3) (1,1)(1,3) (2,1)(2,2)(2,3) (3,2) (4,2) (5,2)(5,3) = 12
    //
    // p1: column from (0,1) down: [1/1/1] at (0,1) => (0,1)(1,1)(2,1) = 3
    // p2: column from (0,3) down: [1/1/1] at (0,3) => (0,3)(1,3)(2,3) = 3
    // p3: [1/1/1] at (0,2) => (0,2)(1,2)(2,2)... but (1,2)=0 in target! Bad.
    //
    // p1: [111] at (0,1) = 3: (0,1)(0,2)(0,3)
    // p2: [1/1] at (1,1) and (1,3) - can't be one piece since there's a gap.
    // p2: [1_1/111] = [101/111] at (1,1) => (1,1)(1,3)(2,1)(2,2)(2,3) = 5
    // p3: [1/1/11] at (3,2) => (3,2)(4,2)(5,2)(5,3) = 4
    // Total: 3+5+4=12 ✓ but only 3 pieces.
    //
    // Split p2: [1] at (1,1)=1 and [1/111] at (1,3)... (1,3)(2,...) hmm.
    // Let me just split into:
    // p2: [1/111] at (1,1)? shape=[[1],[1,1,1]] not rectangular.
    // p2: [1,0,0/1,1,1] at (1,1) => (1,1)(2,1)(2,2)(2,3) = 4
    // p3: [1] at (1,3) = 1... too small again.
    //
    // Let me redesign this puzzle target:
    // _111__  (3)
    // _111__  (3)
    // __1___  (1)
    // __1___  (1)
    // __1___  (1)
    // __11__  (2) total=11
    //
    // p1: [111] at (0,1) = 3
    // p2: [111] at (1,1) = 3
    // p3: [1/1/1/11] = not rect. Use [10/10/10/11] at (2,2) => (2,2)(3,2)(4,2)(5,2)(5,3) = 5
    // Total: 3+3+5=11, 3 pieces. Need 4-5.
    //
    // p1: [111] at (0,1) = 3
    // p2: [111] at (1,1) = 3
    // p3: [1/1/1] at (2,2) = 3: (2,2)(3,2)(4,2)
    // p4: [11] at (5,2) = 2: (5,2)(5,3)
    // Total: 3+3+3+2=11 ✓, 4 pieces ✓
    id: 'h05',
    name: '鍵',
    difficulty: 'hard',
    gridSize: 6,
    target: g([[0, 1, 1, 1, 0, 0], [0, 1, 1, 1, 0, 0], [0, 0, 1, 0, 0, 0], [0, 0, 1, 0, 0, 0], [0, 0, 1, 0, 0, 0], [0, 0, 1, 1, 0, 0]]),
    pieces: [
      { id: 'p1', shape: g([[1, 1, 1]]), color: C.yellow },
      { id: 'p2', shape: g([[1, 1, 1]]), color: C.pink },
      { id: 'p3', shape: g([[1], [1], [1]]), color: C.orange },
      { id: 'p4', shape: g([[1, 1]]), color: C.teal },
    ],
  },
  {
    // 1____1  target=16  p1(4)+p2(4)+p3(4)+p4(4)=16
    // 11__11  (2+4+6+4)
    // 111111  p1: [10/11] at (0,0) => (0,0)(1,0)(1,1) = 3. Only 3.
    // _1111_
    // ______  Hmm. Let me re-tile:
    // ______
    //
    // Cells: (0,0)(0,5) (1,0)(1,1)(1,4)(1,5) (2,0)(2,1)(2,2)(2,3)(2,4)(2,5) (3,1)(3,2)(3,3)(3,4) = 16
    //
    // p1: [1/11/111] = [[1,0,0],[1,1,0],[1,1,1]] at (0,0) => (0,0)(1,0)(1,1)(2,0)(2,1)(2,2) = 6
    // p2: [001/011/111] at (0,3) => (0,5)(1,4)(1,5)(2,3)(2,4)(2,5) = 6
    // p3: [1111] at (3,1) = 4
    // Total: 6+6+4=16, 3 pieces. Need 4-5.
    //
    // Split p1: [1/11] at (0,0) => (0,0)(1,0)(1,1) = 3, and [111] at (2,0) = 3
    // Split p2: [01/11] at (0,4) => (0,5)(1,4)(1,5) = 3, and [111] at (2,3) = 3
    // p5: [1111] at (3,1) = 4
    // Total: 3+3+3+3+4=16, 5 pieces ✓
    id: 'h06',
    name: '山',
    difficulty: 'hard',
    gridSize: 6,
    target: g([[1, 0, 0, 0, 0, 1], [1, 1, 0, 0, 1, 1], [1, 1, 1, 1, 1, 1], [0, 1, 1, 1, 1, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]]),
    pieces: [
      { id: 'p1', shape: g([[1, 0], [1, 1]]), color: C.red },
      { id: 'p2', shape: g([[1, 1, 1]]), color: C.blue },
      { id: 'p3', shape: g([[0, 1], [1, 1]]), color: C.green },
      { id: 'p4', shape: g([[1, 1, 1]]), color: C.purple },
      { id: 'p5', shape: g([[1, 1, 1, 1]]), color: C.orange },
    ],
  },
];

export const ALL_PUZZLES: TangramPuzzle[] = [
  ...easyPuzzles,
  ...mediumPuzzles,
  ...hardPuzzles,
];

export function getPuzzlesByDifficulty(difficulty: string): TangramPuzzle[] {
  return ALL_PUZZLES.filter((p) => p.difficulty === difficulty);
}

export function getPuzzleById(id: string): TangramPuzzle | undefined {
  return ALL_PUZZLES.find((p) => p.id === id);
}

export const DIFFICULTY_LEVELS = [
  { key: 'easy', label: '4x4', difficulty: '初級', gridSize: 4 },
  { key: 'medium', label: '5x5', difficulty: '中級', gridSize: 5 },
  { key: 'hard', label: '6x6', difficulty: '上級', gridSize: 6 },
];

export function rotatePiece(shape: boolean[][]): boolean[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated: boolean[][] = [];
  for (let c = 0; c < cols; c++) {
    const newRow: boolean[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      newRow.push(shape[r][c]);
    }
    rotated.push(newRow);
  }
  return rotated;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
