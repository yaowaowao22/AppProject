// ============================================================
// HomeScreen - 今日のダッシュボード
// ストリークリング・フィルターバッジ・復習カードリスト
// ============================================================

import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { useDatabase } from '../../hooks/useDatabase';
import {
  getDueItems,
  getStreakDays,
  getTodayCompletedCount,
  getTotalItemCount,
  type ReviewableItem,
} from '../../db/reviewRepository';
import { StreakRing } from '../../components/StreakRing';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import { useSidebarFilter } from '../../hooks/useSidebarFilter';
import type { HomeStackParamList, DrawerParamList } from '../../navigation/types';
import type { ItemType } from '../../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

// フィルター選択肢
type FilterKey = 'all' | ItemType;
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全て' },
  { key: 'url', label: 'URL' },
  { key: 'text', label: 'テキスト' },
  { key: 'screenshot', label: 'スクショ' },
];

// next_review_at から「何日遅れか」を返す
function getOverdueDays(nextReviewAt: string): number {
  const due = new Date(nextReviewAt.replace(' ', 'T'));
  const now = new Date();
  const diff = now.getTime() - due.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

// アイテムタイプのラベルと色
const TYPE_META: Record<ItemType, { label: string; color: string; bg: string }> = {
  url: { label: 'URL', color: '#0A84FF', bg: 'rgba(10,132,255,0.12)' },
  text: { label: 'テキスト', color: '#30D158', bg: 'rgba(48,209,88,0.12)' },
  screenshot: { label: '画像', color: '#BF5AF2', bg: 'rgba(191,90,242,0.12)' },
};

// サイドバーフィルターのラベル文字列を生成
function getSidebarFilterLabel(filter: NonNullable<ReturnType<typeof useSidebarFilter>['sidebarFilter']>): string {
  if (filter.kind === 'smart') {
    if (filter.id === 'today')   return '今日の復習';
    if (filter.id === 'overdue') return '期限切れ';
    if (filter.id === 'recent')  return '最近追加';
  }
  if (filter.kind === 'tag') return filter.tagName;
  if (filter.kind === 'collection') return filter.collectionName;
  return '';
}

export function HomeScreen({ navigation }: Props) {
  const { db, isReady } = useDatabase();
  const { colors, isDark } = useTheme();
  const { sidebarFilter, clearFilter } = useSidebarFilter();

  const [dueItems, setDueItems] = useState<ReviewableItem[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  // タグフィルター用: タグが付いているアイテムIDのセット（非同期取得）
  const [taggedItemIds, setTaggedItemIds] = useState<Set<number>>(new Set());

  const loadData = useCallback(async () => {
    if (!db || !isReady) return;
    setLoading(true);
    try {
      const [due, streak, completed, total] = await Promise.all([
        getDueItems(db),
        getStreakDays(db),
        getTodayCompletedCount(db),
        getTotalItemCount(db),
      ]);
      setDueItems(due);
      setStreakDays(streak);
      setTodayCompleted(completed);
      setTotalItems(total);
    } finally {
      setLoading(false);
    }
  }, [db, isReady]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // サイドバーのタグフィルターが変わったら対象アイテムIDを取得
  useEffect(() => {
    if (!sidebarFilter || sidebarFilter.kind !== 'tag' || !db) {
      setTaggedItemIds(new Set());
      return;
    }
    db.getAllAsync<{ item_id: number }>(
      'SELECT item_id FROM item_tags WHERE tag_id = ?',
      [sidebarFilter.tagId]
    ).then((rows) => setTaggedItemIds(new Set(rows.map((r) => r.item_id))));
  }, [sidebarFilter, db]);

  const handleStartReview = () => {
    navigation.getParent<DrawerNavigationProp<DrawerParamList>>()?.navigate('Review');
  };

  // サイドバーフィルターを dueItems に適用
  const sidebarFilteredItems = useMemo<ReviewableItem[]>(() => {
    if (!sidebarFilter) return dueItems;
    if (sidebarFilter.kind === 'smart') {
      if (sidebarFilter.id === 'today')   return dueItems; // getDueItems が today 対象を返す
      if (sidebarFilter.id === 'overdue') return dueItems.filter((ri) =>
        getOverdueDays(ri.item.review!.next_review_at) > 0
      );
      // 'recent' は LibraryScreen に委ねるため HomeScreen では全件表示
      return dueItems;
    }
    if (sidebarFilter.kind === 'tag') {
      return dueItems.filter((ri) => taggedItemIds.has(ri.item.id));
    }
    // collection は noop
    return dueItems;
  }, [sidebarFilter, dueItems, taggedItemIds]);

  if (!isReady || loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.backgroundGrouped }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const cardShadow = isDark ? {} : CardShadow;

  // タイプフィルター後のリスト（サイドバーフィルター済みリストに対して適用）
  const filteredItems =
    activeFilter === 'all'
      ? sidebarFilteredItems
      : sidebarFilteredItems.filter((ri) => ri.item.type === activeFilter);

  const dueCount = filteredItems.length;

  // フィルターごとの件数（サイドバーフィルター済みリストを基準に）
  const countByFilter = (key: FilterKey): number =>
    key === 'all'
      ? sidebarFilteredItems.length
      : sidebarFilteredItems.filter((ri) => ri.item.type === key).length;

  // ---- 空状態（アイテムが0件） ----
  if (totalItems === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.backgroundGrouped }]}>
        <Ionicons name="archive-outline" size={48} color={colors.labelTertiary} />
        <Text style={[styles.emptyTitle, { color: colors.label }]}>
          まだアイテムがありません
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.labelSecondary }]}>
          まずライブラリにアイテムを追加しましょう
        </Text>
        <Pressable
          style={[styles.emptyButton, { backgroundColor: colors.accent }]}
          onPress={() => navigation.getParent<DrawerNavigationProp<DrawerParamList>>()?.navigate('Library')}
          accessibilityRole="button"
        >
          <Text style={styles.emptyButtonText}>ライブラリへ</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.backgroundGrouped }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ――― サイドバーフィルターバッジ ――― */}
      {sidebarFilter && (
        <View style={styles.sidebarBadgeRow}>
          <View style={[styles.sidebarBadge, { backgroundColor: colors.accent + '22' }]}>
            <Text style={[styles.sidebarBadgeText, { color: colors.accent }]}>
              {getSidebarFilterLabel(sidebarFilter)}
            </Text>
            <Pressable
              onPress={clearFilter}
              style={styles.sidebarBadgeClear}
              accessibilityLabel="フィルターを解除"
              accessibilityRole="button"
            >
              <Text style={[styles.sidebarBadgeClearText, { color: colors.accent }]}>×</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ――― ヒーローセクション: ストリークリング + 今日の復習 ――― */}
      <View
        style={[styles.heroCard, { backgroundColor: colors.card }, cardShadow]}
      >
        {/* 上段: ストリークリング + ヘッダー */}
        <View style={styles.heroTop}>
          <StreakRing days={streakDays} size={80} strokeWidth={6} showLabel />
          <View style={styles.heroInfo}>
            <Text style={[styles.heroLabel, { color: colors.labelSecondary }]}>
              今日の復習
            </Text>
            <View style={styles.countRow}>
              <Text style={[styles.countNumber, { color: colors.accent }]}>
                {sidebarFilteredItems.length}
              </Text>
              <Text style={[styles.countUnit, { color: colors.labelSecondary }]}>
                件
              </Text>
            </View>
          </View>
        </View>

        {/* スタートボタン or 完了メッセージ */}
        {sidebarFilteredItems.length > 0 ? (
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              { backgroundColor: pressed ? colors.accent + 'CC' : colors.accent },
            ]}
            onPress={handleStartReview}
            accessibilityRole="button"
            accessibilityLabel="復習を始める"
          >
            <Text style={styles.startButtonText}>復習を始める</Text>
          </Pressable>
        ) : (
          <View style={styles.allDoneRow}>
            <Text style={[styles.allDoneIcon, { color: colors.success }]}>✓</Text>
            <Text style={[styles.allDoneText, { color: colors.success }]}>
              今日の復習は完了です
            </Text>
          </View>
        )}
      </View>

      {/* ――― 復習カードリスト ――― */}
      {sidebarFilteredItems.length > 0 && (
        <>
          {/* フィルターバッジ横スクロール */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map((f) => {
              const count = countByFilter(f.key);
              const isActive = activeFilter === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setActiveFilter(f.key)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive
                        ? colors.accent
                        : colors.backgroundSecondary,
                      borderColor: isActive
                        ? colors.accent
                        : 'transparent',
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isActive ? '#FFFFFF' : colors.labelSecondary },
                    ]}
                  >
                    {f.label}
                  </Text>
                  {count > 0 && (
                    <View
                      style={[
                        styles.filterBadge,
                        {
                          backgroundColor: isActive
                            ? 'rgba(255,255,255,0.25)'
                            : colors.accent + '22',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterBadgeText,
                          { color: isActive ? '#FFFFFF' : colors.accent },
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* カードリスト */}
          {dueCount > 0 ? (
            filteredItems.map((ri) => {
              const meta = TYPE_META[ri.item.type];
              const overdue = getOverdueDays(ri.item.review!.next_review_at);
              return (
                <Pressable
                  key={ri.reviewId}
                  style={({ pressed }) => [
                    styles.itemCard,
                    { backgroundColor: colors.card, opacity: pressed ? 0.75 : 1 },
                    cardShadow,
                  ]}
                  onPress={handleStartReview}
                  accessibilityRole="button"
                >
                  {/* タイプバッジ */}
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: meta.bg },
                    ]}
                  >
                    <Text style={[styles.typeBadgeText, { color: meta.color }]}>
                      {meta.label}
                    </Text>
                  </View>

                  {/* テキスト */}
                  <View style={styles.itemTextArea}>
                    <Text
                      style={[styles.itemTitle, { color: colors.label }]}
                      numberOfLines={2}
                    >
                      {ri.item.title}
                    </Text>
                    {overdue > 0 && (
                      <Text
                        style={[styles.overdueBadge, { color: colors.warning }]}
                      >
                        {overdue}日超過
                      </Text>
                    )}
                  </View>

                  {/* 矢印 */}
                  <Text style={[styles.itemArrow, { color: colors.labelTertiary }]}>
                    ›
                  </Text>
                </Pressable>
              );
            })
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }, cardShadow]}>
              <Text style={[styles.emptyText, { color: colors.labelSecondary }]}>
                このタイプのアイテムはありません
              </Text>
            </View>
          )}
        </>
      )}

      {/* ――― 統計セクション ――― */}
      <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>
        統計
      </Text>
      <View style={styles.statsRow}>
        <View
          style={[styles.statCard, { backgroundColor: colors.card }, cardShadow]}
        >
          <Text style={[styles.statValue, { color: colors.label }]}>
            {todayCompleted}
          </Text>
          <Text style={[styles.statLabel, { color: colors.labelSecondary }]}>
            今日完了
          </Text>
        </View>
        <View
          style={[styles.statCard, { backgroundColor: colors.card }, cardShadow]}
        >
          <Text style={[styles.statValue, { color: colors.label }]}>
            {totalItems}
          </Text>
          <Text style={[styles.statLabel, { color: colors.labelSecondary }]}>
            総アイテム
          </Text>
        </View>
        <View
          style={[styles.statCard, { backgroundColor: colors.card }, cardShadow]}
        >
          <Text style={[styles.statValue, { color: colors.label }]}>
            {streakDays}
          </Text>
          <Text style={[styles.statLabel, { color: colors.labelSecondary }]}>
            連続日数
          </Text>
        </View>
      </View>

      {/* ――― ジャーナル導線 ――― */}
      <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>
        ジャーナル
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.journalCard,
          { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 },
          cardShadow,
        ]}
        onPress={() => navigation.getParent<DrawerNavigationProp<DrawerParamList>>()?.navigate('Journal')}
        accessibilityRole="button"
        accessibilityLabel="学びジャーナルを開く"
      >
        <View style={styles.journalCardContent}>
          <Text style={[styles.journalCardTitle, { color: colors.label }]}>
            学びジャーナル
          </Text>
          <Text style={[styles.journalCardSub, { color: colors.labelSecondary }]}>
            日付別のメモ一覧
          </Text>
        </View>
        <Text style={[styles.journalChevron, { color: colors.labelTertiary }]}>›</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.m,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...TypeScale.headline,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...TypeScale.subheadline,
    textAlign: 'center',
  },
  emptyButton: {
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.m,
    marginTop: Spacing.s,
  },
  emptyButtonText: {
    ...TypeScale.headline,
    color: '#FFFFFF',
  },
  container: {
    padding: Spacing.m,
    paddingBottom: Spacing.xxl,
    gap: Spacing.m,
  },

  // ――― サイドバーフィルターバッジ ―――
  sidebarBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  sidebarBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sidebarBadgeClear: {
    paddingLeft: 2,
  },
  sidebarBadgeClearText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 16,
  },

  // ――― ヒーローカード ―――
  heroCard: {
    borderRadius: Radius.l,
    padding: Spacing.l,
    gap: Spacing.m,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.l,
  },
  heroInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  heroLabel: {
    ...TypeScale.subheadline,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  countNumber: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
    letterSpacing: -2,
  },
  countUnit: {
    ...TypeScale.title3,
    paddingBottom: Spacing.s,
  },
  startButton: {
    borderRadius: Radius.m,
    paddingVertical: Spacing.m,
    alignItems: 'center',
  },
  startButtonText: {
    ...TypeScale.headline,
    color: '#FFFFFF',
  },
  allDoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.s,
  },
  allDoneIcon: {
    ...TypeScale.body,
  },
  allDoneText: {
    ...TypeScale.body,
  },

  // ――― フィルターバッジ ―――
  filterRow: {
    paddingRight: Spacing.m,
    gap: Spacing.s,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: Radius.full,
    gap: Spacing.xs,
    borderWidth: 1,
  },
  filterChipText: {
    ...TypeScale.subheadline,
    fontWeight: '500' as const,
  },
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    lineHeight: 13,
  },

  // ――― アイテムカード ―――
  itemCard: {
    borderRadius: Radius.m,
    padding: Spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    minWidth: 44,
    alignItems: 'center',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 14,
  },
  itemTextArea: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    ...TypeScale.subheadline,
    fontWeight: '500' as const,
  },
  overdueBadge: {
    ...TypeScale.caption1,
    fontWeight: '500' as const,
  },
  itemArrow: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '300' as const,
  },

  // ――― 空状態 ―――
  emptyCard: {
    borderRadius: Radius.m,
    padding: Spacing.l,
    alignItems: 'center',
  },
  emptyText: {
    ...TypeScale.footnote,
  },

  // ――― ジャーナル導線 ―――
  journalCard: {
    borderRadius: Radius.m,
    padding: Spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
  },
  journalCardContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  journalCardTitle: {
    ...TypeScale.body,
    fontWeight: '500' as const,
  },
  journalCardSub: {
    ...TypeScale.caption1,
  },
  journalChevron: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '300' as const,
  },

  // ――― 統計 ―――
  sectionTitle: {
    ...TypeScale.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: Spacing.xs,
    marginBottom: -Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.m,
  },
  statCard: {
    flex: 1,
    borderRadius: Radius.m,
    padding: Spacing.m,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    ...TypeScale.title1,
  },
  statLabel: {
    ...TypeScale.caption1,
  },
});
