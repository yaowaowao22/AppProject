// ============================================================
// StatsRow - Stats 3カラム表示コンポーネント
// 横並び3列に数値と見出しを表示する統計行
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing, Radius, CardShadow } from '../theme/spacing';

export interface StatItem {
  /** 数値ラベル（文字列も可: "12%" など） */
  value: string | number;
  /** 説明ラベル */
  label: string;
  /** 数値に適用するカラー。省略時は colors.label */
  color?: string;
}

interface StatsRowProps {
  /** 表示する統計。3件推奨（2〜4件にも対応） */
  stats: [StatItem, StatItem, StatItem] | StatItem[];
  /** カード背景を使うか否か。デフォルト false */
  withCard?: boolean;
}

export function StatsRow({ stats, withCard = false }: StatsRowProps) {
  const { colors, isDark } = useTheme();
  const cardShadow = isDark ? {} : CardShadow;

  const content = (
    <View style={styles.row}>
      {stats.map((stat, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
          )}
          <View style={styles.cell}>
            <Text
              style={[
                styles.value,
                { color: stat.color ?? colors.label },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {stat.value}
            </Text>
            <Text
              style={[styles.label, { color: colors.labelTertiary }]}
              numberOfLines={1}
            >
              {stat.label}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );

  if (!withCard) {
    return content;
  }

  return (
    <View
      style={[styles.card, { backgroundColor: colors.card }, cardShadow]}
      accessibilityRole="summary"
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.l,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.s,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    position: 'relative',
  },
  value: {
    ...TypeScale.title2,
    fontWeight: '500' as const,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 11,
    lineHeight: 13,
    textAlign: 'center',
    marginTop: 2,
  },
  divider: {
    position: 'absolute',
    left: 0,
    top: 4,
    bottom: 4,
    width: 1,
  },
});
