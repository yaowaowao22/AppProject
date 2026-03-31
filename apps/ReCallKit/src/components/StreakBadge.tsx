// ============================================================
// StreakBadge - 連続学習日数を表示するピル型バッジ
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

interface StreakBadgeProps {
  days: number;
}

export function StreakBadge({ days }: StreakBadgeProps) {
  const { colors } = useTheme();

  if (days === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <Text style={styles.flame}>🔥</Text>
      <Text style={[styles.count, { color: colors.accent }]}>{days}</Text>
      <Text style={[styles.unit, { color: colors.labelSecondary }]}>日連続</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: Radius.full,
    gap: Spacing.xs,
  },
  flame: {
    fontSize: 18,
  },
  count: {
    ...TypeScale.title3,
  },
  unit: {
    ...TypeScale.subheadline,
  },
});
