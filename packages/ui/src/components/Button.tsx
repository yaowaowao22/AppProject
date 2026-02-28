import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const SIZE_CONFIG: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 12 },
  md: { paddingVertical: 10, paddingHorizontal: 20, fontSize: 14 },
  lg: { paddingVertical: 14, paddingHorizontal: 28, fontSize: 16 },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const { colors, theme } = useTheme();
  const overrides = theme.overrides?.button;
  const sizeConfig = SIZE_CONFIG[size];

  const getBackgroundColor = (): string => {
    if (disabled) return colors.border;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'primary':
        return colors.textOnPrimary;
      case 'secondary':
        return colors.textOnPrimary;
      case 'outline':
        return colors.primary;
      case 'ghost':
        return colors.primary;
      default:
        return colors.textOnPrimary;
    }
  };

  const getBorderStyle = (): ViewStyle => {
    if (variant === 'outline') {
      return {
        borderWidth: 1.5,
        borderColor: disabled ? colors.border : colors.primary,
      };
    }
    return {};
  };

  const containerStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    paddingVertical: overrides?.paddingVertical ?? sizeConfig.paddingVertical,
    paddingHorizontal: overrides?.paddingHorizontal ?? sizeConfig.paddingHorizontal,
    borderRadius: overrides?.borderRadius ?? theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.6 : 1,
    ...getBorderStyle(),
  };

  const labelStyle: TextStyle = {
    color: getTextColor(),
    fontSize: sizeConfig.fontSize,
    fontFamily: theme.typography.fontFamily.medium,
    fontWeight: '600',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[containerStyle, style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
          style={styles.loader}
        />
      ) : icon ? (
        <>{icon}</>
      ) : null}
      <Text style={[labelStyle, icon || loading ? styles.textWithIcon : undefined, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginRight: 8,
  },
  textWithIcon: {
    marginLeft: 8,
  },
});
