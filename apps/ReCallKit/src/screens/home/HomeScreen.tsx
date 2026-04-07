// ============================================================
// HomeScreen - 7セクション統合ダッシュボード
// ① フィルターバッジ
// ② ヒーロー CTAカード（empty / due / done 状態適応 + 1タップ復習）
// ③ StatsRow（streak / 今日完了 / 総アイテム）
// ④ ShortcutList（2×2クイックアクション）
// ⑤ 週間アクティビティドットグリッド
// ⑥ CategoryMasteryBar（カテゴリ別習熟度）
// ⑦ 最近追加（横スクロール）
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
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import { SystemColors } from '../../theme/colors';
import { useSidebarFilter } from '../../hooks/useSidebarFilter';
import { useWidgetData } from '../../hooks/useWidgetData';
import { generateHint } from '../../utils/generateHint';
import { StatsRow } from '../../components/StatsRow';
import { CategoryMasteryBar } from '../../components/CategoryMasteryBar';
import { ShortcutList, type ShortcutAction } from '../../components/ShortcutList';
import { DateRow } from '../../components/DateRow';
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

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

const RECENT_CATEGORY_COLORS: Record<string, string> = {
  Programming: '#1A73E8',
  Design: '#E8A000',
  Infrastructure: '#1E8E3E',
};

function getRecentCategoryColor(category: string | null): string {
  if (!category) return '#9AA0A6';
  return RECENT_CATEGORY_COLORS[category] ?? '#9AA0A6';
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
      dueItems.slice(0, 5).map((ri) => ({
        id: ri.item.id,
        question: ri.item.title,
        hintAnswer: generateHint(ri.item.content ?? ''),
      })),
    [dueItems]
  );
  useWidgetData(dueItems.length, streakDays, totalItems, quizItems, peekItems);

  // ナビゲーションハンドラー
  // 1タップ復習: HomeStack 内の ReviewSession に直接遷移（Drawer 経由不要）
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
      case 'map':
        navigation.getParent<DrawerNavigationProp<DrawerParamList>>()?.navigate('Map');
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
      <View style={[styles.center, { backgroundColor: colors.backgroundGrouped }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const cardShadow = isDark ? {} : CardShadow;

  // ヒーロー表示状態
  const heroState: 'empty' | 'due' | 'done' =
    totalItems === 0 ? 'empty' : filteredDueItems.length > 0 ? 'due' : 'done';

  return (
    <ScrollView
      style={{ backgroundColor: colors.backgroundGrouped }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* DateRow + 区切り線 */}
      <DateRow dueCount={filteredDueItems.length} />
      <View style={[styles.hr, { backgroundColor: colors.separator }]} />

      {/* ① フィルターバッジ */}
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

      {/* ② ヒーローCTAカード（3状態適応） */}
      <View style={[styles.heroCard, { backgroundColor: colors.card }, cardShadow]}>

        {/* empty: アイテム未登録 */}
        {heroState === 'empty' && (
          <View style={styles.heroBody}>
            <View style={[styles.heroIconCircle, { backgroundColor: colors.accent + '1A' }]}>
              <Ionicons name="sparkles-outline" size={28} color={colors.accent} />
            </View>
            <View style={styles.heroTexts}>
              <Text style={[styles.heroTitle, { color: colors.label }]}>ようこそ！</Text>
              <Text style={[styles.heroSub, { color: colors.labelSecondary }]}>
                URLを追加して最初のフラッシュカードを作りましょう
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.heroCTA,
                { backgroundColor: pressed ? colors.accent + 'CC' : colors.accent },
              ]}
              onPress={handleOpenURLAnalysis}
              accessibilityRole="button"
              accessibilityLabel="URLから学習カードを追加"
            >
              <Ionicons name="link-outline" size={18} color="#FFFFFF" />
              <Text style={styles.heroCTAText}>URLから追加</Text>
            </Pressable>
          </View>
        )}

        {/* due: 復習が残っている（モック準拠） */}
        {heroState === 'due' && (
          <>
            {/* イラスト帯 */}
            <View style={styles.reviewIllust}>
              {/* 装飾カード（回転） */}
              <View style={[styles.illustCard, styles.illustCardBack2]} />
              <View style={[styles.illustCard, styles.illustCardBack1]} />
              <View style={[styles.illustCard, styles.illustCardFront]} />
            </View>

            {/* ボディ */}
            <View style={styles.reviewBody}>
              {/* タイトル行: "今日の復習 N件" */}
              <Text style={[styles.reviewTitle, { color: colors.label }]}>
                今日の復習{' '}
                <Text style={styles.reviewTitleCount}>{filteredDueItems.length}件</Text>
              </Text>

              {/* メタ行: 推定時間 · カテゴリ */}
              <Text style={styles.reviewMeta}>
                推定 {estimatedMinutes}分
                {dueCategories.length > 0 && ` · ${dueCategories.join(', ')}`}
              </Text>

              {/* 期限切れ（条件付き） */}
              {overdueCount > 0 && (
                <Text style={styles.reviewOverdue}>期限切れ {overdueCount}件</Text>
              )}

              {/* CTAボタン */}
              <Pressable
                style={({ pressed }) => [
                  styles.reviewStartBtn,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleStartReview}
                accessibilityRole="button"
                accessibilityLabel="復習を始める"
              >
                <Ionicons name="play-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.reviewStartBtnText}>復習を始める</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* done: 本日分完了 */}
        {heroState === 'done' && (
          <View style={styles.heroBody}>
            <View style={styles.doneRow}>
              <View style={[styles.doneIconWrap, { backgroundColor: colors.success + '1F' }]}>
                <Ionicons name="checkmark-circle" size={32} color={colors.success} />
              </View>
              <View style={styles.doneTexts}>
                <Text style={[styles.doneTitle, { color: colors.success }]}>本日分完了！</Text>
                <Text style={[styles.doneSub, { color: colors.labelSecondary }]}>
                  今日 {todayCompleted} 件復習・{streakDays}日連続
                </Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.extraBtn,
                { borderColor: colors.accent, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleStartExtraReview}
              accessibilityRole="button"
              accessibilityLabel="追加学習を始める"
            >
              <Text style={[styles.extraBtnText, { color: colors.accent }]}>
                追加学習を始める
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* ③ StatsRow */}
      <StatsRow
        stats={[
          {
            value: streakDays,
            label: '連続日数',
            color: streakDays > 0 ? SystemColors.orange : undefined,
          },
          {
            value: todayCompleted,
            label: '今日完了',
            color: todayCompleted > 0 ? SystemColors.green : undefined,
          },
          { value: totalItems, label: '総アイテム' },
        ]}
      />

      {/* ④ ShortcutList */}
      {totalItems > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>
            クイックアクション
          </Text>
          <ShortcutList onPress={handleShortcut} reviewDueCount={filteredDueItems.length} />
        </>
      )}

      {/* ⑤ 週間アクティビティ */}
      {totalItems > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>
            今週のアクティビティ
          </Text>
          <View style={[styles.weeklyCard, { backgroundColor: colors.card }, cardShadow]}>
            <View style={styles.weeklyRow}>
              {weeklyActivity.map((day, i) => {
                const isToday = i === 6;
                const dotDate = new Date(day.date + 'T00:00:00');
                const dayLabel = DAY_LABELS[dotDate.getDay()];
                const intensity =
                  day.count === 0 ? 0 : day.count <= 2 ? 1 : day.count <= 5 ? 2 : 3;
                const dotBg =
                  intensity === 0
                    ? isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                    : intensity === 1 ? colors.accent + '55'
                    : intensity === 2 ? colors.accent + 'AA'
                    : colors.accent;
                return (
                  <View key={day.date} style={styles.dayCol}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: dotBg },
                        isToday && { borderWidth: 2, borderColor: colors.accent },
                      ]}
                    >
                      {day.count > 0 && (
                        <Text style={styles.dotCount}>
                          {day.count > 9 ? '9+' : String(day.count)}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.dayLabel,
                        { color: isToday ? colors.accent : colors.labelTertiary },
                        isToday && { fontWeight: '700' as const },
                      ]}
                    >
                      {dayLabel}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </>
      )}

      {/* ⑥ CategoryMasteryBar */}
      {categoryStats.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>
            カテゴリ別習熟度
          </Text>
          <CategoryMasteryBar stats={categoryStats} onPressCategory={handlePressCategory} />
        </>
      )}

      {/* ⑦ 最近追加 */}
      {recentItems.length > 0 && (
        <>
          <Text style={styles.labelUpper}>Recently Added</Text>
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
                    { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
                  accessibilityRole="button"
                >
                  {/* カテゴリ行: ドット + カテゴリ名 */}
                  <View style={styles.recentCatRow}>
                    <View style={[styles.recentCatDot, { backgroundColor: catColor }]} />
                    <Text style={styles.recentCatName} numberOfLines={1}>
                      {item.category ?? '未分類'}
                    </Text>
                  </View>

                  {/* 質問テキスト */}
                  <Text
                    style={[styles.recentCardTitle, { color: colors.label }]}
                    numberOfLines={3}
                  >
                    {item.title}
                  </Text>

                  {/* 相対時刻 */}
                  <Text style={styles.recentCardTime}>{relativeTime}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
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

  // ① フィルターバッジ
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
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

  // hr 区切り線
  hr: {
    height: 1,
    marginHorizontal: 16,
  },

  // ② ヒーローカード
  heroCard: {
    borderRadius: Radius.l,
    overflow: 'hidden',
  },
  heroBody: {
    padding: Spacing.l,
    gap: Spacing.m,
  },

  // due: イラスト帯
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

  // due: ボディ
  reviewBody: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 6,
  },
  reviewTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  reviewTitleCount: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  reviewMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: '#5F6368',
  },
  reviewOverdue: {
    fontSize: 13,
    lineHeight: 18,
    color: '#D93025',
    fontWeight: '500' as const,
  },
  reviewStartBtn: {
    backgroundColor: '#1A73E8',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: 16,
  },
  reviewStartBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
  },

  // empty 状態
  heroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  heroTexts: {
    gap: Spacing.xs,
  },
  heroTitle: {
    ...TypeScale.title3,
    fontWeight: '700' as const,
  },
  heroSub: {
    ...TypeScale.subheadline,
  },
  // done 状態
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
  },
  doneIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTexts: {
    flex: 1,
    gap: 2,
  },
  doneTitle: {
    ...TypeScale.title3,
    fontWeight: '700' as const,
  },
  doneSub: {
    ...TypeScale.subheadline,
  },
  // 共通CTA
  heroCTA: {
    borderRadius: Radius.m,
    paddingVertical: Spacing.m,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  heroCTAText: {
    ...TypeScale.headline,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  // 追加学習ボタン（アウトライン）
  extraBtn: {
    borderRadius: Radius.m,
    paddingVertical: Spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  extraBtnText: {
    ...TypeScale.headline,
    fontWeight: '600' as const,
  },

  // セクションタイトル
  sectionTitle: {
    ...TypeScale.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: Spacing.xs,
    marginBottom: -Spacing.xs,
  },

  // ⑤ 週間アクティビティ
  weeklyCard: {
    borderRadius: Radius.l,
    padding: Spacing.m,
  },
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  dotCount: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    lineHeight: 13,
  },
  dayLabel: {
    fontSize: 11,
    lineHeight: 13,
  },

  // label-upper 共通スタイル
  labelUpper: {
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    color: '#9AA0A6',
    marginLeft: Spacing.xs,
    marginBottom: -Spacing.xs,
  },

  // ⑦ 最近追加
  recentScroll: {
    marginHorizontal: -Spacing.m,
  },
  recentScrollContent: {
    paddingHorizontal: Spacing.m,
    gap: Spacing.s,
  },
  recentCard: {
    width: 220,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DADCE0',
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
    color: '#9AA0A6',
    lineHeight: 15,
  },
  recentCardTitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  recentCardTime: {
    fontSize: 11,
    color: '#9AA0A6',
    marginTop: 10,
  },
});
