import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export interface DividerProps {
  style?: StyleProp<ViewStyle>;
}

export function Divider({ style }: DividerProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: colors.divider,
          width: '100%',
        },
        style,
      ]}
    />
  );
}
