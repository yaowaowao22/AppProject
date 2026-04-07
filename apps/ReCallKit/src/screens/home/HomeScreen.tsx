// ============================================================
// HomeScreen - 6セクション統合ダッシュボード
// [1] ヘッダー（DrawerNavigator が担当）
// [2] 週間アクティビティ（This Week）
// [3] 復習ヒーロー CTA（empty / due / done 3状態）
// [4] Recently Added（横スクロール）
// [5] Mastery（カテゴリ別習熟度バー）
// [6] Shortcuts（URLから / 手動）
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
  getAllReviewableItems,
  type ReviewableItem,
} from '../../db/reviewRepository';
import {
  getWeeklyActivity,
  getCategoryStats,
  type DailyActivity,
  type CategoryStats,
} from '../../db/queries';
import { useTheme } from '../../theme/ThemeContext';
import { Spacing } from '../../theme/spacing';
import { GoogleCalendarColors } from '../../theme/colors';
import { useSidebarFilter } from '../../hooks/useSidebarFilter';
import { useWidgetData } from '../../hooks/useWidgetData';
import { generateHint } from '../../utils/generateHint';
import { CategoryMasteryBar } from '../../components/CategoryMasteryBar';
import { ShortcutList, type ShortcutAction } from '../../components/ShortcutList';
import { ReviewCTACard } from '../../components/ReviewCTACard';
import type { HomeStackParamList, DrawerParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

interface RecentItem {
  id: number;
  type: string;
  title: string;
  source_url: string | null;
  category: string | null;
  created_at: string;
}

const ENG_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK_BLUE = GoogleCalendarColors.blue;
const WEEK_BLUE_LIGHT = GoogleCalendarColors.pillBlueBg;

const RECENT_CATEGORY_COLORS: Record<string, string> = {
  Programming: '#1A73E8',
  Design: '#E8A000',
  Infrastructure: '#1E8E3E',
};

function getRecentCategoryColor(category: string | null): string {
  if (!category) return GoogleCalendarColors.textTertiary;
  return RECENT_CATEGORY_COLORS[category] ?? GoogleCalendarColors.textTertiary;
}

function getRelativeTime(createdAt: string): string {
  const now = new Date();
  const created = new Date(createdAt.replace(' ', 'T'));
  const diffMs = now.getTime() - created.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffHours < 1) return 'たった今';
  if (diffHours < 24) return `${Math.floor(diffHours)}時間前`;
  if (diffDays < 2) return '昨日';
  if (diffDays < 7) return `${Math.floor(diffDays)}日前`;
  return `${Math.floor(diffDays / 7)}週間前`;
}

function getSidebarFilterLabel(
  filter: NonNullable<ReturnType<typeof useSidebarFilter>['sidebarFilter']>
): string {
  if (filter.kind === 'tag') return filter.tagName;
  if (filter.kind === 'collection') return filter.collectionName;
  return '';
}

export function HomeScreen({ navigation }: Props) {
  const { db, isReady } = useDatabase();
  const { colors, isDark } = useTheme();
  const { sidebarFilter, clearFilter } = useSidebarFilter();

  const [dueItems, setDueItems] = useState<ReviewableItem[]>([]);
  const [allItems, setAllItems] = useState<ReviewableItem[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [weeklyActivity, setWeeklyActivity] = useState<DailyActivity[]>([]);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [taggedItemIds, setTaggedItemIds] = useState<Set<number>>(new Set());

  const loadData = useCallback(async () => {
    if (!db || !isReady) return;
    setLoading(true);
    try {
      const [due, streak, completed, total, all, weekly, recent, catStats] = await Promise.all([
        getDueItems(db),
        getStreakDays(db),
        getTodayCompletedCount(db),
        getTotalItemCount(db),
        getAllReviewableItems(db),
        getWeeklyActivity(db),
        db.getAllAsync<RecentItem>(`
          SELECT id, type, title, source_url, category, created_at
          FROM items
          WHERE archived = 0
          ORDER BY created_at DESC
          LIMIT 10
        `),
        getCategoryStats(db),
      ]);
      setDueItems(due);
      setAllItems(all);
      setStreakDays(streak);
      setTodayCompleted(completed);
      setTotalItems(total);
      setWeeklyActivity(weekly);
      setRecentItems(recent);
      setCategoryStats(catStats);
    } catch (err) {
      console.error('[HomeScreen] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, [db, isReady]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // タグフィルター用 item ID セット
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

  // フィルター済み due アイテム
  const filteredDueItems = useMemo<ReviewableItem[]>(() => {
    if (!sidebarFilter) return dueItems;
    if (sidebarFilter.kind === 'tag') return dueItems.filter((ri) => taggedItemIds.has(ri.item.id));
    return dueItems;
  }, [sidebarFilter, dueItems, taggedItemIds]);

  // 期限切れ件数（today midnight 以前）
  const overdueCount = useMemo(() => {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    return filteredDueItems.filter((ri) => {
      const next = new Date(ri.item.review!.next_review_at.replace(' ', 'T'));
      return next < todayMidnight;
    }).length;
  }, [filteredDueItems]);

  // due状態ヒーロー用: カテゴリ一覧・推定時間
  const dueCategories = useMemo(() => {
    const cats = filteredDueItems
      .map((ri) => ri.item.category)
      .filter((c): c is string => c != null && c !== '');
    return [...new Set(cats)].slice(0, 3);
  }, [filteredDueItems]);

  const estimatedMinutes = useMemo(
    () => Math.max(1, Math.round(filteredDueItems.length * 0.5)),
    [filteredDueItems.length]
  );

  // 週間サマリー
  const weekActiveDays = useMemo(
    () => weeklyActivity.filter((d) => d.count > 0).length,
    [weeklyActivity]
  );
  const weekTotalReviewed = useMemo(
    () => weeklyActivity.reduce((acc, d) => acc + d.count, 0),
    [weeklyActivity]
  );

  // ウィジェット同期
  const quizItems = useMemo(
    () =>
      [...allItems]
        .sort(() => Math.random() - 0.5)
        .slice(0, 20)
        .map((ri) => ({ question: ri.item.title, answer: ri.item.content ?? '' })),
    [allItems]
  );
  const peekItems = useMemo(
    () =>
      [...allItems]
        .sort(() => Math.random() - 0.5)
        .slice(0, 20)
        .map((ri) => ({
          id: ri.item.id,
          question: ri.item.title,
          hintAnswer: generateHint(ri.item.content ?? ''),
        })),
    [allItems]
  );
  useWidgetData(dueItems.length, streakDays, totalItems, quizItems, peekItems);

  // ナビゲーションハンドラー
  const handleStartReview = () => navigation.navigate('ReviewSession', {});
  const handleStartExtraReview = () => navigation.navigate('ReviewSession', { forceAll: true });

  const handleOpenURLAnalysis = () => {
    navigation.getParent<DrawerNavigationProp<DrawerParamList>>()?.navigate(
      'Library',
      { screen: 'URLAnalysis', params: {} }
    );
  };

  const handleOpenManualAdd = () => {
    navigation.getParent<DrawerNavigationProp<DrawerParamList>>()?.navigate(
      'Library',
      { screen: 'AddItem', params: {} }
    );
  };

  const handleShortcut = (action: ShortcutAction) => {
    switch (action) {
      case 'review':     handleStartReview(); break;
      case 'url_add':    handleOpenURLAnalysis(); break;
      case 'manual_add': handleOpenManualAdd(); break;
      case 'library':
        navigation.getParent<DrawerNavigationProp<DrawerParamList>>()?.navigate('Library');
        break;
    }
  };

  const handlePressCategory = (category: string) => {
    navigation.getParent<DrawerNavigationProp<DrawerParamList>>()?.navigate(
      'Library',
      { screen: 'LibraryMain', params: { filterTag: category } }
    );
  };

  if (!isReady || loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* フィルターバッジ（モック未収録・サイドバーフィルター使用時のみ） */}
      {sidebarFilter && (
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: colors.accent + '22' }]}>
            <Text style={[styles.badgeText, { color: colors.accent }]}>
              {getSidebarFilterLabel(sidebarFilter)}
            </Text>
            <Pressable
              onPress={clearFilter}
              style={styles.badgeClear}
              accessibilityLabel="フィルターを解除"
              accessibilityRole="button"
            >
              <Text style={[styles.badgeClearText, { color: colors.accent }]}>×</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── [2] 週間アクティビティ（This Week） ────────── */}
      {totalItems > 0 && (
        <View style={styles.weeklyCard}>
          <Text style={[styles.labelUpper, { color: colors.labelTertiary, marginTop: 0 }]}>This Week</Text>
          <View style={styles.weeklyRow}>
            {weeklyActivity.map((day, i) => {
              const isToday = i === 6;
              const dotDate = new Date(day.date + 'T00:00:00');
              const dayLabel = ENG_DAY_LABELS[dotDate.getDay()];

              let dotState: 'strong' | 'done' | 'today-ring' | 'none';
              if (day.count >= 5) dotState = 'strong';
              else if (day.count >= 1) dotState = 'done';
              else if (isToday) dotState = 'today-ring';
              else dotState = 'none';

              const dotBg =
                dotState === 'strong' ? WEEK_BLUE
                : dotState === 'done' ? WEEK_BLUE_LIGHT
                : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

              const showCheck = dotState === 'strong' || dotState === 'done';
              const checkColor = dotState === 'strong' ? '#FFFFFF' : WEEK_BLUE;

              return (
                <View key={day.date} style={styles.dayCol}>
                  <Text
                    style={[
                      styles.dayLabel,
                      { color: isToday ? WEEK_BLUE : colors.labelTertiary },
                      isToday && { fontWeight: '700' as const },
                    ]}
                  >
                    {isToday ? 'Today' : dayLabel}
                  </Text>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: dotBg },
                      dotState === 'today-ring' && {
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderColor: WEEK_BLUE,
                      },
                    ]}
                  >
                    {showCheck && (
                      <Ionicons name="checkmark" size={16} color={checkColor} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
          <View style={[styles.weekSummary, { borderTopColor: colors.separator }]}>
            <Text style={[styles.weekSummaryText, { color: colors.labelSecondary }]}>
              今週{' '}
              <Text style={{ fontWeight: '700' as const }}>{weekActiveDays} / 7日</Text>
            </Text>
            <Text style={[styles.weekSummaryText, { color: colors.labelSecondary }]}>
              {weekTotalReviewed}枚 復習済み
            </Text>
          </View>
        </View>
      )}
      {totalItems > 0 && (
        <View style={[styles.sectionGap, { backgroundColor: colors.backgroundSecondary }]} />
      )}

      {/* ── [3] 復習ヒーローCTA ─────────────────────────── */}
      <ReviewCTACard
        dueCount={filteredDueItems.length}
        overdueCount={overdueCount}
        todayCompleted={todayCompleted}
        streakDays={streakDays}
        totalItems={totalItems}
        estimatedMinutes={estimatedMinutes}
        categories={dueCategories}
        onStart={handleStartReview}
        onStartExtra={handleStartExtraReview}
        onStartURLAdd={handleOpenURLAnalysis}
      />
      <View style={[styles.sectionGap, { backgroundColor: colors.backgroundSecondary }]} />

      {/* ── [4] Recently Added ──────────────────────────── */}
      {recentItems.length > 0 && (
        <>
          <Text style={[styles.labelUpper, { color: colors.labelTertiary }]}>Recently Added</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.recentScroll}
            contentContainerStyle={styles.recentScrollContent}
          >
            {recentItems.map((item) => {
              const catColor = getRecentCategoryColor(item.category);
              const relativeTime = getRelativeTime(item.created_at);
              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.recentCard,
                    { backgroundColor: colors.card, borderColor: colors.separator, opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
                  accessibilityRole="button"
                >
                  <View style={styles.recentCatRow}>
                    <View style={[styles.recentCatDot, { backgroundColor: catColor }]} />
                    <Text style={[styles.recentCatName, { color: colors.labelTertiary }]} numberOfLines={1}>
                      {item.category ?? '未分類'}
                    </Text>
                  </View>
                  <Text
                    style={[styles.recentCardTitle, { color: colors.label }]}
                    numberOfLines={3}
                  >
                    {item.title}
                  </Text>
                  <Text style={[styles.recentCardTime, { color: colors.labelTertiary }]}>{relativeTime}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      )}
      {/* sep（Recently Added がある場合は marginTop:20） */}
      <View
        style={[
          styles.sep,
          { backgroundColor: colors.separator },
          recentItems.length > 0 && { marginTop: 20 },
        ]}
      />

      {/* ── [7] Mastery ─────────────────────────────────── */}
      {categoryStats.length > 0 && (
        <CategoryMasteryBar stats={categoryStats} onPressCategory={handlePressCategory} />
      )}
      <View style={[styles.sep, { backgroundColor: colors.separator }]} />

      {/* ── [8] Shortcuts ───────────────────────────────── */}
      <ShortcutList onPress={handleShortcut} reviewDueCount={filteredDueItems.length} />
    </ScrollView>

    {/* ── FAB: URLから学習カード作成 ──────────────────── */}
    <Pressable
      onPress={handleOpenURLAnalysis}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
      ]}
      accessibilityLabel="URLから学習カードを作成"
      accessibilityRole="button"
    >
      <Ionicons name="add" size={28} color="#FFFFFF" />
    </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    paddingTop: Spacing.m,
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.xxl + 80,
  },

  // フィルターバッジ
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.s,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  badgeClear: {
    paddingLeft: 2,
  },
  badgeClearText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 16,
  },

  // ── 区切り線 ──────────────────────────────────────────
  // sep: container の paddingHorizontal:16 があるので marginHorizontal 不要
  // → 画面端から16pxの位置に自動的に配置される
  sep: {
    height: 1,
  },

  // section-gap: full-screen 幅（container の padding を打ち消す）
  sectionGap: {
    height: 8,
    marginHorizontal: -Spacing.m,
  },

  // ── [5] 週間アクティビティ ────────────────────────────
  weeklyCard: {
    backgroundColor: 'transparent',
    paddingBottom: 20,
    paddingHorizontal: 0,
  },
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  dayCol: {
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 11,
    lineHeight: 13,
  },
  weekSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: Spacing.m,
  },
  weekSummaryText: {
    fontSize: 13,
    lineHeight: 18,
  },

  // label-upper 共通スタイル
  labelUpper: {
    fontSize: 11,
    fontWeight: '500' as const,      // mockup .label-upper { font-weight:500 }
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginTop: Spacing.m,
    marginBottom: 14,
    // marginLeft なし: mockup に左インデントなし、container の padding のみ
  },

  // ── [6] Recently Added ────────────────────────────────
  recentScroll: {
    marginHorizontal: -Spacing.m,
  },
  recentScrollContent: {
    paddingHorizontal: Spacing.m,
    gap: 10, // mockup .recent-scroll { gap:10px }
  },
  recentCard: {
    width: 220,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: Spacing.s,
  },
  recentCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  recentCatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  recentCatName: {
    fontSize: 11,
    lineHeight: 15,
  },
  recentCardTitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  recentCardTime: {
    fontSize: 11,
    marginTop: 10,
  },

  // ── FAB ──────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    // Android shadow
    elevation: 6,
  },
});
