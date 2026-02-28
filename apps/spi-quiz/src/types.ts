export type QuizCategory = 'gengo' | 'higengo' | 'sogo';

export interface SPIQuestion {
  id: number;
  category: 'gengo' | 'higengo' | 'seikaku';
  subcategory: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizResult {
  id: string;
  date: string;
  mode: QuizCategory;
  modeLabel: string;
  correct: number;
  total: number;
  accuracy: number;
}
