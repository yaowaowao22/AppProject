import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Button } from './Button';

export interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

export interface EmptyStateProps {
  icon: string | React.ReactNode;
  title: string;
  subtitle?: string;
  action?: EmptyStateAction;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  const { colors, theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { marginBottom: theme.spacing.md }]}>
        {typeof icon === 'string' ? (
          <Text style={styles.emoji}>{icon}</Text>
        ) : (
          icon
        )}
      </View>
      <Text
        style={[
          styles.title,
          {
            color: colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.xl,
            marginBottom: theme.spacing.sm,
          },
        ]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            {
              color: colors.textSecondary,
              fontFamily: theme.typography.fontFamily.regular,
              fontSize: theme.typography.fontSize.md,
              marginBottom: theme.spacing.lg,
              paddingHorizontal: theme.spacing.xl,
            },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
      {action ? (
        <Button
          title={action.label}
          onPress={action.onPress}
          variant="primary"
          size="md"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
  },
  subtitle: {
    textAlign: 'center',
  },
});
