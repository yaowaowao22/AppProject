export type EikenLevel = '5級' | '4級' | '3級' | '準2級' | '2級';
export type QuestionType = 'vocabulary' | 'grammar' | 'conversation';

export interface EikenQuestion {
  id: number;
  level: EikenLevel;
  type: QuestionType;
  sentence: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizSettings {
  level: EikenLevel | 'all';
  type: QuestionType | 'mixed';
  questionCount: number;
}

export interface QuizQuestion {
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  source: QuestionType;
  level: EikenLevel;
}

export interface QuizResult {
  id: string;
  date: string;
  level: string;
  type: string;
  correct: number;
  total: number;
}
