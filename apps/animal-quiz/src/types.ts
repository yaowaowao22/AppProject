export type QuizMode = 'featureToAnimal' | 'emojiToName' | 'habitat' | 'trueFalse';

export interface Animal {
  name: string;
  emoji: string;
  habitat: string;
  fact: string;
  category: string;
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
  category?: string;
  correct: number;
  total: number;
}
