// ============================================================
// ReviewScreen - フルスクリーンモーダル復習画面
// カードフリップ → 評価ボタン → SM-2更新 → 次のカード
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDatabase } from '../../hooks/useDatabase';
import {
  getDueItems,
  submitReviewRating,
  type ReviewableItem,
} from '../../db/reviewRepository';
import { SIMPLE_RATINGS } from '../../sm2/algorithm';
import type { SimpleRating } from '../../sm2/algorithm';
import { ReviewCard } from '../../components/ReviewCard';
import { RatingButtons } from '../../components/RatingButtons';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import type { ReviewStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ReviewStackParamList, 'Review'>;

export function ReviewScreen({ navigation }: Props) {
  const { db, isReady } = useDatabase();
  const { colors } = useTheme();

  const [items, setItems] = useState<ReviewableItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !isReady) return;
    (async () => {
      try {
        const due = await getDueItems(db);
        setItems(due);
        if (due.length === 0) setIsComplete(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [db, isReady]);

  // ヘッダーオプションをナビゲーションに反映
  useEffect(() => {
    navigation.setOptions({
      headerTitle:
        !loading && !isComplete && items.length > 0
          ? `${currentIndex + 1} / ${items.length}`
          : '復習',
      headerRight: () => (
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="閉じる"
          hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
        >
          <Text style={[TypeScale.body, { color: colors.accent }]}>閉じる</Text>
        </Pressable>
      ),
    });
  }, [navigation, colors, currentIndex, items.length, isComplete, loading]);

  const currentItem = items[currentIndex];

  const handleRate = useCallback(
    async (rating: SimpleRating) => {
      if (!db || !currentItem) return;

      const quality = SIMPLE_RATINGS[rating];
      const review = currentItem.item.review!;

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
            <Text style={[styles.completeSubtitle, { color: colors.labelSecondary }]}>
              {completedCount}件の復習を完了しました
            </Text>
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

  const progressRatio = currentIndex / items.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* プログレスバー */}
      <View style={[styles.progressTrack, { backgroundColor: colors.backgroundSecondary }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.accent,
              width: `${progressRatio * 100}%`,
            },
          ]}
        />
      </View>

      {/* カードエリア */}
      <View style={styles.cardArea}>
        <ReviewCard
          key={currentIndex}
          title={currentItem.item.title}
          content={currentItem.item.content}
          onFlip={() => setIsCardFlipped(true)}
        />
      </View>

      {/* 評価エリア（カードをめくった後に表示） */}
      <View style={styles.ratingArea}>
        {isCardFlipped ? (
          <RatingButtons onRate={handleRate} />
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

  // プログレスバー
  progressTrack: {
    height: 4,
    marginHorizontal: Spacing.m,
    marginTop: Spacing.xs,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
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
});
