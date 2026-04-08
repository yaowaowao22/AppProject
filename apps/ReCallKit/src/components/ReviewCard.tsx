// ============================================================
// ReviewCard - 3Dフリップアニメーション付きレビューカード
// Indigo Pro: 2px角丸 + オフセット影 + FadeSeparator
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
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
import { SystemColors } from '../theme/colors';
import { FadeSeparator } from './FadeSeparator';
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
const EXIT_DURATION = 300; // ms
const SWIPE_ROTATE_FACTOR = 0.08; // deg per px

// オフセット影
const cardOffsetShadow = Platform.select({
  ios: {
    shadowColor: '#E5E5E5',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  default: {
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderRightColor: '#E5E5E5',
    borderBottomColor: '#E5E5E5',
  },
});

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
  const swipeStyle = useAnimatedStyle(() => {
    const isExiting = exitProgress.value > 0;
    const swipeScale = isExiting
      ? interpolate(exitProgress.value, [0, 1], [1, 0.85])
      : interpolate(Math.abs(translateX.value), [0, SWIPE_THRESHOLD], [1, 1.03], Extrapolation.CLAMP);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${translateX.value * SWIPE_ROTATE_FACTOR}deg` },
        { scale: swipeScale },
      ],
      opacity: interpolate(exitProgress.value, [0, 0.6, 1], [1, 0.8, 0]),
    };
  });

  // ---- スワイプ方向ティントオーバーレイ ----
  const swipeTintStyle = useAnimatedStyle(() => {
    const absX = Math.abs(translateX.value);
    const tintOpacity = interpolate(absX, [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD * 1.5], [0, 0, 0.18], Extrapolation.CLAMP);
    const isRight = translateX.value > 0;
    return {
      backgroundColor: isRight ? '#34C759' : '#FF3B30',
      opacity: tintOpacity,
    };
  });

  // ---- スワイプスタンプ（覚えた!/覚えてない） ----
  const stampRememberedStyle = useAnimatedStyle(() => {
    const progress = interpolate(translateX.value, [SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: progress,
      transform: [
        { scale: interpolate(progress, [0, 1], [0.5, 1]) },
        { rotateZ: '-15deg' },
      ],
    };
  });
  const stampForgotStyle = useAnimatedStyle(() => {
    const progress = interpolate(translateX.value, [-SWIPE_THRESHOLD * 0.5, -SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: progress,
      transform: [
        { scale: interpolate(progress, [0, 1], [0.5, 1]) },
        { rotateZ: '15deg' },
      ],
    };
  });

  const handleFlip = async () => {
    if (flip.value > 0) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    lift.value = withSequence(
      withTiming(1, { duration: FLIP_DURATION, easing: EASING }),
      withTiming(0, { duration: FLIP_DURATION * 0.5, easing: EASING })
    );

    flip.value = withTiming(1, { duration: FLIP_DURATION * 1.5, easing: EASING }, (done) => {
      if (done && onFlip) runOnJS(onFlip)();
    });
  };

  const callOnSwipeRate = (rating: SimpleRating) => {
    if (onSwipeRate) onSwipeRate(rating);
  };

  const triggerThresholdHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  const crossedThreshold = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .enabled(isFlipped)
    .activeOffsetX([-15, 15])
    .activeOffsetY([-15, 15])
    .onStart(() => {
      crossedThreshold.value = 0;
    })
    .onUpdate((e) => {
      if (exitProgress.value > 0) return;
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      const absX = Math.abs(e.translationX);
      if (absX >= SWIPE_THRESHOLD && crossedThreshold.value === 0) {
        crossedThreshold.value = 1;
        runOnJS(triggerThresholdHaptic)();
      } else if (absX < SWIPE_THRESHOLD * 0.7 && crossedThreshold.value === 1) {
        crossedThreshold.value = 0;
      }
    })
    .onEnd((e) => {
      if (exitProgress.value > 0) return;

      const absX = Math.abs(e.translationX);

      if (absX > SWIPE_THRESHOLD) {
        const rating: SimpleRating = e.translationX < 0 ? 'forgot' : 'remembered';
        const targetX = e.translationX < 0 ? -EXIT_DISTANCE : EXIT_DISTANCE;
        const targetY = e.translationY * 0.3;
        exitProgress.value = withTiming(1, { duration: EXIT_DURATION, easing: Easing.in(Easing.cubic) });
        translateX.value = withTiming(targetX, { duration: EXIT_DURATION, easing: Easing.in(Easing.cubic) }, (done) => {
          if (done) runOnJS(callOnSwipeRate)(rating);
        });
        translateY.value = withTiming(targetY, { duration: EXIT_DURATION });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardBase = {
    backgroundColor: colors.card,
    borderColor: colors.separator,
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
            <Animated.View
              style={[
                styles.card,
                cardBase,
                !isDark && cardOffsetShadow,
                frontStyle,
              ]}
            >
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
            <Animated.View
              style={[
                styles.card,
                cardBase,
                !isDark && cardOffsetShadow,
                styles.absoluteFill,
                backStyle,
              ]}
            >
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
                <FadeSeparator style={{ marginVertical: Spacing.m, marginHorizontal: 0 }} />
                <Text style={[styles.sectionLabel, { color: colors.labelTertiary }]}>
                  ANSWER
                </Text>
                <Text style={[styles.contentText, { color: colors.label }]} numberOfLines={7}>
                  {content}
                </Text>
              </View>

              {/* スワイプ方向ティントオーバーレイ */}
              <Animated.View
                style={[styles.absoluteFill, { borderRadius: Radius.xs }, swipeTintStyle]}
                pointerEvents="none"
              />

              {/* スワイプスタンプ: 覚えた！ */}
              <Animated.View style={[styles.stampContainer, styles.stampLeft, stampRememberedStyle]} pointerEvents="none">
                <View style={[styles.stampBorder, { borderColor: '#34C759' }]}>
                  <Text style={[styles.stampText, { color: '#34C759' }]}>覚えた！</Text>
                </View>
              </Animated.View>

              {/* スワイプスタンプ: 覚えてない */}
              <Animated.View style={[styles.stampContainer, styles.stampRight, stampForgotStyle]} pointerEvents="none">
                <View style={[styles.stampBorder, { borderColor: '#FF3B30' }]}>
                  <Text style={[styles.stampText, { color: '#FF3B30' }]}>覚えてない</Text>
                </View>
              </Animated.View>

              {/* スワイプ2方向ヒント */}
              <View style={styles.swipeHintBlock}>
                <View style={styles.swipeHintSides}>
                  <View style={styles.swipeHintSideItem}>
                    <Text style={[styles.swipeArrow, { color: SystemColors.red }]}>←</Text>
                    <Text style={[styles.swipeLabel, { color: SystemColors.red }]}>覚えてない</Text>
                  </View>
                  <View style={styles.swipeHintSideItem}>
                    <Text style={[styles.swipeLabel, { color: SystemColors.green }]}>覚えた！</Text>
                    <Text style={[styles.swipeArrow, { color: SystemColors.green }]}>→</Text>
                  </View>
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
    borderRadius: Radius.xs,
    borderWidth: 1,
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
    lineHeight: 33,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  titleSmall: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.22,
    marginTop: Spacing.xs,
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

  // スワイプスタンプ
  stampContainer: {
    position: 'absolute',
    top: 40,
    zIndex: 10,
  },
  stampLeft: {
    left: 16,
  },
  stampRight: {
    right: 16,
  },
  stampBorder: {
    borderWidth: 3,
    borderRadius: Radius.xs,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stampText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
