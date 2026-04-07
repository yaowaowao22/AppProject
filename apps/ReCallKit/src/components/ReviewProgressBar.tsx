// 復習・クイズ画面で共通のプログレスバー
// バー + 残り枚数 + 評価済みミニドット行

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

// 評価ごとのカラー（ReviewScreen と同一定義）
const RATING_COLORS = {
  again:   '#FF3B30',
  hard:    '#FF9500',
  good:    '#007AFF',
  perfect: '#34C759',
} as const;

const RATING_LABELS: { key: keyof typeof RATING_COLORS; symbol: string }[] = [
  { key: 'again',   symbol: '×' },
  { key: 'hard',    symbol: '△' },
  { key: 'good',    symbol: '○' },
  { key: 'perfect', symbol: '◎' },
];

interface Props {
  /** 0-based の現在インデックス */
  currentIndex: number;
  total: number;
  /** 評価済みの内訳（省略時はミニドット行を非表示） */
  ratingCounts?: Partial<Record<string, number>>;
}

export function ReviewProgressBar({ currentIndex, total, ratingCounts }: Props) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);
  // 残り3枚以下で緑に変化
  const nearEnd = total > 0 && (total - currentIndex) <= 3;
  const remaining = total - currentIndex;

  useEffect(() => {
    progress.value = withSpring(total > 0 ? currentIndex / total : 0, { damping: 20 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, total]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  // 評価済みの合計件数
  const ratedTotal = ratingCounts
    ? Object.values(ratingCounts).reduce((s, v) => s + (v ?? 0), 0)
    : 0;
  const showDots = !!ratingCounts && ratedTotal > 0;

  return (
    <View style={styles.section}>
      {/* カウンター行: 残り枚数（左）・進捗（右） */}
      <View style={styles.counterRow}>
        <Text style={[styles.remaining, { color: nearEnd ? '#34C759' : colors.labelSecondary }]}>
          残り {remaining} 枚
        </Text>
        <Text style={[styles.count, { color: colors.labelTertiary }]}>
          {currentIndex} / {total}
        </Text>
      </View>

      {/* プログレスバー */}
      <View style={[styles.track, { backgroundColor: colors.backgroundSecondary }]}>
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: nearEnd ? '#34C759' : colors.accent },
            fillStyle,
          ]}
        />
      </View>

      {/* 評価済みミニドット行 */}
      {showDots && (
        <View style={styles.dotsRow}>
          {RATING_LABELS.map(({ key, symbol }) => {
            const cnt = ratingCounts?.[key] ?? 0;
            if (cnt === 0) return null;
            return (
              <View key={key} style={styles.dotItem}>
                <View style={[styles.dot, { backgroundColor: RATING_COLORS[key] }]} />
                <Text style={[styles.dotLabel, { color: colors.labelTertiary }]}>
                  {symbol} {cnt}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: Spacing.m,
    marginTop: Spacing.s,
    gap: Spacing.xs,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remaining: {
    ...TypeScale.caption1,
    fontWeight: '600',
  },
  count: {
    ...TypeScale.caption1,
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
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.m,
    marginTop: 2,
  },
  dotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotLabel: {
    ...TypeScale.caption2,
  },
});
