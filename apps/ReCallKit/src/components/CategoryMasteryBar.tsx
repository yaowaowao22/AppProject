// ============================================================
// CategoryMasteryBar
// カテゴリ別マスタリー進捗バー（シンプルリスト形式）
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Spacing } from '../theme/spacing';
import type { CategoryStats } from '../db/queries';

interface Props {
  stats: CategoryStats[];
  onPressCategory?: (category: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Programming: '#1A73E8',
  Design: '#E8A000',
  Infrastructure: '#1E8E3E',
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#9AA0A6';
}

export function CategoryMasteryBar({ stats, onPressCategory }: Props) {
  const { colors } = useTheme();

  if (stats.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* ラベル */}
      <Text style={styles.labelUpper}>Mastery</Text>

      {stats.map((stat, index) => {
        const ratio = stat.itemCount > 0 ? stat.masteredCount / stat.itemCount : 0;
        const pct = Math.round(ratio * 100);
        const barColor = getCategoryColor(stat.category);
        const isFirst = index === 0;

        return (
          <Pressable
            key={stat.category}
            style={({ pressed }) => [
              styles.row,
              !isFirst && { borderTopWidth: 1, borderTopColor: '#F8F9FA' },
              pressed && onPressCategory ? { opacity: 0.7 } : undefined,
            ]}
            onPress={onPressCategory ? () => onPressCategory(stat.category) : undefined}
            accessibilityRole={onPressCategory ? 'button' : 'none'}
            accessibilityLabel={`${stat.category} ${pct}%`}
          >
            {/* カテゴリ名 */}
            <Text style={[styles.categoryLabel, { color: colors.label }]} numberOfLines={1}>
              {stat.category}
            </Text>

            {/* プログレスバー */}
            <View style={[styles.track, { backgroundColor: '#F8F9FA' }]}>
              <View
                style={[
                  styles.fill,
                  {
                    width: pct > 0 ? (`${Math.max(pct, 4)}%` as any) : 0,
                    backgroundColor: barColor,
                  },
                ]}
              />
            </View>

            {/* パーセント */}
            <Text style={[styles.pctText, { color: colors.labelSecondary }]}>
              {pct}%
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.m,
    paddingTop: 20,
    paddingBottom: 20,
  },
  labelUpper: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#9AA0A6',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  categoryLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  track: {
    width: 80,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  pctText: {
    fontSize: 13,
    fontWeight: '500',
    minWidth: 32,
    textAlign: 'right',
  },
});
