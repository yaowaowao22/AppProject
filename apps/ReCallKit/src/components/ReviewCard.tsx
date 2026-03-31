// ============================================================
// ReviewCard - 3Dフリップアニメーション付きレビューカード
// 表面: タイトル / 裏面: タイトル + 内容
// フリップ: Y軸回転 + 浮き上がりスケール + 影深度変化
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolate,
  Extrapolation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

interface ReviewCardProps {
  title: string;
  content: string;
  onFlip?: () => void;
}

const CARD_HEIGHT = 320;
const FLIP_DURATION = 320; // 表→裏 (ms)
const EASING = Easing.out(Easing.cubic);

export function ReviewCard({ title, content, onFlip }: ReviewCardProps) {
  const { colors, isDark } = useTheme();
  // 0 = 表, 1 = 裏
  const flip = useSharedValue(0);
  // フリップ中に少し浮き上がる (0 → 1 → 0)
  const lift = useSharedValue(0);

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

  const cardBase = {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
  };

  return (
    <Pressable
      onPress={handleFlip}
      accessibilityRole="button"
      accessibilityLabel="カードをめくる"
      style={styles.pressable}
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
            <Text style={[styles.contentText, { color: colors.label }]} numberOfLines={9}>
              {content}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
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
    padding: Spacing.l,
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
});
