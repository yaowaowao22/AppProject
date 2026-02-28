import React from 'react';
import { View, Text, type ViewStyle, type TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export type BadgeVariant = 'filled' | 'outline';

export interface BadgeProps {
  label: string;
  color?: string;
  variant?: BadgeVariant;
}

export function Badge({
  label,
  color,
  variant = 'filled',
}: BadgeProps) {
  const { colors, theme } = useTheme();
  const badgeColor = color ?? colors.primary;

  const containerStyle: ViewStyle =
    variant === 'filled'
      ? {
          backgroundColor: badgeColor,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs / 2,
          borderRadius: theme.radius.full,
          alignSelf: 'flex-start',
        }
      : {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: badgeColor,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs / 2,
          borderRadius: theme.radius.full,
          alignSelf: 'flex-start',
        };

  const textStyle: TextStyle =
    variant === 'filled'
      ? {
          color: colors.textOnPrimary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: theme.typography.fontSize.xs,
          fontWeight: '600',
        }
      : {
          color: badgeColor,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: theme.typography.fontSize.xs,
          fontWeight: '600',
        };

  return (
    <View style={containerStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}
