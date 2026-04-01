// ============================================================
// QuizScreen - クローズ削除クイズ（マルチアイテム対応）
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
  Modal,
  Linking,
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
import { Ionicons } from '@expo/vector-icons';
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

  const sentences = content.split(/([。.！!？?])/);
  if (sentences.length > 0) {
    const first = sentences[0];
    const keywordMatch = first.match(/[：:→]\s*(.+)$/);
    if (keywordMatch) {
      const idx = content.indexOf(keywordMatch[0]);
      const prefix = content.slice(0, idx + 1);
      const keyword = keywordMatch[1];
      const rest = content.slice(idx + keywordMatch[0].length);
      return [
        { text: prefix + ' ', isBlank: false },
        { text: keyword, isBlank: true },
        ...(rest ? [{ text: rest, isBlank: false }] : []),
      ];
    }
  }

  return [{ text: content, isBlank: true }];
}

// ---- コンポーネント ----------------------------------------------

export function QuizScreen({ navigation, route }: Props) {
  const { itemIds } = route.params;
  const { db, isReady } = useDatabase();
  const { colors, isDark } = useTheme();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewable, setReviewable] = useState<Awaited<ReturnType<typeof getItemById>>>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [aiModalVisible, setAIModalVisible] = useState(false);

  const flip = useSharedValue(0);
  const lift = useSharedValue(0);

  // アイテム読み込み（currentIndex が変わるたびに実行）
  useEffect(() => {
    if (!db || !isReady) return;
    if (itemIds.length === 0) {
      setIsComplete(true);
      setLoading(false);
      return;
    }
    if (isComplete) return;

    flip.value = 0;
    lift.value = 0;
    setRevealed(false);
    setLoading(true);

    (async () => {
      try {
        const item = await getItemById(db, itemIds[currentIndex]);
        setReviewable(item);
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, isReady, currentIndex, itemIds]);

  // ヘッダー設定
  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'クイズ',
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
      { rotateY: `${interpolate(flip.value, [0, 0.5], [0, 90])}deg` },
      { scale: interpolate(lift.value, [0, 0.5, 1], [1, 1.02, 1]) },
    ],
    opacity: interpolate(flip.value, [0.3, 0.5], [1, 0]),
  }));

  const answerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(flip.value, [0.5, 1], [-90, 0])}deg` },
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
      if (currentIndex + 1 >= itemIds.length) {
        setIsComplete(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [db, reviewable, currentIndex, itemIds.length]
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
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Text style={styles.doneEmoji}>✅</Text>
          <Text style={[styles.doneTitle, { color: colors.label }]}>クイズ完了！</Text>
          {itemIds.length > 0 && (
            <Text style={[styles.doneSubtitle, { color: colors.labelSecondary }]}>
              {itemIds.length}問に答えました
            </Text>
          )}
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

  const cardShadowBase = {
    shadowColor: colors.cardShadowColor,
    shadowOffset: { width: 0, height: 4 },
    backgroundColor: colors.card,
  };

  const progressRatio = currentIndex / itemIds.length;
  const sourceUrl = reviewable.item.source_url;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* ── 共通ヘッダー: プログレスセクション ── */}
      <View style={styles.progressSection}>
        <View style={[styles.progressTrack, { backgroundColor: colors.backgroundSecondary }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.accent, width: `${progressRatio * 100}%` },
            ]}
          />
        </View>
        <Text style={[styles.progressCount, { color: colors.labelSecondary }]}>
          {currentIndex + 1} / {itemIds.length}
        </Text>
      </View>

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
            {/* 問題面 */}
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
                          { color: colors.accent, borderBottomColor: colors.accent },
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
                <View style={[styles.revealDot, { backgroundColor: colors.accent, opacity: 0.4 }]} />
                <View style={[styles.revealDot, { backgroundColor: colors.accent, opacity: 0.2 }]} />
                <Text style={[styles.revealHint, { color: colors.labelTertiary }]}>
                  タップして答えを確認
                </Text>
              </View>
            </Animated.View>

            {/* 答え面 */}
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

            {/* ── AI深堀りボタン ── */}
            <Pressable
              style={[styles.aiButton, { borderColor: colors.accent + '40' }]}
              onPress={() => setAIModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="AI深掘り"
            >
              <Ionicons name="sparkles-outline" size={15} color={colors.accent} />
              <Text style={[styles.aiButtonText, { color: colors.accent }]}>AI深掘り</Text>
            </Pressable>
          </>
        ) : (
          <Text style={[styles.rateHint, { color: colors.labelTertiary }]}>
            答えを確認してから自己評価してください
          </Text>
        )}
      </View>

      {/* ── AI深堀りモーダル ── */}
      <Modal
        visible={aiModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAIModalVisible(false)}
      >
        <View style={[styles.aiModal, { backgroundColor: colors.background }]}>
          {/* モーダルヘッダー */}
          <View style={[styles.aiModalHeader, { borderBottomColor: colors.separator }]}>
            <View style={styles.aiModalTitleRow}>
              <Ionicons name="sparkles" size={18} color={colors.accent} />
              <Text style={[styles.aiModalTitle, { color: colors.label }]}>AI深掘り</Text>
            </View>
            <Pressable
              onPress={() => setAIModalVisible(false)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="閉じる"
            >
              <Ionicons name="close-circle" size={26} color={colors.labelTertiary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.aiModalScroll}
            contentContainerStyle={styles.aiModalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* フルコンテンツ */}
            <Text style={[styles.aiSectionLabel, { color: colors.labelTertiary }]}>
              フルコンテンツ
            </Text>
            <View style={[styles.aiContentBox, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.aiContentText, { color: colors.label }]}>
                {reviewable.item.content}
              </Text>
            </View>

            {/* ソースURL */}
            {sourceUrl ? (
              <>
                <Text style={[styles.aiSectionLabel, { color: colors.labelTertiary }]}>
                  ソースURL
                </Text>
                <Pressable
                  style={[styles.aiLinkBox, { backgroundColor: colors.backgroundSecondary }]}
                  onPress={() => Linking.openURL(sourceUrl)}
                  accessibilityRole="link"
                >
                  <Ionicons name="link-outline" size={15} color={colors.accent} />
                  <Text
                    style={[styles.aiLinkText, { color: colors.accent }]}
                    numberOfLines={2}
                  >
                    {sourceUrl}
                  </Text>
                  <Ionicons name="open-outline" size={15} color={colors.labelTertiary} />
                </Pressable>
              </>
            ) : null}

            {/* 近日公開バナー */}
            <View style={[styles.aiCtaBanner, { backgroundColor: colors.accent + '12' }]}>
              <Ionicons name="construct-outline" size={18} color={colors.accent} />
              <Text style={[styles.aiCtaText, { color: colors.labelSecondary }]}>
                AIによる詳細解析・追加Q&A生成機能は近日公開予定です
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
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

  // ── 共通ヘッダー: プログレス ──
  progressSection: {
    marginHorizontal: Spacing.m,
    marginTop: Spacing.s,
    gap: Spacing.xs,
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  progressCount: {
    ...TypeScale.caption1,
    textAlign: 'right',
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

  // AI深堀りボタン
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    alignSelf: 'center',
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  aiButtonText: {
    ...TypeScale.footnote,
    fontWeight: '600',
  },

  // 完了
  doneEmoji: { fontSize: 56 },
  doneTitle: { ...TypeScale.title2, textAlign: 'center' },
  doneSubtitle: { ...TypeScale.body, textAlign: 'center' },
  closeButton: {
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.m,
    marginTop: Spacing.l,
  },
  closeButtonText: { ...TypeScale.headline, color: '#FFFFFF' },
  emptyText: { ...TypeScale.body, textAlign: 'center' },

  // ── AI深堀りモーダル ──
  aiModal: {
    flex: 1,
  },
  aiModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  aiModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  aiModalTitle: {
    ...TypeScale.headline,
  },
  aiModalScroll: { flex: 1 },
  aiModalContent: {
    padding: Spacing.l,
    gap: Spacing.m,
    paddingBottom: Spacing.xxl,
  },
  aiSectionLabel: {
    ...TypeScale.caption1,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: -Spacing.xs,
  },
  aiContentBox: {
    borderRadius: Radius.m,
    padding: Spacing.m,
  },
  aiContentText: {
    ...TypeScale.bodyJA,
    lineHeight: 26,
  },
  aiLinkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.m,
    padding: Spacing.m,
  },
  aiLinkText: {
    ...TypeScale.footnote,
    flex: 1,
    textDecorationLine: 'underline',
  },
  aiCtaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    borderRadius: Radius.m,
    padding: Spacing.m,
    marginTop: Spacing.s,
  },
  aiCtaText: {
    ...TypeScale.footnote,
    flex: 1,
    lineHeight: 18,
  },
});
