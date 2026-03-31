// ============================================================
// ReviewCard - フリップアニメーション付きレビューカード
// 表面: タイトル / 裏面: タイトル + 内容
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
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
// フリップ進行: 0=表, 1=裏
// 0→0.5: 表面が 0→90° に回転しながら消える
// 0.5→1: 裏面が -90→0° に回転しながら現れる

export function ReviewCard({ title, content, onFlip }: ReviewCardProps) {
  const { colors, isDark } = useTheme();
  const flipProgress = useSharedValue(0);

  // 表面: 0→90° に回転、opacity は 0.4→0.5 でフェードアウト
  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1500 },
      {
        rotateY: `${interpolate(
          flipProgress.value,
          [0, 0.5],
          [0, 90],
          Extrapolation.CLAMP
        )}deg`,
      },
    ],
    opacity: interpolate(flipProgress.value, [0.35, 0.5], [1, 0], Extrapolation.CLAMP),
  }));

  // 裏面: -90→0° に回転、opacity は 0.5→0.65 でフェードイン
  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1500 },
      {
        rotateY: `${interpolate(
          flipProgress.value,
          [0.5, 1],
          [-90, 0],
          Extrapolation.CLAMP
        )}deg`,
      },
    ],
    opacity: interpolate(flipProgress.value, [0.5, 0.65], [0, 1], Extrapolation.CLAMP),
  }));

  const handleFlip = async () => {
    if (flipProgress.value > 0) return; // 既にフリップ済み
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    flipProgress.value = withTiming(1, { duration: 480 }, (finished) => {
      if (finished && onFlip) {
        runOnJS(onFlip)();
      }
    });
  };

  const cardBase = [
    styles.card,
    {
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.1,
      shadowRadius: 8,
      elevation: isDark ? 0 : 3,
    },
  ] as const;

  return (
    <Pressable onPress={handleFlip} accessibilityRole="button" accessibilityLabel="カードをめくる">
      <View style={styles.wrapper}>
        {/* 表面 */}
        <Animated.View style={[...cardBase, frontStyle]}>
          <View style={styles.cardBody}>
            <Text style={[styles.sectionLabel, { color: colors.labelTertiary }]}>
              タイトル
            </Text>
            <Text style={[styles.titleText, { color: colors.label }]} numberOfLines={5}>
              {title}
            </Text>
          </View>
          <Text style={[styles.flipHint, { color: colors.labelTertiary }]}>
            タップしてめくる
          </Text>
        </Animated.View>

        {/* 裏面 - 絶対位置 */}
        <Animated.View style={[...cardBase, styles.absoluteFill, backStyle]}>
          <View style={styles.cardBody}>
            <Text style={[styles.sectionLabel, { color: colors.labelTertiary }]}>
              タイトル
            </Text>
            <Text style={[styles.titleSmall, { color: colors.labelSecondary }]} numberOfLines={2}>
              {title}
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            <Text style={[styles.sectionLabel, { color: colors.labelTertiary }]}>
              内容
            </Text>
            <Text style={[styles.contentText, { color: colors.label }]} numberOfLines={8}>
              {content}
            </Text>
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: CARD_HEIGHT,
    marginHorizontal: Spacing.m,
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
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  flipHint: {
    ...TypeScale.footnote,
    textAlign: 'center',
  },
});
