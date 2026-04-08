// ============================================================
// FadeSeparator - 左→右フェードアウトする1本線セパレーター
// 左端から始まり、40%地点で透明にフェードアウト
// ============================================================

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

interface FadeSeparatorProps {
  style?: object;
}

export function FadeSeparator({ style }: FadeSeparatorProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={[colors.separator, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        locations={[0.4, 1]}
        style={styles.line}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 1,
    marginHorizontal: 0,
    marginVertical: 12,
  },
  line: {
    height: 1,
    width: '100%',
  },
});
