import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

interface WavySeparatorProps {
  style?: object;
}

export function WavySeparator({ style }: WavySeparatorProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Svg viewBox="0 0 430 20" style={styles.svg} preserveAspectRatio="none">
        <Path
          d="M0 10 C55 18, 100 18, 145 10 S240 2, 285 10 S380 18, 430 10"
          stroke={colors.separator}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeDasharray="3 4"
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 20,
    marginHorizontal: 6,
    overflow: 'visible',
  },
  svg: {
    width: '100%',
    height: 20,
  },
});
