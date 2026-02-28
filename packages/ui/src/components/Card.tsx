import React from 'react';
import {
  View,
  TouchableOpacity,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export interface CardProps {
  children: React.ReactNode;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function Card({
  children,
  elevated = false,
  style,
  onPress,
}: CardProps) {
  const { colors, theme } = useTheme();
  const overrides = theme.overrides?.card;

  const cardStyle: ViewStyle = {
    backgroundColor: elevated ? colors.surfaceElevated : colors.surface,
    borderRadius: overrides?.borderRadius ?? theme.radius.lg,
    borderWidth: overrides?.borderWidth ?? 0,
    borderColor: colors.border,
    padding: theme.spacing.md,
    ...(elevated ? theme.shadows.md : theme.shadows.sm),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}
