// ============================================================
// ReviewCTACard - 今日の復習 CTA カード
// due件数・overdue件数・完了状態に応じてUIを切り替える
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing, Radius, CardShadow } from '../theme/spacing';
import { SystemColors } from '../theme/colors';

interface ReviewCTACardProps {
  /** 今日の復習対象件数 */
  dueCount: number;
  /** うち期限切れ件数 */
  overdueCount: number;
  /** 今日すでに復習した件数 */
  todayCompleted: number;
  /** 総アイテム数（0 のとき「アイテム未登録」状態） */
  totalItems: number;
  /** 「復習を始める」押下 */
  onStart: () => void;
  /** 「追加学習を始める」押下（全完了時に表示） */
  onStartExtra: () => void;
}

export function ReviewCTACard({
  dueCount,
  overdueCount,
  todayCompleted,
  totalItems,
  onStart,
  onStartExtra,
}: ReviewCTACardProps) {
  const { colors, isDark } = useTheme();
  const cardShadow = isDark ? {} : CardShadow;

  const isOverdue = overdueCount > 0;
  const actionColor = isOverdue ? SystemColors.orange : colors.accent;

  return (
    <View style={[styles.card, { backgroundColor: colors.card }, cardShadow]}>
      {/* ヘッダー行 */}
      <View style={styles.header}>
        <Text style={[styles.countText, { color: colors.label }]}>
          今日の復習　{dueCount}件
        </Text>

        {isOverdue && dueCount > 0 && (
          <View style={[styles.overdueBadge, { backgroundColor: SystemColors.orange + '22' }]}>
            <Ionicons name="time-outline" size={12} color={SystemColors.orange} />
            <Text style={[styles.overdueBadgeText, { color: SystemColors.orange }]}>
              うち {overdueCount} 件が期限切れ
            </Text>
          </View>
        )}
      </View>

      {/* 状態別ボディ */}
      {dueCount > 0 ? (
        /* ── 復習あり ── */
        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              { backgroundColor: pressed ? actionColor + 'CC' : actionColor },
            ]}
            onPress={onStart}
            accessibilityRole="button"
            accessibilityLabel="復習を始める"
          >
            <Ionicons
              name="play-circle-outline"
              size={20}
              color="#FFFFFF"
              style={styles.startButtonIcon}
            />
            <Text style={styles.startButtonText}>復習を始める</Text>
          </Pressable>
          {isOverdue && (
            <Text style={[styles.hintText, { color: SystemColors.orange }]}>
              期限切れが {overdueCount} 件あります。早めに復習しましょう
            </Text>
          )}
        </View>
      ) : totalItems === 0 ? (
        /* ── アイテム未登録 ── */
        <View style={styles.emptyRow}>
          <Text style={[styles.emptyText, { color: colors.labelSecondary }]}>
            アイテムを追加して復習を始めましょう
          </Text>
        </View>
      ) : (
        /* ── 全完了 ── */
        <View style={styles.section}>
          <View style={styles.completionRow}>
            <View style={[styles.completionIcon, { backgroundColor: colors.success + '1F' }]}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            </View>
            <View style={styles.completionText}>
              <Text style={[styles.allDoneText, { color: colors.success }]}>本日分完了</Text>
              <Text style={[styles.completedCountLabel, { color: colors.labelSecondary }]}>
                今日 {todayCompleted} 件復習しました
              </Text>
            </View>
          </View>
          <Text style={[styles.extraHint, { color: colors.labelSecondary }]}>
            追加学習しますか？
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.extraButton,
              { borderColor: colors.accent, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={onStartExtra}
            accessibilityRole="button"
            accessibilityLabel="追加学習を始める"
          >
            <Text style={[styles.extraButtonText, { color: colors.accent }]}>
              追加学習を始める
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.l,
    padding: Spacing.l,
    gap: Spacing.m,
  },
  header: {
    gap: Spacing.s,
  },
  countText: {
    ...TypeScale.title3,
    fontWeight: '600' as const,
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: Radius.xs,
    paddingHorizontal: Spacing.s,
    paddingVertical: 3,
  },
  overdueBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 14,
  },

  // ── 復習あり ──
  section: {
    gap: Spacing.xs,
  },
  startButton: {
    borderRadius: Radius.m,
    paddingVertical: Spacing.m,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  startButtonIcon: {
    marginRight: 2,
  },
  startButtonText: {
    ...TypeScale.headline,
    color: '#FFFFFF',
  },
  hintText: {
    ...TypeScale.caption1,
    textAlign: 'center',
  },

  // ── アイテム未登録 ──
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyText: {
    ...TypeScale.body,
    fontWeight: '600' as const,
  },

  // ── 全完了 ──
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
  },
  completionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionText: {
    flex: 1,
    gap: 2,
  },
  allDoneText: {
    ...TypeScale.body,
    fontWeight: '600' as const,
  },
  completedCountLabel: {
    ...TypeScale.caption1,
  },
  extraHint: {
    ...TypeScale.subheadline,
  },
  extraButton: {
    borderRadius: Radius.m,
    paddingVertical: Spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  extraButtonText: {
    ...TypeScale.headline,
  },
});
