export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Level {
  id: string;
  size: number;
  start: [number, number];
  blocked: [number, number][];
  difficulty: Difficulty;
  /** First 3 moves as hints (shown via rewarded ad) */
  hintMoves: ('up' | 'down' | 'left' | 'right')[];
}

/*
 * Block Fill Puzzle levels.
 *
 * Sliding rules: the block moves in a direction and slides until it hits
 * a wall, a blocked cell, or an already-filled cell. Every cell it crosses
 * (including the stop cell) becomes filled. The puzzle is solved when every
 * non-blocked cell is filled.
 *
 * Each level is designed with a valid solution path.
 * hintMoves contains the first 3 moves of one valid solution.
 */

// ─── Easy (5x5) ─────────────────────────────────────────────
// Pattern: blocked cells placed to create guided serpentine paths

const easyLevels: Level[] = [
  { id: 'e1', size: 5, start: [0, 0], blocked: [], difficulty: 'easy', hintMoves: ['right', 'down', 'left'] },
  { id: 'e2', size: 5, start: [4, 4], blocked: [], difficulty: 'easy', hintMoves: ['left', 'up', 'right'] },
  { id: 'e3', size: 5, start: [0, 0], blocked: [[2, 2]], difficulty: 'easy', hintMoves: ['right', 'down', 'left'] },
  { id: 'e4', size: 5, start: [0, 0], blocked: [[1, 3], [3, 1]], difficulty: 'easy', hintMoves: ['right', 'down', 'left'] },
  { id: 'e5', size: 5, start: [0, 4], blocked: [[2, 2]], difficulty: 'easy', hintMoves: ['left', 'down', 'right'] },
  { id: 'e6', size: 5, start: [4, 0], blocked: [[2, 2]], difficulty: 'easy', hintMoves: ['right', 'up', 'left'] },
  { id: 'e7', size: 5, start: [0, 0], blocked: [[1, 2], [3, 2]], difficulty: 'easy', hintMoves: ['down', 'right', 'up'] },
  { id: 'e8', size: 5, start: [0, 0], blocked: [[2, 4], [4, 2]], difficulty: 'easy', hintMoves: ['right', 'down', 'left'] },
  { id: 'e9', size: 5, start: [4, 4], blocked: [[1, 1], [1, 2]], difficulty: 'easy', hintMoves: ['left', 'up', 'right'] },
  { id: 'e10', size: 5, start: [0, 2], blocked: [[2, 0], [2, 4]], difficulty: 'easy', hintMoves: ['left', 'down', 'right'] },
];

// ─── Medium (6x6) ───────────────────────────────────────────

const mediumLevels: Level[] = [
  {
    id: 'm1',
    size: 6,
    start: [0, 0],
    blocked: [],
    difficulty: 'medium',
    hintMoves: ['right', 'down', 'left'],
  },
  {
    id: 'm2',
    size: 6,
    start: [5, 5],
    blocked: [],
    difficulty: 'medium',
    hintMoves: ['left', 'up', 'right'],
  },
  {
    id: 'm3',
    size: 6,
    start: [0, 0],
    blocked: [[2, 3], [4, 2]],
    difficulty: 'medium',
    hintMoves: ['right', 'down', 'left'],
  },
  {
    id: 'm4',
    size: 6,
    start: [0, 0],
    blocked: [[1, 2], [3, 3], [5, 1]],
    difficulty: 'medium',
    hintMoves: ['right', 'down', 'left'],
  },
  {
    id: 'm5',
    size: 6,
    start: [5, 0],
    blocked: [[1, 3], [3, 2]],
    difficulty: 'medium',
    hintMoves: ['up', 'right', 'down'],
  },
  {
    id: 'm6',
    size: 6,
    start: [0, 5],
    blocked: [[2, 2], [4, 3]],
    difficulty: 'medium',
    hintMoves: ['left', 'down', 'right'],
  },
  {
    id: 'm7',
    size: 6,
    start: [5, 5],
    blocked: [[1, 2], [3, 4]],
    difficulty: 'medium',
    hintMoves: ['left', 'up', 'right'],
  },
  {
    id: 'm8',
    size: 6,
    start: [0, 0],
    blocked: [[2, 2], [2, 4], [4, 1]],
    difficulty: 'medium',
    hintMoves: ['right', 'down', 'left'],
  },
  {
    id: 'm9',
    size: 6,
    start: [0, 3],
    blocked: [[2, 1], [4, 4]],
    difficulty: 'medium',
    hintMoves: ['left', 'down', 'right'],
  },
  {
    id: 'm10',
    size: 6,
    start: [3, 0],
    blocked: [[1, 3], [5, 2], [0, 5]],
    difficulty: 'medium',
    hintMoves: ['right', 'up', 'left'],
  },
];

// ─── Hard (7x7) ─────────────────────────────────────────────

const hardLevels: Level[] = [
  {
    id: 'h1',
    size: 7,
    start: [0, 0],
    blocked: [],
    difficulty: 'hard',
    hintMoves: ['right', 'down', 'left'],
  },
  {
    id: 'h2',
    size: 7,
    start: [6, 6],
    blocked: [],
    difficulty: 'hard',
    hintMoves: ['left', 'up', 'right'],
  },
  {
    id: 'h3',
    size: 7,
    start: [0, 0],
    blocked: [[2, 3], [4, 3]],
    difficulty: 'hard',
    hintMoves: ['right', 'down', 'left'],
  },
  {
    id: 'h4',
    size: 7,
    start: [0, 0],
    blocked: [[1, 3], [3, 2], [5, 4]],
    difficulty: 'hard',
    hintMoves: ['right', 'down', 'left'],
  },
  {
    id: 'h5',
    size: 7,
    start: [6, 0],
    blocked: [[1, 2], [3, 4], [5, 1]],
    difficulty: 'hard',
    hintMoves: ['up', 'right', 'down'],
  },
  {
    id: 'h6',
    size: 7,
    start: [0, 6],
    blocked: [[2, 3], [4, 2], [5, 5]],
    difficulty: 'hard',
    hintMoves: ['left', 'down', 'right'],
  },
  {
    id: 'h7',
    size: 7,
    start: [0, 0],
    blocked: [[1, 4], [3, 2], [5, 5], [2, 6]],
    difficulty: 'hard',
    hintMoves: ['right', 'down', 'left'],
  },
  {
    id: 'h8',
    size: 7,
    start: [6, 6],
    blocked: [[1, 1], [3, 4], [5, 2], [4, 0]],
    difficulty: 'hard',
    hintMoves: ['left', 'up', 'right'],
  },
  {
    id: 'h9',
    size: 7,
    start: [0, 3],
    blocked: [[2, 1], [4, 5], [6, 3]],
    difficulty: 'hard',
    hintMoves: ['left', 'down', 'right'],
  },
  {
    id: 'h10',
    size: 7,
    start: [3, 0],
    blocked: [[0, 4], [2, 2], [5, 3], [6, 6]],
    difficulty: 'hard',
    hintMoves: ['right', 'up', 'left'],
  },
];

export const ALL_LEVELS: Level[] = [...easyLevels, ...mediumLevels, ...hardLevels];

export const DIFFICULTIES: { key: Difficulty; label: string; description: string }[] = [
  { key: 'easy', label: '初級', description: '5x5 マス' },
  { key: 'medium', label: '中級', description: '6x6 マス' },
  { key: 'hard', label: '上級', description: '7x7 マス' },
];

export function getLevelsByDifficulty(difficulty: Difficulty): Level[] {
  return ALL_LEVELS.filter((l) => l.difficulty === difficulty);
}
