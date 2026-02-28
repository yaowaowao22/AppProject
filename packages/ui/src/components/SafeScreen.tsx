import React from 'react';
import { type ViewStyle, type StyleProp } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

export interface SafeScreenProps {
  children: React.ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}

export function SafeScreen({
  children,
  edges = ['top', 'bottom'],
  style,
}: SafeScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[
        {
          flex: 1,
          backgroundColor: colors.background,
        },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}
