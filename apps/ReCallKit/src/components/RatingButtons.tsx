// ============================================================
// RatingButtons - SM-2 2段階評価ボタン（Indigo Pro）
// 覚えてない / 覚えた！ — 2px角丸
// ============================================================

import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing, Radius, MinTapTarget } from '../theme/spacing';
import type { SimpleRating } from '../sm2/algorithm';

interface RatingButtonsProps {
  onRate: (rating: SimpleRating) => void;
}

const RATINGS: {
  key: SimpleRating;
  label: string;
  sublabel: string;
  tint: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  {
    key: 'forgot',
    label: '覚えてない',
    sublabel: 'もう一度',
    tint: '#FF3B30',
    icon: 'close-circle-outline',
  },
  {
    key: 'remembered',
    label: '覚えた！',
    sublabel: '次へ進む',
    tint: '#34C759',
    icon: 'checkmark-circle-outline',
  },
];

const HAPTIC_MAP: Record<SimpleRating, () => Promise<void>> = {
  forgot:     () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  remembered: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
};

export function RatingButtons({ onRate }: RatingButtonsProps) {
  const { colors } = useTheme();

  const handlePress = async (rating: SimpleRating) => {
    await HAPTIC_MAP[rating]();
    onRate(rating);
  };

  return (
    <View style={styles.container}>
      {RATINGS.map(({ key, label, sublabel, tint, icon }) => (
        <Pressable
          key={key}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: pressed ? `${tint}33` : `${tint}1A`,
              borderColor: `${tint}40`,
            },
          ]}
          onPress={() => handlePress(key)}
          accessibilityLabel={label}
          accessibilityRole="button"
        >
          <Ionicons name={icon} size={24} color={tint} />
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
    gap: Spacing.m,
    paddingHorizontal: Spacing.m,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    minHeight: MinTapTarget + 16,
    borderRadius: Radius.xs,
    paddingTop: 14,
    paddingHorizontal: Spacing.s,
    paddingBottom: 12,
    gap: 4,
    borderWidth: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  sublabel: {
    fontSize: 11,
    opacity: 0.7,
    textAlign: 'center',
  },
});
