// ============================================================
// FilterChip - 再利用可能なフィルターチップ
// ============================================================

import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  activeColor?: string;
  bgColor?: string;
  textActiveColor?: string;
  textInactiveColor?: string;
}

export function FilterChip({
  label,
  active,
  onPress,
  activeColor,
  bgColor,
  textActiveColor = '#FFFFFF',
  textInactiveColor,
}: FilterChipProps) {
  const { colors } = useTheme();

  const resolvedActiveColor = activeColor ?? colors.accent;
  const resolvedBgColor = bgColor ?? colors.backgroundSecondary;
  const resolvedTextInactiveColor = textInactiveColor ?? colors.labelSecondary;

  return (
    <Pressable
      style={[
        styles.chip,
        { backgroundColor: active ? resolvedActiveColor : resolvedBgColor },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? textActiveColor : resolvedTextInactiveColor },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    height: 30,
    justifyContent: 'center',
  },
  chipText: {
    ...TypeScale.caption1,
    fontWeight: '500' as const,
  },
});
