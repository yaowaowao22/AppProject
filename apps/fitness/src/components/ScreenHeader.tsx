import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SPACING, BUTTON_HEIGHT } from '../theme';
import { useTheme } from '../ThemeContext';
import type { TanrenThemeColors } from '../theme';
import type { DynamicTypography } from '../ThemeContext';

// ── Props ─────────────────────────────────────────────────────────────────────

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showHamburger?: boolean;
  rightAction?: ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ScreenHeader({
  title,
  subtitle,
  showBack,
  onBack,
  showHamburger,
  rightAction,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, typography } = useTheme();
  const navigation = useNavigation<any>();
  const styles = makeStyles(colors, insets.top, typography);

  return (
    <View style={styles.header}>
      <View style={styles.inner}>
        {showHamburger ? (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.openDrawer()}
            accessibilityRole="button"
            accessibilityLabel="メニューを開く"
          >
            <Ionicons name="menu-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : showBack ? (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onBack ?? (() => navigation.goBack())}
            accessibilityRole="button"
            accessibilityLabel="戻る"
          >
            <Ionicons name="chevron-back-outline" size={32} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}

        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {rightAction != null ? (
          <View style={styles.rightAction}>{rightAction}</View>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(c: TanrenThemeColors, topInset: number, t: DynamicTypography) {
  return StyleSheet.create({
    header: {
      backgroundColor: c.background,
      paddingTop: topInset,
    },
    inner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.contentMargin,
      paddingVertical: 5,
      minHeight: BUTTON_HEIGHT.icon + 10,
    },
    iconBtn: {
      width: BUTTON_HEIGHT.icon,
      height: BUTTON_HEIGHT.icon,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    iconPlaceholder: {
      width: BUTTON_HEIGHT.icon,
      flexShrink: 0,
    },
    titleWrap: {
      flex: 1,
      marginHorizontal: SPACING.xs,
    },
    title: {
      fontSize: Math.round(t.screenTitle * 0.79), // screenTitle(28) * 0.79 ≈ 22
      fontWeight: t.bold,
      fontFamily: t.fontFamily,
      color: c.textPrimary,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: t.captionSmall,
      fontWeight: t.regular,
      fontFamily: t.fontFamily,
      color: c.textTertiary,
      marginTop: 2,
    },
    rightAction: {
      width: BUTTON_HEIGHT.icon,
      alignItems: 'flex-end',
      justifyContent: 'center',
      flexShrink: 0,
    },
  });
}
