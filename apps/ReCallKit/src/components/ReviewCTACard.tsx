// ============================================================
// ReviewCTACard - 今日の復習 CTA カード
// due件数・overdue件数・完了状態に応じてUIを切り替える
// イラスト帯 + ボディ のフラットデザイン（モック準拠）
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { Spacing, Radius } from '../theme/spacing';

interface ReviewCTACardProps {
  /** 今日の復習対象件数 */
  dueCount: number;
  /** うち期限切れ件数 */
  overdueCount: number;
  /** 今日すでに復習した件数 */
  todayCompleted: number;
  /** 総アイテム数（0 のとき「アイテム未登録」状態） */
  totalItems: number;
  /** 推定復習時間（分）*/
  estimatedMinutes?: number;
  /** 復習対象カテゴリ一覧 */
  categories?: string[];
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
  estimatedMinutes,
  categories,
  onStart,
  onStartExtra,
}: ReviewCTACardProps) {
  const { colors } = useTheme();
  const isOverdue = overdueCount > 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      {dueCount > 0 ? (
        /* ── 復習あり ── */
        <>
          {/* イラスト帯 */}
          <View style={styles.reviewIllust}>
            <View style={[styles.illustCard, styles.illustCardBack2]} />
            <View style={[styles.illustCard, styles.illustCardBack1]} />
            <View style={[styles.illustCard, styles.illustCardFront]} />
          </View>

          {/* ボディ */}
          <View style={styles.reviewBody}>
            <Text style={[styles.countText, { color: colors.label }]}>
              今日の復習{' '}
              <Text style={styles.countTextStrong}>{dueCount}件</Text>
            </Text>
            {(estimatedMinutes !== undefined || (categories && categories.length > 0)) && (
              <Text style={styles.metaText}>
                {estimatedMinutes !== undefined ? `推定 ${estimatedMinutes}分` : ''}
                {estimatedMinutes !== undefined && categories && categories.length > 0 ? ' · ' : ''}
                {categories && categories.length > 0 ? categories.join(', ') : ''}
              </Text>
            )}
            {isOverdue && (
              <Text style={styles.overdueText}>期限切れ {overdueCount}件</Text>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.startButton,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={onStart}
              accessibilityRole="button"
              accessibilityLabel="復習を始める"
            >
              <Ionicons name="play-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.startButtonText}>復習を始める</Text>
            </Pressable>
          </View>
        </>
      ) : totalItems === 0 ? (
        /* ── アイテム未登録 ── */
        <View style={styles.emptyRow}>
          <Text style={[styles.emptyText, { color: colors.labelSecondary }]}>
            アイテムを追加して復習を始めましょう
          </Text>
        </View>
      ) : (
        /* ── 全完了 ── */
        <View style={styles.doneBody}>
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
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DADCE0',
  },

  // ── イラスト帯 ──
  reviewIllust: {
    height: 140,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  illustCard: {
    position: 'absolute',
    width: 90,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 3,
  },
  illustCardBack2: {
    transform: [{ rotate: '-12deg' }, { translateX: -50 }, { translateY: 8 }],
    backgroundColor: '#FFE082',
  },
  illustCardBack1: {
    transform: [{ rotate: '6deg' }, { translateX: 40 }, { translateY: -4 }],
    backgroundColor: '#FFECB3',
  },
  illustCardFront: {
    transform: [{ rotate: '-2deg' }],
  },

  // ── ボディ ──
  reviewBody: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 6,
  },
  countText: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  countTextStrong: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#5F6368',
  },
  overdueText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#D93025',
    fontWeight: '500' as const,
  },
  startButton: {
    backgroundColor: '#1A73E8',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: 16,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },

  // ── アイテム未登録 ──
  emptyRow: {
    padding: Spacing.l,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },

  // ── 全完了 ──
  doneBody: {
    padding: Spacing.l,
    gap: Spacing.m,
  },
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
    fontSize: 15,
    fontWeight: '600' as const,
  },
  completedCountLabel: {
    fontSize: 13,
  },
  extraHint: {
    fontSize: 15,
  },
  extraButton: {
    borderRadius: Radius.m,
    paddingVertical: Spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  extraButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
