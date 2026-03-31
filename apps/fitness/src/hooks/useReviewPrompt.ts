import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config';
import type { UsageStats } from './useUsageStats';

// ── 定数 ──────────────────────────────────────────────────────────────────────

/** レビューリクエストを表示するワークアウト完了回数の閾値 */
const REVIEW_WORKOUT_THRESHOLD = 3;
/** レビューリクエストを表示する起動日数の閾値 */
const REVIEW_LAUNCH_DAYS_THRESHOLD = 3;

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * ワークアウト完了画面で呼び出すストアレビュー訴求フック。
 *
 * - totalWorkouts >= 3 かつ launchDays >= 3 を満たした最初のタイミングで
 *   StoreReview.requestReview() を呼び出す。
 * - 一度リクエスト済みなら再度リクエストしない。
 * - expo-store-review が未インストール / Native モジュール未対応環境では静かにスキップ。
 *
 * @param stats useUsageStats の戻り値を渡す
 */
export function useReviewPrompt(stats: UsageStats): void {
  const { totalWorkouts, launchDays } = stats;

  useEffect(() => {
    if (
      totalWorkouts < REVIEW_WORKOUT_THRESHOLD ||
      launchDays < REVIEW_LAUNCH_DAYS_THRESHOLD
    ) {
      return;
    }

    let cancelled = false;

    async function maybeRequest() {
      try {
        // 既にリクエスト済みかチェック
        const alreadyRequested = await AsyncStorage.getItem(
          STORAGE_KEYS.REVIEW_REQUESTED,
        );
        if (alreadyRequested === 'true' || cancelled) return;

        // expo-store-review を動的 require（未インストール時は安全にスキップ）
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const StoreReview = require('expo-store-review');
        const isAvailable = await StoreReview.isAvailableAsync();
        if (!isAvailable || cancelled) return;

        await StoreReview.requestReview();
        await AsyncStorage.setItem(STORAGE_KEYS.REVIEW_REQUESTED, 'true');
      } catch (e) {
        // エラーは静かに無視（レビュー促進の失敗はユーザー体験に影響しない）
        console.warn('[useReviewPrompt]', e);
      }
    }

    // マウント直後に少し遅延させて完了アニメーションと競合しないようにする
    const timer = setTimeout(maybeRequest, 1500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [totalWorkouts, launchDays]);
}
