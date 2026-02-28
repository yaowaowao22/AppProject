export type QuizMode =
  | 'ingredientToFood'
  | 'emojiToName'
  | 'originCountry'
  | 'calorieCompare'
  | 'triviaOX';

export interface FoodEntry {
  name: string;
  emoji: string;
  origin: string;
  category: string;
  fact: string;
  calories?: number;
  ingredients?: string[];
}

export interface Question {
  questionText: string;
  displayEmoji: string;
  choices: string[];
  correctIndex: number;
  type: QuizMode;
  fact: string;
}

export interface QuizResult {
  id: string;
  date: string;
  mode: QuizMode;
  correct: number;
  total: number;
}
