export interface KanjiEntry {
  kanji: string;
  reading: string;
  meaning: string;
  level: 'N5' | 'N4' | 'N3';
}

export interface QuizResult {
  id: string;
  date: string;
  level: string;
  correct: number;
  total: number;
  timeSeconds: number;
}

export type QuizLevel = 'N5' | 'N4' | 'N3' | 'ALL';
export type QuizCount = 10 | 20 | 30;

export interface QuizQuestion {
  kanji: KanjiEntry;
  choices: string[];
  correctIndex: number;
}
