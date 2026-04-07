// ============================================================
// MasteryDistribution
// 4段階マスタリーレベル分布バー（New / Learning / Advanced / Master）
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { SystemColors } from '../theme/colors';
import type { MasterySummary } from '../db/queries';

const MASTERY_META = [
  { key: 'master'   as const, label: 'マスター', color: SystemColors.green  },
  { key: 'advanced' as const, label: '上級',     color: SystemColors.blue   },
  { key: 'learning' as const, label: '学習中',   color: SystemColors.orange },
  { key: 'new'      as const, label: '未学習',   color: '#9E9EA7'            },
];

interface Props {
  summary: MasterySummary;
}

export function MasteryDistribution({ summary }: Props) {
  const { colors } = useTheme();
  const total = summary.total > 0 ? summary.total : 1; // ゼロ除算防止

  return (
    <View style={styles.wrapper}>
      {MASTERY_META.map(({ key, label, color }) => {
        const count = summary[key];
        const pct = Math.round((count / total) * 100);
        const barWidthPct = `${pct}%` as const;
        return (
          <View key={key} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={[styles.levelLabel, { color: colors.labelSecondary }]} numberOfLines={1}>
              {label}
            </Text>
            <View style={[styles.barTrack, { backgroundColor: colors.separator }]}>
              <View
                style={[
                  styles.barFill,
                  // @ts-ignore - RN StyleSheet accepts percentage strings for width
                  { width: barWidthPct, backgroundColor: color + 'AA' },
                ]}
              />
            </View>
            <Text style={[styles.count, { color: colors.label }]}>{count}</Text>
            <Text style={[styles.pct, { color: colors.labelTertiary }]}>
              {pct}%
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.s,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  levelLabel: {
    ...TypeScale.caption1,
    width: 52,
    flexShrink: 0,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Radius.full,
    minWidth: 3,
  },
  count: {
    ...TypeScale.caption1,
    fontWeight: '600' as const,
    width: 28,
    textAlign: 'right',
    flexShrink: 0,
  },
  pct: {
    ...TypeScale.caption2,
    width: 32,
    textAlign: 'right',
    flexShrink: 0,
  },
});
