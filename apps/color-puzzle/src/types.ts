export type Difficulty = 'easy' | 'medium' | 'hard';

export type PuzzleColor = 0 | 1 | 2 | 3 | 4 | 5;

export interface GameResult {
  id: string;
  date: string;
  difficulty: Difficulty;
  moves: number;
  targetMoves: number;
  stars: number;
}
