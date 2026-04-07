// ============================================================
// HistoryScreen - 学習履歴
// StreakRing・統計カード・マスタリー分布・復習セッション別履歴
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
  toMasteryLevel,
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

// マスタリーレベルのメタ情報（色・ラベル）
const MASTERY_META: { key: MasteryLevel; label: string; color: string }[] = [
  { key: 'master',   label: 'マスター', color: SystemColors.green  },
  { key: 'advanced', label: '上級',     color: SystemColors.blue   },
  { key: 'learning', label: '学習中',   color: SystemColors.orange },
  { key: 'new',      label: '未学習',   color: '#9E9EA7'            },
];

// セッション型: 近い時間帯に復習されたアイテム群
interface ReviewSession {
  /** セッション開始時刻（最も早い last_reviewed_at） */
  startTime: Date;
  /** セッション内のアイテム一覧 */
  items: ReviewableItem[];
  /** マスタリー分布 */
  mastery: { new: number; learning: number; advanced: number; master: number; total: number };
}

/** 30分以内の復習を同一セッションとしてクラスタリング */
const SESSION_GAP_MS = 30 * 60 * 1000;

/**
 * ReviewableItem[] を復習セッション単位にグループ化
 * last_reviewed_at 降順ソート済みを前提
 */
function groupIntoSessions(items: ReviewableItem[]): ReviewSession[] {
  if (items.length === 0) return [];

  // last_reviewed_at 降順ソート
  const sorted = [...items].sort((a, b) => {
    const aT = a.item.review?.last_reviewed_at ?? '';
    const bT = b.item.review?.last_reviewed_at ?? '';
    return aT > bT ? -1 : aT < bT ? 1 : 0;
  });

  const sessions: ReviewSession[] = [];
  let currentItems: ReviewableItem[] = [sorted[0]];
  let currentTime = new Date(
    (sorted[0].item.review?.last_reviewed_at ?? '').replace(' ', 'T')
  );

  for (let i = 1; i < sorted.length; i++) {
    const ri = sorted[i];
    const t = new Date(
      (ri.item.review?.last_reviewed_at ?? '').replace(' ', 'T')
    );
    // 前のアイテムとの差が30分以内なら同一セッション
    if (currentTime.getTime() - t.getTime() <= SESSION_GAP_MS) {
      currentItems.push(ri);
    } else {
      sessions.push(buildSession(currentItems));
      currentItems = [ri];
    }
    currentTime = t;
  }
  sessions.push(buildSession(currentItems));

  return sessions;
}

/** セッション内のマスタリー分布を算出 */
function buildSession(items: ReviewableItem[]): ReviewSession {
  const mastery = { new: 0, learning: 0, advanced: 0, master: 0, total: items.length };
  for (const ri of items) {
    const r = ri.item.review;
    if (r) {
      mastery[toMasteryLevel({ repetitions: r.repetitions, easiness_factor: r.easiness_factor })]++;
    } else {
      mastery.new++;
    }
  }
  // セッション開始時刻 = 最も早い last_reviewed_at
  const times = items
    .map((ri) => ri.item.review?.last_reviewed_at)
    .filter((t): t is string => !!t)
    .map((t) => new Date(t.replace(' ', 'T')).getTime());
  const startTime = new Date(times.length > 0 ? Math.min(...times) : Date.now());

  return { startTime, items, mastery };
}

/** セッション時刻を「今日 14:30」「昨日 9:15」「4/5 14:30」形式で表示 */
function formatSessionTime(date: Date): string {
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toDateString();

  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const time = `${hh}:${mm}`;

  if (date.toDateString() === todayStr) return `今日 ${time}`;
  if (date.toDateString() === yesterdayStr) return `昨日 ${time}`;
  return `${date.getMonth() + 1}/${date.getDate()} ${time}`;
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

  // セッション単位にグループ化（新しい順）
  const sessions = useMemo(
    () => groupIntoSessions(recentlyReviewed),
    [recentlyReviewed]
  );

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
          {sessions.map((session, idx) => {
            const total = session.mastery.total || 1;
            return (
              <View
                key={session.startTime.getTime() + '-' + idx}
                style={[styles.sessionCard, { backgroundColor: colors.card }, cardShadow]}
              >
                {/* ヘッダー: 時刻 + カード数 */}
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionTimeRow}>
                    <Ionicons name="time-outline" size={16} color={colors.labelSecondary} />
                    <Text style={[styles.sessionTime, { color: colors.label }]}>
                      {formatSessionTime(session.startTime)}
                    </Text>
                  </View>
                  <Text style={[styles.sessionCount, { color: colors.labelTertiary }]}>
                    {session.mastery.total}カード
                  </Text>
                </View>

                {/* スタック型マスタリー分布バー */}
                <View style={[styles.stackedBarTrack, { backgroundColor: colors.separator }]}>
                  {MASTERY_META.map(({ key, color }) => {
                    const count = session.mastery[key];
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

                {/* マスタリー凡例 */}
                <View style={styles.sessionLegend}>
                  {MASTERY_META.map(({ key, label, color }) => {
                    const count = session.mastery[key];
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
    padding: Spacing.m,
    gap: Spacing.s,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sessionTime: {
    ...TypeScale.subheadline,
    fontWeight: '600' as const,
  },
  sessionCount: {
    ...TypeScale.caption1,
  },

  // ――― スタック型マスタリー分布バー ―――
  stackedBarTrack: {
    height: 8,
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
