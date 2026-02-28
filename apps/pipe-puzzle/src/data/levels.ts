import type { LevelDefinition } from '../utils/pipePuzzle';

/**
 * Pipe Puzzle Levels
 *
 * Legend:
 * S = Source (water origin, fixed)
 * D = Drain (water destination, fixed)
 * ─ = Straight horizontal
 * │ = Straight vertical
 * ┌ = Corner: right + bottom
 * ┐ = Corner: left + bottom
 * └ = Corner: right + top
 * ┘ = Corner: left + top
 * ┬ = Tee: left + right + bottom
 * ┤ = Tee: top + left + bottom
 * ┴ = Tee: left + right + top
 * ├ = Tee: top + right + bottom
 * ┼ = Cross: all four directions
 * . = Empty
 */

export const levels: LevelDefinition[] = [
  // ===== EASY (8 levels, 4x4) =====
  // Level 1: Simple straight path
  {
    id: 1,
    difficulty: 'easy',
    rows: 4,
    cols: 4,
    layout: [
      'S─┐.',
      '..│.',
      '.┌┘.',
      '.└─D',
    ],
    scrambleCount: 1,
  },
  // Level 2: L-shape path
  {
    id: 2,
    difficulty: 'easy',
    rows: 4,
    cols: 4,
    layout: [
      'S┐..',
      '.│..',
      '.│..',
      '.└─D',
    ],
    scrambleCount: 1,
  },
  // Level 3: Zigzag
  {
    id: 3,
    difficulty: 'easy',
    rows: 4,
    cols: 4,
    layout: [
      'S─┐.',
      '..└┐',
      '.┌─┘',
      '.└─D',
    ],
    scrambleCount: 1,
  },
  // Level 4: U-shape
  {
    id: 4,
    difficulty: 'easy',
    rows: 4,
    cols: 4,
    layout: [
      'S┐.D',
      '.│.│',
      '.│.│',
      '.└─┘',
    ],
    scrambleCount: 1,
  },
  // Level 5: Spiral inward
  {
    id: 5,
    difficulty: 'easy',
    rows: 4,
    cols: 4,
    layout: [
      'S──┐',
      '.┌D│',
      '.│.│',
      '.└─┘',
    ],
    scrambleCount: 1,
  },
  // Level 6: S-curve
  {
    id: 6,
    difficulty: 'easy',
    rows: 4,
    cols: 4,
    layout: [
      '.S┐.',
      '.┌┘.',
      '.└┐.',
      '..└D',
    ],
    scrambleCount: 1,
  },
  // Level 7: Simple with branching
  {
    id: 7,
    difficulty: 'easy',
    rows: 4,
    cols: 4,
    layout: [
      'S─┐.',
      '..│.',
      '..│.',
      '..└D',
    ],
    scrambleCount: 1,
  },
  // Level 8: Wide path
  {
    id: 8,
    difficulty: 'easy',
    rows: 4,
    cols: 4,
    layout: [
      'S──┐',
      '...│',
      '...│',
      'D──┘',
    ],
    scrambleCount: 1,
  },

  // ===== MEDIUM (9 levels, 5x5) =====
  // Level 9
  {
    id: 9,
    difficulty: 'medium',
    rows: 5,
    cols: 5,
    layout: [
      'S─┐..',
      '..└┐.',
      '...│.',
      '..┌┘.',
      '..└─D',
    ],
    scrambleCount: 1,
  },
  // Level 10
  {
    id: 10,
    difficulty: 'medium',
    rows: 5,
    cols: 5,
    layout: [
      'S──┐.',
      '...│.',
      '.┌─┘.',
      '.│...',
      '.└──D',
    ],
    scrambleCount: 1,
  },
  // Level 11: With T-piece
  {
    id: 11,
    difficulty: 'medium',
    rows: 5,
    cols: 5,
    layout: [
      'S─┬─┐',
      '..│.│',
      '..│.│',
      '..│.│',
      '..└─D',
    ],
    scrambleCount: 1,
  },
  // Level 12: Complex zigzag
  {
    id: 12,
    difficulty: 'medium',
    rows: 5,
    cols: 5,
    layout: [
      'S┐...',
      '.└─┐.',
      '...└┐',
      '.┌──┘',
      '.└──D',
    ],
    scrambleCount: 1,
  },
  // Level 13
  {
    id: 13,
    difficulty: 'medium',
    rows: 5,
    cols: 5,
    layout: [
      'S──┐.',
      '...│.',
      '.┌─┤.',
      '.│.│.',
      '.└─┘D',
    ],
    scrambleCount: 1,
  },
  // Level 14
  {
    id: 14,
    difficulty: 'medium',
    rows: 5,
    cols: 5,
    layout: [
      'S─┐..',
      '..│..',
      '.┌┼┐.',
      '.│.│.',
      '.└─┘D',
    ],
    scrambleCount: 1,
  },
  // Level 15
  {
    id: 15,
    difficulty: 'medium',
    rows: 5,
    cols: 5,
    layout: [
      '.S──┐',
      '.│..│',
      '.│.┌┘',
      '.│.│.',
      '.└─┘D',
    ],
    scrambleCount: 1,
  },
  // Level 16
  {
    id: 16,
    difficulty: 'medium',
    rows: 5,
    cols: 5,
    layout: [
      'S─┐..',
      '..└─┐',
      '...┌┘',
      '.┌─┘.',
      '.└──D',
    ],
    scrambleCount: 1,
  },
  // Level 17
  {
    id: 17,
    difficulty: 'medium',
    rows: 5,
    cols: 5,
    layout: [
      'S┐.┌D',
      '.│.│.',
      '.└┐│.',
      '..││.',
      '..└┘.',
    ],
    scrambleCount: 1,
  },

  // ===== HARD (8 levels, 6x6) =====
  // Level 18
  {
    id: 18,
    difficulty: 'hard',
    rows: 6,
    cols: 6,
    layout: [
      'S──┐..',
      '...│..',
      '.┌─┘..',
      '.│.┌─┐',
      '.└─┘.│',
      '.....D',
    ],
    scrambleCount: 1,
  },
  // Level 19
  {
    id: 19,
    difficulty: 'hard',
    rows: 6,
    cols: 6,
    layout: [
      'S─┐...',
      '..└─┐.',
      '....│.',
      '.┌──┘.',
      '.│....',
      '.└───D',
    ],
    scrambleCount: 1,
  },
  // Level 20: With cross
  {
    id: 20,
    difficulty: 'hard',
    rows: 6,
    cols: 6,
    layout: [
      'S──┐..',
      '...│..',
      '.┌─┼─┐',
      '.│.│.│',
      '.│.└─┘',
      '.└───D',
    ],
    scrambleCount: 1,
  },
  // Level 21: T-piece network
  {
    id: 21,
    difficulty: 'hard',
    rows: 6,
    cols: 6,
    layout: [
      'S─┬──┐',
      '..│..│',
      '..├─┐│',
      '..│.││',
      '..│.└┘',
      '..└──D',
    ],
    scrambleCount: 1,
  },
  // Level 22
  {
    id: 22,
    difficulty: 'hard',
    rows: 6,
    cols: 6,
    layout: [
      'S─┐┌─┐',
      '..│└┐│',
      '..│.││',
      '..└┐││',
      '...│└┘',
      '...└─D',
    ],
    scrambleCount: 1,
  },
  // Level 23
  {
    id: 23,
    difficulty: 'hard',
    rows: 6,
    cols: 6,
    layout: [
      '.S─┐..',
      '.│.│..',
      '.│.└─┐',
      '.└──┐│',
      '....││',
      '...D└┘',
    ],
    scrambleCount: 1,
  },
  // Level 24
  {
    id: 24,
    difficulty: 'hard',
    rows: 6,
    cols: 6,
    layout: [
      'S───┐.',
      '....│.',
      '.┌──┘.',
      '.│....',
      '.└──┐.',
      '....└D',
    ],
    scrambleCount: 1,
  },
  // Level 25
  {
    id: 25,
    difficulty: 'hard',
    rows: 6,
    cols: 6,
    layout: [
      'S─┐┌─┐',
      '..└┤.│',
      '..┌┘.│',
      '..│..│',
      '..│┌─┘',
      '..└┘.D',
    ],
    scrambleCount: 1,
  },
];

export function getLevelsByDifficulty(difficulty: string): LevelDefinition[] {
  return levels.filter((l) => l.difficulty === difficulty);
}

export function getLevelById(id: number): LevelDefinition | undefined {
  return levels.find((l) => l.id === id);
}
