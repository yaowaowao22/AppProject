import { foods, triviaQuestions } from './foods';
import { Question, QuizMode, FoodEntry } from '../types';

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

function getFoodsWithIngredients(): FoodEntry[] {
  return foods.filter((f) => f.ingredients && f.ingredients.length >= 2);
}

function getFoodsWithCalories(): FoodEntry[] {
  return foods.filter((f) => f.calories !== undefined && f.calories > 0);
}

function generateIngredientToFoodQuestion(pool: FoodEntry[], target: FoodEntry): Question {
  const ingredients = target.ingredients!;
  const displayIngredients = ingredients.slice(0, 3).join('、');
  const wrongNames = pickRandom(
    pool.map((f) => f.name),
    3,
    [target.name]
  );
  const choices = shuffle([target.name, ...wrongNames]);
  return {
    questionText: `${displayIngredients}で作るのは？`,
    displayEmoji: '\u{1F373}',
    choices,
    correctIndex: choices.indexOf(target.name),
    type: 'ingredientToFood',
    fact: target.fact,
  };
}

function generateEmojiToNameQuestion(pool: FoodEntry[], target: FoodEntry): Question {
  const wrongNames = pickRandom(
    pool.filter((f) => f.emoji !== target.emoji).map((f) => f.name),
    3,
    [target.name]
  );
  const choices = shuffle([target.name, ...wrongNames]);
  return {
    questionText: 'この食べ物は何？',
    displayEmoji: target.emoji,
    choices,
    correctIndex: choices.indexOf(target.name),
    type: 'emojiToName',
    fact: target.fact,
  };
}

function generateOriginCountryQuestion(pool: FoodEntry[], target: FoodEntry): Question {
  const wrongOrigins = pickRandom(
    [...new Set(pool.map((f) => f.origin))],
    3,
    [target.origin]
  );
  const choices = shuffle([target.origin, ...wrongOrigins]);
  return {
    questionText: `${target.emoji} ${target.name}はどの国の料理？`,
    displayEmoji: '',
    choices,
    correctIndex: choices.indexOf(target.origin),
    type: 'originCountry',
    fact: target.fact,
  };
}

function generateCalorieCompareQuestion(pool: FoodEntry[]): Question {
  const withCalories = pool.filter((f) => f.calories !== undefined);
  if (withCalories.length < 4) {
    return generateEmojiToNameQuestion(pool, pool[0]);
  }

  const selected = shuffle(withCalories).slice(0, 4);
  const highest = selected.reduce((max, f) =>
    (f.calories ?? 0) > (max.calories ?? 0) ? f : max
  );

  const choices = selected.map((f) => `${f.emoji} ${f.name}`);
  const correctChoice = `${highest.emoji} ${highest.name}`;

  return {
    questionText: 'カロリーが一番高いのはどれ？',
    displayEmoji: '\u{1F525}',
    choices,
    correctIndex: choices.indexOf(correctChoice),
    type: 'calorieCompare',
    fact: `${highest.name}は約${highest.calories}kcalです。`,
  };
}

function generateTriviaOXQuestion(): Question {
  const trivia = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
  const choices = ['\u{2B55} まる', '\u{274C} ばつ'];
  const correctIndex = trivia.isTrue ? 0 : 1;

  return {
    questionText: trivia.statement,
    displayEmoji: '\u{1F9D0}',
    choices,
    correctIndex,
    type: 'triviaOX',
    fact: trivia.explanation,
  };
}

export function generateQuiz(mode: QuizMode, count: number): Question[] {
  const pool = [...foods];

  switch (mode) {
    case 'ingredientToFood': {
      const withIngredients = getFoodsWithIngredients();
      const safeCount = Math.min(count, withIngredients.length);
      const selected = shuffle(withIngredients).slice(0, safeCount);
      return selected.map((target) => generateIngredientToFoodQuestion(withIngredients, target));
    }
    case 'emojiToName': {
      const safeCount = Math.min(count, pool.length);
      const selected = shuffle(pool).slice(0, safeCount);
      return selected.map((target) => generateEmojiToNameQuestion(pool, target));
    }
    case 'originCountry': {
      const safeCount = Math.min(count, pool.length);
      const selected = shuffle(pool).slice(0, safeCount);
      return selected.map((target) => generateOriginCountryQuestion(pool, target));
    }
    case 'calorieCompare': {
      const withCalories = getFoodsWithCalories();
      const questions: Question[] = [];
      const usedSets = new Set<string>();
      const maxAttempts = count * 3;
      let attempts = 0;
      while (questions.length < count && attempts < maxAttempts) {
        const q = generateCalorieCompareQuestion(withCalories);
        const key = q.choices.sort().join('|');
        if (!usedSets.has(key)) {
          usedSets.add(key);
          questions.push(q);
        }
        attempts++;
      }
      return questions;
    }
    case 'triviaOX': {
      const safeCount = Math.min(count, triviaQuestions.length);
      const shuffledTrivia = shuffle([...triviaQuestions]).slice(0, safeCount);
      return shuffledTrivia.map((trivia) => {
        const choices = ['\u{2B55} まる', '\u{274C} ばつ'];
        return {
          questionText: trivia.statement,
          displayEmoji: '\u{1F9D0}',
          choices,
          correctIndex: trivia.isTrue ? 0 : 1,
          type: 'triviaOX' as QuizMode,
          fact: trivia.explanation,
        };
      });
    }
  }
}
