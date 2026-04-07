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

// iOS system colors (mockupStyles.RatingColors 準拠: again=red, hard=amber, good=green, perfect=blue)
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
    tint: '#FF3B30',
  },
  {
    key: 'hard',
    label: '難しかった',
    sublabel: '苦労した',
    tint: '#FF9F0A',
  },
  {
    key: 'good',
    label: '良かった',
    sublabel: '少し迷った',
    tint: '#30D158',
  },
  {
    key: 'perfect',
    label: '簡単',
    sublabel: '完璧',
    tint: '#0A84FF',
  },
];

const HAPTIC_MAP: Record<SimpleRating, () => Promise<void>> = {
  again:   () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  hard:    () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  good:    () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  perfect: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
};

export function RatingButtons({ onRate }: RatingButtonsProps) {
  const { colors } = useTheme();

  const handlePress = async (rating: SimpleRating) => {
    await HAPTIC_MAP[rating]();
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
              backgroundColor: pressed ? `${tint}33` : `${tint}26`,
            },
          ]}
          onPress={() => handlePress(key)}
          accessibilityLabel={label}
          accessibilityRole="button"
        >
          <View style={[styles.indicator, { backgroundColor: tint }]} />
          <Text style={[styles.label, { color: tint }]}>{label}</Text>
          <Text style={[styles.sublabel, { color: tint }]}>
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
    minHeight: MinTapTarget,
    borderRadius: Radius.m,
    borderWidth: 1.5,
    paddingVertical: Spacing.xs,
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
