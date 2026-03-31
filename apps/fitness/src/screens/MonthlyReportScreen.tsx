import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BODY_PARTS, EXERCISES } from '../exerciseDB';
import { RADIUS, SPACING, TYPOGRAPHY } from '../theme';
import type { TanrenThemeColors } from '../theme';
import type { BodyPart } from '../types';
import { useTheme } from '../ThemeContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { useWorkout } from '../WorkoutContext';

// ── ヘルパー ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function fmtVol(vol: number): string {
  return vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : String(Math.round(vol));
}

// ── MonthlyReportScreen ───────────────────────────────────────────────────────

export default function MonthlyReportScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { workouts } = useWorkout();

  const [displayMonth, setDisplayMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth(); // 0-indexed

  // ── 選択月のワークアウトを抽出 ────────────────────────────────────────────
  const monthWorkouts = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return workouts.filter(w => w.date.startsWith(prefix));
  }, [workouts, year, month]);

  // ── 月間サマリー ──────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const workoutCount = monthWorkouts.length;
    const totalVolume = monthWorkouts.reduce((s, w) => s + w.totalVolume, 0);
    const totalSets = monthWorkouts.reduce(
      (s, w) => s + w.sessions.reduce((s2, sess) => s2 + sess.sets.length, 0),
      0,
    );
    const avgDuration =
      workoutCount > 0
        ? Math.round(
            monthWorkouts.reduce((s, w) => s + w.duration, 0) / workoutCount / 60,
          )
        : 0;
    return { workoutCount, totalVolume, totalSets, avgDuration };
  }, [monthWorkouts]);

  // ── 部位別ボリューム ──────────────────────────────────────────────────────
  const bodyPartData = useMemo(() => {
    const volMap: Record<BodyPart, number> = {
      chest: 0, back: 0, legs: 0, shoulders: 0, arms: 0, core: 0,
    };
    for (const daily of monthWorkouts) {
      for (const session of daily.sessions) {
        const ex = EXERCISES.find(e => e.id === session.exerciseId);
        if (!ex) continue;
        const vol = session.sets.reduce(
          (s, set) =>
            s + (set.weight != null && set.reps != null ? set.weight * set.reps : 0),
          0,
        );
        volMap[ex.bodyPart] += vol;
      }
    }
    const maxVol = Math.max(...Object.values(volMap), 0);
    return BODY_PARTS.map(bp => ({
      id: bp.id as BodyPart,
      label: bp.label,
      volume: volMap[bp.id as BodyPart],
      ratio: maxVol > 0 ? volMap[bp.id as BodyPart] / maxVol : 0,
      isMax: maxVol > 0 && volMap[bp.id as BodyPart] === maxVol,
    }));
  }, [monthWorkouts]);

  // ── 日別ボリューム（選択月の各日）────────────────────────────────────────
  const dailyData = useMemo(() => {
    const todayStr = toDateStr(new Date());
    const lastDayNum = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: lastDayNum }, (_, i) => {
      const d = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const daily = monthWorkouts.find(w => w.date === dateStr);
      return {
        dateStr,
        label: `${month + 1}/${d}`,
        volume: daily?.totalVolume ?? 0,
        isToday: dateStr === todayStr,
      };
    });
  }, [monthWorkouts, year, month]);

  const maxDailyVol = useMemo(
    () => Math.max(...dailyData.map(d => d.volume), 1),
    [dailyData],
  );

  // ── 種目別ランキング TOP5 ─────────────────────────────────────────────────
  const exerciseRanking = useMemo(() => {
    const map: Record<string, { name: string; volume: number; sets: number }> = {};
    for (const daily of monthWorkouts) {
      for (const session of daily.sessions) {
        const ex = EXERCISES.find(e => e.id === session.exerciseId);
        const name = ex?.name ?? session.exerciseId;
        const vol = session.sets.reduce(
          (s, set) =>
            s + (set.weight != null && set.reps != null ? set.weight * set.reps : 0),
          0,
        );
        if (!map[session.exerciseId]) {
          map[session.exerciseId] = { name, volume: 0, sets: 0 };
        }
        map[session.exerciseId].volume += vol;
        map[session.exerciseId].sets += session.sets.length;
      }
    }
    return Object.entries(map)
      .sort((a, b) => b[1].volume - a[1].volume)
      .slice(0, 5)
      .map(([id, d], i) => ({ id, rank: i + 1, ...d }));
  }, [monthWorkouts]);

  const monthLabel = `${year}年${month + 1}月`;
  const isEmpty = monthWorkouts.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScreenHeader title="月間レポート" showHamburger />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      {/* ── 月選択 ── */}
      <View style={styles.monthSelector}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() =>
            setDisplayMonth(prev => {
              const d = new Date(prev);
              d.setMonth(d.getMonth() - 1);
              return d;
            })
          }
          accessibilityLabel="前の月"
          accessibilityRole="button"
        >
          <Text style={styles.navText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel} accessibilityLabel={monthLabel}>
          {monthLabel}
        </Text>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() =>
            setDisplayMonth(prev => {
              const d = new Date(prev);
              d.setMonth(d.getMonth() + 1);
              return d;
            })
          }
          accessibilityLabel="次の月"
          accessibilityRole="button"
        >
          <Text style={styles.navText}>›</Text>
        </TouchableOpacity>
      </View>

      {isEmpty ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>この月のトレーニング記録はありません</Text>
        </View>
      ) : (
        <>
          {/* ── 月間サマリーカード ── */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <View style={styles.numRow}>
                  <Text style={styles.numText}>{summary.workoutCount}</Text>
                  <Text style={styles.unitText}>回</Text>
                </View>
                <Text style={styles.summaryLabel}>トレーニング</Text>
              </View>
              <View style={[styles.summaryItem, styles.itemBorderL]}>
                <View style={styles.numRow}>
                  <Text style={styles.numText}>{fmtVol(summary.totalVolume)}</Text>
                  <Text style={styles.unitText}>kg</Text>
                </View>
                <Text style={styles.summaryLabel}>総ボリューム</Text>
              </View>
            </View>
            <View style={[styles.summaryRow, styles.rowBorderT]}>
              <View style={styles.summaryItem}>
                <View style={styles.numRow}>
                  <Text style={styles.numText}>{summary.totalSets}</Text>
                  <Text style={styles.unitText}>set</Text>
                </View>
                <Text style={styles.summaryLabel}>総セット数</Text>
              </View>
              <View style={[styles.summaryItem, styles.itemBorderL]}>
                <View style={styles.numRow}>
                  <Text style={styles.numText}>{summary.avgDuration}</Text>
                  <Text style={styles.unitText}>分</Text>
                </View>
                <Text style={styles.summaryLabel}>平均時間</Text>
              </View>
            </View>
          </View>

          {/* ── 部位別ボリューム分布 ── */}
          {/* アクセント箇所1: 最大値バー背景 accentDim */}
          <Text style={styles.sectionLabel}>部位別ボリューム</Text>
          <View style={styles.bodyPartCard}>
            {bodyPartData.map((bp, idx) => (
              <View
                key={bp.id}
                style={[styles.bodyPartRow, idx > 0 && styles.bodyPartRowBorder]}
              >
                <Text style={styles.partLabel}>{bp.label}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      bp.volume > 0 && { width: `${Math.max(bp.ratio * 100, 2)}%` as any },
                      bp.isMax && styles.barFillMax,
                    ]}
                  />
                </View>
                <Text style={styles.partVolume}>
                  {bp.volume > 0 ? fmtVol(bp.volume) : '—'}
                </Text>
              </View>
            ))}
          </View>

          {/* ── 日別ボリューム推移 ── */}
          {/* アクセント箇所2: 当日バー accent */}
          <Text style={styles.sectionLabel}>日別推移</Text>
          <View style={styles.chartBox}>
            <Text style={styles.chartTitle}>{monthLabel}の日別ボリューム</Text>
            <View style={styles.chartBars}>
              {dailyData.map((day, idx) => {
                const ratio = day.volume / maxDailyVol;
                const barH = Math.max(ratio * 72, day.volume > 0 ? 4 : 0);
                const showLabel = idx === 0 || (idx + 1) % 7 === 0 || idx === dailyData.length - 1;
                return (
                  <View key={idx} style={styles.barCol}>
                    {day.volume > 0 && (showLabel || day.isToday) && (
                      <Text
                        style={[
                          styles.barTopVal,
                          day.isToday && styles.barTopValCurrent,
                        ]}
                        numberOfLines={1}
                      >
                        {fmtVol(day.volume)}
                      </Text>
                    )}
                    <View
                      style={[
                        styles.weekBarFill,
                        { height: barH },
                        day.isToday ? styles.weekBarCurrent : styles.weekBarDefault,
                      ]}
                    />
                    <Text
                      style={[
                        styles.barLabel,
                        day.isToday && styles.barLabelCurrent,
                      ]}
                      numberOfLines={1}
                    >
                      {showLabel ? day.label : ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── 種目別ランキング TOP5 ── */}
          <Text style={styles.sectionLabel}>種目別ランキング</Text>
          <View style={styles.rankCard}>
            {exerciseRanking.map((item, idx) => (
              <View
                key={item.id}
                style={[styles.rankRow, idx > 0 && styles.rankRowBorder]}
              >
                <Text style={styles.rankNum}>{item.rank}</Text>
                <Text style={styles.rankName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.rankRight}>
                  <Text style={styles.rankSets}>{item.sets}セット</Text>
                  <Text style={styles.rankVol}>{fmtVol(item.volume)}kg</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── スタイル ──────────────────────────────────────────────────────────────────

function makeStyles(c: TanrenThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  safe: {
    flex: 1,
    backgroundColor: c.background,
  },
  content: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },

  // ── 月選択 ────────────────────────────────────────────────────────────────
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.contentMargin,
    marginBottom: SPACING.sectionGap,
  },
  navBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 22,
    color: c.textSecondary,
  },
  monthLabel: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.semiBold,
    color: c.textSecondary,
  },

  // ── 空状態 ────────────────────────────────────────────────────────────────
  emptyWrap: {
    paddingHorizontal: SPACING.contentMargin,
    paddingTop: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.bodySmall,
    color: c.textTertiary,
    textAlign: 'center',
  },

  // ── セクションラベル ──────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.semiBold,
    color: c.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    paddingHorizontal: SPACING.contentMargin,
    marginTop: SPACING.sectionGap,
    marginBottom: 10,
  },

  // ── 月間サマリーカード（2×2グリッド）────────────────────────────────────────
  summaryCard: {
    backgroundColor: c.cardBackground,
    borderRadius: RADIUS.card,
    marginHorizontal: SPACING.contentMargin,
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
  },
  rowBorderT: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.separator,
  },
  summaryItem: {
    flex: 1,
    paddingVertical: SPACING.cardPadding,
    paddingHorizontal: SPACING.cardPadding,
  },
  itemBorderL: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: c.separator,
  },
  numRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  numText: {
    fontSize: 30,
    fontWeight: TYPOGRAPHY.heavy,
    color: c.textPrimary,
    letterSpacing: -1.2,
    lineHeight: 34,
    fontVariant: ['tabular-nums'],
  },
  unitText: {
    fontSize: 11,
    color: c.textSecondary,
    marginBottom: 3,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.captionSmall,
    fontWeight: TYPOGRAPHY.regular,
    color: c.textTertiary,
    marginTop: 4,
  },

  // ── 部位別ボリューム分布 ──────────────────────────────────────────────────
  bodyPartCard: {
    backgroundColor: c.cardBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginHorizontal: SPACING.contentMargin,
  },
  bodyPartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    gap: SPACING.sm,
  },
  bodyPartRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.separator,
  },
  partLabel: {
    width: 48,
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.semiBold,
    color: c.textPrimary,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: RADIUS.badge,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: RADIUS.badge,
    width: '0%',
    backgroundColor: c.surface2,
  },
  barFillMax: {
    backgroundColor: c.accentDim, // アクセント箇所1
  },
  partVolume: {
    width: 44,
    fontSize: TYPOGRAPHY.caption,
    color: c.textSecondary,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },

  // ── 週別ボリュームバーチャート（ProgressScreen準拠）────────────────────────
  chartBox: {
    backgroundColor: c.cardBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.cardPadding,
    marginHorizontal: SPACING.contentMargin,
  },
  chartTitle: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.semiBold,
    color: c.textSecondary,
    marginBottom: 14,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 96,
    gap: 2,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barTopVal: {
    fontSize: 8,
    color: c.textTertiary,
    marginBottom: 3,
    fontVariant: ['tabular-nums'],
  },
  barTopValCurrent: {
    color: c.textPrimary,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  weekBarFill: {
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  weekBarDefault: {
    backgroundColor: c.surface2,
  },
  weekBarCurrent: {
    backgroundColor: c.accent, // アクセント箇所2
  },
  barLabel: {
    fontSize: 9,
    color: c.textTertiary,
    marginTop: 5,
    fontVariant: ['tabular-nums'],
  },
  barLabelCurrent: {
    color: c.textPrimary,
    fontWeight: TYPOGRAPHY.semiBold,
  },

  // ── 種目別ランキング TOP5 ─────────────────────────────────────────────────
  rankCard: {
    backgroundColor: c.cardBackground,
    borderRadius: RADIUS.card,
    marginHorizontal: SPACING.contentMargin,
    overflow: 'hidden',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  rankRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.separator,
  },
  rankNum: {
    width: 20,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.semiBold,
    color: c.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  rankName: {
    flex: 1,
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.semiBold,
    color: c.textPrimary,
  },
  rankRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  rankSets: {
    fontSize: TYPOGRAPHY.captionSmall,
    color: c.textTertiary,
  },
  rankVol: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.semiBold,
    color: c.textSecondary,
    fontVariant: ['tabular-nums'],
  },

  bottomPad: {
    height: SPACING.lg,
  },
  });
}
