import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export interface HeaderProps {
  title: string;
  leftIcon?: React.ReactNode;
  onLeftPress?: () => void;
  rightIcon?: React.ReactNode;
  onRightPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Header({
  title,
  leftIcon,
  onLeftPress,
  rightIcon,
  onRightPress,
  style,
}: HeaderProps) {
  const { colors, theme } = useTheme();
  const overrides = theme.overrides?.header;

  const headerHeight = overrides?.height ?? 56;
  const borderBottomWidth = overrides?.borderBottomWidth ?? 1;

  const containerStyle: ViewStyle = {
    height: headerHeight,
    backgroundColor: colors.surface,
    borderBottomWidth,
    borderBottomColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  };

  return (
    <View style={[containerStyle, style]}>
      <View style={styles.side}>
        {leftIcon && onLeftPress ? (
          <TouchableOpacity
            onPress={onLeftPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.iconButton}
          >
            {leftIcon}
          </TouchableOpacity>
        ) : leftIcon ? (
          <View style={styles.iconButton}>{leftIcon}</View>
        ) : null}
      </View>
      <View style={styles.center}>
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            {
              color: colors.text,
              fontFamily: theme.typography.fontFamily.medium,
              fontSize: theme.typography.fontSize.xl,
              fontWeight: '600',
            },
          ]}
        >
          {title}
        </Text>
      </View>
      <View style={[styles.side, styles.rightSide]}>
        {rightIcon && onRightPress ? (
          <TouchableOpacity
            onPress={onRightPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.iconButton}
          >
            {rightIcon}
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.iconButton}>{rightIcon}</View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  side: {
    width: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightSide: {
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  iconButton: {
    padding: 4,
  },
});
