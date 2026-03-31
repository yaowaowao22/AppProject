// ============================================================
// RatingButtons - SM-2 3段階評価ボタン
// 忘れた / 難しかった / 覚えてた
// ============================================================

import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing, Radius, MinTapTarget } from '../theme/spacing';
import type { SimpleRating } from '../sm2/algorithm';

interface RatingButtonsProps {
  onRate: (rating: SimpleRating) => void;
}

const RATINGS: { key: SimpleRating; label: string; emoji: string }[] = [
  { key: 'forgot', label: '忘れた',     emoji: '😰' },
  { key: 'hard',   label: '難しかった', emoji: '🤔' },
  { key: 'easy',   label: '覚えてた',   emoji: '✅' },
];

export function RatingButtons({ onRate }: RatingButtonsProps) {
  const { colors } = useTheme();

  const handlePress = async (rating: SimpleRating) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRate(rating);
  };

  return (
    <View style={styles.container}>
      {RATINGS.map(({ key, label, emoji }) => (
        <Pressable
          key={key}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: pressed ? colors.backgroundSecondary : colors.card,
              borderColor: colors.separator,
            },
          ]}
          onPress={() => handlePress(key)}
          accessibilityLabel={label}
          accessibilityRole="button"
        >
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={[styles.label, { color: colors.label }]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.s,
    paddingHorizontal: Spacing.m,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MinTapTarget * 1.5,
    borderRadius: Radius.m,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.m,
    gap: Spacing.xs,
  },
  emoji: {
    fontSize: 24,
  },
  label: {
    ...TypeScale.footnote,
    textAlign: 'center',
  },
});
