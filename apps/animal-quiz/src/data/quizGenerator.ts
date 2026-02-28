import { animals, featureDescriptions, habitats, habitatAnimals } from './animals';
import { Question, QuizMode, Animal } from '../types';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getRandomItems<T>(array: T[], count: number): T[] {
  return shuffleArray(array).slice(0, count);
}

function getWrongChoices(correctAnimal: Animal, count: number, pool: Animal[]): Animal[] {
  const wrong = pool.filter((a) => a.name !== correctAnimal.name);
  return getRandomItems(wrong, count);
}

function generateFeatureToAnimalQuestion(animal: Animal): Question | null {
  const description = featureDescriptions[animal.name];
  if (!description) return null;

  const sameCategory = animals.filter(
    (a) => a.category === animal.category && a.name !== animal.name
  );
  const otherAnimals =
    sameCategory.length >= 3
      ? getRandomItems(sameCategory, 3)
      : getRandomItems(
          animals.filter((a) => a.name !== animal.name),
          3
        );

  const choices = shuffleArray([animal, ...otherAnimals]);
  const correctIndex = choices.findIndex((c) => c.name === animal.name);

  return {
    questionText: `${description}動物は？`,
    displayEmoji: '❓',
    choices: choices.map((c) => `${c.emoji} ${c.name}`),
    correctIndex,
    type: 'featureToAnimal',
    fact: animal.fact,
  };
}

function generateEmojiToNameQuestion(animal: Animal): Question {
  const sameCategory = animals.filter(
    (a) => a.category === animal.category && a.name !== animal.name
  );
  const otherAnimals =
    sameCategory.length >= 3
      ? getRandomItems(sameCategory, 3)
      : getRandomItems(
          animals.filter((a) => a.name !== animal.name),
          3
        );

  const choices = shuffleArray([animal, ...otherAnimals]);
  const correctIndex = choices.findIndex((c) => c.name === animal.name);

  return {
    questionText: 'この絵文字の動物は？',
    displayEmoji: animal.emoji,
    choices: choices.map((c) => c.name),
    correctIndex,
    type: 'emojiToName',
    fact: animal.fact,
  };
}

function generateHabitatQuestion(animal: Animal): Question {
  const correctHabitat = animal.habitat;
  const wrongHabitats = getRandomItems(
    habitats.filter((h) => h !== correctHabitat),
    3
  );
  const allHabitats = shuffleArray([correctHabitat, ...wrongHabitats]);
  const correctIndex = allHabitats.findIndex((h) => h === correctHabitat);

  return {
    questionText: `${animal.emoji} ${animal.name}の生息地は？`,
    displayEmoji: animal.emoji,
    choices: allHabitats,
    correctIndex,
    type: 'habitat',
    fact: animal.fact,
  };
}

function generateTrueFalseQuestion(animal: Animal): Question {
  const isTrue = Math.random() > 0.5;

  let questionText: string;
  let correctIndex: number;

  if (isTrue) {
    const trueStatements = getTrueStatement(animal);
    questionText = trueStatements;
    correctIndex = 0;
  } else {
    const falseStatement = getFalseStatement(animal);
    questionText = falseStatement;
    correctIndex = 1;
  }

  return {
    questionText,
    displayEmoji: animal.emoji,
    choices: ['○ 正しい', '× 間違い'],
    correctIndex,
    type: 'trueFalse',
    fact: animal.fact,
  };
}

function getTrueStatement(animal: Animal): string {
  const statements: string[] = [];

  statements.push(`${animal.name}は${animal.category}である`);

  if (animal.habitat) {
    statements.push(`${animal.name}は${animal.habitat}に生息している`);
  }

  return statements[Math.floor(Math.random() * statements.length)];
}

function getFalseStatement(animal: Animal): string {
  const allCategories = ['哺乳類', '鳥類', '爬虫類', '魚類', '昆虫', '海洋生物'];
  const wrongCategories = allCategories.filter((c) => c !== animal.category);
  const wrongCategory = wrongCategories[Math.floor(Math.random() * wrongCategories.length)];

  const wrongHabitats = habitats.filter((h) => h !== animal.habitat);
  const wrongHabitat = wrongHabitats[Math.floor(Math.random() * wrongHabitats.length)];

  const statements = [
    `${animal.name}は${wrongCategory}である`,
    `${animal.name}は${wrongHabitat}に生息している`,
  ];

  return statements[Math.floor(Math.random() * statements.length)];
}

export function generateQuiz(
  mode: QuizMode,
  count: number,
  category?: string
): Question[] {
  let pool = category ? animals.filter((a) => a.category === category) : [...animals];

  if (pool.length < 4) {
    pool = [...animals];
  }

  const selected = getRandomItems(pool, Math.min(count, pool.length));
  const questions: Question[] = [];

  for (const animal of selected) {
    let question: Question | null = null;

    switch (mode) {
      case 'featureToAnimal':
        question = generateFeatureToAnimalQuestion(animal);
        if (!question) {
          question = generateEmojiToNameQuestion(animal);
        }
        break;
      case 'emojiToName':
        question = generateEmojiToNameQuestion(animal);
        break;
      case 'habitat':
        question = generateHabitatQuestion(animal);
        break;
      case 'trueFalse':
        question = generateTrueFalseQuestion(animal);
        break;
    }

    if (question) {
      questions.push(question);
    }
  }

  return questions;
}
