export interface Kotowaza {
  proverb: string;
  meaning: string;
  example: string;
  level: 'basic' | 'intermediate' | 'advanced';
}

export type QuizMode = 'meaning-to-proverb' | 'fill-in-blank' | 'select-meaning';

export type QuizLevel = 'basic' | 'intermediate' | 'advanced' | 'ALL';
export type QuizCount = 10 | 20 | 30;

export interface QuizQuestion {
  kotowaza: Kotowaza;
  mode: QuizMode;
  questionText: string;
  choices: string[];
  correctIndex: number;
}

export interface QuizResult {
  id: string;
  date: string;
  level: string;
  mode: string;
  correct: number;
  total: number;
  timeSeconds: number;
}
