import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Canvas, Line, Circle, vec } from '@shopify/react-native-skia';

// CSS変数から転用
const GOLD = '#C8A96E';
const GOLD_OPACITY = 0.55;
const DOT_RADIUS = 4; // 直径8px → 半径4px

const PHI_RATIOS = [0.382, 0.618] as const;

export interface CorrectionChip {
  label: string;
  value: string;
  position: { x: number; y: number };
}

interface PhiGridProps {
  width: number;
  height: number;
  visible: boolean;
  corrections?: CorrectionChip[];
}

export default function PhiGrid({ width, height, visible, corrections }: PhiGridProps) {
  if (!visible || width === 0 || height === 0) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { width, height }]} pointerEvents="none">
      {/* Skia Canvas: φグリッドライン + ドット */}
      <Canvas style={{ width, height }}>
        {/* 縦ライン × 2 */}
        {PHI_RATIOS.map((r) => (
          <Line
            key={`v-${r}`}
            p1={vec(width * r, 0)}
            p2={vec(width * r, height)}
            color={GOLD}
            strokeWidth={1}
            opacity={GOLD_OPACITY}
          />
        ))}

        {/* 横ライン × 2 */}
        {PHI_RATIOS.map((r) => (
          <Line
            key={`h-${r}`}
            p1={vec(0, height * r)}
            p2={vec(width, height * r)}
            color={GOLD}
            strokeWidth={1}
            opacity={GOLD_OPACITY}
          />
        ))}

        {/* 4交差点ドット */}
        {PHI_RATIOS.flatMap((ry) =>
          PHI_RATIOS.map((rx) => (
            <Circle
              key={`dot-${rx}-${ry}`}
              cx={width * rx}
              cy={height * ry}
              r={DOT_RADIUS}
              color={GOLD}
            />
          ))
        )}
      </Canvas>

      {/* 補正チップ: React Native View でレンダリング（borderRadius + 日本語テキスト対応） */}
      {corrections?.map((chip, i) => (
        <View
          key={i}
          style={[
            styles.chip,
            { left: chip.position.x, top: chip.position.y },
          ]}
        >
          <Text style={styles.chipText}>
            {chip.label} {chip.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    position: 'absolute',
    backgroundColor: 'rgba(17,17,17,0.75)',
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
