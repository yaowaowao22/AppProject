// ============================================================
// ReviewCard - 3Dフリップアニメーション付きレビューカード
// 表面: タイトル / 裏面: タイトル + 内容
// フリップ: Y軸回転 + 浮き上がりスケール + 影深度変化
// スワイプ: 裏面表示時のみ有効 / 方向で評価送信 / 退場アニメーション
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import type { SimpleRating } from '../sm2/algorithm';

interface ReviewCardProps {
  title: string;
  content: string;
  onFlip?: () => void;
  isFlipped?: boolean;
  onSwipeRate?: (rating: SimpleRating) => void;
}

const CARD_HEIGHT = 320;
const FLIP_DURATION = 320; // 表→裏 (ms)
const EASING = Easing.out(Easing.cubic);
const SWIPE_THRESHOLD = 80; // px
const EXIT_DISTANCE = 500; // px
const EXIT_DURATION = 250; // ms

export function ReviewCard({
  title,
  content,
  onFlip,
  isFlipped = false,
  onSwipeRate,
}: ReviewCardProps) {
  const { colors, isDark } = useTheme();
  // 0 = 表, 1 = 裏
  const flip = useSharedValue(0);
  // フリップ中に少し浮き上がる (0 → 1 → 0)
  const lift = useSharedValue(0);

  // スワイプ移動量
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  // 退場アニメーション進捗 (0=通常, 1=退場中)
  const exitProgress = useSharedValue(0);

  // ---- 表面 ----
  // 0→0.5: 0→90deg、0.35→0.5でフェードアウト
  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      {
        rotateY: `${interpolate(
          flip.value,
          [0, 0.5],
          [0, 90],
          Extrapolation.CLAMP
        )}deg`,
      },
      {
        scale: interpolate(lift.value, [0, 0.5, 1], [1, 1.03, 1]),
      },
    ],
    opacity: interpolate(flip.value, [0.32, 0.5], [1, 0], Extrapolation.CLAMP),
  }));

  // ---- 裏面 ----
  // 0.5→1: -90→0deg、0.5→0.65でフェードイン
  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      {
        rotateY: `${interpolate(
          flip.value,
          [0.5, 1],
          [-90, 0],
          Extrapolation.CLAMP
        )}deg`,
      },
      {
        scale: interpolate(lift.value, [0, 0.5, 1], [1, 1.03, 1]),
      },
    ],
    opacity: interpolate(flip.value, [0.5, 0.68], [0, 1], Extrapolation.CLAMP),
  }));

  // ---- 影 (フリップ中に深くなる) ----
  const shadowStyle = useAnimatedStyle(() => {
    const depth = interpolate(lift.value, [0, 0.5, 1], [0, 1, 0]);
    return {
      shadowOpacity: isDark
        ? 0
        : interpolate(depth, [0, 1], [0.1, 0.22]),
      shadowRadius: interpolate(depth, [0, 1], [8, 18]),
      elevation: interpolate(depth, [0, 1], [3, 8]),
    };
  });

  // ---- スワイプ用 wrapper transform ----
  const swipeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateZ: `${translateX.value * 0.05}deg` },
      { scale: interpolate(exitProgress.value, [0, 1], [1, 0.8]) },
    ],
    opacity: interpolate(exitProgress.value, [0, 1], [1, 0]),
  }));

  const handleFlip = async () => {
    if (flip.value > 0) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // 浮き上がりを表→裏の途中でピーク
    lift.value = withSequence(
      withTiming(1, { duration: FLIP_DURATION, easing: EASING }),
      withTiming(0, { duration: FLIP_DURATION * 0.5, easing: EASING })
    );

    flip.value = withTiming(1, { duration: FLIP_DURATION * 1.5, easing: EASING }, (done) => {
      if (done && onFlip) runOnJS(onFlip)();
    });
  };

  // runOnJS 経由で UI スレッドから JS コールバックを呼ぶ
  const callOnSwipeRate = (rating: SimpleRating) => {
    if (onSwipeRate) onSwipeRate(rating);
  };

  const panGesture = Gesture.Pan()
    .enabled(isFlipped)
    .activeOffsetX([-15, 15])
    .activeOffsetY([-15, 15])
    .onUpdate((e) => {
      if (exitProgress.value > 0) return;
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (exitProgress.value > 0) return;

      const absX = Math.abs(e.translationX);
      const absY = Math.abs(e.translationY);

      if (absX >= absY && absX > SWIPE_THRESHOLD) {
        // 左右スワイプ: again / perfect
        const rating: SimpleRating = e.translationX < 0 ? 'again' : 'perfect';
        const targetX = e.translationX < 0 ? -EXIT_DISTANCE : EXIT_DISTANCE;
        exitProgress.value = withTiming(1, { duration: EXIT_DURATION });
        translateX.value = withTiming(targetX, { duration: EXIT_DURATION }, (done) => {
          if (done) runOnJS(callOnSwipeRate)(rating);
        });
        translateY.value = withTiming(0, { duration: EXIT_DURATION });
      } else if (absY > absX && absY > SWIPE_THRESHOLD) {
        // 上下スワイプ: good / hard
        const rating: SimpleRating = e.translationY < 0 ? 'good' : 'hard';
        const targetY = e.translationY < 0 ? -EXIT_DISTANCE : EXIT_DISTANCE;
        exitProgress.value = withTiming(1, { duration: EXIT_DURATION });
        translateX.value = withTiming(0, { duration: EXIT_DURATION });
        translateY.value = withTiming(targetY, { duration: EXIT_DURATION }, (done) => {
          if (done) runOnJS(callOnSwipeRate)(rating);
        });
      } else {
        // 閾値未満: 元の位置に戻す
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardBase = {
    backgroundColor: colors.card,
    shadowColor: colors.cardShadowColor,
    shadowOffset: { width: 0, height: 4 },
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.pressable, swipeStyle]}>
        <Pressable
          onPress={handleFlip}
          accessibilityRole="button"
          accessibilityLabel="カードをめくる"
        >
          <Animated.View style={[styles.wrapper, shadowStyle]}>
            {/* 表面 */}
            <Animated.View style={[styles.card, cardBase, frontStyle]}>
              <View style={styles.cardBody}>
                <Text style={[styles.sectionLabel, { color: colors.labelTertiary }]}>
                  QUESTION
                </Text>
                <Text style={[styles.titleText, { color: colors.label }]} numberOfLines={6}>
                  {title}
                </Text>
              </View>
              <View style={styles.flipHintRow}>
                <View style={[styles.flipDot, { backgroundColor: colors.accent }]} />
                <View style={[styles.flipDot, { backgroundColor: colors.accent, opacity: 0.4 }]} />
                <View style={[styles.flipDot, { backgroundColor: colors.accent, opacity: 0.2 }]} />
                <Text style={[styles.flipHint, { color: colors.labelTertiary }]}>
                  タップしてめくる
                </Text>
              </View>
            </Animated.View>

            {/* 裏面 (絶対位置) */}
            <Animated.View style={[styles.card, cardBase, styles.absoluteFill, backStyle]}>
              <View style={styles.cardBody}>
                <Text style={[styles.sectionLabel, { color: colors.labelTertiary }]}>
                  QUESTION
                </Text>
                <Text
                  style={[styles.titleSmall, { color: colors.labelSecondary }]}
                  numberOfLines={2}
                >
                  {title}
                </Text>
                <View style={[styles.divider, { backgroundColor: colors.separator }]} />
                <Text style={[styles.sectionLabel, { color: colors.labelTertiary }]}>
                  ANSWER
                </Text>
                <Text style={[styles.contentText, { color: colors.label }]} numberOfLines={7}>
                  {content}
                </Text>
              </View>

              {/* スワイプ4方向ヒント */}
              <View style={styles.swipeHintBlock}>
                {/* 上: good */}
                <View style={styles.swipeHintCenter}>
                  <Text style={[styles.swipeArrow, { color: '#007AFF' }]}>↑</Text>
                  <Text style={[styles.swipeLabel, { color: '#007AFF' }]}>良かった</Text>
                </View>
                {/* 左右: again / perfect */}
                <View style={styles.swipeHintSides}>
                  <View style={styles.swipeHintSideItem}>
                    <Text style={[styles.swipeArrow, { color: '#FF3B30' }]}>←</Text>
                    <Text style={[styles.swipeLabel, { color: '#FF3B30' }]}>もう一度</Text>
                  </View>
                  <View style={styles.swipeHintSideItem}>
                    <Text style={[styles.swipeLabel, { color: '#34C759' }]}>簡単</Text>
                    <Text style={[styles.swipeArrow, { color: '#34C759' }]}>→</Text>
                  </View>
                </View>
                {/* 下: hard */}
                <View style={styles.swipeHintCenter}>
                  <Text style={[styles.swipeArrow, { color: '#FF9500' }]}>↓</Text>
                  <Text style={[styles.swipeLabel, { color: '#FF9500' }]}>難しかった</Text>
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginHorizontal: Spacing.m,
  },
  wrapper: {
    height: CARD_HEIGHT,
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: Radius.l,
    paddingVertical: 32,
    paddingHorizontal: Spacing.l,
    justifyContent: 'space-between',
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardBody: {
    flex: 1,
  },
  sectionLabel: {
    ...TypeScale.caption1,
    letterSpacing: 1.2,
    marginBottom: Spacing.xs,
  },
  titleText: {
    ...TypeScale.title2,
    marginTop: Spacing.xs,
  },
  titleSmall: {
    ...TypeScale.headline,
    marginTop: Spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.m,
  },
  contentText: {
    ...TypeScale.bodyJA,
  },
  flipHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  flipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  flipHint: {
    ...TypeScale.footnote,
    marginLeft: Spacing.xs,
  },

  // スワイプヒント（裏面フッター）
  swipeHintBlock: {
    gap: 2,
    paddingTop: Spacing.xs,
    opacity: 0.65,
  },
  swipeHintCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  swipeHintSides: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  swipeHintSideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  swipeArrow: {
    fontSize: 13,
    fontWeight: '600',
  },
  swipeLabel: {
    ...TypeScale.caption1,
    fontWeight: '500',
  },
});
