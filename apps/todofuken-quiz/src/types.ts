export type QuizMode = 'capital' | 'famous' | 'region' | 'mixed';

export interface QuizResult {
  id: string;
  date: string;
  mode: QuizMode;
  correct: number;
  total: number;
}

export interface Prefecture {
  id: number;
  name: string;
  capital: string;
  region: string;
  population: number;
  area: number;
  famous: string;
  funFact: string;
}

export interface Question {
  questionText: string;
  choices: string[];
  correctIndex: number;
  prefectureId: number;
  type: QuizMode;
}
