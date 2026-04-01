// 復習・クイズ画面で共通のプログレスバー（バー + N/M カウンター）

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

interface Props {
  /** 0-based の現在インデックス */
  currentIndex: number;
  total: number;
}

export function ReviewProgressBar({ currentIndex, total }: Props) {
  const { colors } = useTheme();
  const ratio = currentIndex / total;

  return (
    <View style={styles.section}>
      <View style={[styles.track, { backgroundColor: colors.backgroundSecondary }]}>
        <View
          style={[styles.fill, { backgroundColor: colors.accent, width: `${ratio * 100}%` }]}
        />
      </View>
      <Text style={[styles.count, { color: colors.labelSecondary }]}>
        {currentIndex + 1} / {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: Spacing.m,
    marginTop: Spacing.s,
    gap: Spacing.xs,
  },
  track: {
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  count: {
    ...TypeScale.caption1,
    textAlign: 'right',
  },
});
