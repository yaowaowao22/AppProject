import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { SwipeableRow } from '../components/SwipeableRow';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionLabel } from '../components/SectionLabel';
import { SPACING, RADIUS } from '../theme';
import type { TanrenThemeColors } from '../theme';
import { useTheme } from '../ThemeContext';
import type { DynamicTypography } from '../ThemeContext';
import { useWorkout } from '../WorkoutContext';
import { EXERCISES, BODY_PARTS, getExerciseById } from '../exerciseDB';
import type { RootDrawerParamList } from '../navigation/RootNavigator';
import { CALENDAR } from '../config';
import type { BodyPart } from '../types';
import { loadAppSettings } from '../utils/storage';

// ── 型 ────────────────────────────────────────────────────────────────────────

type HomeNavProp = DrawerNavigationProp<RootDrawerParamList, 'Home'>;

// ── 定数 ──────────────────────────────────────────────────────────────────────

const QUICK_START_IDS = [
  'chest_001', // ベンチプレス
  'legs_001',  // スクワット
  'back_001',  // デッドリフト
  'shoulders_001', // ショルダープレス
  'back_003',  // 懸垂
] as const;

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

// ── ヘルパー ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildCalendarWeeks(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const dow = firstDay.getDay(); // 0=Sun
  const daysToMonday = dow === 0 ? 6 : dow - 1;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - daysToMonday);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeksNeeded = Math.ceil((daysToMonday + daysInMonth) / 7);

  const weeks: Date[][] = [];
  for (let w = 0; w < weeksNeeded; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      week.push(date);
    }
    weeks.push(week);
  }
  return weeks;
}

function formatVolume(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
}

function formatSectionDate(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return '今日';
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { workouts, personalRecords, deleteSessionFromWorkout, setWorkoutTargetDate, customExercises } = useWorkout();
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

  const todayStr = useMemo(() => toDateStr(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [showCalendar, setShowCalendar] = useState(true);
  const [showQuickStart, setShowQuickStart] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadAppSettings().then(s => {
        setShowCalendar(s.showCalendar);
        setShowQuickStart(s.showQuickStart);
      });
    }, []),
  );

  // workouts を日付でインデックス
  const workoutByDate = useMemo(() => {
    const map = new Map<string, typeof workouts[0]>();
    for (const w of workouts) map.set(w.date, w);
    return map;
  }, [workouts]);

  // カレンダーグリッド
  const calendarWeeks = useMemo(
    () => buildCalendarWeeks(calendarMonth.getFullYear(), calendarMonth.getMonth()),
    [calendarMonth],
  );

  // 選択日のワークアウト
  const selectedDayWorkout = useMemo(
    () => workoutByDate.get(selectedDate) ?? null,
    [workoutByDate, selectedDate],
  );

  // 選択日の鍛えた部位
  const selectedDayBodyParts = useMemo<BodyPart[]>(() => {
    if (!selectedDayWorkout) return [];
    const parts = new Set<BodyPart>();
    for (const s of selectedDayWorkout.sessions) {
      const ex = getExerciseById(s.exerciseId, customExercises);
      if (ex) parts.add(ex.bodyPart);
    }
    return [...parts];
  }, [selectedDayWorkout, customExercises]);

  // 選択日のメニュー
  const { selectedWorkoutId, selectedMenu } = useMemo(() => {
    const selected = workoutByDate.get(selectedDate);
    if (!selected) return { selectedWorkoutId: null, selectedMenu: [] };
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const session of selected.sessions) {
      if (!seen.has(session.exerciseId)) {
        seen.add(session.exerciseId);
        ids.push(session.exerciseId);
      }
    }
    const items = ids
      .map(id => {
        const exercise = getExerciseById(id, customExercises);
        const pr = personalRecords.find(r => r.exerciseId === id);
        const session = selected.sessions.find(s => s.exerciseId === id);
        const lastSets = session?.sets.length ?? 0;
        const lastMaxWeight =
          session?.sets.reduce<number | null>((max, s) => {
            if (s.weight === null) return max;
            return max === null ? s.weight : Math.max(max, s.weight);
          }, null) ?? null;
        return { exercise, pr, lastSets, lastMaxWeight };
      })
      .filter(
        (item): item is {
          exercise: typeof EXERCISES[0];
          pr: typeof personalRecords[0] | undefined;
          lastSets: number;
          lastMaxWeight: number | null;
        } => item.exercise != null,
      );
    return { selectedWorkoutId: selected.id, selectedMenu: items };
  }, [workoutByDate, selectedDate, personalRecords, customExercises]);

  // ボタンコンテナの高さ（スクロール余白算出用）
  const btnContainerHeight = 50 + Math.max(insets.bottom, SPACING.md) + SPACING.md;

  function handleStartWorkout() {
    setWorkoutTargetDate(selectedDate);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate('WorkoutStack', { screen: 'ExerciseSelect' });
  }

  function handleChipPress(exerciseId: string) {
    setWorkoutTargetDate(selectedDate);
    (navigation as any).navigate('WorkoutStack', {
      screen: 'ActiveWorkout',
      params: { exerciseIds: [exerciseId], fromHome: true, _ts: Date.now() },
    });
  }

  function handleMenuItemPress(exerciseId: string) {
    setWorkoutTargetDate(selectedDate);
    const selectedWorkout = workoutByDate.get(selectedDate);
    const existingSession = selectedWorkout?.sessions.find(s => s.exerciseId === exerciseId);
    if (existingSession && selectedWorkout) {
      (navigation as any).navigate('WorkoutStack', {
        screen: 'ActiveWorkout',
        params: {
          exerciseIds: [exerciseId],
          existingWorkoutId: selectedWorkout.id,
          existingSession,
          fromHome: true,
          _ts: Date.now(),
        },
      });
    } else {
      (navigation as any).navigate('WorkoutStack', {
        screen: 'ActiveWorkout',
        params: { exerciseIds: [exerciseId], fromHome: true, _ts: Date.now() },
      });
    }
  }

  const monthLabel = calendarMonth.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.container}>
      <ScreenHeader title="ホーム" showHamburger />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: btnContainerHeight + SPACING.md }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── カレンダー ─────────────────────────────────────────────────── */}
        {showCalendar && (
          <View style={styles.calendarCard}>
            {/* 月ナビゲーション */}
            <View style={styles.calHeader}>
              <TouchableOpacity
                style={styles.calNavBtn}
                onPress={() =>
                  setCalendarMonth(
                    prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                  )
                }
                accessibilityRole="button"
                accessibilityLabel="前の月"
              >
                <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.calMonthLabel}>{monthLabel}</Text>
              <TouchableOpacity
                style={styles.calNavBtn}
                onPress={() =>
                  setCalendarMonth(
                    prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                  )
                }
                accessibilityRole="button"
                accessibilityLabel="次の月"
              >
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* 曜日ラベル */}
            <View style={styles.calDayRow}>
              {DAY_LABELS.map(d => (
                <Text key={d} style={styles.calDayLabel}>
                  {d}
                </Text>
              ))}
            </View>

            {/* 週グリッド */}
            {calendarWeeks.map((week, wi) => (
              <View key={wi} style={styles.calWeekRow}>
                {week.map(date => {
                  const dateStr = toDateStr(date);
                  const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;
                  const hasWorkout = workoutByDate.has(dateStr);

                  return (
                    <TouchableOpacity
                      key={dateStr}
                      style={[
                        styles.calDayCell,
                        isSelected && { backgroundColor: colors.accent },
                        isToday && !isSelected && {
                          borderWidth: 1,
                          borderColor: colors.accent,
                        },
                      ]}
                      onPress={() => setSelectedDate(dateStr)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={dateStr}
                    >
                      <Text
                        style={[
                          styles.calDayNum,
                          !isCurrentMonth && { color: colors.textTertiary },
                          isSelected && { color: colors.onAccent },
                          isToday &&
                            !isSelected && {
                              color: colors.accent,
                              fontWeight: typography.bold,
                            },
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                      {hasWorkout ? (
                        <View
                          style={[
                            styles.calDot,
                            {
                              backgroundColor: isSelected
                                ? colors.onAccent
                                : colors.accent,
                            },
                          ]}
                        />
                      ) : (
                        <View style={styles.calDotPlaceholder} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* ── 今日のサマリー ─────────────────────────────────────────────── */}
        <SectionLabel>{formatSectionDate(selectedDate, todayStr)}</SectionLabel>
        {selectedDayWorkout != null ? (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{selectedDayWorkout.sessions.length}</Text>
              <Text style={styles.statKey}>セッション</Text>
            </View>
            <View style={[styles.statItem, styles.statBorder]}>
              <Text style={styles.statNum}>
                {formatVolume(selectedDayWorkout.totalVolume)}
              </Text>
              <Text style={styles.statKey}>kg ボリューム</Text>
            </View>
            <View style={[styles.statItem, styles.statBorder]}>
              <View style={styles.bodyPartIcons}>
                {selectedDayBodyParts.map(bp => {
                  const bpConfig = BODY_PARTS.find(b => b.id === bp);
                  if (!bpConfig) return null;
                  return (
                    <Ionicons
                      key={bp}
                      name={bpConfig.icon as any}
                      size={16}
                      color={colors.accent}
                    />
                  );
                })}
              </View>
              <Text style={styles.statKey}>鍛えた部位</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyDayContainer}>
            <Text style={styles.emptyDayText}>トレーニング記録なし</Text>
          </View>
        )}

        {/* ── クイックスタート ───────────────────────────────────────────── */}
        {showQuickStart && (
          <>
            <SectionLabel style={{ marginTop: SPACING.sectionGap }}>クイックスタート</SectionLabel>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {QUICK_START_IDS.map(id => {
                const ex = EXERCISES.find(e => e.id === id);
                if (!ex) return null;
                return (
                  <TouchableOpacity
                    key={id}
                    style={styles.chip}
                    onPress={() => handleChipPress(id)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={ex.name}
                  >
                    <Text style={styles.chipText}>{ex.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ── トレーニングメニュー ───────────────────────────────────────── */}
        <SectionLabel style={{ marginTop: SPACING.sectionGap }}>トレーニングメニュー</SectionLabel>
        {selectedMenu.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>トレーニングメニューがありません</Text>
            <Text style={styles.emptySubText}>種目を選択してワークアウトを開始しましょう</Text>
          </View>
        ) : (
          <View style={styles.menuList}>
            {selectedMenu.map(({ exercise, pr, lastSets, lastMaxWeight }, idx) => {
              const bodyPartLabel =
                BODY_PARTS.find(b => b.id === exercise.bodyPart)?.label ?? '';
              const metaParts: string[] = [];
              if (bodyPartLabel) metaParts.push(bodyPartLabel);
              if (lastMaxWeight !== null) metaParts.push(`前回 ${lastMaxWeight}kg`);
              if (lastSets > 0) metaParts.push(`${lastSets}セット`);
              if (pr?.maxWeight != null) metaParts.push(`PR ${pr.maxWeight}kg`);
              const metaStr = metaParts.join(' · ');
              return (
                <React.Fragment key={exercise.id}>
                  {idx > 0 && <View style={styles.menuSeparator} />}
                  <SwipeableRow
                    onDelete={() =>
                      selectedWorkoutId &&
                      deleteSessionFromWorkout(selectedWorkoutId, exercise.id)
                    }
                  >
                    <TouchableOpacity
                      style={styles.menuRow}
                      onPress={() => handleMenuItemPress(exercise.id)}
                      activeOpacity={0.72}
                      accessibilityRole="button"
                      accessibilityLabel={exercise.name}
                    >
                      <View style={styles.menuIconBox}>
                        <Ionicons
                          name={exercise.icon as any}
                          size={16}
                          color={colors.accent}
                        />
                      </View>
                      <View style={styles.menuInfo}>
                        <Text style={styles.menuName} numberOfLines={1}>{exercise.name}</Text>
                        {metaStr !== '' && (
                          <Text style={styles.menuMeta} numberOfLines={1}>{metaStr}</Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </SwipeableRow>
                </React.Fragment>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── 固定ワークアウト開始ボタン ─────────────────────────────────── */}
      <View
        style={[
          styles.fixedBtnWrapper,
          { paddingBottom: Math.max(insets.bottom, SPACING.md) },
        ]}
      >
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleStartWorkout}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="ワークアウトを開始する"
        >
          <Text style={styles.ctaText}>ワークアウト開始</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(c: TanrenThemeColors, t: DynamicTypography) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingTop: SPACING.sm,
    },

    // ── カレンダー ──────────────────────────────────────────────────────────
    calendarCard: {
      marginHorizontal: SPACING.contentMargin,
      marginBottom: SPACING.sectionGap,
      backgroundColor: c.surface1,
      borderRadius: RADIUS.card,
      padding: SPACING.cardPadding,
    },
    calHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.sm,
    },
    calNavBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    calMonthLabel: {
      fontSize: t.bodySmall,
      fontWeight: t.semiBold,
      fontFamily: t.fontFamily,
      color: c.textPrimary,
    },
    calDayRow: {
      flexDirection: 'row',
      marginBottom: SPACING.xs,
    },
    calDayLabel: {
      flex: 1,
      textAlign: 'center',
      fontSize: t.captionSmall,
      fontWeight: t.regular,
      fontFamily: t.fontFamily,
      color: c.textTertiary,
    },
    calWeekRow: {
      flexDirection: 'row',
    },
    calDayCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: SPACING.xs,
      borderRadius: RADIUS.badge + 2,
      marginVertical: 1,
    },
    calDayNum: {
      fontSize: t.captionSmall,
      fontWeight: t.regular,
      fontFamily: t.fontFamily,
      color: c.textPrimary,
    },
    calDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      marginTop: 2,
    },
    calDotPlaceholder: {
      width: 4,
      height: 4,
      marginTop: 2,
    },

    // ── 日次サマリー ────────────────────────────────────────────────────────
    statsRow: {
      flexDirection: 'row',
      paddingHorizontal: SPACING.contentMargin,
      marginBottom: SPACING.md,
    },
    statItem: {
      flex: 1,
      gap: SPACING.xs,
    },
    statBorder: {
      borderLeftWidth: 1,
      borderLeftColor: c.separator,
      paddingLeft: SPACING.md,
    },
    statNum: {
      fontSize: Math.round(t.exerciseName * 1.2),
      fontWeight: t.heavy,
      fontFamily: t.fontFamily,
      color: c.textPrimary,
      letterSpacing: -1,
      fontVariant: ['tabular-nums'],
      lineHeight: Math.round(t.exerciseName * 1.2),
    },
    statKey: {
      fontSize: t.captionSmall,
      fontWeight: t.regular,
      fontFamily: t.fontFamily,
      color: c.textTertiary,
    },
    bodyPartIcons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      minHeight: 20,
      alignItems: 'center',
    },
    emptyDayContainer: {
      paddingHorizontal: SPACING.contentMargin,
      paddingVertical: SPACING.sm,
      marginBottom: SPACING.md,
    },
    emptyDayText: {
      fontSize: t.bodySmall,
      fontWeight: t.regular,
      fontFamily: t.fontFamily,
      color: c.textTertiary,
    },

    // ── クイックスタート ────────────────────────────────────────────────────
    chips: {
      paddingHorizontal: SPACING.contentMargin,
      gap: SPACING.sm,
    },
    chip: {
      backgroundColor: c.surface1,
      borderRadius: RADIUS.chip,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.cardPadding,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chipText: {
      fontSize: t.caption,
      fontWeight: t.regular,
      fontFamily: t.fontFamily,
      color: c.textSecondary,
    },

    // ── 本日のメニュー ──────────────────────────────────────────────────────
    menuList: {
      paddingHorizontal: 0,
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.contentMargin,
      paddingVertical: 11,
      minHeight: 56,
      gap: 12,
    },
    menuIconBox: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: c.accentDim,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    menuInfo: {
      flex: 1,
    },
    menuName: {
      fontSize: t.body,
      fontWeight: t.semiBold,
      fontFamily: t.fontFamily,
      color: c.textPrimary,
    },
    menuMeta: {
      fontSize: t.captionSmall,
      fontFamily: t.fontFamily,
      color: c.textTertiary,
      marginTop: 2,
    },
    menuSeparator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.separator,
      marginLeft: SPACING.contentMargin + 28 + 12,
    },
    emptyContainer: {
      paddingHorizontal: SPACING.contentMargin,
      paddingVertical: SPACING.md,
      gap: SPACING.xs,
    },
    emptyText: {
      fontSize: t.bodySmall,
      fontWeight: t.semiBold,
      fontFamily: t.fontFamily,
      color: c.textSecondary,
    },
    emptySubText: {
      fontSize: t.captionSmall,
      fontWeight: t.regular,
      fontFamily: t.fontFamily,
      color: c.textTertiary,
    },

    // ── 固定CTAボタン ───────────────────────────────────────────────────────
    fixedBtnWrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: SPACING.contentMargin,
      paddingTop: SPACING.md,
      backgroundColor: c.background,
    },
    ctaButton: {
      height: 50,
      backgroundColor: c.accent,
      borderRadius: RADIUS.btnCTA,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaText: {
      fontSize: t.body,
      fontWeight: t.bold,
      fontFamily: t.fontFamily,
      color: c.onAccent,
      letterSpacing: -0.2,
    },
  });
}
