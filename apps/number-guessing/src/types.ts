export type GameMode = 'classic' | 'hard' | 'timeattack';

export interface GuessEntry {
  value: number;
  direction: 'higher' | 'lower' | 'correct';
}

export interface GameResult {
  id: string;
  date: string;
  mode: GameMode;
  target: number;
  guessCount: number;
  won: boolean;
  timeAttackScore?: number;
  rangeMax: number;
}
