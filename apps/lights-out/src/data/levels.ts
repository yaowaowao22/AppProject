import type { LevelDef } from '../types';

// === Easy Levels (3x3) ===

const easyLevels: LevelDef[] = [
  {
    id: 'e01',
    name: '十字',
    difficulty: 'easy',
    size: 3,
    toggleSequence: [[1, 1]],
  },
  {
    id: 'e02',
    name: '角',
    difficulty: 'easy',
    size: 3,
    toggleSequence: [[0, 0]],
  },
  {
    id: 'e03',
    name: '辺',
    difficulty: 'easy',
    size: 3,
    toggleSequence: [[0, 1]],
  },
  {
    id: 'e04',
    name: '対角',
    difficulty: 'easy',
    size: 3,
    toggleSequence: [[0, 0], [2, 2]],
  },
  {
    id: 'e05',
    name: '二角',
    difficulty: 'easy',
    size: 3,
    toggleSequence: [[0, 0], [0, 2]],
  },
  {
    id: 'e06',
    name: '横列',
    difficulty: 'easy',
    size: 3,
    toggleSequence: [[1, 0], [1, 2]],
  },
  {
    id: 'e07',
    name: '縦列',
    difficulty: 'easy',
    size: 3,
    toggleSequence: [[0, 1], [2, 1]],
  },
  {
    id: 'e08',
    name: 'L字',
    difficulty: 'easy',
    size: 3,
    toggleSequence: [[0, 0], [2, 0]],
  },
  {
    id: 'e09',
    name: '三角',
    difficulty: 'easy',
    size: 3,
    toggleSequence: [[0, 0], [0, 2], [2, 1]],
  },
  {
    id: 'e10',
    name: '四隅',
    difficulty: 'easy',
    size: 3,
    toggleSequence: [[0, 0], [0, 2], [2, 0], [2, 2]],
  },
];

// === Medium Levels (5x5) ===

const mediumLevels: LevelDef[] = [
  {
    id: 'm01',
    name: '中心',
    difficulty: 'medium',
    size: 5,
    toggleSequence: [[2, 2]],
  },
  {
    id: 'm02',
    name: '十字架',
    difficulty: 'medium',
    size: 5,
    toggleSequence: [[0, 2], [2, 0], [2, 4], [4, 2]],
  },
  {
    id: 'm03',
    name: 'X字',
    difficulty: 'medium',
    size: 5,
    toggleSequence: [[0, 0], [0, 4], [4, 0], [4, 4]],
  },
  {
    id: 'm04',
    name: 'ダイヤ',
    difficulty: 'medium',
    size: 5,
    toggleSequence: [[0, 2], [2, 0], [2, 4], [4, 2], [2, 2]],
  },
  {
    id: 'm05',
    name: '枠',
    difficulty: 'medium',
    size: 5,
    toggleSequence: [[0, 0], [0, 2], [0, 4], [2, 0], [2, 4], [4, 0], [4, 2], [4, 4]],
  },
  {
    id: 'm06',
    name: '市松',
    difficulty: 'medium',
    size: 5,
    toggleSequence: [[0, 0], [0, 2], [0, 4], [2, 0], [2, 2], [2, 4], [4, 0], [4, 2], [4, 4]],
  },
  {
    id: 'm07',
    name: '横線',
    difficulty: 'medium',
    size: 5,
    toggleSequence: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]],
  },
  {
    id: 'm08',
    name: '矢印',
    difficulty: 'medium',
    size: 5,
    toggleSequence: [[0, 2], [1, 1], [1, 3], [2, 2], [3, 2]],
  },
  {
    id: 'm09',
    name: '稲妻',
    difficulty: 'medium',
    size: 5,
    toggleSequence: [[0, 1], [1, 2], [2, 1], [3, 2], [4, 3]],
  },
  {
    id: 'm10',
    name: '波',
    difficulty: 'medium',
    size: 5,
    toggleSequence: [[0, 0], [1, 2], [2, 4], [3, 2], [4, 0]],
  },
  {
    id: 'm11',
    name: '花',
    difficulty: 'medium',
    size: 5,
    toggleSequence: [[1, 2], [2, 1], [2, 3], [3, 2]],
  },
  {
    id: 'm12',
    name: '梯子',
    difficulty: 'medium',
    size: 5,
    toggleSequence: [[0, 1], [0, 3], [2, 1], [2, 3], [4, 1], [4, 3]],
  },
];

// === Hard Levels (7x7) ===

const hardLevels: LevelDef[] = [
  {
    id: 'h01',
    name: '中心点',
    difficulty: 'hard',
    size: 7,
    toggleSequence: [[3, 3]],
  },
  {
    id: 'h02',
    name: '大十字',
    difficulty: 'hard',
    size: 7,
    toggleSequence: [[0, 3], [3, 0], [3, 6], [6, 3]],
  },
  {
    id: 'h03',
    name: '大X',
    difficulty: 'hard',
    size: 7,
    toggleSequence: [[0, 0], [1, 1], [2, 2], [4, 4], [5, 5], [6, 6]],
  },
  {
    id: 'h04',
    name: '渦巻き',
    difficulty: 'hard',
    size: 7,
    toggleSequence: [[0, 0], [0, 3], [0, 6], [3, 0], [3, 6], [6, 0], [6, 3], [6, 6]],
  },
  {
    id: 'h05',
    name: '星座',
    difficulty: 'hard',
    size: 7,
    toggleSequence: [[0, 3], [1, 1], [1, 5], [3, 0], [3, 3], [3, 6], [5, 1], [5, 5], [6, 3]],
  },
  {
    id: 'h06',
    name: '碁盤',
    difficulty: 'hard',
    size: 7,
    toggleSequence: [
      [0, 0], [0, 2], [0, 4], [0, 6],
      [2, 0], [2, 2], [2, 4], [2, 6],
      [4, 0], [4, 2], [4, 4], [4, 6],
      [6, 0], [6, 2], [6, 4], [6, 6],
    ],
  },
  {
    id: 'h07',
    name: '迷路',
    difficulty: 'hard',
    size: 7,
    toggleSequence: [
      [0, 1], [0, 5], [1, 3], [2, 1], [2, 5],
      [3, 3], [4, 1], [4, 5], [5, 3], [6, 1], [6, 5],
    ],
  },
  {
    id: 'h08',
    name: '城壁',
    difficulty: 'hard',
    size: 7,
    toggleSequence: [
      [0, 0], [0, 2], [0, 4], [0, 6],
      [3, 1], [3, 3], [3, 5],
      [6, 0], [6, 2], [6, 4], [6, 6],
    ],
  },
  {
    id: 'h09',
    name: '龍',
    difficulty: 'hard',
    size: 7,
    toggleSequence: [
      [0, 2], [0, 4], [1, 1], [1, 5],
      [2, 0], [2, 3], [2, 6],
      [3, 1], [3, 5], [4, 2], [4, 4],
      [5, 3], [6, 3],
    ],
  },
  {
    id: 'h10',
    name: '鳳凰',
    difficulty: 'hard',
    size: 7,
    toggleSequence: [
      [0, 3], [1, 1], [1, 3], [1, 5],
      [2, 0], [2, 2], [2, 4], [2, 6],
      [3, 1], [3, 5],
      [4, 2], [4, 4], [5, 3], [6, 1], [6, 5],
    ],
  },
  {
    id: 'h11',
    name: '雷神',
    difficulty: 'hard',
    size: 7,
    toggleSequence: [
      [0, 0], [0, 6], [1, 2], [1, 4],
      [2, 3], [3, 1], [3, 5],
      [4, 3], [5, 2], [5, 4], [6, 0], [6, 6],
    ],
  },
  {
    id: 'h12',
    name: '風車',
    difficulty: 'hard',
    size: 7,
    toggleSequence: [
      [0, 3], [1, 4], [2, 5],
      [3, 6], [3, 0],
      [4, 1], [5, 2], [6, 3],
      [3, 3],
    ],
  },
];

export const ALL_LEVELS: LevelDef[] = [...easyLevels, ...mediumLevels, ...hardLevels];

export function getLevelsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): LevelDef[] {
  return ALL_LEVELS.filter((l) => l.difficulty === difficulty);
}

export function getLevelById(id: string): LevelDef | undefined {
  return ALL_LEVELS.find((l) => l.id === id);
}
