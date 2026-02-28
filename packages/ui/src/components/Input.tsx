import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  multiline = false,
  secureTextEntry = false,
  style,
}: InputProps) {
  const { colors, theme } = useTheme();
  const overrides = theme.overrides?.input;
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  const borderColor = error
    ? colors.error
    : isFocused
      ? colors.primary
      : colors.border;

  const inputContainerStyle: ViewStyle = {
    borderWidth: overrides?.borderWidth ?? 1,
    borderColor,
    borderRadius: overrides?.borderRadius ?? theme.radius.md,
    backgroundColor: colors.surface,
    minHeight: overrides?.height ?? (multiline ? 100 : 48),
    paddingHorizontal: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.sm,
    justifyContent: multiline ? 'flex-start' : 'center',
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <Text
          style={[
            styles.label,
            {
              color: error ? colors.error : colors.textSecondary,
              fontFamily: theme.typography.fontFamily.medium,
              fontSize: theme.typography.fontSize.sm,
              marginBottom: theme.spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <View style={inputContainerStyle}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          secureTextEntry={secureTextEntry}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            {
              color: colors.text,
              fontFamily: theme.typography.fontFamily.regular,
              fontSize: theme.typography.fontSize.md,
            },
            multiline && styles.multilineInput,
          ]}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
      {error ? (
        <Text
          style={[
            styles.error,
            {
              color: colors.error,
              fontFamily: theme.typography.fontFamily.regular,
              fontSize: theme.typography.fontSize.xs,
              marginTop: theme.spacing.xs,
            },
          ]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {},
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  multilineInput: {
    minHeight: 80,
  },
  error: {},
});
