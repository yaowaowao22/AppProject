import { countries } from './countries';
import { Question, QuizMode } from '../types';

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

function generateFlagToNameQuestion(pool: typeof countries, targetIndex: number): Question {
  const target = pool[targetIndex];
  const wrongNames = pickRandom(
    pool.map((c) => c.name),
    3,
    [target.name]
  );
  const choices = shuffle([target.name, ...wrongNames]);
  return {
    questionText: 'この国旗はどの国？',
    displayEmoji: target.flag,
    choices,
    correctIndex: choices.indexOf(target.name),
    type: 'flagToName',
  };
}

function generateNameToFlagQuestion(pool: typeof countries, targetIndex: number): Question {
  const target = pool[targetIndex];
  const wrongFlags = pickRandom(
    pool.map((c) => c.flag),
    3,
    [target.flag]
  );
  const choices = shuffle([target.flag, ...wrongFlags]);
  return {
    questionText: `「${target.name}」の国旗は？`,
    displayEmoji: '',
    choices,
    correctIndex: choices.indexOf(target.flag),
    type: 'nameToFlag',
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
    case 'flagToName':
      return indices.map((i) => generateFlagToNameQuestion(pool, i));
    case 'nameToFlag':
      return indices.map((i) => generateNameToFlagQuestion(pool, i));
    case 'continent': {
      return indices.map((i) => {
        const useFlag = Math.random() < 0.5;
        if (useFlag) {
          return generateFlagToNameQuestion(pool, i);
        }
        return generateNameToFlagQuestion(pool, i);
      });
    }
  }
}
