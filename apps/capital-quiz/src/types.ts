export type QuizMode = 'countryToCapital' | 'capitalToCountry' | 'continent' | 'worldShuffle';

export type Continent = 'アジア' | 'ヨーロッパ' | '北アメリカ' | '南アメリカ' | 'アフリカ' | 'オセアニア';

export interface Country {
  name: string;
  capital: string;
  continent: string;
  flag: string;
  population: string;
}

export interface Question {
  questionText: string;
  displayEmoji: string;
  choices: string[];
  correctIndex: number;
  type: QuizMode;
  funFact: string;
  correctAnswer: string;
}

export interface QuizResult {
  id: string;
  date: string;
  mode: QuizMode;
  continent?: string;
  correct: number;
  total: number;
}
