import React from 'react';
import { Text, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { SPACING, TYPOGRAPHY } from '../theme';
import { useTheme } from '../ThemeContext';
import type { TanrenThemeColors } from '../theme';

// ── Props ─────────────────────────────────────────────────────────────────────

interface SectionLabelProps {
  children: string;
  style?: ViewStyle;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SectionLabel({ children, style }: SectionLabelProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <Text style={[styles.label, style]}>
      {children}
    </Text>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(c: TanrenThemeColors) {
  return StyleSheet.create({
    label: {
      fontSize: TYPOGRAPHY.caption,        // 12
      fontWeight: TYPOGRAPHY.semiBold,     // '600'
      color: c.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.9,
      paddingHorizontal: SPACING.contentMargin,
      marginTop: SPACING.md,              // 16
      marginBottom: SPACING.sm,           // 8
    },
  });
}
