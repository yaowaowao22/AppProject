import { allQuestions } from './eikenData';
import type { QuizQuestion, QuizSettings, EikenQuestion } from '../types';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function convertToQuizQuestion(q: EikenQuestion): QuizQuestion {
  return {
    questionText: q.sentence,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    source: q.type,
    level: q.level,
  };
}

export function generateQuiz(settings: QuizSettings): QuizQuestion[] {
  const { level, type, questionCount } = settings;

  let pool: EikenQuestion[] = [];

  if (level === 'all') {
    pool = [...allQuestions];
  } else {
    pool = allQuestions.filter((q) => q.level === level);
  }

  if (type !== 'mixed') {
    pool = pool.filter((q) => q.type === type);
  }

  const shuffled = shuffleArray(pool);
  const selected = shuffled.slice(0, questionCount);

  return selected.map(convertToQuizQuestion);
}

export function eliminateWrongOptions(question: QuizQuestion): number[] {
  const wrongIndices = question.options
    .map((_, i) => i)
    .filter((i) => i !== question.correctIndex);
  const shuffledWrong = shuffleArray(wrongIndices);
  return shuffledWrong.slice(0, 2);
}
