// 復習・クイズ画面で共通のプログレスバー（バー + N/M カウンター）

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
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
  const progress = useSharedValue(0);
  // 残り3枚以下で緑に変化
  const nearEnd = total > 0 && (total - currentIndex) <= 3;

  useEffect(() => {
    progress.value = withSpring(total > 0 ? currentIndex / total : 0, { damping: 20 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, total]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.section}>
      <View style={[styles.track, { backgroundColor: colors.backgroundSecondary }]}>
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: nearEnd ? '#34C759' : colors.accent },
            fillStyle,
          ]}
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
