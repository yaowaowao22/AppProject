// ============================================================
// HistoryScreen - 学習履歴
// StreakRing・統計カード・最近の復習履歴リスト
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useDatabase } from '../../hooks/useDatabase';
import {
  getStreakDays,
  getTodayCompletedCount,
  getTotalItemCount,
  getRecentlyReviewedItems,
  type ReviewableItem,
} from '../../db/reviewRepository';
import { StreakRing } from '../../components/StreakRing';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import { SystemColors } from '../../theme/colors';

// アイテムタイプのラベルと色
const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  url:        { label: 'URL',      color: SystemColors.blue,   bg: SystemColors.blue   + '1F' },
  text:       { label: 'テキスト', color: SystemColors.green,  bg: SystemColors.green  + '1F' },
  screenshot: { label: '画像',     color: SystemColors.purple, bg: SystemColors.purple + '1F' },
};

// 相対時刻を日本語で返す
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr.replace(' ', 'T'));
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays === 1) return '昨日';
  return `${diffDays}日前`;
}

export function HistoryScreen() {
  const { db, isReady } = useDatabase();
  const { colors, isDark } = useTheme();

  const [streakDays, setStreakDays] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [recentlyReviewed, setRecentlyReviewed] = useState<ReviewableItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!db || !isReady) return;
    setLoading(true);
    try {
      const [streak, completed, total, recent] = await Promise.all([
        getStreakDays(db),
        getTodayCompletedCount(db),
        getTotalItemCount(db),
        getRecentlyReviewedItems(db, 20),
      ]);
      setStreakDays(streak);
      setTodayCompleted(completed);
      setTotalItems(total);
      setRecentlyReviewed(recent);
    } catch (err) {
      console.error('[HistoryScreen] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, [db, isReady]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (!isReady || loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.backgroundGrouped }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const cardShadow = isDark ? {} : CardShadow;

  return (
    <ScrollView
      style={{ backgroundColor: colors.backgroundGrouped }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ――― StreakRing + 統計カード ――― */}
      <View style={[styles.statsCard, { backgroundColor: colors.card }, cardShadow]}>
        <View style={styles.streakRow}>
          <StreakRing days={streakDays} size={80} strokeWidth={6} showLabel />
          <View style={styles.streakInfo}>
            <Text style={[styles.streakLabel, { color: colors.labelSecondary }]}>
              現在の連続記録
            </Text>
            <Text style={[styles.streakValue, { color: colors.accent }]}>
              {streakDays}日
            </Text>
          </View>
        </View>

        <View style={[styles.separator, { backgroundColor: colors.separator }]} />

        {/* 統計行 */}
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={[styles.statValue, { color: colors.label }]}>{todayCompleted}</Text>
            <Text style={[styles.statLabel, { color: colors.labelSecondary }]}>今日完了</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
          <View style={styles.statCell}>
            <Text style={[styles.statValue, { color: colors.label }]}>{totalItems}</Text>
            <Text style={[styles.statLabel, { color: colors.labelSecondary }]}>総アイテム</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
          <View style={styles.statCell}>
            <Text style={[styles.statValue, { color: colors.label }]}>{streakDays}</Text>
            <Text style={[styles.statLabel, { color: colors.labelSecondary }]}>連続日数</Text>
          </View>
        </View>
      </View>

      {/* ――― 最近の復習履歴 ――― */}
      {recentlyReviewed.length > 0 ? (
        <>
          <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>
            最近の復習履歴
          </Text>
          {recentlyReviewed.map((ri) => {
            const meta = TYPE_META[ri.item.type] ?? TYPE_META.text;
            const relTime = ri.item.review?.last_reviewed_at
              ? formatRelativeTime(ri.item.review.last_reviewed_at)
              : '';
            return (
              <View
                key={ri.reviewId}
                style={[styles.recentCard, { backgroundColor: colors.card }, cardShadow]}
              >
                <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
                </View>
                <View style={styles.recentTextArea}>
                  <View style={styles.recentTitleRow}>
                    <Text
                      style={[styles.recentTitle, { color: colors.label }]}
                      numberOfLines={2}
                    >
                      {ri.item.title}
                    </Text>
                    {relTime ? (
                      <Text style={[styles.recentTime, { color: colors.labelTertiary }]}>
                        {relTime}
                      </Text>
                    ) : null}
                  </View>
                  {ri.item.content ? (
                    <Text
                      style={[styles.recentContent, { color: colors.labelSecondary }]}
                      numberOfLines={2}
                    >
                      {ri.item.content}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </>
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: colors.card }, cardShadow]}>
          <Ionicons name="time-outline" size={28} color={colors.labelTertiary} />
          <Text style={[styles.emptyText, { color: colors.labelSecondary }]}>
            まだ復習履歴がありません
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: Spacing.m,
    paddingBottom: Spacing.xxl,
    gap: Spacing.m,
  },

  // ――― StreakRing + 統計カード ―――
  statsCard: {
    borderRadius: Radius.l,
    padding: Spacing.l,
    gap: Spacing.m,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.l,
  },
  streakInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  streakLabel: {
    ...TypeScale.subheadline,
  },
  streakValue: {
    ...TypeScale.title2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
  },
  statValue: {
    ...TypeScale.title3,
    fontWeight: '600' as const,
  },
  statLabel: {
    ...TypeScale.caption2,
  },

  // ――― セクションタイトル ―――
  sectionTitle: {
    ...TypeScale.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: Spacing.xs,
    marginBottom: -Spacing.xs,
  },

  // ――― 最近の復習カード ―――
  recentCard: {
    borderRadius: Radius.m,
    padding: Spacing.m,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.m,
  },
  typeBadge: {
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xs,
    minWidth: 44,
    alignItems: 'center',
    marginTop: 2,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 14,
  },
  recentTextArea: {
    flex: 1,
    gap: Spacing.xs,
  },
  recentTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.s,
  },
  recentTitle: {
    ...TypeScale.subheadline,
    fontWeight: '500' as const,
    flex: 1,
  },
  recentTime: {
    ...TypeScale.caption1,
    flexShrink: 0,
  },
  recentContent: {
    ...TypeScale.footnote,
  },

  // ――― 空状態 ―――
  emptyCard: {
    borderRadius: Radius.l,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.m,
  },
  emptyText: {
    ...TypeScale.subheadline,
    textAlign: 'center',
  },
});
