export type KenteiLevel = '10級' | '8級' | '6級' | '4級' | '3級' | '準2級';

export type QuestionType = '読み' | '書き' | '部首' | '四字熟語';

export type QuizCount = 10 | 20 | 30;

export interface YomiEntry {
  type: '読み';
  word: string;
  reading: string;
  meaning: string;
  level: KenteiLevel;
}

export interface KakiEntry {
  type: '書き';
  reading: string;
  correctKanji: string;
  meaning: string;
  level: KenteiLevel;
}

export interface BushuEntry {
  type: '部首';
  kanji: string;
  bushuName: string;
  bushuChar: string;
  level: KenteiLevel;
}

export interface YojiEntry {
  type: '四字熟語';
  full: string;
  display: string;
  answer: string;
  meaning: string;
  level: KenteiLevel;
}

export type KenteiEntry = YomiEntry | KakiEntry | BushuEntry | YojiEntry;

export interface QuizQuestion {
  entry: KenteiEntry;
  questionText: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizResult {
  id: string;
  date: string;
  level: string;
  questionType: string;
  correct: number;
  total: number;
  timeSeconds: number;
}
