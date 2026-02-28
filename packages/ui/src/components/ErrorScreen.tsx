import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Button } from './Button';

export interface ErrorScreenProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  const { colors, theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text
        style={[
          styles.icon,
          {
            fontSize: 48,
            marginBottom: theme.spacing.md,
          },
        ]}
      >
        !
      </Text>
      <Text
        style={[
          styles.message,
          {
            color: colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.lg,
            marginBottom: theme.spacing.lg,
            paddingHorizontal: theme.spacing.xl,
          },
        ]}
      >
        {message}
      </Text>
      {onRetry ? (
        <Button title="Retry" onPress={onRetry} variant="primary" size="md" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
});
