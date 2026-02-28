export type QuizMode = 'flagToName' | 'nameToFlag' | 'continent';

export type Continent = 'アジア' | 'ヨーロッパ' | '北アメリカ' | '南アメリカ' | 'アフリカ' | 'オセアニア';

export interface Country {
  name: string;
  flag: string;
  continent: string;
  capital: string;
}

export interface Question {
  questionText: string;
  displayEmoji: string;
  choices: string[];
  correctIndex: number;
  type: QuizMode;
}

export interface QuizResult {
  id: string;
  date: string;
  mode: QuizMode;
  continent?: string;
  correct: number;
  total: number;
}
