import { useEffect } from 'react';
import { Platform } from 'react-native';

// Expo Go / web ではネイティブモジュールが存在しないのでフォールバック
let updateWidgetData: (reviewCount: number, streak: number, totalItems: number) => void = () => {};

if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bridge = require('recall-widget-bridge');
    updateWidgetData = bridge.updateWidgetData;
  } catch {
    // Expo Go など、ネイティブモジュール未ビルド環境では無視
  }
}

/**
 * ホーム画面のデータが揃ったタイミングで iOS ウィジェットへ同期する。
 * reviewCount / streak / totalItems が変わるたびに再送信。
 */
export function useWidgetData(
  reviewCount: number,
  streak: number,
  totalItems: number
): void {
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    updateWidgetData(reviewCount, streak, totalItems);
  }, [reviewCount, streak, totalItems]);
}
