// ============================================================
// HistoryScreen - 学習履歴
// StreakRing・統計カード・マスタリー分布・最近の復習履歴リスト（ソート付き）
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { useDatabase } from '../../hooks/useDatabase';
import {
  getStreakDays,
  getTodayCompletedCount,
  getTotalItemCount,
  getRecentlyReviewedItems,
  getAccuracyRate,
  type ReviewableItem,
} from '../../db/reviewRepository';
import {
  getMasterySummary,
  type MasterySummary,
} from '../../db/queries';
import { StreakRing } from '../../components/StreakRing';
import { MasteryDistribution } from '../../components/MasteryDistribution';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import { SystemColors } from '../../theme/colors';
import type { DrawerParamList } from '../../navigation/types';

// ソートキー
type SortKey = 'recent' | 'next' | 'title';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: '最新順' },
  { key: 'next',   label: '次回順' },
  { key: 'title',  label: 'タイトル' },
];

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
  const drawerNav = useNavigation<DrawerNavigationProp<DrawerParamList>>();

  const [streakDays, setStreakDays] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [recentlyReviewed, setRecentlyReviewed] = useState<ReviewableItem[]>([]);
  const [masterySummary, setMasterySummary] = useState<MasterySummary | null>(null);
  const [masteredCount, setMasteredCount] = useState(0);
  const [accuracyRate, setAccuracyRate] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!db || !isReady) return;
    setLoading(true);
    try {
      const [streak, completed, total, recent, mastery, accuracy] = await Promise.all([
        getStreakDays(db),
        getTodayCompletedCount(db),
        getTotalItemCount(db),
        getRecentlyReviewedItems(db, 30),
        getMasterySummary(db),
        getAccuracyRate(db),
      ]);
      setStreakDays(streak);
      setTodayCompleted(completed);
      setTotalItems(total);
      setRecentlyReviewed(recent);
      setMasterySummary(mastery);
      setMasteredCount((mastery.advanced ?? 0) + (mastery.master ?? 0));
      setAccuracyRate(accuracy);
    } catch (err) {
      console.error('[HistoryScreen] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, [db, isReady]);

  // ソート済みリスト（クライアントサイドソート）
  const sortedReviewed = useMemo(() => {
    const list = [...recentlyReviewed];
    switch (sortKey) {
      case 'next':
        return list.sort((a, b) => {
          const aTime = a.item.review?.next_review_at ?? '';
          const bTime = b.item.review?.next_review_at ?? '';
          return aTime < bTime ? -1 : aTime > bTime ? 1 : 0;
        });
      case 'title':
        return list.sort((a, b) => a.item.title.localeCompare(b.item.title, 'ja'));
      case 'recent':
      default:
        return list.sort((a, b) => {
          const aTime = a.item.review?.last_reviewed_at ?? '';
          const bTime = b.item.review?.last_reviewed_at ?? '';
          return aTime > bTime ? -1 : aTime < bTime ? 1 : 0;
        });
    }
  }, [recentlyReviewed, sortKey]);

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

  const cardShadow = isDark
    ? { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator }
    : CardShadow;

  return (
    <ScrollView
      style={{ backgroundColor: colors.backgroundGrouped }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ――― StreakRing + 統計グリッド ――― */}
      <View style={styles.historyStats}>
        <StreakRing days={streakDays} size={80} strokeWidth={6} />
        <View style={styles.statGrid}>
          {[
            { val: todayCompleted, lbl: '今日完了' },
            { val: totalItems,     lbl: '総カード' },
            { val: masteredCount,  lbl: '習得済み' },
            { val: `${accuracyRate}%`, lbl: '正答率' },
          ].map((s) => (
            <View
              key={s.lbl}
              style={[styles.statBox, { borderColor: colors.separator }]}
            >
              <Text style={[styles.statVal, { color: colors.label }]}>{s.val}</Text>
              <Text style={[styles.statLbl, { color: colors.labelTertiary }]}>{s.lbl}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ――― マスタリー分布カード ――― */}
      {masterySummary && masterySummary.total > 0 && (
        <View style={[styles.masteryCard, { backgroundColor: colors.card }, cardShadow]}>
          <Text style={[styles.masteryCardTitle, { color: colors.label }]}>
            マスタリー分布
          </Text>
          <MasteryDistribution summary={masterySummary} />
        </View>
      )}

      {/* ――― 最近の復習履歴 ――― */}
      {sortedReviewed.length > 0 ? (
        <>
          {/* セクションタイトル + ソートチップ */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>
              復習履歴
            </Text>
            <View style={styles.sortRow}>
              {SORT_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => setSortKey(opt.key)}
                  style={[
                    styles.sortChip,
                    {
                      backgroundColor:
                        sortKey === opt.key ? colors.accent + '1F' : colors.backgroundGrouped,
                      borderColor:
                        sortKey === opt.key ? colors.accent : colors.separator,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      { color: sortKey === opt.key ? colors.accent : colors.labelSecondary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          {sortedReviewed.map((ri) => {
            const meta = TYPE_META[ri.item.type] ?? TYPE_META.text;
            const relTime = ri.item.review?.last_reviewed_at
              ? formatRelativeTime(ri.item.review.last_reviewed_at)
              : '';
            return (
              <View
                key={ri.reviewId}
                style={[styles.historyItem, { borderBottomColor: colors.separator, backgroundColor: colors.card }]}
              >
                <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
                </View>
                <View style={styles.historyBody}>
                  <Text
                    style={[styles.historyTitle, { color: colors.accent }]}
                    numberOfLines={1}
                  >
                    {ri.item.title}
                  </Text>
                  {relTime ? (
                    <Text style={[styles.historyTime, { color: colors.labelTertiary }]}>
                      {relTime}
                    </Text>
                  ) : null}
                  {ri.item.content ? (
                    <Text
                      style={[styles.historyPreview, { color: colors.labelSecondary }]}
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
          <Pressable
            style={[styles.ctaButton, { backgroundColor: colors.accent }]}
            onPress={() => drawerNav.navigate('Review')}
          >
            <Text style={styles.ctaButtonText}>今すぐ復習する</Text>
          </Pressable>
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

  // ――― マスタリー分布カード ―――
  masteryCard: {
    borderRadius: Radius.l,
    padding: Spacing.l,
    gap: Spacing.m,
  },
  masteryCardTitle: {
    ...TypeScale.headline,
    fontWeight: '600' as const,
  },

  // ――― セクションタイトル + ソート ―――
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: Spacing.xs,
  },
  sectionTitle: {
    ...TypeScale.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sortRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  sortChip: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sortChipText: {
    ...TypeScale.caption2,
    fontWeight: '500' as const,
  },

  // ――― 最近の復習カード ―――
  recentCard: {
    borderRadius: Radius.m,
    paddingVertical: 14,
    paddingHorizontal: Spacing.m,
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
  ctaButton: {
    marginTop: Spacing.s,
    paddingHorizontal: Spacing.l,
    paddingVertical: 10,
    borderRadius: Radius.full,
    alignSelf: 'center',
  },
  ctaButtonText: {
    ...TypeScale.subheadline,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
