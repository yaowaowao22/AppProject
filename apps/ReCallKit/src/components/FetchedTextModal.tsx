// ============================================================
// FetchedTextModal - フェッチした元記事テキスト表示モーダル
// ============================================================

import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

interface Props {
  visible: boolean;
  text: string;
  title?: string;
  onClose: () => void;
}

export function FetchedTextModal({ visible, text, title, onClose }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.label }]} numberOfLines={1}>
            {title ?? '元記事'}
          </Text>
          <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button">
            <Ionicons name="close-circle" size={28} color={colors.labelTertiary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xxl }]}
          showsVerticalScrollIndicator
        >
          <Text style={[styles.bodyText, { color: colors.label }]} selectable>
            {text}
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    gap: Spacing.m,
  },
  headerTitle: {
    ...TypeScale.title3,
    fontWeight: '600',
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.m,
  },
  bodyText: {
    ...TypeScale.bodyJA,
    lineHeight: 26,
  },
});
