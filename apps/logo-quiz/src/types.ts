export interface BrandEntry {
  name: string;
  hints: string[];
  category: string;
  foundedYear?: number;
}

export interface QuizQuestion {
  brand: BrandEntry;
  choices: string[];
  correctIndex: number;
}

export interface GameResult {
  id: string;
  date: string;
  category: string;
  correct: number;
  total: number;
  totalScore: number;
  questionCount: number;
}

export type GamePhase = 'playing' | 'feedback' | 'result';
