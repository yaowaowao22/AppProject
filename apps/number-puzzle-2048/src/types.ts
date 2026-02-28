export type Grid = (number | null)[][];

export interface GameResult {
  id: string;
  date: string;
  score: number;
  highestTile: number;
  won: boolean;
}
