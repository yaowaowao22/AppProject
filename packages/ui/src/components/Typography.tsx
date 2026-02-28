import React from 'react';
import {
  Text,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export interface TypographyProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

function useBaseStyle(overrides: {
  fontSize: number;
  fontFamily: string;
  fontWeight: TextStyle['fontWeight'];
  lineHeightMultiplier?: number;
}, props: TypographyProps): TextStyle {
  const { colors } = useTheme();
  return {
    color: props.color ?? colors.text,
    fontSize: overrides.fontSize,
    fontFamily: overrides.fontFamily,
    fontWeight: overrides.fontWeight,
    lineHeight: overrides.fontSize * (overrides.lineHeightMultiplier ?? 1.4),
    textAlign: props.align ?? 'left',
  };
}

export function H1(props: TypographyProps) {
  const { theme } = useTheme();
  const baseStyle = useBaseStyle(
    {
      fontSize: theme.typography.fontSize.hero,
      fontFamily: theme.typography.fontFamily.bold,
      fontWeight: '700',
      lineHeightMultiplier: 1.2,
    },
    props,
  );
  return <Text style={[baseStyle, props.style]}>{props.children}</Text>;
}

export function H2(props: TypographyProps) {
  const { theme } = useTheme();
  const baseStyle = useBaseStyle(
    {
      fontSize: theme.typography.fontSize.xxl,
      fontFamily: theme.typography.fontFamily.bold,
      fontWeight: '700',
      lineHeightMultiplier: 1.25,
    },
    props,
  );
  return <Text style={[baseStyle, props.style]}>{props.children}</Text>;
}

export function H3(props: TypographyProps) {
  const { theme } = useTheme();
  const baseStyle = useBaseStyle(
    {
      fontSize: theme.typography.fontSize.xl,
      fontFamily: theme.typography.fontFamily.medium,
      fontWeight: '600',
      lineHeightMultiplier: 1.3,
    },
    props,
  );
  return <Text style={[baseStyle, props.style]}>{props.children}</Text>;
}

export function Body(props: TypographyProps) {
  const { theme } = useTheme();
  const baseStyle = useBaseStyle(
    {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.regular,
      fontWeight: '400',
    },
    props,
  );
  return <Text style={[baseStyle, props.style]}>{props.children}</Text>;
}

export function Caption(props: TypographyProps) {
  const { colors, theme } = useTheme();
  const baseStyle = useBaseStyle(
    {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.regular,
      fontWeight: '400',
    },
    props,
  );
  // Caption defaults to textSecondary unless a color is explicitly given
  if (!props.color) {
    baseStyle.color = colors.textSecondary;
  }
  return <Text style={[baseStyle, props.style]}>{props.children}</Text>;
}
