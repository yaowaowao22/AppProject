import { KakuroPuzzle, KakuroCellDef } from '../types';

const B: KakuroCellDef = { type: 'blocked' };
const E: KakuroCellDef = { type: 'empty' };
function CR(right: number): KakuroCellDef {
  return { type: 'clue', right } as any;
}
function CD(down: number): KakuroCellDef {
  return { type: 'clue', down } as any;
}
function CRD(right: number, down: number): KakuroCellDef {
  return { type: 'clue', right, down } as any;
}

// ==========================================
// 4x4 Easy Puzzles
// ==========================================
// Standard 4x4 layout:
//   B      CD(a)  CD(b)   B
//  CR(c)    E      E     CD(d)
//  CR(e)    E      E      E
//   B      CR(f)   E      E
//
// Empty cells: (1,1)(1,2) (2,1)(2,2)(2,3) (3,2)(3,3)
// H-runs: row1 from (0,0)=B so from... wait. Let me be precise.
// Row 0: B, CD, CD, B  -- no horizontal runs (no right clues)
// Row 1: CR(c), E, E, CD(d)  -- hrun from CR(c): cells (1,1),(1,2). Sum=c
// Row 2: CR(e), E, E, E  -- hrun from CR(e): cells (2,1),(2,2),(2,3). Sum=e
// Row 3: B, CR(f), E, E  -- hrun from CR(f): cells (3,2),(3,3). Sum=f
// V-runs:
// Col 1: CD(a) at (0,1) down: (1,1),(2,1). Sum=a. (3,1)=CR so stops.
// Col 2: CD(b) at (0,2) down: (1,2),(2,2),(3,2). Sum=b  (all E)
// Col 3: CD(d) at (1,3) down: (2,3),(3,3). Sum=d

const easy4x4: KakuroPuzzle[] = [
  {
    // sol: (1,1)=1,(1,2)=2,(2,1)=3,(2,2)=4,(2,3)=6,(3,2)=5,(3,3)=7
    // h: c=1+2=3, e=3+4+6=13, f=5+7=12
    // v: a=1+3=4, b=2+4+5=11, d=6+7=13
    id: 'e01', name: 'かんたん1', rows: 4, cols: 4, difficulty: 'easy',
    grid: [
      [B,     CD(4),  CD(11), B     ],
      [CR(3), E,      E,      CD(13)],
      [CR(13),E,      E,      E     ],
      [B,     CR(12), E,      E     ],
    ],
    solution: [
      [0, 0, 0, 0],
      [0, 1, 2, 0],
      [0, 3, 4, 6],
      [0, 0, 5, 7],
    ],
  },
  {
    // sol: (1,1)=3,(1,2)=1,(2,1)=6,(2,2)=5,(2,3)=2,(3,2)=8,(3,3)=4
    // h: 3+1=4, 6+5+2=13, 8+4=12
    // v: 3+6=9, 1+5+8=14, 2+4=6
    id: 'e02', name: 'かんたん2', rows: 4, cols: 4, difficulty: 'easy',
    grid: [
      [B,     CD(9),  CD(14), B     ],
      [CR(4), E,      E,      CD(6) ],
      [CR(13),E,      E,      E     ],
      [B,     CR(12), E,      E     ],
    ],
    solution: [
      [0, 0, 0, 0],
      [0, 3, 1, 0],
      [0, 6, 5, 2],
      [0, 0, 8, 4],
    ],
  },
  {
    // sol: (1,1)=8,(1,2)=5,(2,1)=9,(2,2)=3,(2,3)=4,(3,2)=1,(3,3)=2
    // h: 8+5=13, 9+3+4=16, 1+2=3
    // v: 8+9=17, 5+3+1=9, 4+2=6
    id: 'e03', name: 'かんたん3', rows: 4, cols: 4, difficulty: 'easy',
    grid: [
      [B,      CD(17), CD(9),  B     ],
      [CR(13), E,      E,      CD(6) ],
      [CR(16), E,      E,      E     ],
      [B,      CR(3),  E,      E     ],
    ],
    solution: [
      [0, 0, 0, 0],
      [0, 8, 5, 0],
      [0, 9, 3, 4],
      [0, 0, 1, 2],
    ],
  },
  {
    // sol: (1,1)=2,(1,2)=7,(2,1)=4,(2,2)=1,(2,3)=3,(3,2)=5,(3,3)=6
    // h: 2+7=9, 4+1+3=8, 5+6=11
    // v: 2+4=6, 7+1+5=13, 3+6=9
    id: 'e04', name: 'かんたん4', rows: 4, cols: 4, difficulty: 'easy',
    grid: [
      [B,     CD(6),  CD(13), B     ],
      [CR(9), E,      E,      CD(9) ],
      [CR(8), E,      E,      E     ],
      [B,     CR(11), E,      E     ],
    ],
    solution: [
      [0, 0, 0, 0],
      [0, 2, 7, 0],
      [0, 4, 1, 3],
      [0, 0, 5, 6],
    ],
  },
  {
    // sol: (1,1)=5,(1,2)=3,(2,1)=1,(2,2)=4,(2,3)=9,(3,2)=7,(3,3)=2
    // h: 5+3=8, 1+4+9=14, 7+2=9
    // v: 5+1=6, 3+4+7=14, 9+2=11
    id: 'e05', name: 'かんたん5', rows: 4, cols: 4, difficulty: 'easy',
    grid: [
      [B,      CD(6),  CD(14), B      ],
      [CR(8),  E,      E,      CD(11) ],
      [CR(14), E,      E,      E      ],
      [B,      CR(9),  E,      E      ],
    ],
    solution: [
      [0, 0, 0, 0],
      [0, 5, 3, 0],
      [0, 1, 4, 9],
      [0, 0, 7, 2],
    ],
  },
  {
    // sol: (1,1)=4,(1,2)=9,(2,1)=6,(2,2)=2,(2,3)=1,(3,2)=8,(3,3)=5
    // h: 4+9=13, 6+2+1=9, 8+5=13
    // v: 4+6=10, 9+2+8=19, 1+5=6
    id: 'e06', name: 'かんたん6', rows: 4, cols: 4, difficulty: 'easy',
    grid: [
      [B,      CD(10), CD(19), B     ],
      [CR(13), E,      E,      CD(6) ],
      [CR(9),  E,      E,      E     ],
      [B,      CR(13), E,      E     ],
    ],
    solution: [
      [0, 0, 0, 0],
      [0, 4, 9, 0],
      [0, 6, 2, 1],
      [0, 0, 8, 5],
    ],
  },
  {
    // sol: (1,1)=5,(1,2)=7,(2,1)=1,(2,2)=6,(2,3)=2,(3,2)=3,(3,3)=8
    // h: 5+7=12, 1+6+2=9, 3+8=11
    // v: 5+1=6, 7+6+3=16, 2+8=10
    id: 'e07', name: 'かんたん7', rows: 4, cols: 4, difficulty: 'easy',
    grid: [
      [B,      CD(6),  CD(16), B      ],
      [CR(12), E,      E,      CD(10) ],
      [CR(9),  E,      E,      E      ],
      [B,      CR(11), E,      E      ],
    ],
    solution: [
      [0, 0, 0, 0],
      [0, 5, 7, 0],
      [0, 1, 6, 2],
      [0, 0, 3, 8],
    ],
  },
  {
    // sol: (1,1)=7,(1,2)=2,(2,1)=9,(2,2)=8,(2,3)=3,(3,2)=1,(3,3)=6
    // h: 7+2=9, 9+8+3=20, 1+6=7
    // v: 7+9=16, 2+8+1=11, 3+6=9
    id: 'e08', name: 'かんたん8', rows: 4, cols: 4, difficulty: 'easy',
    grid: [
      [B,     CD(16), CD(11), B     ],
      [CR(9), E,      E,      CD(9) ],
      [CR(20),E,      E,      E     ],
      [B,     CR(7),  E,      E     ],
    ],
    solution: [
      [0, 0, 0, 0],
      [0, 7, 2, 0],
      [0, 9, 8, 3],
      [0, 0, 1, 6],
    ],
  },
];

// ==========================================
// 6x6 Medium Puzzles
// ==========================================
// Layout A: 3x3 block (rows 1-3, cols 1-3)
//   B     CD   CD   CD    B    B
//  CR      E    E    E    B    B
//  CR      E    E    E    B    B
//  CR      E    E    E    B    B
//   B      B    B    B    B    B
//   B      B    B    B    B    B

const medium6x6: KakuroPuzzle[] = [
  {
    // sol: r1=[1,9,5] r2=[3,7,2] r3=[8,4,6]
    // h: 15, 12, 18. v: c1=12, c2=20, c3=13
    id: 'm01', name: '中級1', rows: 6, cols: 6, difficulty: 'medium',
    grid: [
      [B,      CD(12), CD(20), CD(13), B, B],
      [CR(15), E,      E,      E,      B, B],
      [CR(12), E,      E,      E,      B, B],
      [CR(18), E,      E,      E,      B, B],
      [B,      B,      B,      B,      B, B],
      [B,      B,      B,      B,      B, B],
    ],
    solution: [
      [0, 0, 0, 0, 0, 0],
      [0, 1, 9, 5, 0, 0],
      [0, 3, 7, 2, 0, 0],
      [0, 8, 4, 6, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ],
  },
  {
    // sol: r1=[2,5,1] r2=[4,3,8] r3=[6,9,7]
    // h: 8, 15, 22. v: c1=12, c2=17, c3=16
    id: 'm02', name: '中級2', rows: 6, cols: 6, difficulty: 'medium',
    grid: [
      [B,      CD(12), CD(17), CD(16), B, B],
      [CR(8),  E,      E,      E,      B, B],
      [CR(15), E,      E,      E,      B, B],
      [CR(22), E,      E,      E,      B, B],
      [B,      B,      B,      B,      B, B],
      [B,      B,      B,      B,      B, B],
    ],
    solution: [
      [0, 0, 0, 0, 0, 0],
      [0, 2, 5, 1, 0, 0],
      [0, 4, 3, 8, 0, 0],
      [0, 6, 9, 7, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ],
  },
  {
    // Layout: two 2x2 blocks
    //   B   CD  CD   B   CD  CD
    //  CR    E   E   B   CR   E   E   (wait, 6 cols only)
    // Actually:
    //   B   CD  CD   B   CD  CD
    //  CR    E   E  CR    E   E
    //  CR    E   E  CR    E   E
    //   B    B   B   B    B   B
    //   B    B   B   B    B   B
    //   B    B   B   B    B   B
    //
    // Left: r1l=[1,3] r2l=[5,2]. c1=[1,5]=6 c2=[3,2]=5
    // Right: r1r=[6,9] r2r=[7,4]. c4=[6,7]=13 c5=[9,4]=13
    id: 'm03', name: '中級3', rows: 6, cols: 6, difficulty: 'medium',
    grid: [
      [B,      CD(6),  CD(5),  B,      CD(13), CD(13)],
      [CR(4),  E,      E,      CR(15), E,      E     ],
      [CR(7),  E,      E,      CR(11), E,      E     ],
      [B,      B,      B,      B,      B,      B     ],
      [B,      B,      B,      B,      B,      B     ],
      [B,      B,      B,      B,      B,      B     ],
    ],
    solution: [
      [0, 0, 0, 0, 0, 0],
      [0, 1, 3, 0, 6, 9],
      [0, 5, 2, 0, 7, 4],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ],
  },
  {
    // Two 2x2 blocks stacked
    //   B   CD  CD   B    B    B
    //  CR    E   E   B    B    B
    //  CR    E   E   B    B    B
    //   B   CD  CD   B    B    B
    //  CR    E   E   B    B    B
    //  CR    E   E   B    B    B
    //
    // Top: r1=[3,1] r2=[5,4]. c1t=[3,5]=8 c2t=[1,4]=5
    // Bot: r4=[8,6] r5=[9,7]. c1b=[8,9]=17 c2b=[6,7]=13
    id: 'm04', name: '中級4', rows: 6, cols: 6, difficulty: 'medium',
    grid: [
      [B,      CD(8),  CD(5),  B, B, B],
      [CR(4),  E,      E,      B, B, B],
      [CR(9),  E,      E,      B, B, B],
      [B,      CD(17), CD(13), B, B, B],
      [CR(14), E,      E,      B, B, B],
      [CR(16), E,      E,      B, B, B],
    ],
    solution: [
      [0, 0, 0, 0, 0, 0],
      [0, 3, 1, 0, 0, 0],
      [0, 5, 4, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 8, 6, 0, 0, 0],
      [0, 9, 7, 0, 0, 0],
    ],
  },
  {
    // 2x3 block (2 rows, 3 cols)
    //   B   CD  CD  CD   B   B
    //  CR    E   E   E   B   B
    //  CR    E   E   E   B   B
    //   B    B   B  CD  CD   B
    //   B    B   B  CR   E   E
    //   B    B   B  CR   E   E
    //
    // Top: r1=[2,9,4] r2=[5,8,1]. c1=[2,5]=7 c2=[9,8]=17 c3=[4,1]=5
    // Bot: r4=[3,6] r5=[7,8]. c4=[3,7]=10 c5=[6,8]=14
    id: 'm05', name: '中級5', rows: 6, cols: 6, difficulty: 'medium',
    grid: [
      [B,      CD(7),  CD(17), CD(5), B,      B      ],
      [CR(15), E,      E,      E,     B,      B      ],
      [CR(14), E,      E,      E,     B,      B      ],
      [B,      B,      B,      B,     CD(10), CD(14) ],
      [B,      B,      B,      CR(9), E,      E      ],
      [B,      B,      B,      CR(15),E,      E      ],
    ],
    solution: [
      [0, 0, 0, 0, 0, 0],
      [0, 2, 9, 4, 0, 0],
      [0, 5, 8, 1, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 3, 6],
      [0, 0, 0, 0, 7, 8],
    ],
  },
  {
    // Layout: 4x2 tall block
    //   B   CD  CD   B   B   B
    //  CR    E   E   B   B   B
    //  CR    E   E   B   B   B
    //  CR    E   E   B   B   B
    //  CR    E   E   B   B   B
    //   B    B   B   B   B   B
    //
    // sol: r1=[1,3] r2=[7,4] r3=[8,2] r4=[9,6]
    // c1=[1,7,8,9]=25  c2=[3,4,2,6]=15
    id: 'm06', name: '中級6', rows: 6, cols: 6, difficulty: 'medium',
    grid: [
      [B,      CD(25), CD(15), B, B, B],
      [CR(4),  E,      E,      B, B, B],
      [CR(11), E,      E,      B, B, B],
      [CR(10), E,      E,      B, B, B],
      [CR(15), E,      E,      B, B, B],
      [B,      B,      B,      B, B, B],
    ],
    solution: [
      [0, 0, 0, 0, 0, 0],
      [0, 1, 3, 0, 0, 0],
      [0, 7, 4, 0, 0, 0],
      [0, 8, 2, 0, 0, 0],
      [0, 9, 6, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ],
  },
  {
    // Layout: 2x4 wide block
    //   B   CD  CD  CD  CD   B
    //  CR    E   E   E   E   B
    //  CR    E   E   E   E   B
    //   B    B   B   B   B   B
    //   B    B   B   B   B   B
    //   B    B   B   B   B   B
    //
    // sol: r1=[1,5,9,3] r2=[4,8,2,6]
    // c1=[1,4]=5 c2=[5,8]=13 c3=[9,2]=11 c4=[3,6]=9
    id: 'm07', name: '中級7', rows: 6, cols: 6, difficulty: 'medium',
    grid: [
      [B,      CD(5),  CD(13), CD(11), CD(9), B],
      [CR(18), E,      E,      E,      E,     B],
      [CR(20), E,      E,      E,      E,     B],
      [B,      B,      B,      B,      B,     B],
      [B,      B,      B,      B,      B,     B],
      [B,      B,      B,      B,      B,     B],
    ],
    solution: [
      [0, 0, 0, 0, 0, 0],
      [0, 1, 5, 9, 3, 0],
      [0, 4, 8, 2, 6, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ],
  },
];

// ==========================================
// 8x8 Hard Puzzles
// ==========================================

const hard8x8: KakuroPuzzle[] = [
  {
    // 4x4 block (rows 1-4, cols 1-4)
    // sol: r1=[1,5,9,3] r2=[4,8,2,6] r3=[7,3,6,9] r4=[2,9,1,5]
    // h: 18,20,25,17  v: c1=14,c2=25,c3=18,c4=23
    id: 'h01', name: '上級1', rows: 8, cols: 8, difficulty: 'hard',
    grid: [
      [B,      CD(14), CD(25), CD(18), CD(23), B, B, B],
      [CR(18), E,      E,      E,      E,      B, B, B],
      [CR(20), E,      E,      E,      E,      B, B, B],
      [CR(25), E,      E,      E,      E,      B, B, B],
      [CR(17), E,      E,      E,      E,      B, B, B],
      [B,      B,      B,      B,      B,      B, B, B],
      [B,      B,      B,      B,      B,      B, B, B],
      [B,      B,      B,      B,      B,      B, B, B],
    ],
    solution: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 5, 9, 3, 0, 0, 0],
      [0, 4, 8, 2, 6, 0, 0, 0],
      [0, 7, 3, 6, 9, 0, 0, 0],
      [0, 2, 9, 1, 5, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    // Two 3x3 blocks diagonal
    // Top-left 3x3: rows 1-3, cols 1-3
    // Bottom-right 3x3: rows 5-7, cols 5-7
    //
    // TL sol: r1=[2,6,3] r2=[4,8,9] r3=[7,1,5]
    // h: 11,21,13  v: c1=13,c2=15,c3=17
    //
    // BR sol: r5=[1,9] r6=[3,7] r7=[8,4]
    // h: 10,10,12  v: c6=[1,3,8]=12, c7=[9,7,4]=20
    id: 'h02', name: '上級2', rows: 8, cols: 8, difficulty: 'hard',
    grid: [
      [B,      CD(13), CD(15), CD(17), B, B,      B,      B      ],
      [CR(11), E,      E,      E,      B, B,      B,      B      ],
      [CR(21), E,      E,      E,      B, B,      B,      B      ],
      [CR(13), E,      E,      E,      B, B,      B,      B      ],
      [B,      B,      B,      B,      B, B,      CD(12), CD(20) ],
      [B,      B,      B,      B,      B, CR(10), E,      E      ],
      [B,      B,      B,      B,      B, CR(10), E,      E      ],
      [B,      B,      B,      B,      B, CR(12), E,      E      ],
    ],
    solution: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 2, 6, 3, 0, 0, 0, 0],
      [0, 4, 8, 9, 0, 0, 0, 0],
      [0, 7, 1, 5, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 1, 9],
      [0, 0, 0, 0, 0, 0, 3, 7],
      [0, 0, 0, 0, 0, 0, 8, 4],
    ],
  },
  {
    // L-shape: 4x2 left + 2x2 bottom-right
    // Rows 1-4, cols 1-2 (4 rows, 2 cols)
    // Rows 6-7, cols 5-6 (2 rows, 2 cols)
    //
    // Left: r1=[1,3] r2=[7,4] r3=[8,2] r4=[9,6]
    // c1=[1,7,8,9]=25 c2=[3,4,2,6]=15
    //
    // Right: r6=[5,9] r7=[3,8]
    // c6=[5,3]=8 c7=[9,8]=17
    id: 'h03', name: '上級3', rows: 8, cols: 8, difficulty: 'hard',
    grid: [
      [B,      CD(25), CD(15), B, B, B, B,      B      ],
      [CR(4),  E,      E,      B, B, B, B,      B      ],
      [CR(11), E,      E,      B, B, B, B,      B      ],
      [CR(10), E,      E,      B, B, B, B,      B      ],
      [CR(15), E,      E,      B, B, B, B,      B      ],
      [B,      B,      B,      B, B, B, CD(8),  CD(17) ],
      [B,      B,      B,      B, B, CR(14), E,  E     ],
      [B,      B,      B,      B, B, CR(11), E,  E     ],
    ],
    solution: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 3, 0, 0, 0, 0, 0],
      [0, 7, 4, 0, 0, 0, 0, 0],
      [0, 8, 2, 0, 0, 0, 0, 0],
      [0, 9, 6, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 5, 9],
      [0, 0, 0, 0, 0, 0, 3, 8],
    ],
  },
  {
    // Four 2x2 blocks in corners
    // TL(1-2,1-2) TR(1-2,5-6) BL(5-6,1-2) BR(5-6,5-6)
    //
    // TL: r1=[3,1] r2=[5,4]. c1=[3,5]=8 c2=[1,4]=5
    // TR: r1=[6,9] r2=[7,2]. c6=[6,7]=13 c7=[9,2]=11
    // BL: r5=[8,6] r6=[9,7]. c1=[8,9]=17 c2=[6,7]=13
    // BR: r5=[2,5] r6=[4,3]. c6=[2,4]=6 c7=[5,3]=8
    id: 'h04', name: '上級4', rows: 8, cols: 8, difficulty: 'hard',
    grid: [
      [B,      CD(8),  CD(5),  B, B, B, CD(13), CD(11)],
      [CR(4),  E,      E,      B, B, CR(15), E,   E   ],
      [CR(9),  E,      E,      B, B, CR(9),  E,   E   ],
      [B,      B,      B,      B, B, B,      B,   B   ],
      [B,      CD(17), CD(13), B, B, B, CD(6),  CD(8) ],
      [CR(14), E,      E,      B, B, CR(7),  E,   E   ],
      [CR(16), E,      E,      B, B, CR(7),  E,   E   ],
      [B,      B,      B,      B, B, B,      B,   B   ],
    ],
    solution: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 3, 1, 0, 0, 0, 6, 9],
      [0, 5, 4, 0, 0, 0, 7, 2],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 8, 6, 0, 0, 0, 2, 5],
      [0, 9, 7, 0, 0, 0, 4, 3],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    // 3x4 block (3 rows, 4 cols) + separate 2x3 block
    //   B   CD  CD  CD  CD   B   B   B
    //  CR    E   E   E   E   B   B   B
    //  CR    E   E   E   E   B   B   B
    //  CR    E   E   E   E   B   B   B
    //   B    B   B   B   B  CD  CD  CD
    //   B    B   B   B   B  CR   E   E   E
    //   B    B   B   B   B  CR   E   E   E
    //   B    B   B   B   B   B   B   B
    //
    // Top: r1=[1,5,9,3]=18 r2=[4,8,2,6]=20 r3=[7,3,6,9]=25
    // c1=[1,4,7]=12 c2=[5,8,3]=16 c3=[9,2,6]=17 c4=[3,6,9]=18
    //
    // Bot: r5=[2,8]=10 r6=[9,1]=10
    // c6=[2,9]=11 c7=[8,1]=9
    id: 'h05', name: '上級5', rows: 8, cols: 8, difficulty: 'hard',
    grid: [
      [B,      CD(12), CD(16), CD(17), CD(18), B,      B,     B     ],
      [CR(18), E,      E,      E,      E,      B,      B,     B     ],
      [CR(20), E,      E,      E,      E,      B,      B,     B     ],
      [CR(25), E,      E,      E,      E,      B,      B,     B     ],
      [B,      B,      B,      B,      B,      B,      CD(11), CD(9)],
      [B,      B,      B,      B,      B,      CR(10), E,      E   ],
      [B,      B,      B,      B,      B,      CR(10), E,      E   ],
      [B,      B,      B,      B,      B,      B,      B,     B     ],
    ],
    solution: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 5, 9, 3, 0, 0, 0],
      [0, 4, 8, 2, 6, 0, 0, 0],
      [0, 7, 3, 6, 9, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 2, 8],
      [0, 0, 0, 0, 0, 0, 9, 1],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
];

export const ALL_PUZZLES: KakuroPuzzle[] = [...easy4x4, ...medium6x6, ...hard8x8];

export function getPuzzlesByDifficulty(difficulty: string): KakuroPuzzle[] {
  return ALL_PUZZLES.filter((p) => p.difficulty === difficulty);
}

export function getPuzzleById(id: string): KakuroPuzzle | undefined {
  return ALL_PUZZLES.find((p) => p.id === id);
}

export const DIFFICULTY_LEVELS = [
  { difficulty: 'easy', label: '4x4', displayName: '初級' },
  { difficulty: 'medium', label: '6x6', displayName: '中級' },
  { difficulty: 'hard', label: '8x8', displayName: '上級' },
];
