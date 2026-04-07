// ============================================================
// ReviewScreen - フルスクリーンモーダル復習画面
// カードフリップ → 評価ボタン → SM-2更新 → 次のカード
// スワイプ評価・背景フラッシュ・評価内訳サマリー対応
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDatabase } from '../../hooks/useDatabase';
import {
  getDueItems,
  getAllReviewableItems,
  submitReviewRating,
  type ReviewableItem,
} from '../../db/reviewRepository';
import { SIMPLE_RATINGS } from '../../sm2/algorithm';
import type { SimpleRating } from '../../sm2/algorithm';
import { ReviewCard } from '../../components/ReviewCard';
import { RatingButtons } from '../../components/RatingButtons';
import { AIDeepDiveButtons } from '../../components/AIDeepDiveButtons';
import { ReviewProgressBar } from '../../components/ReviewProgressBar';
import { useCloseHeader } from '../../hooks/useCloseHeader';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import type { ReviewStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ReviewStackParamList, 'ReviewSession'>;

// 評価ごとのフラッシュカラー
const RATING_COLORS: Record<SimpleRating, string> = {
  again:   '#FF3B30',
  hard:    '#FF9500',
  good:    '#007AFF',
  perfect: '#34C759',
};

// 完了画面の内訳表示順
const SUMMARY_ITEMS: { key: SimpleRating; label: string }[] = [
  { key: 'perfect', label: '簡単' },
  { key: 'good',    label: '良かった' },
  { key: 'hard',    label: '難しかった' },
  { key: 'again',   label: 'もう一度' },
];

export function ReviewScreen({ navigation, route }: Props) {
  const { db, isReady } = useDatabase();
  const { colors } = useTheme();
  const reviewIds = route.params?.reviewIds;
  const forceAll = route.params?.forceAll;

  const [items, setItems] = useState<ReviewableItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ratingCounts, setRatingCounts] = useState<Record<string, number>>({
    again: 0, hard: 0, good: 0, perfect: 0,
  });

  // フラッシュオーバーレイ
  const flashOpacity = useSharedValue(0);
  const [flashColor, setFlashColor] = useState('#007AFF');
  const flashAnimatedStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  useEffect(() => {
    if (!db || !isReady) return;
    (async () => {
      try {
        // reviewIds 指定時はグループ内アイテムが期限外でも取得できるよう全件対象にする
        const allItems = (forceAll || (reviewIds && reviewIds.length > 0))
          ? await getAllReviewableItems(db)
          : await getDueItems(db);
        const filtered = reviewIds && reviewIds.length > 0
          ? allItems.filter((ri) => reviewIds.includes(ri.item.id))
          : allItems;
        setItems(filtered);
        if (filtered.length === 0) setIsComplete(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [db, isReady]);

  useCloseHeader(navigation, '復習');

  const currentItem = items[currentIndex];

  const handleRate = useCallback(
    async (rating: SimpleRating) => {
      if (!db || !currentItem || !currentItem.item.review) return;

      // 背景フラッシュ
      setFlashColor(RATING_COLORS[rating]);
      flashOpacity.value = withSequence(
        withTiming(0.15, { duration: 100 }),
        withTiming(0, { duration: 200 })
      );

      // 評価カウントアップ
      setRatingCounts((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));

      const quality = SIMPLE_RATINGS[rating];
      const review = currentItem.item.review;

      await submitReviewRating(
        db,
        currentItem.reviewId,
        {
          repetitions: review.repetitions,
          easiness_factor: review.easiness_factor,
          interval_days: review.interval_days,
        },
        quality
      );

      if (currentIndex + 1 >= items.length) {
        setIsComplete(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
        setIsCardFlipped(false);
      }
    },
    [db, currentItem, currentIndex, items.length]
  );

  // ---- ローディング ----
  if (!isReady || loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  // ---- 完了画面 ----
  if (isComplete) {
    const completedCount = items.length;
    const maxCount = Math.max(...Object.values(ratingCounts), 1);

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.completeContainer}>
          <Text style={styles.completeEmoji}>
            {completedCount > 0 ? '🎉' : '📚'}
          </Text>
          <Text style={[styles.completeTitle, { color: colors.label }]}>
            {completedCount > 0 ? '復習完了！' : '今日の復習はありません'}
          </Text>
          {completedCount > 0 && (
            <>
              <Text style={[styles.completeSubtitle, { color: colors.labelSecondary }]}>
                {completedCount}件の復習を完了しました
              </Text>

              {/* 評価内訳 */}
              <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                {SUMMARY_ITEMS.map(({ key, label }) => {
                  const count = ratingCounts[key] ?? 0;
                  const barWidth = count > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <View key={key} style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: colors.labelSecondary }]}>
                        {label}
                      </Text>
                      <View style={[styles.summaryTrack, { backgroundColor: colors.backgroundSecondary }]}>
                        <View
                          style={[
                            styles.summaryBar,
                            { backgroundColor: RATING_COLORS[key], width: `${barWidth}%` },
                          ]}
                        />
                      </View>
                      <Text style={[styles.summaryCount, { color: colors.label }]}>
                        {count}枚
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
          <Pressable
            style={[styles.doneButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
          >
            <Text style={styles.doneButtonText}>閉じる</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 背景フラッシュオーバーレイ（評価時に一瞬光る） */}
      <Animated.View
        style={[styles.flashOverlay, { backgroundColor: flashColor }, flashAnimatedStyle]}
        pointerEvents="none"
      />

      {/* プログレスセクション（バー + カウンター） */}
      <ReviewProgressBar currentIndex={currentIndex} total={items.length} />

      {/* カードエリア */}
      <View style={styles.cardArea}>
        <ReviewCard
          key={currentIndex}
          title={currentItem.item.title}
          content={currentItem.item.content}
          onFlip={() => setIsCardFlipped(true)}
          isFlipped={isCardFlipped}
          onSwipeRate={handleRate}
        />
      </View>

      {/* 評価エリア（カードをめくった後に表示） */}
      <View style={styles.ratingArea}>
        {isCardFlipped ? (
          <>
            <RatingButtons onRate={handleRate} />
            <AIDeepDiveButtons
              question={currentItem.item.title}
              answer={currentItem.item.content}
            />
          </>
        ) : (
          <Text style={[styles.ratingHint, { color: colors.labelTertiary }]}>
            カードをめくって自己評価してください
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // フラッシュオーバーレイ
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },

  // カードエリア
  cardArea: {
    flex: 1,
    justifyContent: 'center',
  },

  // 評価エリア
  ratingArea: {
    paddingBottom: Spacing.xl,
    minHeight: 120,
    justifyContent: 'center',
    gap: Spacing.s,
  },
  ratingHint: {
    ...TypeScale.footnote,
    textAlign: 'center',
  },

  // 完了画面
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.m,
  },
  completeEmoji: {
    fontSize: 64,
    marginBottom: Spacing.s,
  },
  completeTitle: {
    ...TypeScale.title2,
    textAlign: 'center',
  },
  completeSubtitle: {
    ...TypeScale.body,
    textAlign: 'center',
  },
  doneButton: {
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.m,
    marginTop: Spacing.l,
  },
  doneButtonText: {
    ...TypeScale.headline,
    color: '#FFFFFF',
  },

  // 評価内訳カード
  summaryCard: {
    width: '100%',
    borderRadius: Radius.l,
    padding: Spacing.m,
    gap: Spacing.s,
    marginTop: Spacing.s,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  summaryLabel: {
    ...TypeScale.footnote,
    width: 68,
    textAlign: 'right',
  },
  summaryTrack: {
    flex: 1,
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  summaryBar: {
    height: '100%',
    borderRadius: Radius.full,
    minWidth: 4,
  },
  summaryCount: {
    ...TypeScale.footnote,
    width: 28,
    textAlign: 'right',
  },
});
