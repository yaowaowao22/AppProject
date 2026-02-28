import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress?: () => void;
  showDivider?: boolean;
  showChevron?: boolean;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onPress,
  showDivider = false,
  showChevron = false,
}: ListItemProps) {
  const { colors, theme } = useTheme();

  const content = (
    <View
      style={[
        styles.container,
        {
          paddingVertical: theme.spacing.sm + 4,
          paddingHorizontal: theme.spacing.md,
          borderBottomWidth: showDivider ? 1 : 0,
          borderBottomColor: colors.divider,
        },
      ]}
    >
      {leftIcon ? (
        <View style={[styles.leftIcon, { marginRight: theme.spacing.sm + 4 }]}>
          {leftIcon}
        </View>
      ) : null}
      <View style={styles.textContainer}>
        <Text
          numberOfLines={1}
          style={{
            color: colors.text,
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: theme.typography.fontSize.lg,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={2}
            style={{
              color: colors.textSecondary,
              fontFamily: theme.typography.fontFamily.regular,
              fontSize: theme.typography.fontSize.sm,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightIcon ? (
        <View style={[styles.rightIcon, { marginLeft: theme.spacing.sm }]}>
          {rightIcon}
        </View>
      ) : null}
      {showChevron && !rightIcon ? (
        <Text
          style={{
            color: colors.textMuted,
            fontSize: theme.typography.fontSize.lg,
            marginLeft: theme.spacing.sm,
          }}
        >
          {'>'}
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  rightIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
