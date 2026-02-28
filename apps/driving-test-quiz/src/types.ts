export interface Question {
  id: number;
  category: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface TestResult {
  id: string;
  date: string;
  category: string;
  correct: number;
  total: number;
  passed: boolean;
}
