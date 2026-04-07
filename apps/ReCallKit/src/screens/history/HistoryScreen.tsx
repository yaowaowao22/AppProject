// ============================================================
// HistoryScreen - 学習履歴
// StreakRing・統計カード・マスタリー分布・復習セッション別履歴（展開/折りたたみ）
// セッションデータは review_sessions / review_session_items テーブルから取得
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { useDatabase } from '../../hooks/useDatabase';
import {
  getStreakDays,
  getTodayCompletedCount,
  getTotalItemCount,
  getAccuracyRate,
  getReviewSessions,
  getSessionItems,
  type ReviewSessionRecord,
  type ReviewSessionItemRecord,
} from '../../db/reviewRepository';
import {
  getMasterySummary,
  type MasterySummary,
  type MasteryLevel,
} from '../../db/queries';
import { StreakRing } from '../../components/StreakRing';
import { MasteryDistribution } from '../../components/MasteryDistribution';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import { SystemColors } from '../../theme/colors';
import type { DrawerParamList } from '../../navigation/types';

// Android で LayoutAnimation を有効化
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// マスタリーレベルのメタ情報（色・ラベル）
const MASTERY_META: { key: MasteryLevel; label: string; color: string }[] = [
  { key: 'master',   label: 'マスター', color: SystemColors.green  },
  { key: 'advanced', label: '上級',     color: SystemColors.blue   },
  { key: 'learning', label: '学習中',   color: SystemColors.orange },
  { key: 'new',      label: '未学習',   color: '#9E9EA7'            },
];

// アイテムタイプのラベルと色
const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  url:        { label: 'URL',      color: SystemColors.blue,   bg: SystemColors.blue   + '1F' },
  text:       { label: 'テキスト', color: SystemColors.green,  bg: SystemColors.green  + '1F' },
  screenshot: { label: '画像',     color: SystemColors.purple, bg: SystemColors.purple + '1F' },
};

// 評価ラベル
const QUALITY_LABEL: Record<number, { label: string; color: string }> = {
  5: { label: '簡単',       color: SystemColors.blue   },
  4: { label: '良かった',   color: SystemColors.green  },
  3: { label: '良かった',   color: SystemColors.green  },
  2: { label: '難しかった', color: SystemColors.orange },
  1: { label: 'もう一度',   color: '#FF3B30'            },
  0: { label: 'もう一度',   color: '#FF3B30'            },
};

function formatSessionTime(dateStr: string): string {
  const date = new Date(dateStr.replace(' ', 'T'));
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const time = `${hh}:${mm}`;

  if (date.toDateString() === todayStr) return `今日 ${time}`;
  if (date.toDateString() === yesterdayDate.toDateString()) return `昨日 ${time}`;

  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]}) ${time}`;
}

export function HistoryScreen() {
  const { db, isReady } = useDatabase();
  const { colors, isDark } = useTheme();
  const drawerNav = useNavigation<DrawerNavigationProp<DrawerParamList>>();

  const [streakDays, setStreakDays] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [masterySummary, setMasterySummary] = useState<MasterySummary | null>(null);
  const [masteredCount, setMasteredCount] = useState(0);
  const [accuracyRate, setAccuracyRate] = useState(0);
  const [sessions, setSessions] = useState<ReviewSessionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // 展開済みセッションID → そのアイテム一覧
  const [expandedItems, setExpandedItems] = useState<Record<number, ReviewSessionItemRecord[]>>({});

  const loadData = useCallback(async () => {
    if (!db || !isReady) return;
    setLoading(true);
    try {
      const [streak, completed, total, mastery, accuracy, sessionList] = await Promise.all([
        getStreakDays(db),
        getTodayCompletedCount(db),
        getTotalItemCount(db),
        getMasterySummary(db),
        getAccuracyRate(db),
        getReviewSessions(db, 30),
      ]);
      setStreakDays(streak);
      setTodayCompleted(completed);
      setTotalItems(total);
      setMasterySummary(mastery);
      setMasteredCount((mastery.advanced ?? 0) + (mastery.master ?? 0));
      setAccuracyRate(accuracy);
      setSessions(sessionList);
    } catch (err) {
      console.error('[HistoryScreen] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, [db, isReady]);

  const toggleExpand = useCallback(async (session: ReviewSessionRecord) => {
    const id = session.id;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (expandedItems[id]) {
      // 折りたたむ
      setExpandedItems((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      // 展開: アイテムを遅延ロード
      if (!db) return;
      const items = await getSessionItems(db, id);
      setExpandedItems((prev) => ({ ...prev, [id]: items }));
    }
  }, [db, expandedItems]);

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

      {/* ――― 復習セッション別履歴 ――― */}
      {sessions.length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>
              復習履歴
            </Text>
          </View>
          {sessions.map((session) => {
            const mastery = session.masterySnapshot;
            const total = mastery.total || 1;
            const items = expandedItems[session.id];
            const isExpanded = !!items;
            return (
              <View
                key={session.id}
                style={[styles.sessionCard, { backgroundColor: colors.card }, cardShadow]}
              >
                {/* ――― セッションヘッダー（タップで展開） ――― */}
                <Pressable
                  style={styles.sessionHeader}
                  onPress={() => toggleExpand(session)}
                >
                  <View style={styles.sessionHeaderTop}>
                    <Ionicons
                      name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                      size={16}
                      color={colors.labelSecondary}
                    />
                    <Ionicons name="time-outline" size={15} color={colors.labelSecondary} />
                    <Text style={[styles.sessionTime, { color: colors.label }]}>
                      {formatSessionTime(session.startedAt)}
                    </Text>
                    <Text style={[styles.sessionCount, { color: colors.labelTertiary }]}>
                      {session.cardCount}枚
                    </Text>
                    <Text style={[styles.sessionAccuracy, { color: session.accuracy >= 60 ? SystemColors.green : SystemColors.orange }]}>
                      {session.accuracy}%
                    </Text>
                  </View>

                  {/* スタック型マスタリー分布バー */}
                  {mastery.total > 0 && (
                    <View style={[styles.stackedBarTrack, { backgroundColor: colors.separator }]}>
                      {MASTERY_META.map(({ key, color }) => {
                        const count = mastery[key] ?? 0;
                        if (count === 0) return null;
                        const pct = (count / total) * 100;
                        return (
                          <View
                            key={key}
                            style={[
                              styles.stackedBarSegment,
                              // @ts-ignore - RN accepts percentage string for width
                              { width: `${pct}%`, backgroundColor: color },
                            ]}
                          />
                        );
                      })}
                    </View>
                  )}

                  {/* マスタリー凡例 */}
                  {mastery.total > 0 && (
                    <View style={styles.sessionLegend}>
                      {MASTERY_META.map(({ key, label, color }) => {
                        const count = mastery[key] ?? 0;
                        if (count === 0) return null;
                        return (
                          <View key={key} style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: color }]} />
                            <Text style={[styles.legendText, { color: colors.labelSecondary }]}>
                              {label} {count}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </Pressable>

                {/* ――― 展開時: アイテム詳細リスト ――― */}
                {isExpanded && (
                  <View style={[styles.expandedList, { borderTopColor: colors.separator }]}>
                    {items.map((ri) => {
                      const meta = TYPE_META[ri.type] ?? TYPE_META.text;
                      const masteryInfo = MASTERY_META.find((m) => m.key === ri.masteryLevel);
                      const ratingInfo = QUALITY_LABEL[ri.quality] ?? QUALITY_LABEL[0];
                      return (
                        <View
                          key={ri.id}
                          style={[styles.historyItem, { borderBottomColor: colors.separator }]}
                        >
                          <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
                            <Text style={[styles.typeBadgeText, { color: meta.color }]}>
                              {meta.label}
                            </Text>
                          </View>
                          <View style={styles.historyBody}>
                            <Text
                              style={[styles.historyTitle, { color: colors.label }]}
                              numberOfLines={1}
                            >
                              {ri.title}
                            </Text>
                            {ri.content ? (
                              <Text
                                style={[styles.historyPreview, { color: colors.labelSecondary }]}
                                numberOfLines={2}
                              >
                                {ri.content}
                              </Text>
                            ) : null}
                          </View>
                          <View style={styles.itemBadges}>
                            {masteryInfo && (
                              <View style={[styles.badgePill, { backgroundColor: masteryInfo.color + '1F' }]}>
                                <Text style={[styles.badgePillText, { color: masteryInfo.color }]}>
                                  {masteryInfo.label}
                                </Text>
                              </View>
                            )}
                            <View style={[styles.badgePill, { backgroundColor: ratingInfo.color + '1F' }]}>
                              <Text style={[styles.badgePillText, { color: ratingInfo.color }]}>
                                {ratingInfo.label}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
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

  // ――― StreakRing + 統計グリッド ―――
  historyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 20,
  },
  statGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    width: '45%',
    flexGrow: 1,
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '500' as const,
  },
  statLbl: {
    fontSize: 11,
    marginTop: 2,
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

  // ――― セクションタイトル ―――
  sectionHeader: {
    marginLeft: Spacing.xs,
  },
  sectionTitle: {
    ...TypeScale.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ――― セッションカード ―――
  sessionCard: {
    borderRadius: Radius.l,
    overflow: 'hidden',
  },
  sessionHeader: {
    padding: Spacing.m,
    gap: Spacing.s,
  },
  sessionHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionTime: {
    ...TypeScale.subheadline,
    fontWeight: '600' as const,
    flex: 1,
  },
  sessionCount: {
    ...TypeScale.caption1,
  },
  sessionAccuracy: {
    ...TypeScale.caption1,
    fontWeight: '600' as const,
    marginLeft: 4,
  },

  // ――― スタック型マスタリーバー ―――
  stackedBarTrack: {
    height: 6,
    borderRadius: Radius.full,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  stackedBarSegment: {
    height: '100%',
  },

  // ――― 凡例 ―――
  sessionLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  legendText: {
    ...TypeScale.caption2,
  },

  // ――― 展開リスト ―――
  expandedList: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  // ――― 履歴アイテム行 ―――
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: Spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  typeBadge: {
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xs,
    minWidth: 44,
    alignItems: 'center',
    flexShrink: 0,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '500' as const,
    lineHeight: 14,
  },
  historyBody: {
    flex: 1,
    minWidth: 0,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  historyPreview: {
    fontSize: 12,
    marginTop: 2,
  },
  itemBadges: {
    flexShrink: 0,
    alignItems: 'flex-end',
    gap: 4,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '600' as const,
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
