// ============================================================
// FilterChip - 再利用可能なフィルターチップ
// ============================================================

import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  /** チップ左端に表示するアイコン（非アクティブ時のみ） */
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  activeColor?: string;
  bgColor?: string;
  textActiveColor?: string;
  textInactiveColor?: string;
}

export function FilterChip({
  label,
  active,
  onPress,
  icon,
  activeColor,
  bgColor,
  textActiveColor,
  textInactiveColor,
}: FilterChipProps) {
  const { colors } = useTheme();

  const resolvedActiveColor = activeColor ?? colors.accent;
  const resolvedBgColor = bgColor ?? colors.backgroundSecondary;
  const resolvedTextActiveColor = textActiveColor ?? colors.onAccent;
  const resolvedTextInactiveColor = textInactiveColor ?? colors.labelSecondary;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? resolvedActiveColor : resolvedBgColor,
          borderWidth: active ? 0 : StyleSheet.hairlineWidth,
          borderColor: colors.separator,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {/* 非アクティブ時のプレフィックスアイコン */}
      {!active && icon && (
        <Ionicons
          name={icon}
          size={11}
          color={resolvedTextInactiveColor}
          style={styles.prefixIcon}
        />
      )}

      <Text
        style={[
          styles.chipText,
          { color: active ? resolvedTextActiveColor : resolvedTextInactiveColor },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      {/* アクティブ時の × アイコン */}
      {active && (
        <Ionicons
          name="close-circle"
          size={13}
          color={resolvedTextActiveColor}
          style={styles.closeIcon}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prefixIcon: {
    marginRight: -1,
  },
  chipText: {
    ...TypeScale.footnote,
    fontWeight: '500' as const,
  },
  closeIcon: {
    marginLeft: -1,
  },
});
