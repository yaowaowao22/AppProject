import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

// ネイティブモジュール（iOS のみ）
const NativeModule = Platform.OS === 'ios'
  ? (() => { try { return requireNativeModule('RecallWidgetBridge'); } catch { return null; } })()
  : null;

/**
 * ウィジェットに表示するデータを App Group UserDefaults へ書き込む。
 * WidgetCenter のタイムラインリロードも行う。
 * iOS 以外・Expo Go では何もしない。
 */
export function updateWidgetData(
  reviewCount: number,
  streak: number,
  totalItems: number
): void {
  NativeModule?.updateWidgetData(reviewCount, streak, totalItems);
}

/**
 * ウィジェットに表示するQ&Aデータを App Group UserDefaults へ書き込む。
 * WidgetCenter のタイムラインリロードも行う。
 * iOS 以外・Expo Go では何もしない。
 */
export function updateWidgetQuizData(
  items: { question: string; answer: string }[]
): void {
  NativeModule?.updateWidgetQuizData(items);
}

/**
 * Flashcard Peek ウィジェット用データを App Group UserDefaults へ書き込む。
 * 穴埋めヒント付きの復習カードデータ（最大5件）。
 * iOS 以外・Expo Go では何もしない。
 */
export function updateFlashcardPeekData(
  items: { id: number; question: string; hintAnswer: string }[]
): void {
  NativeModule?.updateFlashcardPeekData(items);
}
