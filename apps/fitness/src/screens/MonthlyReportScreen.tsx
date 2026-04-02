import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Line as SvgLine, Path, Text as SvgText } from 'react-native-svg';
import { BODY_PARTS, EXERCISES, getExerciseById } from '../exerciseDB';
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

// ── DailyLineChart ────────────────────────────────────────────────────────────

type DayDatum = { volume: number; label: string; isToday: boolean };

function DailyLineChart({ data, colors }: { data: DayDatum[]; colors: TanrenThemeColors }) {
  const [chartWidth, setChartWidth] = useState(0);

  const maxVol = Math.max(...data.map(d => d.volume), 0);
  const hasData = maxVol > 0;

  const CHART_H = 110;
  const Y_W     = 38;
  const PAD_T   = 14;
  const PAD_R   = 4;
  const X_H     = 20;

  const plotW = Math.max(chartWidth - Y_W - PAD_R, 0);
  const plotH = CHART_H - PAD_T;
  const n     = data.length;

  const xOf = (i: number) =>
    Y_W + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yOf = (vol: number) =>
    PAD_T + (hasData ? (1 - vol / maxVol) * plotH : plotH);

  // Y軸: 0・中間・最大 の 3刻み（きりのよい数値）
  const yTicks = useMemo((): number[] => {
    if (!hasData) return [0];
    const mag  = Math.pow(10, Math.floor(Math.log10(maxVol)));
    const step = [1, 2, 2.5, 5, 10]
      .map(f => f * mag)
      .find(s => Math.ceil(maxVol / s) <= 3) ?? mag;
    const top = Math.ceil(maxVol / step) * step;
    const mid = Math.round(top / 2 / step) * step;
    return [...new Set([0, mid, top])].sort((a, b) => a - b);
  }, [maxVol, hasData]);

  // X軸ラベル: 1日目・7日おき・最終日
  const xLabelIdx = useMemo((): number[] => {
    const s = new Set<number>([0]);
    for (let i = 6; i < n - 1; i += 7) s.add(i);
    s.add(n - 1);
    return [...s].sort((a, b) => a - b);
  }, [n]);

  const pathD = hasData && chartWidth > 0
    ? data.map((d, i) =>
        `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(d.volume).toFixed(1)}`
      ).join(' ')
    : '';

  return (
    <View onLayout={e => setChartWidth(e.nativeEvent.layout.width)}>
      {chartWidth > 0 && (
        <Svg width={chartWidth} height={CHART_H + X_H}>
          {/* グリッド線 & Y軸ラベル */}
          {yTicks.map(tick => {
            const y = yOf(tick);
            return (
              <G key={tick}>
                <SvgLine
                  x1={Y_W} y1={y} x2={Y_W + plotW} y2={y}
                  stroke={colors.separator}
                  strokeWidth={tick === 0 ? 0.8 : 0.5}
                  strokeDasharray={tick === 0 ? undefined : '3 3'}
                />
                <SvgText
                  x={Y_W - 4} y={y + 3.5}
                  fontSize={9} fill={colors.textTertiary}
                  textAnchor="end"
                >
                  {fmtVol(tick)}
                </SvgText>
              </G>
            );
          })}

          {/* 折れ線 */}
          {hasData && (
            <Path
              d={pathD}
              stroke={colors.accent}
              strokeWidth={1.8}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* ドット */}
          {hasData && data.map((d, i) => {
            if (d.volume === 0) return null;
            return (
              <Circle
                key={i}
                cx={xOf(i)}
                cy={yOf(d.volume)}
                r={d.isToday ? 4.5 : 2.5}
                fill={d.isToday ? colors.accent : colors.cardBackground}
                stroke={colors.accent}
                strokeWidth={1.5}
              />
            );
          })}

          {/* X軸日付ラベル */}
          {xLabelIdx.map(i => {
            const d = data[i];
            return (
              <SvgText
                key={i}
                x={xOf(i)}
                y={CHART_H + X_H - 3}
                fontSize={9}
                fill={d.isToday ? colors.textPrimary : colors.textTertiary}
                fontWeight={d.isToday ? '600' : '400'}
                textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
              >
                {d.label}
              </SvgText>
            );
          })}
        </Svg>
      )}
    </View>
  );
}

// ── MonthlyReportScreen ───────────────────────────────────────────────────────

export default function MonthlyReportScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { workouts, customExercises } = useWorkout();

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
        const ex = getExerciseById(session.exerciseId, customExercises);
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
  }, [monthWorkouts, customExercises]);

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

  // ── 種目別ランキング TOP5 ─────────────────────────────────────────────────
  const exerciseRanking = useMemo(() => {
    const map: Record<string, { name: string; volume: number; sets: number }> = {};
    for (const daily of monthWorkouts) {
      for (const session of daily.sessions) {
        const ex = getExerciseById(session.exerciseId, customExercises);
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
  }, [monthWorkouts, customExercises]);

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
            <DailyLineChart data={dailyData} colors={colors} />
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
    marginBottom: SPACING.md,
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
