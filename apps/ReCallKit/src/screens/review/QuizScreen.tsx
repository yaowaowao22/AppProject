// ============================================================
// QuizScreen - クローズ削除クイズ
// {{word}} 記法で空欄を定義 → タップで答えを表示 → 4段階評価
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDatabase } from '../../hooks/useDatabase';
import { getItemById, submitReviewRating } from '../../db/reviewRepository';
import { SIMPLE_RATINGS } from '../../sm2/algorithm';
import type { SimpleRating } from '../../sm2/algorithm';
import { RatingButtons } from '../../components/RatingButtons';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { SystemColors } from '../../theme/colors';
import type { ReviewStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ReviewStackParamList, 'Quiz'>;

// ---- クローズ削除パーサー ----------------------------------------

interface ClozeChunk {
  text: string;
  isBlank: boolean; // true = 空欄（答え）
}

/**
 * コンテンツを解析してクローズチャンクに変換
 * 1. {{word}} 記法を優先
 * 2. 記法なし → コンテンツ先頭文の末尾句を自動ブランク化
 */
function parseCloze(content: string): ClozeChunk[] {
  const EXPLICIT = /\{\{(.+?)\}\}/g;

  if (EXPLICIT.test(content)) {
    // 記法あり: 分割してチャンク化
    EXPLICIT.lastIndex = 0;
    const chunks: ClozeChunk[] = [];
    let cursor = 0;
    let match: RegExpExecArray | null;

    while ((match = EXPLICIT.exec(content)) !== null) {
      if (match.index > cursor) {
        chunks.push({ text: content.slice(cursor, match.index), isBlank: false });
      }
      chunks.push({ text: match[1], isBlank: true });
      cursor = match.index + match[0].length;
    }
    if (cursor < content.length) {
      chunks.push({ text: content.slice(cursor), isBlank: false });
    }
    return chunks;
  }

  // 記法なし: 先頭センテンス末尾の重要語をブランク化
  const sentences = content.split(/([。.！!？?])/);
  if (sentences.length > 0) {
    const first = sentences[0];
    // 「：」「:」「→」の後ろをブランクとして扱う
    const keywordMatch = first.match(/[：:→]\s*(.+)$/);
    if (keywordMatch) {
      const idx = content.indexOf(keywordMatch[0]);
      const prefix = content.slice(0, idx + 1); // 記号まで含む
      const keyword = keywordMatch[1];
      const rest = content.slice(idx + keywordMatch[0].length);
      return [
        { text: prefix + ' ', isBlank: false },
        { text: keyword, isBlank: true },
        ...(rest ? [{ text: rest, isBlank: false }] : []),
      ];
    }
  }

  // フォールバック: コンテンツ全体を答えにする
  return [{ text: content, isBlank: true }];
}

// ---- コンポーネント ----------------------------------------------

export function QuizScreen({ navigation, route }: Props) {
  const { itemId } = route.params;
  const { db, isReady } = useDatabase();
  const { colors, isDark } = useTheme();

  const [reviewable, setReviewable] = useState<Awaited<ReturnType<typeof getItemById>>>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);

  // フリップ進行: 0=問題, 1=答え
  const flip = useSharedValue(0);
  const lift = useSharedValue(0);

  useEffect(() => {
    if (!db || !isReady) return;
    (async () => {
      try {
        const item = await getItemById(db, itemId);
        setReviewable(item);
      } finally {
        setLoading(false);
      }
    })();
  }, [db, isReady, itemId]);

  // ヘッダーオプションをナビゲーションに反映
  useEffect(() => {
    navigation.setOptions({
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
  }, [navigation, colors]);

  const chunks = reviewable ? parseCloze(reviewable.item.content) : [];

  // ---- フリップアニメーション ----
  const questionStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      {
        rotateY: `${interpolate(flip.value, [0, 0.5], [0, 90])}deg`,
      },
      { scale: interpolate(lift.value, [0, 0.5, 1], [1, 1.02, 1]) },
    ],
    opacity: interpolate(flip.value, [0.3, 0.5], [1, 0]),
  }));

  const answerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      {
        rotateY: `${interpolate(flip.value, [0.5, 1], [-90, 0])}deg`,
      },
      { scale: interpolate(lift.value, [0, 0.5, 1], [1, 1.02, 1]) },
    ],
    opacity: interpolate(flip.value, [0.5, 0.68], [0, 1]),
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: isDark
      ? 0
      : interpolate(lift.value, [0, 0.5, 1], [0.1, 0.22, 0.1]),
    shadowRadius: interpolate(lift.value, [0, 0.5, 1], [8, 20, 8]),
    elevation: interpolate(lift.value, [0, 0.5, 1], [3, 9, 3]),
  }));

  const handleReveal = useCallback(async () => {
    if (revealed) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const EASING = Easing.out(Easing.cubic);

    lift.value = withTiming(1, { duration: 320, easing: EASING }, () => {
      lift.value = withTiming(0, { duration: 200, easing: EASING });
    });
    flip.value = withTiming(1, { duration: 480, easing: EASING }, (finished) => {
      if (finished) runOnJS(setRevealed)(true);
    });
  }, [revealed, flip, lift]);

  const handleRate = useCallback(
    async (rating: SimpleRating) => {
      if (!db || !reviewable) return;
      const quality = SIMPLE_RATINGS[rating];
      const review = reviewable.item.review!;
      await submitReviewRating(
        db,
        reviewable.reviewId,
        {
          repetitions: review.repetitions,
          easiness_factor: review.easiness_factor,
          interval_days: review.interval_days,
        },
        quality
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    },
    [db, reviewable]
  );

  // ---- ローディング ----
  if (!isReady || loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  // ---- アイテム未発見 ----
  if (!reviewable) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.labelSecondary }]}>
            アイテムが見つかりません
          </Text>
          <Pressable
            style={[styles.closeButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeButtonText}>閉じる</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ---- 完了画面 ----
  if (done) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Text style={styles.doneEmoji}>✅</Text>
          <Text style={[styles.doneTitle, { color: colors.label }]}>評価完了！</Text>
          <Pressable
            style={[styles.closeButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
          >
            <Text style={styles.closeButtonText}>閉じる</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const cardShadowBase = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    backgroundColor: colors.card,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* タイトル */}
      <Text
        style={[styles.itemTitle, { color: colors.labelSecondary }]}
        numberOfLines={2}
      >
        {reviewable.item.title}
      </Text>

      {/* カードエリア */}
      <View style={styles.cardArea}>
        <Pressable
          onPress={handleReveal}
          disabled={revealed}
          accessibilityRole="button"
          accessibilityLabel={revealed ? undefined : '答えを表示'}
        >
          <Animated.View style={[styles.cardWrapper, shadowStyle]}>
            {/* 問題面: ブランク埋め込みテキスト */}
            <Animated.View style={[styles.card, cardShadowBase, questionStyle]}>
              <Text style={[styles.sectionLabel, { color: colors.labelTertiary }]}>
                QUESTION
              </Text>
              <ScrollView style={styles.clozeScroll} showsVerticalScrollIndicator={false}>
                <Text style={[styles.clozeText, { color: colors.label }]}>
                  {chunks.map((chunk, i) =>
                    chunk.isBlank ? (
                      <Text
                        key={i}
                        style={[
                          styles.blank,
                          {
                            color: colors.accent,
                            borderBottomColor: colors.accent,
                          },
                        ]}
                      >
                        {'　　　　'}
                      </Text>
                    ) : (
                      <Text key={i}>{chunk.text}</Text>
                    )
                  )}
                </Text>
              </ScrollView>
              <View style={styles.revealRow}>
                <View style={[styles.revealDot, { backgroundColor: colors.accent }]} />
                <View
                  style={[styles.revealDot, { backgroundColor: colors.accent, opacity: 0.4 }]}
                />
                <View
                  style={[styles.revealDot, { backgroundColor: colors.accent, opacity: 0.2 }]}
                />
                <Text style={[styles.revealHint, { color: colors.labelTertiary }]}>
                  タップして答えを確認
                </Text>
              </View>
            </Animated.View>

            {/* 答え面: 答え強調表示 */}
            <Animated.View
              style={[styles.card, cardShadowBase, styles.absoluteFill, answerStyle]}
            >
              <Text style={[styles.sectionLabel, { color: colors.labelTertiary }]}>
                ANSWER
              </Text>
              <ScrollView style={styles.clozeScroll} showsVerticalScrollIndicator={false}>
                <Text style={[styles.clozeText, { color: colors.label }]}>
                  {chunks.map((chunk, i) =>
                    chunk.isBlank ? (
                      <Text
                        key={i}
                        style={[styles.answerHighlight, { color: SystemColors.green }]}
                      >
                        {chunk.text}
                      </Text>
                    ) : (
                      <Text key={i}>{chunk.text}</Text>
                    )
                  )}
                </Text>
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </Pressable>
      </View>

      {/* 評価エリア */}
      <View style={styles.ratingArea}>
        {revealed ? (
          <>
            <Text style={[styles.rateHint, { color: colors.labelSecondary }]}>
              どのくらい思い出せましたか？
            </Text>
            <RatingButtons onRate={handleRate} />
          </>
        ) : (
          <Text style={[styles.rateHint, { color: colors.labelTertiary }]}>
            答えを確認してから自己評価してください
          </Text>
        )}
      </View>
    </View>
  );
}

const CARD_HEIGHT = 300;

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.m,
    paddingHorizontal: Spacing.xl,
  },

  // タイトル
  itemTitle: {
    ...TypeScale.subheadline,
    paddingHorizontal: Spacing.m,
    marginTop: Spacing.xs,
    marginBottom: Spacing.s,
  },

  // カード
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.m,
  },
  cardWrapper: {
    height: CARD_HEIGHT,
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: Radius.l,
    padding: Spacing.l,
    justifyContent: 'space-between',
  },
  absoluteFill: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  sectionLabel: {
    ...TypeScale.caption1,
    letterSpacing: 1.2,
    marginBottom: Spacing.s,
  },
  clozeScroll: { flex: 1 },
  clozeText: {
    ...TypeScale.bodyJA,
    lineHeight: 26,
  },
  blank: {
    fontWeight: '700',
    textDecorationLine: 'underline',
    letterSpacing: 4,
  },
  answerHighlight: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  revealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.s,
  },
  revealDot: { width: 5, height: 5, borderRadius: 2.5 },
  revealHint: {
    ...TypeScale.footnote,
    marginLeft: Spacing.xs,
  },

  // 評価エリア
  ratingArea: {
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.s,
    minHeight: 120,
    justifyContent: 'center',
    gap: Spacing.s,
  },
  rateHint: {
    ...TypeScale.footnote,
    textAlign: 'center',
    paddingHorizontal: Spacing.l,
  },

  // 完了
  doneEmoji: { fontSize: 56 },
  doneTitle: { ...TypeScale.title2, textAlign: 'center' },
  closeButton: {
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.m,
    marginTop: Spacing.l,
  },
  closeButtonText: { ...TypeScale.headline, color: '#FFFFFF' },
  emptyText: { ...TypeScale.body, textAlign: 'center' },
});
