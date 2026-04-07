// ============================================================
// StreakRing - SVGリング型ストリーク表示
// 7日サイクルで円弧が埋まる。中央に日数+「日連続」。
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { RecallAmber, SystemColors } from '../theme/colors';

interface StreakRingProps {
  days: number;
  /** リングの外径（デフォルト 88） */
  size?: number;
  /** リングの太さ（デフォルト 7） */
  strokeWidth?: number;
}

// 7日を1サイクルとして進捗を計算
const CYCLE = 7;
const GRADIENT_ID = 'streakGradient';

export function StreakRing({
  days,
  size = 80,
  strokeWidth = 6,
}: StreakRingProps) {
  const { colors, isDark } = useTheme();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // 7日サイクルでの進捗（0〜1）。7日ちょうどは満タン表示。
  const progress = days === 0 ? 0 : Math.min((days % CYCLE === 0 ? CYCLE : days % CYCLE) / CYCLE, 1);
  const strokeDashoffset = circumference * (1 - progress);

  // 完全達成（7の倍数）は全て埋まる
  const isFullCycle = days > 0 && days % CYCLE === 0;

  // ストリーク長に応じてリングの色を変える
  const ringColor = days >= 30
    ? SystemColors.purple      // 30日以上: パープル
    : days >= 14
    ? SystemColors.indigo      // 14日以上: インディゴ
    : isDark ? RecallAmber.dark : RecallAmber.light;  // 通常: アンバー

  const trackColor = isDark
    ? 'rgba(255,255,255,0.08)'
    : 'rgba(0,0,0,0.07)';

  return (
    <View style={styles.root}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={ringColor} stopOpacity={1} />
            <Stop offset="100%" stopColor={ringColor} stopOpacity={0.7} />
          </LinearGradient>
        </Defs>

        {/* トラック（グレー） */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* プログレスリング */}
        {days > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={`url(#${GRADIENT_ID})`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={isFullCycle ? 0 : strokeDashoffset}
            strokeLinecap="round"
            // 12時位置スタート
            rotation="-90"
            origin={`${center}, ${center}`}
          />
        )}
      </Svg>

      {/* 中央テキスト（数字 + 「日連続」縦積み） */}
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={[styles.days, { color: days > 0 ? colors.label : colors.labelTertiary }]}>
          {days}
        </Text>
        <Text style={[styles.label, { color: colors.labelTertiary }]}>
          日連続
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 0,
  },
  days: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 24,
  },
  label: {
    fontSize: 10,
  },
});
