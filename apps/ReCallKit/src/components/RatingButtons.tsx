// ============================================================
// RatingButtons - SM-2 4段階評価ボタン
// もう一度 / 難しかった / 良かった / 簡単
// ============================================================

import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing, Radius, MinTapTarget } from '../theme/spacing';
import { SystemColors } from '../theme/colors';
import type { SimpleRating } from '../sm2/algorithm';

interface RatingButtonsProps {
  onRate: (rating: SimpleRating) => void;
}

const RATINGS: {
  key: SimpleRating;
  label: string;
  sublabel: string;
  tint: string;
}[] = [
  {
    key: 'again',
    label: 'もう一度',
    sublabel: '忘れた',
    tint: SystemColors.red,
  },
  {
    key: 'hard',
    label: '難しかった',
    sublabel: '苦労した',
    tint: SystemColors.orange,
  },
  {
    key: 'good',
    label: '良かった',
    sublabel: '少し迷った',
    tint: SystemColors.blue,
  },
  {
    key: 'perfect',
    label: '簡単',
    sublabel: '完璧',
    tint: SystemColors.green,
  },
];

export function RatingButtons({ onRate }: RatingButtonsProps) {
  const { colors } = useTheme();

  const handlePress = async (rating: SimpleRating) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRate(rating);
  };

  return (
    <View style={styles.container}>
      {RATINGS.map(({ key, label, sublabel, tint }) => (
        <Pressable
          key={key}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: pressed
                ? `${tint}22`
                : colors.card,
              borderColor: tint,
            },
          ]}
          onPress={() => handlePress(key)}
          accessibilityLabel={label}
          accessibilityRole="button"
        >
          <View style={[styles.indicator, { backgroundColor: tint }]} />
          <Text style={[styles.label, { color: colors.label }]}>{label}</Text>
          <Text style={[styles.sublabel, { color: colors.labelTertiary }]}>
            {sublabel}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.m,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MinTapTarget * 1.4,
    borderRadius: Radius.m,
    borderWidth: 1.5,
    paddingVertical: Spacing.s,
    gap: 2,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: Spacing.xs,
  },
  label: {
    ...TypeScale.footnote,
    fontWeight: '600',
    textAlign: 'center',
  },
  sublabel: {
    fontSize: 10,
    textAlign: 'center',
  },
});
