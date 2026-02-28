import { prefectures, regions } from './prefectures';
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

function generateCapitalQuestion(prefectureIndex: number): Question {
  const pref = prefectures[prefectureIndex];
  const wrongCapitals = pickRandom(
    prefectures.map((p) => p.capital),
    3,
    [pref.capital]
  );
  const choices = shuffle([pref.capital, ...wrongCapitals]);
  return {
    questionText: `${pref.name}の県庁所在地は？`,
    choices,
    correctIndex: choices.indexOf(pref.capital),
    prefectureId: pref.id,
    type: 'capital',
  };
}

function generateFamousQuestion(prefectureIndex: number): Question {
  const pref = prefectures[prefectureIndex];
  const wrongPrefs = pickRandom(
    prefectures.map((p) => p.name),
    3,
    [pref.name]
  );
  const choices = shuffle([pref.name, ...wrongPrefs]);
  return {
    questionText: `「${pref.famous}」といえば\nどの都道府県？`,
    choices,
    correctIndex: choices.indexOf(pref.name),
    prefectureId: pref.id,
    type: 'famous',
  };
}

function generateRegionQuestion(prefectureIndex: number): Question {
  const pref = prefectures[prefectureIndex];
  const wrongRegions = pickRandom(regions, 3, [pref.region]);
  const choices = shuffle([pref.region, ...wrongRegions]);
  return {
    questionText: `${pref.name}はどの地方？`,
    choices,
    correctIndex: choices.indexOf(pref.region),
    prefectureId: pref.id,
    type: 'region',
  };
}

function generateComparisonQuestion(): Question {
  const [a, b] = pickRandom(prefectures, 2);
  const isArea = Math.random() < 0.5;

  if (isArea) {
    const larger = a.area > b.area ? a : b;
    const choices = shuffle([a.name, b.name]);
    return {
      questionText: `面積が大きいのはどっち？\n${a.name} vs ${b.name}`,
      choices,
      correctIndex: choices.indexOf(larger.name),
      prefectureId: larger.id,
      type: 'mixed',
    };
  } else {
    const morePop = a.population > b.population ? a : b;
    const choices = shuffle([a.name, b.name]);
    return {
      questionText: `人口が多いのはどっち？\n${a.name} vs ${b.name}`,
      choices,
      correctIndex: choices.indexOf(morePop.name),
      prefectureId: morePop.id,
      type: 'mixed',
    };
  }
}

function generateMixedQuestion(prefectureIndex: number): Question {
  const rand = Math.random();
  if (rand < 0.25) {
    return generateCapitalQuestion(prefectureIndex);
  } else if (rand < 0.5) {
    return generateFamousQuestion(prefectureIndex);
  } else if (rand < 0.7) {
    return generateRegionQuestion(prefectureIndex);
  } else {
    return generateComparisonQuestion();
  }
}

export function generateQuiz(mode: QuizMode, count: number): Question[] {
  const indices = shuffle(
    Array.from({ length: prefectures.length }, (_, i) => i)
  ).slice(0, count);

  switch (mode) {
    case 'capital':
      return indices.map(generateCapitalQuestion);
    case 'famous':
      return indices.map(generateFamousQuestion);
    case 'region':
      return indices.map(generateRegionQuestion);
    case 'mixed':
      return indices.map(generateMixedQuestion);
  }
}
