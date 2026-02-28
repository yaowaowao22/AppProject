import { vocabularyData } from './vocabulary';
import { grammarData } from './grammar';
import type { QuizQuestion, QuizSettings, VocabEntry, GrammarQuestion } from '../types';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateVocabQuestion(entry: VocabEntry, allEntries: VocabEntry[]): QuizQuestion {
  const wrongEntries = allEntries
    .filter((e) => e.word !== entry.word && e.meaning !== entry.meaning)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const options = shuffleArray([entry, ...wrongEntries]);
  const correctIndex = options.findIndex((o) => o.word === entry.word);

  return {
    questionText: entry.word,
    subText: `(${entry.partOfSpeech})`,
    options: options.map((o) => o.meaning),
    correctIndex,
    explanation: `${entry.word}：${entry.meaning}\n例文：${entry.example}`,
    source: 'vocabulary',
  };
}

function convertGrammarQuestion(q: GrammarQuestion): QuizQuestion {
  return {
    questionText: q.sentence,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    source: 'grammar',
  };
}

export function generateQuiz(settings: QuizSettings): QuizQuestion[] {
  const { type, level, questionCount } = settings;

  let vocabPool: VocabEntry[] = [];
  let grammarPool: GrammarQuestion[] = [];

  if (type === 'vocabulary' || type === 'mixed') {
    vocabPool =
      level === 'all'
        ? [...vocabularyData]
        : vocabularyData.filter((v) => v.level === level);
  }

  if (type === 'grammar' || type === 'mixed') {
    grammarPool =
      level === 'all'
        ? [...grammarData]
        : grammarData.filter((g) => g.level === level);
  }

  const questions: QuizQuestion[] = [];

  if (type === 'vocabulary') {
    const selected = shuffleArray(vocabPool).slice(0, questionCount);
    for (const entry of selected) {
      questions.push(generateVocabQuestion(entry, vocabularyData));
    }
  } else if (type === 'grammar') {
    const selected = shuffleArray(grammarPool).slice(0, questionCount);
    for (const q of selected) {
      questions.push(convertGrammarQuestion(q));
    }
  } else {
    const vocabCount = Math.ceil(questionCount / 2);
    const grammarCount = questionCount - vocabCount;

    const selectedVocab = shuffleArray(vocabPool).slice(0, vocabCount);
    const selectedGrammar = shuffleArray(grammarPool).slice(0, grammarCount);

    for (const entry of selectedVocab) {
      questions.push(generateVocabQuestion(entry, vocabularyData));
    }
    for (const q of selectedGrammar) {
      questions.push(convertGrammarQuestion(q));
    }
  }

  return shuffleArray(questions).slice(0, questionCount);
}

export function eliminateWrongOptions(question: QuizQuestion): number[] {
  const wrongIndices = question.options
    .map((_, i) => i)
    .filter((i) => i !== question.correctIndex);
  const shuffledWrong = shuffleArray(wrongIndices);
  return shuffledWrong.slice(0, 2);
}
