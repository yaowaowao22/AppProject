import { countries } from './countries';
import { Question, QuizMode, Country } from '../types';

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function pickRandom<T>(array: T[], count: number, exclude?: T[]): T[] {
  const filtered = exclude ? array.filter((item) => !exclude.includes(item)) : [...array];
  return shuffle(filtered).slice(0, count);
}

function generateFunFact(country: Country): string {
  const facts = [
    `${country.name}の人口は${country.population}です。`,
    `${country.name}は${country.continent}に位置しています。`,
    `${country.capital}は${country.name}の首都です。`,
  ];
  return facts[Math.floor(Math.random() * facts.length)];
}

function generateCountryToCapitalQuestion(pool: Country[], targetIndex: number): Question {
  const target = pool[targetIndex];
  const wrongCapitals = pickRandom(
    pool.map((c) => c.capital),
    3,
    [target.capital]
  );
  const choices = shuffle([target.capital, ...wrongCapitals]);
  return {
    questionText: `${target.name}の首都は？`,
    displayEmoji: target.flag,
    choices,
    correctIndex: choices.indexOf(target.capital),
    type: 'countryToCapital',
    funFact: generateFunFact(target),
    correctAnswer: target.capital,
  };
}

function generateCapitalToCountryQuestion(pool: Country[], targetIndex: number): Question {
  const target = pool[targetIndex];
  const wrongNames = pickRandom(
    pool.map((c) => c.name),
    3,
    [target.name]
  );
  const choices = shuffle([target.name, ...wrongNames]);
  return {
    questionText: `「${target.capital}」はどの国の首都？`,
    displayEmoji: '',
    choices,
    correctIndex: choices.indexOf(target.name),
    type: 'capitalToCountry',
    funFact: generateFunFact(target),
    correctAnswer: target.name,
  };
}

export function generateQuiz(
  mode: QuizMode,
  count: number,
  continent?: string
): Question[] {
  const pool = continent
    ? countries.filter((c) => c.continent === continent)
    : countries;

  const safeCount = Math.min(count, pool.length);
  const indices = shuffle(
    Array.from({ length: pool.length }, (_, i) => i)
  ).slice(0, safeCount);

  switch (mode) {
    case 'countryToCapital':
      return indices.map((i) => generateCountryToCapitalQuestion(pool, i));
    case 'capitalToCountry':
      return indices.map((i) => generateCapitalToCountryQuestion(pool, i));
    case 'continent':
      return indices.map((i) => {
        const useCountryToCapital = Math.random() < 0.5;
        if (useCountryToCapital) {
          return generateCountryToCapitalQuestion(pool, i);
        }
        return generateCapitalToCountryQuestion(pool, i);
      });
    case 'worldShuffle':
      return indices.map((i) => {
        const useCountryToCapital = Math.random() < 0.5;
        if (useCountryToCapital) {
          return generateCountryToCapitalQuestion(pool, i);
        }
        return generateCapitalToCountryQuestion(pool, i);
      });
  }
}
