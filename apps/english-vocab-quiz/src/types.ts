export interface WordEntry {
  word: string;
  meaning: string;
  level: '5-4級' | '3-準2級' | '2-準1級';
  example: string;
}

export interface QuizResult {
  id: string;
  date: string;
  level: string;
  mode: QuizMode;
  correct: number;
  total: number;
  timeSeconds: number;
}

export type QuizLevel = '5-4級' | '3-準2級' | '2-準1級' | 'ALL';
export type QuizCount = 10 | 20 | 30;
export type QuizMode = 'en-to-jp' | 'jp-to-en';

export interface QuizQuestion {
  entry: WordEntry;
  choices: string[];
  correctIndex: number;
  mode: QuizMode;
}
