export interface QuizResult {
  id: string;
  date: string;
  type: 'vocabulary' | 'grammar' | 'mixed';
  level: string;
  correct: number;
  total: number;
}

export interface VocabEntry {
  word: string;
  meaning: string;
  partOfSpeech: string;
  level: 'basic' | 'intermediate' | 'advanced';
  example: string;
}

export interface GrammarQuestion {
  id: number;
  sentence: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  level: 'basic' | 'intermediate' | 'advanced';
}

export type QuizType = 'vocabulary' | 'grammar' | 'mixed';
export type QuizLevel = 'basic' | 'intermediate' | 'advanced' | 'all';

export interface QuizSettings {
  type: QuizType;
  level: QuizLevel;
  questionCount: number;
}

export interface QuizQuestion {
  questionText: string;
  subText?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  source: 'vocabulary' | 'grammar';
}
