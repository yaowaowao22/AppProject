import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomSheet, SheetRow, SparkBars } from '../components/BottomSheet';
import { ScreenHeader } from '../components/ScreenHeader';
import { BODY_PARTS, EXERCISES, getExerciseById } from '../exerciseDB';
import { RADIUS, SPACING } from '../theme';
import type { TanrenThemeColors } from '../theme';
import { useTheme } from '../ThemeContext';
import type { DynamicTypography } from '../ThemeContext';
import type { BodyPart } from '../types';
import { useWorkout } from '../WorkoutContext';
import type { HistoryStackParamList } from '../navigation/RootNavigator';

// ── ヘルパ�E ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0=日
  const diff = dow === 0 ? -6 : 1 - dow; // 月曜始まり
  d.setDate(d.getDate() + diff);
  return d;
}

function getWeekLabel(weekStart: Date): string {
  return `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
}

// ── コンポ�EネンチE─────────────────────────────────────────────────────────────

// ── BottomSheet state types ───────────────────────────────────────────────────

type PRSheet = {
  type: 'pr';
  title: string;
  subtitle: string;
  sparks: { label: string; value: number; isCurrent?: boolean }[];
  rows: { label: string; detail: string; value: string; badge: boolean; onPress?: () => void }[];
};

type SheetState = PRSheet | null;

export default function ProgressScreen() {
  const { workouts, personalRecords, weeklyStats, customExercises } = useWorkout();
  const { colors, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);
  const navigation = useNavigation<NativeStackNavigationProp<HistoryStackParamList>>();
  const [sheet, setSheet] = useState<SheetState>(null);

  const [displayMonth, setDisplayMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // ── Section 1: PRカーチE──────────────────────────────────────────────────
  const prCards = useMemo(() => {
    return personalRecords
      .filter(pr => pr.maxWeight !== null)
      .map(pr => ({
        exerciseId: pr.exerciseId,
        name: getExerciseById(pr.exerciseId, customExercises)?.name ?? pr.exerciseId,
        maxWeight: pr.maxWeight as number,
        achievedAt: pr.achievedAt,
      }))
      .sort((a, b) => b.maxWeight - a.maxWeight);
  }, [personalRecords, customExercises]);

  // ── Section 2: 部位別ベストボリューム ────────────────────────────────────
  const partVolumes = useMemo(() => {
    const volMap: Record<BodyPart, number> = {
      chest: 0, back: 0, legs: 0, shoulders: 0, arms: 0, core: 0,
    };
    const dateMap: Record<BodyPart, string> = {
      chest: '', back: '', legs: '', shoulders: '', arms: '', core: '',
    };

    for (const daily of workouts) {
      for (const session of daily.sessions) {
        const exercise = getExerciseById(session.exerciseId, customExercises);
        if (!exercise) continue;
        const vol = session.sets.reduce((sum, s) => {
          return sum + (s.weight !== null && s.reps !== null ? s.weight * s.reps : 0);
        }, 0);
        const bp = exercise.bodyPart;
        if (vol > volMap[bp]) {
          volMap[bp] = vol;
          dateMap[bp] = daily.date;
        }
      }
    }

    return BODY_PARTS.map(bp => ({
      id: bp.id as BodyPart,
      label: bp.label,
      volume: volMap[bp.id as BodyPart],
      achievedAt: dateMap[bp.id as BodyPart],
    }));
  }, [workouts, customExercises]);

  // ── Section 3: 直迁E日ボリュームチャート（日別・タチE�EでDayDetail�E�────────
  const dailyChartData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = toDateStr(d);
      const daily = workouts.find(w => w.date === dateStr);
      result.push({
        dateStr,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        volume: daily?.totalVolume ?? 0,
        workoutId: daily?.id ?? null,
        isToday: i === 0,
      });
    }
    return result;
  }, [workouts]);

  const maxDailyVolume = useMemo(
    () => Math.max(...dailyChartData.map(d => d.volume), 1),
    [dailyChartData],
  );

  // ── Section 5: カレンダー ─────────────────────────────────────────────────
  const calendarData = useMemo(() => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDayNum = new Date(year, month + 1, 0).getDate();

    const dow = firstDay.getDay(); // 0=日
    const startOffset = dow === 0 ? 6 : dow - 1; // 月曜始まり
    type CalDay = { date: number | null; dateStr: string; hasWorkout: boolean; isToday: boolean };
    const days: CalDay[] = [];

    for (let i = 0; i < startOffset; i++) {
      days.push({ date: null, dateStr: '', hasWorkout: false, isToday: false });
    }

    const todayStr = toDateStr(new Date());
    const workoutDates = new Set(workouts.map(w => w.date));

    for (let d = 1; d <= lastDayNum; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: d,
        dateStr,
        hasWorkout: workoutDates.has(dateStr),
        isToday: dateStr === todayStr,
      });
    }

    while (days.length % 7 !== 0) {
      days.push({ date: null, dateStr: '', hasWorkout: false, isToday: false });
    }

    return { days, label: `${year}年${month + 1}月` };
  }, [displayMonth, workouts]);

  const onDayPress = (dateStr: string) => {
    const daily = workouts.find(w => w.date === dateStr);
    if (!daily) return;
    navigation.navigate('DayDetail', { workoutId: daily.id });
  };

  const onPRCardPress = (exerciseId: string) => {
    const ex = getExerciseById(exerciseId, customExercises);
    const pr = personalRecords.find(r => r.exerciseId === exerciseId);
    if (!ex || !pr) return;

    const title = ex.name;
    const subtitle = pr.maxWeight !== null ? `自己ベスト${pr.maxWeight}kg` : '記録なし';

    // 過去セチE��ョン�E�この種目�E�を日付�E頁E��最大6件
    const pastSessions = workouts
      .flatMap(w => w.sessions.map(s => ({ ...s, date: w.date })))
      .filter(s => s.exerciseId === exerciseId && !!s.completedAt)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-6);

    const sparks = pastSessions.map((s, i) => {
      const d = new Date(s.date + 'T00:00:00');
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const maxW = s.sets.reduce<number>((m, set) => Math.max(m, set.weight ?? 0), 0);
      return { label, value: maxW, isCurrent: i === pastSessions.length - 1 };
    });

    const rows = pastSessions
      .slice()
      .reverse()
      .map((s, i) => {
        const d = new Date(s.date + 'T00:00:00');
        const label = `${d.getMonth() + 1}月${d.getDate()}日`;
        const maxW = s.sets.reduce<number | null>((m, set) =>
          set.weight !== null ? (m === null ? set.weight : Math.max(m, set.weight)) : m, null);
        const hasPR = s.sets.some(set => set.isPersonalRecord);
        const workoutId = workouts.find(w => w.date === s.date)?.id;
        return {
          label,
          detail: `${s.sets.length}セット`,
          value: maxW !== null ? `${maxW}kg` : '自重',
          badge: hasPR,
          onPress: workoutId
            ? () => { setSheet(null); navigation.navigate('DayDetail', { workoutId }); }
            : undefined,
        };
      });

    setSheet({ type: 'pr', title, subtitle, sparks, rows });
  };

  // ── レンダリング ──────────────────────────────────────────────────────────

  return (
    <>
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScreenHeader title="進捗" showHamburger />
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      {/* ── Section 1: PRカーチE── */}
      <Text style={styles.sectionLabel}>自己ベスト</Text>
      {prCards.length === 0 ? (
        <Text style={styles.emptyText}>まだ記録がありません</Text>
      ) : (
        <FlatList
          horizontal
          data={prCards}
          keyExtractor={item => item.exerciseId}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hListContent}
          scrollEnabled
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.prCard}
              onPress={() => onPRCardPress(item.exerciseId)}
              activeOpacity={0.72}
              accessibilityRole="button"
              accessibilityLabel={`${item.name} 自己ベスト${item.maxWeight}kg`}
            >
              <Text style={styles.prExName}>{item.name}</Text>
              <View style={styles.prNumRow}>
                <Text style={styles.prNum}>{item.maxWeight}</Text>
                <Text style={styles.prUnit}>kg</Text>
              </View>
              <Text style={styles.prDate}>{formatDate(item.achievedAt)}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ── Section 2: 部位別ベストボリュームカーチE── */}
      <Text style={styles.sectionLabel}>部位別ベスト</Text>
      <FlatList
        horizontal
        data={partVolumes}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hListContent}
        scrollEnabled
        renderItem={({ item }) => (
          <View
            style={styles.pvCard}
            accessibilityLabel={`${item.label} ベストボリューム ${item.volume > 0 ? `${item.volume}kg` : 'なし'}`}
          >
            <Text style={styles.pvPart}>{item.label}</Text>
            <View style={styles.pvNumRow}>
              <Text style={styles.pvVol}>
                {item.volume > 0 ? item.volume.toLocaleString() : '-'}
              </Text>
              {item.volume > 0 && <Text style={styles.pvUnit}>kg</Text>}
            </View>
            <Text style={styles.pvDate}>
              {item.achievedAt ? formatDate(item.achievedAt) : '-'}
            </Text>
          </View>
        )}
      />

      {/* ── Section 3: 直迁E日ボリュームチャーチE── */}
      <Text style={styles.sectionLabel}>直迁E日</Text>
      <View style={styles.chartBox}>
        <Text style={styles.chartTitle}>日別ボリューム</Text>
        <View style={styles.chartBars}>
          {dailyChartData.map((day, idx) => {
            const ratio = day.volume / maxDailyVolume;
            const barH = Math.max(ratio * 72, day.volume > 0 ? 4 : 0);
            return (
              <TouchableOpacity
                key={idx}
                style={styles.barCol}
                onPress={() => {
                  if (day.workoutId) {
                    navigation.navigate('DayDetail', { workoutId: day.workoutId });
                  }
                }}
                activeOpacity={day.workoutId ? 0.7 : 1}
                disabled={!day.workoutId}
                accessibilityRole={day.workoutId ? 'button' : 'none'}
                accessibilityLabel={
                  day.workoutId
                    ? `${day.label} ワークアウト詳細を見る`
                    : `${day.label} データなし`
                }
              >
                {day.volume > 0 && (
                  <Text style={[styles.barTopVal, day.isToday && styles.barTopValCurrent]}>
                    {day.volume >= 1000
                      ? `${(day.volume / 1000).toFixed(1)}k`
                      : String(Math.round(day.volume))}
                  </Text>
                )}
                <View
                  style={[
                    styles.barFill,
                    { height: barH },
                    day.isToday
                      ? styles.barFillCurrent
                      : day.workoutId
                        ? styles.barFillActive
                        : styles.barFillDefault,
                  ]}
                />
                <Text style={[styles.barLabel, day.isToday && styles.barLabelCurrent]}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Section 4: ストリークカウンター ── */}
      <View style={styles.streakRow}>
        <Text style={styles.streakNumber}>{weeklyStats.streakDays}</Text>
        <Text style={styles.streakUnit}>日</Text>
      </View>
      <Text style={styles.streakSub}>連続トレーニング日</Text>

      {/* ── Section 5: カレンダー ── */}
      <Text style={styles.sectionLabel}>カレンダー</Text>
      <View style={styles.calBox}>
        {/* 月�EチE��ー + ナビ */}
        <View style={styles.calHeader}>
          <TouchableOpacity
            style={styles.calNavBtn}
            onPress={() =>
              setDisplayMonth(prev => {
                const d = new Date(prev);
                d.setMonth(d.getMonth() - 1);
                return d;
              })
            }
            accessibilityLabel="前の月"
          >
            <Text style={styles.calNavText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.calMonthLabel}>{calendarData.label}</Text>
          <TouchableOpacity
            style={styles.calNavBtn}
            onPress={() =>
              setDisplayMonth(prev => {
                const d = new Date(prev);
                d.setMonth(d.getMonth() + 1);
                return d;
              })
            }
            accessibilityLabel="次の月"
          >
            <Text style={styles.calNavText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 7列グリチE�� */}
        <View style={styles.calGrid}>
          {/* 曜日ヘッダー */}
          {['月', '火', '水', '木', '金', '土', '日'].map(dow => (
            <View key={dow} style={styles.calCell}>
              <Text style={styles.calWeekLabel}>{dow}</Text>
            </View>
          ))}

          {/* 日付セル */}
          {calendarData.days.map((day, idx) => (
            <View key={idx} style={styles.calCell}>
              {day.date !== null ? (
                <TouchableOpacity
                  style={[styles.calDayBtn, day.isToday && styles.calDayBtnToday]}
                  onPress={() => day.hasWorkout ? onDayPress(day.dateStr) : undefined}
                  activeOpacity={day.hasWorkout ? 0.7 : 1}
                  accessibilityLabel={`${day.date}日${day.hasWorkout ? ' トレーニングあり' : ''}`}
                >
                  <Text
                    style={[
                      styles.calDayText,
                      day.hasWorkout && !day.isToday && styles.calDayTextWorkout,
                      day.isToday && styles.calDayTextToday,
                    ]}
                  >
                    {day.date}
                  </Text>
                  {day.hasWorkout && !day.isToday && <View style={styles.calDot} />}
                </TouchableOpacity>
              ) : (
                <View style={styles.calDayBtn} />
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottomPad} />
    </ScrollView>

    <BottomSheet
      visible={sheet !== null}
      onClose={() => setSheet(null)}
      title={sheet?.title ?? ''}
      subtitle={sheet?.subtitle}
    >
      {sheet?.type === 'pr' && sheet.sparks.length > 0 && (
        <SparkBars bars={sheet.sparks} />
      )}
      {sheet !== null && sheet.rows.map((row, i) => (
        <SheetRow
          key={i}
          label={row.label}
          detail={row.detail}
          value={row.value}
          badge={row.badge}
          isLast={i === sheet.rows.length - 1}
          onPress={row.onPress}
        />
      ))}
    </BottomSheet>
    </SafeAreaView>
    </>
  );
}

// ── スタイル ──────────────────────────────────────────────────────────────────

// カレンダーセル幁E= (画面幁E- contentMarginÁE - calBox paddingÁE) ÷ 7
const SCREEN_W = Dimensions.get('window').width;
const CAL_INNER_W = SCREEN_W - SPACING.contentMargin * 2 - SPACING.md * 2;
const CELL_W = Math.floor(CAL_INNER_W / 7);

function makeStyles(c: TanrenThemeColors, typography: DynamicTypography) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.background,
    },
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      paddingBottom: SPACING.xxl,
    },

    // ── タイトル ────────────────────────────────────────────────────────────────
    screenTitle: {
      fontSize: typography.screenTitle,
      fontWeight: typography.bold,
      color: c.textPrimary,
      letterSpacing: -0.5,
      paddingHorizontal: SPACING.contentMargin,
      marginBottom: SPACING.sectionGap,
    },

    // ── セクションラベル ─────────────────────────────────────────────────────────
    sectionLabel: {
      fontSize: 11,
      fontWeight: typography.semiBold,
      color: c.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.9,
      paddingHorizontal: SPACING.contentMargin,
      marginTop: SPACING.sectionGap,
      marginBottom: 10,
    },

    emptyText: {
      fontSize: typography.caption,
      color: c.textTertiary,
      paddingHorizontal: SPACING.contentMargin,
    },

    hListContent: {
      paddingHorizontal: SPACING.contentMargin,
      gap: SPACING.cardGap,
    },

    // ── PRカーチE─────────────────────────────────────────────────────────────────
    prCard: {
      width: 140,
      backgroundColor: c.surface1,
      borderRadius: RADIUS.card,
      borderTopWidth: 1.5,
      borderTopColor: c.accent,
      padding: SPACING.cardPadding,
    },
    prExName: {
      fontSize: typography.captionSmall,
      fontWeight: typography.semiBold,
      color: c.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 6,
    },
    prNumRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 2,
    },
    prNum: {
      fontSize: 30,
      fontWeight: typography.heavy,
      color: c.textPrimary,
      letterSpacing: -1.2,
      lineHeight: 34,
      fontVariant: ['tabular-nums'],
    },
    prUnit: {
      fontSize: 11,
      color: c.textSecondary,
      marginBottom: 3,
    },
    prDate: {
      fontSize: typography.captionSmall,
      color: c.textTertiary,
      marginTop: 4,
    },

    // ── 部位別ベストカーチE────────────────────────────────────────────────────────
    pvCard: {
      width: 130,
      backgroundColor: c.surface1,
      borderRadius: RADIUS.card,
      borderTopWidth: 1.5,
      borderTopColor: c.separator,
      padding: SPACING.cardPadding,
    },
    pvPart: {
      fontSize: 18,
      fontWeight: typography.heavy,
      color: c.textPrimary,
      letterSpacing: -0.5,
      marginBottom: 6,
    },
    pvNumRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 2,
    },
    pvVol: {
      fontSize: 22,
      fontWeight: typography.heavy,
      color: c.textPrimary,
      letterSpacing: -1,
      lineHeight: 26,
      fontVariant: ['tabular-nums'],
    },
    pvUnit: {
      fontSize: 11,
      color: c.textSecondary,
      marginBottom: 2,
    },
    pvDate: {
      fontSize: typography.captionSmall,
      color: c.textTertiary,
      marginTop: 5,
    },

    // ── 週間�Eリュームバ�EチャーチE────────────────────────────────────────────────
    chartBox: {
      backgroundColor: c.surface1,
      borderRadius: RADIUS.card,
      padding: SPACING.cardPadding,
      marginHorizontal: SPACING.contentMargin,
    },
    chartTitle: {
      fontSize: typography.caption,
      fontWeight: typography.semiBold,
      color: c.textSecondary,
      marginBottom: 14,
    },
    chartBars: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      height: 96,
      gap: 5,
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
      fontWeight: typography.semiBold,
    },
    barFill: {
      width: '100%',
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    barFillDefault: {
      backgroundColor: c.surface2,
    },
    barFillActive: {
      backgroundColor: c.textTertiary,
    },
    barFillCurrent: {
      backgroundColor: c.accent,
    },
    barLabel: {
      fontSize: 9,
      color: c.textTertiary,
      marginTop: 5,
      fontVariant: ['tabular-nums'],
    },
    barLabelCurrent: {
      color: c.textPrimary,
      fontWeight: typography.semiBold,
    },

    // ── ストリーク ───────────────────────────────────────────────────────────────
    streakRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
      paddingHorizontal: SPACING.contentMargin,
      paddingTop: SPACING.xs,
      marginTop: SPACING.sectionGap,
    },
    streakNumber: {
      fontSize: 48,
      fontWeight: typography.heavy,
      color: c.textPrimary,
      letterSpacing: -3,
      lineHeight: 52,
      fontVariant: ['tabular-nums'],
    },
    streakUnit: {
      fontSize: 14,
      fontWeight: typography.regular,
      color: c.textTertiary,
    },
    streakSub: {
      fontSize: typography.caption,
      color: c.textTertiary,
      lineHeight: 19,
      paddingHorizontal: SPACING.contentMargin,
      paddingTop: 4,
    },

    // ── カレンダー ───────────────────────────────────────────────────────────────
    calBox: {
      backgroundColor: c.surface1,
      borderRadius: RADIUS.card,
      padding: SPACING.md,
      marginHorizontal: SPACING.contentMargin,
    },
    calHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    calNavBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    calNavText: {
      fontSize: 22,
      color: c.textSecondary,
    },
    calMonthLabel: {
      fontSize: typography.caption,
      fontWeight: typography.semiBold,
      color: c.textSecondary,
    },
    calGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    calCell: {
      width: CELL_W,
      alignItems: 'center',
      marginBottom: 2,
    },
    calWeekLabel: {
      fontSize: 9,
      fontWeight: typography.semiBold,
      color: c.textTertiary,
      textAlign: 'center',
      paddingVertical: 3,
    },
    calDayBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
    },
    calDayBtnToday: {
      backgroundColor: c.textPrimary,
    },
    calDayText: {
      fontSize: typography.caption,
      fontWeight: typography.regular,
      color: c.textTertiary,
      textAlign: 'center',
    },
    calDayTextWorkout: {
      color: c.textSecondary,
    },
    calDayTextToday: {
      color: c.background,
      fontWeight: typography.bold,
    },
    calDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.accent,
      marginTop: 2,
    },

    bottomPad: {
      height: SPACING.lg,
    },
  });
}
