// ============================================================
// CategoryMasteryBar
// カテゴリ別マスタリー進捗バー
// getCategoryStats() の結果を受け取り、カテゴリごとの習熟状況を可視化する
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { SystemColors } from '../theme/colors';
import type { CategoryStats } from '../db/queries';

interface Props {
  stats: CategoryStats[];
  /** カテゴリ行をタップしたときのコールバック */
  onPressCategory?: (category: string) => void;
}

export function CategoryMasteryBar({ stats, onPressCategory }: Props) {
  const { colors } = useTheme();

  if (stats.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {stats.map((stat, index) => {
        const ratio = stat.itemCount > 0 ? stat.masteredCount / stat.itemCount : 0;
        const pct = Math.round(ratio * 100);
        const isLast = index === stats.length - 1;
        // 80% 以上で成功色（緑）、それ未満でアクセント色
        const barColor = pct >= 80 ? SystemColors.green : colors.accent;

        return (
          <Pressable
            key={stat.category}
            style={({ pressed }) => [
              styles.row,
              !isLast && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.separator,
              },
              pressed && onPressCategory ? { opacity: 0.7 } : undefined,
            ]}
            onPress={onPressCategory ? () => onPressCategory(stat.category) : undefined}
            accessibilityRole={onPressCategory ? 'button' : 'none'}
            accessibilityLabel={`${stat.category} — ${stat.masteredCount}/${stat.itemCount}件習熟 ${pct}%`}
          >
            {/* 上段: カテゴリ名 + バッジ + 数値 */}
            <View style={styles.rowHeader}>
              <Text
                style={[styles.categoryLabel, { color: colors.label }]}
                numberOfLines={1}
              >
                {stat.category}
              </Text>
              <View style={styles.rowRight}>
                {stat.dueCount > 0 && (
                  <View
                    style={[
                      styles.dueBadge,
                      { backgroundColor: colors.warning + '22' },
                    ]}
                  >
                    <Text style={[styles.dueBadgeText, { color: colors.warning }]}>
                      {stat.dueCount}件期限
                    </Text>
                  </View>
                )}
                <Text
                  style={[styles.countText, { color: colors.labelSecondary }]}
                >
                  {stat.masteredCount}/{stat.itemCount}
                </Text>
              </View>
            </View>

            {/* プログレスバー */}
            <View
              style={[styles.track, { backgroundColor: colors.backgroundSecondary }]}
            >
              <View
                style={[
                  styles.fill,
                  {
                    // パーセントを幅に変換（最低幅: 4% → ゼロ進捗でも視認可能）
                    width: pct > 0 ? (`${Math.max(pct, 4)}%` as any) : 0,
                    backgroundColor: barColor,
                  },
                ]}
              />
            </View>

            {/* 下段: パーセント表示 */}
            <Text
              style={[
                styles.pctText,
                { color: pct >= 80 ? SystemColors.green : colors.labelSecondary },
              ]}
            >
              {pct}% 習熟
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.l,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    gap: Spacing.xs,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.s,
  },
  categoryLabel: {
    ...TypeScale.subheadline,
    fontWeight: '500' as const,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  dueBadge: {
    borderRadius: Radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 14,
  },
  countText: {
    ...TypeScale.caption1,
    // @ts-ignore — fontVariant はプラットフォーム依存
    fontVariant: ['tabular-nums'],
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
  pctText: {
    ...TypeScale.caption2,
    fontWeight: '500' as const,
  },
});
