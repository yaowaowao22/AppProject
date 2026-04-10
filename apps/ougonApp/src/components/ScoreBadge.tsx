import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// CSS変数から転用
const BLACK = '#111111';
const GRAY = '#AAAAAA'; // mock.html --gray-3 相当

interface ScoreBadgeProps {
  score: number; // 0–100
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
  return (
    <View style={styles.container}>
      {/* 左カラム: スコア数値 + ラベル */}
      <View>
        <Text style={styles.num}>{Math.round(score)}</Text>
        <Text style={styles.label}>φ適合度</Text>
      </View>
      {/* 右: 単位 */}
      <Text style={styles.unit}>%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  num: {
    fontSize: 22,
    fontWeight: '200',
    letterSpacing: -1,
    color: BLACK,
    lineHeight: 22,
  },
  label: {
    fontSize: 9,
    color: GRAY,
    marginTop: 1,
  },
  unit: {
    fontSize: 10,
    color: GRAY,
    fontWeight: '500',
    marginBottom: 1,
  },
});
