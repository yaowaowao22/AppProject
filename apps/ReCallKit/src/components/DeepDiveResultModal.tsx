// ============================================================
// DeepDiveResultModal - AI深掘り結果表示モーダル
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
import type { DeepDive } from '../types';

interface Props {
  visible: boolean;
  dives: DeepDive[];
  onClose: () => void;
}

export function DeepDiveResultModal({ visible, dives, onClose }: Props) {
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
          <Text style={[styles.headerTitle, { color: colors.label }]}>
            AI深掘り
          </Text>
          <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button">
            <Ionicons name="close-circle" size={28} color={colors.labelTertiary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xxl }]}
          showsVerticalScrollIndicator={false}
        >
          {dives.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.labelSecondary }]}>
                深掘り結果はまだありません
              </Text>
            </View>
          ) : (
            dives.map((dive, index) => (
              <View key={dive.id} style={styles.diveItem}>
                {/* Q&A ヘッダー */}
                <View style={[styles.qaCard, { backgroundColor: colors.backgroundSecondary }]}>
                  <View style={styles.qaRow}>
                    <Text style={[styles.qaLabel, { color: colors.accent }]}>Q</Text>
                    <Text style={[styles.qaText, { color: colors.label }]} numberOfLines={3}>
                      {dive.question}
                    </Text>
                  </View>
                  <View style={[styles.qaDivider, { backgroundColor: colors.separator }]} />
                  <View style={styles.qaRow}>
                    <Text style={[styles.qaLabel, { color: '#34C759' }]}>A</Text>
                    <Text style={[styles.qaText, { color: colors.label }]} numberOfLines={3}>
                      {dive.answer}
                    </Text>
                  </View>
                </View>

                {/* 深掘り結果 */}
                <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
                  <View style={styles.resultHeader}>
                    <Ionicons name="bulb" size={16} color="#5856D6" />
                    <Text style={[styles.resultLabel, { color: '#5856D6' }]}>
                      深掘り解説
                    </Text>
                  </View>
                  <Text style={[styles.resultText, { color: colors.label }]}>
                    {dive.result ?? ''}
                  </Text>
                  {dive.completed_at && (
                    <Text style={[styles.timestamp, { color: colors.labelTertiary }]}>
                      {dive.completed_at}
                    </Text>
                  )}
                </View>

                {index < dives.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.separator }]} />
                )}
              </View>
            ))
          )}
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
  },
  headerTitle: {
    ...TypeScale.title3,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: Spacing.m,
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    ...TypeScale.body,
  },
  diveItem: {
    marginBottom: Spacing.l,
  },
  qaCard: {
    borderRadius: Radius.m,
    padding: Spacing.m,
    marginBottom: Spacing.s,
  },
  qaRow: {
    flexDirection: 'row',
    gap: Spacing.s,
  },
  qaLabel: {
    fontSize: 14,
    fontWeight: '700',
    width: 20,
  },
  qaText: {
    ...TypeScale.subheadline,
    flex: 1,
    lineHeight: 22,
  },
  qaDivider: {
    height: 1,
    marginVertical: Spacing.xs,
    marginLeft: 28,
  },
  resultCard: {
    borderRadius: Radius.m,
    padding: Spacing.m,
    gap: Spacing.s,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  resultLabel: {
    ...TypeScale.footnote,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultText: {
    ...TypeScale.bodyJA,
    lineHeight: 26,
  },
  timestamp: {
    ...TypeScale.caption2,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  divider: {
    height: 1,
    marginTop: Spacing.m,
  },
});
