import React, { useMemo } from 'react';
import {
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import type { TanrenThemeColors } from '../theme';
import { RADIUS, SPACING, TYPOGRAPHY } from '../theme';

// ── Props ─────────────────────────────────────────────────────────────────────

interface ForceUpdateModalProps {
  visible: boolean;
  storeUrl: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ForceUpdateModal({ visible, storeUrl }: ForceUpdateModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleUpdate = () => {
    if (storeUrl) {
      Linking.openURL(storeUrl).catch(() => {
        // URL を開けない場合は無視（ユーザーが手動でストアを探せるよう何も隠さない）
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // 強制アップデートのため閉じることを許可しない
      onRequestClose={() => undefined}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* アイコン */}
          <View style={styles.iconWrap}>
            <Ionicons name="arrow-up-circle" size={52} color={colors.accent} />
          </View>

          {/* タイトル */}
          <Text style={styles.title}>アップデートが必要です</Text>

          {/* 本文 */}
          <Text style={styles.body}>
            新しいバージョンのアプリが利用可能です。{'\n'}
            引き続きご利用いただくには{'\n'}
            アップデートが必要です。
          </Text>

          {/* CTA */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleUpdate}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`${Platform.OS === 'ios' ? 'App Store' : 'Google Play'} でアップデートする`}
          >
            <Text style={styles.buttonText}>アップデートする</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── スタイル ──────────────────────────────────────────────────────────────────

function makeStyles(c: TanrenThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: c.scrim,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: SPACING.contentMargin,
    },

    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: c.surface1,
      borderRadius: RADIUS.card,
      padding: SPACING.xl,
      alignItems: 'center',
    },

    iconWrap: {
      marginBottom: SPACING.lg,
    },

    title: {
      fontSize: TYPOGRAPHY.exerciseName,
      fontWeight: TYPOGRAPHY.bold,
      color: c.textPrimary,
      textAlign: 'center',
      marginBottom: SPACING.md,
    },

    body: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.regular,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: SPACING.xl,
    },

    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: c.accent,
      borderRadius: RADIUS.button,
      height: 52,
      paddingHorizontal: SPACING.xl,
      width: '100%',
    },

    buttonText: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.background,
    },
  });
}
