export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface CardType {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
  id: string;
}

export interface GameResult {
  id: string;
  date: string;
  moves: number;
  timeSeconds: number;
  won: boolean;
}

export interface GameState {
  tableau: CardType[][];
  foundations: CardType[][];
  stock: CardType[];
  waste: CardType[];
}

export interface Selection {
  source: 'tableau' | 'waste' | 'foundation';
  pileIndex: number;
  cardIndex: number;
}
