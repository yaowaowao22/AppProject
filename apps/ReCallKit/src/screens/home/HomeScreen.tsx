// ============================================================
// HomeScreen - 今日のダッシュボード
// ストリークリング・URL解析導線・最近復習した内容
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
import { getWeeklyActivity, type DailyActivity } from '../../db/queries';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import { SystemColors } from '../../theme/colors';
import { useSidebarFilter } from '../../hooks/useSidebarFilter';
import { useWidgetData } from '../../hooks/useWidgetData';
import { generateHint } from '../../utils/generateHint';
import type { HomeStackParamList, DrawerParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

// 最近追加アイテムの簡易型（表示用）
interface RecentItem {
  id: number;
  type: string;
  title: string;
  source_url: string | null;
  category: string | null;
  created_at: string;
}

// 曜日ラベル（日曜=0）
const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

// サイドバーフィルターのラベル文字列を生成
function getSidebarFilterLabel(filter: NonNullable<ReturnType<typeof useSidebarFilter>['sidebarFilter']>): string {
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<DailyActivity[]>([]);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  // タグフィルター用: タグが付いているアイテムIDのセット（非同期取得）
  const [taggedItemIds, setTaggedItemIds] = useState<Set<number>>(new Set());

  const loadData = useCallback(async () => {
    if (!db || !isReady) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [due, streak, completed, total, all, weekly, recent] = await Promise.all([
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
      ]);
      setDueItems(due);
      setAllItems(all);
      setStreakDays(streak);
      setTodayCompleted(completed);
      setTotalItems(total);
      setWeeklyActivity(weekly);
      setRecentItems(recent);
    } catch (err) {
      console.error('[HomeScreen] loadData error:', err);
      setLoadError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [db, isReady]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // サイドバーフィルターを dueItems に適用（overdueCount より前に宣言が必要）
  const sidebarFilteredItemsEarly = useMemo<ReviewableItem[]>(() => {
    if (!sidebarFilter) return dueItems;
    if (sidebarFilter.kind === 'tag') {
      return dueItems.filter((ri) => taggedItemIds.has(ri.item.id));
    }
    return dueItems;
  }, [sidebarFilter, dueItems, taggedItemIds]);

  // 期限切れアイテム数（today midnight より前が due のもの）
  const overdueCount = useMemo(() => {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    return sidebarFilteredItemsEarly.filter((ri) => {
      const next = new Date(ri.item.review!.next_review_at.replace(' ', 'T'));
      return next < todayMidnight;
    }).length;
  }, [sidebarFilteredItemsEarly]);

  // ウィジェット用Q&Aデータ（全アイテムからランダムに最大20件）
  const quizItems = useMemo(() => {
    const shuffled = [...allItems].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 20).map((ri) => ({
      question: ri.item.title,
      answer: ri.item.content ?? '',
    }));
  }, [allItems]);

  // Flashcard Peek ウィジェット用（due順に最大5件、穴埋めヒント付き）
  const peekItems = useMemo(() => {
    return dueItems.slice(0, 5).map((ri) => ({
      id: ri.item.id,
      question: ri.item.title,
      hintAnswer: generateHint(ri.item.content ?? ''),
    }));
  }, [dueItems]);

  // iOS ウィジェットへデータを同期
  useWidgetData(dueItems.length, streakDays, totalItems, quizItems, peekItems);

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

  const handleStartExtraReview = () => {
    navigation.getParent<DrawerNavigationProp<DrawerParamList>>()?.navigate(
      'Review',
      { screen: 'ReviewSession', params: { forceAll: true } }
    );
  };

  const handleOpenURLAnalysis = () => {
    // LibraryStack 内の URLAnalysis モーダルへネストナビゲート
    navigation.getParent<DrawerNavigationProp<DrawerParamList>>()?.navigate(
      'Library',
      { screen: 'URLAnalysis', params: {} }
    );
  };

  // sidebarFilteredItems は overdueCount より前に宣言済み（sidebarFilteredItemsEarly として）
  const sidebarFilteredItems = sidebarFilteredItemsEarly;

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

      {/* ――― 空状態ウェルカムメッセージ ――― */}
      {totalItems === 0 && (
        <View style={[styles.welcomeCard, { backgroundColor: colors.accent + '1A' }]}>
          <Ionicons name="sparkles-outline" size={20} color={colors.accent} />
          <Text style={[styles.welcomeText, { color: colors.accent }]}>
            ようこそ！URLを追加して学習を始めましょう
          </Text>
        </View>
      )}

      {/* ――― 今日の復習カード ――― */}
      <View style={[styles.heroCard, { backgroundColor: colors.card }, cardShadow]}>
        <View style={styles.heroHeader}>
          <Text style={[styles.heroCountText, { color: colors.label }]}>
            今日の復習　{sidebarFilteredItems.length}件
          </Text>
          {overdueCount > 0 && sidebarFilteredItems.length > 0 && (
            <View style={[styles.overdueBadge, { backgroundColor: SystemColors.orange + '22' }]}>
              <Ionicons name="time-outline" size={12} color={SystemColors.orange} />
              <Text style={[styles.overdueBadgeText, { color: SystemColors.orange }]}>
                うち {overdueCount} 件が期限切れ
              </Text>
            </View>
          )}
        </View>

        {/* スタートボタン or 完了/空状態メッセージ */}
        {sidebarFilteredItems.length > 0 ? (
          <View style={styles.startButtonSection}>
            <Pressable
              style={({ pressed }) => [
                styles.startButton,
                overdueCount > 0
                  ? { backgroundColor: pressed ? SystemColors.orange + 'CC' : SystemColors.orange }
                  : { backgroundColor: pressed ? colors.accent + 'CC' : colors.accent },
              ]}
              onPress={handleStartReview}
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
            {overdueCount > 0 && (
              <Text style={[styles.startButtonHint, { color: SystemColors.orange }]}>
                期限切れが {overdueCount} 件あります。早めに復習しましょう
              </Text>
            )}
          </View>
        ) : totalItems === 0 ? (
          <View style={styles.allDoneRow}>
            <Text style={[styles.allDoneText, { color: colors.labelSecondary }]}>
              アイテムを追加して復習を始めましょう
            </Text>
          </View>
        ) : (
          <View style={styles.extraLearningSection}>
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
            <Text style={[styles.extraLearningHint, { color: colors.labelSecondary }]}>
              追加学習しますか？
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.extraLearningButton,
                { borderColor: colors.accent, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleStartExtraReview}
              accessibilityRole="button"
              accessibilityLabel="追加学習を始める"
            >
              <Text style={[styles.extraLearningButtonText, { color: colors.accent }]}>
                追加学習を始める
              </Text>
            </Pressable>
          </View>
        )}

      </View>

      {/* ――― URL解析導線 ――― */}
      <Pressable
        style={({ pressed }) => [
          styles.urlAnalysisCard,
          { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 },
          cardShadow,
        ]}
        onPress={handleOpenURLAnalysis}
        accessibilityRole="button"
        accessibilityLabel="URL解析で学習カードを作成"
      >
        <View style={[styles.urlAnalysisIcon, { backgroundColor: colors.accent + '1A' }]}>
          <Ionicons name="link-outline" size={22} color={colors.accent} />
        </View>
        <View style={styles.urlAnalysisContent}>
          <Text style={[styles.urlAnalysisTitle, { color: colors.label }]}>
            URLから学習カードを作成
          </Text>
          <Text style={[styles.urlAnalysisSub, { color: colors.labelSecondary }]}>
            AIがQ&Aを自動生成します
          </Text>
        </View>
        <Text style={[styles.urlAnalysisChevron, { color: colors.labelTertiary }]}>›</Text>
      </Pressable>

      {/* ――― 週間アクティビティ ――― */}
      {totalItems > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>
            今週のアクティビティ
          </Text>
          <View style={[styles.weeklyCard, { backgroundColor: colors.card }, cardShadow]}>
            <View style={styles.weeklyGridRow}>
              {weeklyActivity.map((day, i) => {
                const isToday = i === 6;
                const dotDate = new Date(day.date + 'T00:00:00');
                const dayLabel = DAY_LABELS[dotDate.getDay()];
                const intensity = day.count === 0 ? 0 : day.count <= 2 ? 1 : day.count <= 5 ? 2 : 3;
                const dotBg =
                  intensity === 0
                    ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')
                    : intensity === 1
                    ? colors.accent + '55'
                    : intensity === 2
                    ? colors.accent + 'AA'
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

      {/* ――― 最近追加 ――― */}
      {recentItems.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>
            最近追加
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.recentScrollView}
            contentContainerStyle={styles.recentScrollContent}
          >
            {recentItems.map((item) => {
              const isUrl = item.type === 'url' && item.source_url;
              const iconName = isUrl ? 'link-outline' : 'document-text-outline';
              const dateStr = item.created_at.slice(5, 10).replace('-', '/');
              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.recentCard,
                    { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 },
                    cardShadow,
                  ]}
                  onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
                  accessibilityRole="button"
                >
                  <View style={[styles.recentCardIconWrap, { backgroundColor: colors.accent + '1A' }]}>
                    <Ionicons name={iconName} size={16} color={colors.accent} />
                  </View>
                  <Text
                    style={[styles.recentCardTitle, { color: colors.label }]}
                    numberOfLines={3}
                  >
                    {item.title}
                  </Text>
                  <View style={styles.recentCardFooter}>
                    {item.category ? (
                      <Text
                        style={[styles.recentCardCategory, { color: colors.accent }]}
                        numberOfLines={1}
                      >
                        {item.category}
                      </Text>
                    ) : (
                      <View />
                    )}
                    <Text style={[styles.recentCardDate, { color: colors.labelTertiary }]}>
                      {dateStr}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      )}

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
  welcomeCard: {
    borderRadius: Radius.l,
    padding: Spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  welcomeText: {
    ...TypeScale.subheadline,
    flex: 1,
    fontWeight: '500' as const,
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
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
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
  heroHeader: {
    gap: Spacing.s,
  },
  heroCountText: {
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
  startButtonSection: {
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
  startButtonHint: {
    ...TypeScale.caption1,
    textAlign: 'center',
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
  completedCountLabel: {
    ...TypeScale.caption1,
  },
  allDoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  allDoneIcon: {
    ...TypeScale.body,
    fontWeight: '600' as const,
  },
  allDoneText: {
    ...TypeScale.body,
    fontWeight: '600' as const,
  },
  extraLearningSection: {
    gap: Spacing.s,
  },
  extraLearningHint: {
    ...TypeScale.subheadline,
  },
  extraLearningButton: {
    borderRadius: Radius.m,
    paddingVertical: Spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  extraLearningButtonText: {
    ...TypeScale.headline,
  },
  // ――― URL解析カード ―――
  urlAnalysisCard: {
    borderRadius: Radius.m,
    padding: Spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
  },
  urlAnalysisIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlAnalysisContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  urlAnalysisTitle: {
    ...TypeScale.body,
    fontWeight: '500' as const,
  },
  urlAnalysisSub: {
    ...TypeScale.caption1,
  },
  urlAnalysisChevron: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '300' as const,
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

  // ――― 週間ドットグリッド ―――
  weeklyCard: {
    borderRadius: Radius.l,
    padding: Spacing.m,
  },
  weeklyGridRow: {
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

  // ――― 横スクロールRecentlyAdded ―――
  recentScrollView: {
    marginHorizontal: -Spacing.m,
  },
  recentScrollContent: {
    paddingHorizontal: Spacing.m,
    gap: Spacing.s,
  },
  recentCard: {
    width: 144,
    borderRadius: Radius.m,
    padding: Spacing.m,
    gap: Spacing.s,
    justifyContent: 'space-between',
    minHeight: 120,
  },
  recentCardIconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.s,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  recentCardTitle: {
    ...TypeScale.caption1,
    fontWeight: '500' as const,
    flex: 1,
    lineHeight: 16,
  },
  recentCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  recentCardCategory: {
    fontSize: 10,
    fontWeight: '600' as const,
    lineHeight: 12,
    flex: 1,
  },
  recentCardDate: {
    fontSize: 10,
    lineHeight: 12,
    flexShrink: 0,
  },
});
