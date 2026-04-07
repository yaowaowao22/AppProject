import { useEffect } from 'react';
import { Platform } from 'react-native';

// Expo Go / web ではネイティブモジュールが存在しないのでフォールバック
let updateWidgetData: (reviewCount: number, streak: number, totalItems: number) => void = () => {};
let updateWidgetQuizData: (items: { question: string; answer: string }[]) => void = () => {};
let updateFlashcardPeekData: (items: { id: number; question: string; hintAnswer: string }[]) => void = () => {};

if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bridge = require('recall-widget-bridge');
    // bridge の関数が undefined の場合はデフォルトの空関数を維持する
    if (typeof bridge.updateWidgetData === 'function') updateWidgetData = bridge.updateWidgetData;
    if (typeof bridge.updateWidgetQuizData === 'function') updateWidgetQuizData = bridge.updateWidgetQuizData;
    if (typeof bridge.updateFlashcardPeekData === 'function') updateFlashcardPeekData = bridge.updateFlashcardPeekData;
  } catch {
    // Expo Go など、ネイティブモジュール未ビルド環境では無視
  }
}

/** Flashcard Peek ウィジェット用データ型 */
export interface FlashcardPeekItem {
  id: number;
  question: string;
  hintAnswer: string;
}

/**
 * ホーム画面のデータが揃ったタイミングで iOS ウィジェットへ同期する。
 * reviewCount / streak / totalItems / quizItems / peekItems が変わるたびに再送信。
 */
export function useWidgetData(
  reviewCount: number,
  streak: number,
  totalItems: number,
  quizItems?: { question: string; answer: string }[],
  peekItems?: FlashcardPeekItem[]
): void {
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    updateWidgetData(reviewCount, streak, totalItems);
  }, [reviewCount, streak, totalItems]);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    if (!quizItems) return;
    updateWidgetQuizData(quizItems);
  }, [quizItems]);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    if (!peekItems) return;
    updateFlashcardPeekData(peekItems);
  }, [peekItems]);
}
