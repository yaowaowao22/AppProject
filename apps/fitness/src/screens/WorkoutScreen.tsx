import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BODY_PARTS, EXERCISES_BY_PART, EXERCISES } from '../exerciseDB';
import type { BodyPart } from '../types';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, BUTTON_HEIGHT } from '../theme';
import { useWorkout } from '../WorkoutContext';
import type { WorkoutStackParamList } from '../navigation/RootNavigator';

// ── 部位別筋肉サブタイトル ────────────────────────────────────────────────────

const BODY_PART_MUSCLE: Record<BodyPart, string> = {
  chest:     '大胸筋・三角筋前部',
  back:      '広背筋・僧帽筋',
  legs:      '大腿四頭筋・臀部',
  shoulders: '三角筋全面',
  arms:      '上腕二・三頭筋',
  core:      '腹直筋・腹斜筋',
};

// ── 種目選択（部位タブ + 複数選択） ──────────────────────────────────────────

type ExerciseSelectProps = NativeStackScreenProps<WorkoutStackParamList, 'ExerciseSelect'>;

export function ExerciseSelectScreen({ navigation }: ExerciseSelectProps) {
  const [selectedPart, setSelectedPart] = useState<BodyPart>(BODY_PARTS[0].id as BodyPart);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const exercises = EXERCISES_BY_PART[selectedPart] ?? [];

  function toggleExercise(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }

  function handleStart() {
    if (selectedIds.length === 0) return;
    navigation.navigate('ActiveWorkout', { exerciseIds: selectedIds });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 部位タブ */}
      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {BODY_PARTS.map(bp => {
            const active = selectedPart === bp.id;
            return (
              <TouchableOpacity
                key={bp.id}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setSelectedPart(bp.id as BodyPart)}
                activeOpacity={0.7}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={bp.label}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {bp.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 種目リスト */}
      <FlatList
        style={styles.exList}
        data={exercises}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.exListContent,
          selectedIds.length > 0 && styles.exListContentWithBtn,
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const selected = selectedIds.includes(item.id);
          return (
            <TouchableOpacity
              style={[
                styles.exRow,
                index === exercises.length - 1 && styles.exRowLast,
                selected && styles.exRowSelected,
              ]}
              onPress={() => toggleExercise(item.id)}
              accessibilityLabel={item.name}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              activeOpacity={0.7}
            >
              <View style={styles.exRowLeft}>
                <View style={[styles.exIcon, selected && styles.exIconSelected]}>
                  {selected
                    ? <Ionicons name="checkmark" size={16} color="#fff" />
                    : <Text style={styles.exIconText}>{item.name.charAt(0)}</Text>
                  }
                </View>
                <View style={styles.exTextCol}>
                  <Text style={[styles.exName, selected && styles.exNameSelected]}>
                    {item.name}
                  </Text>
                  <Text style={styles.exDet}>{item.equipment}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* 開始ボタン（選択時のみ表示） */}
      {selectedIds.length > 0 && (
        <View style={styles.startWrap}>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={handleStart}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`${selectedIds.length}種目を開始`}
          >
            <Text style={styles.startBtnText}>
              {selectedIds.length}種目を開始
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── アクティブワークアウト ─────────────────────────────────────────────────────

type ActiveWorkoutProps = NativeStackScreenProps<WorkoutStackParamList, 'ActiveWorkout'>;

const REST_DURATION = 60;
const DEFAULT_SETS = 5;

type SetRow = { weight: number | null; reps: number | null; done: boolean };

function buildRows(
  prevSets: Array<{ weight: number | null; reps: number | null }> | null,
): SetRow[] {
  // 前回データなし → すべて空白
  if (!prevSets || prevSets.length === 0) {
    return Array.from({ length: DEFAULT_SETS }, () => ({ weight: null, reps: null, done: false }));
  }
  const base    = prevSets.slice(0, DEFAULT_SETS);
  const lastW   = base[base.length - 1].weight;
  const lastR   = base[base.length - 1].reps;
  return Array.from({ length: DEFAULT_SETS }, (_, i) => ({
    weight: base[i]?.weight ?? lastW,
    reps:   base[i]?.reps   ?? lastR,
    done:   false,
  }));
}

export function ActiveWorkoutScreen({ navigation, route }: ActiveWorkoutProps) {
  const { exerciseIds } = route.params;
  const { workouts, startSession, addSet, completeSession } = useWorkout();
  const insets = useSafeAreaInsets();

  const [currentIndex, setCurrentIndex] = useState(0);
  const exerciseId = exerciseIds[currentIndex];
  const exercise = EXERCISES.find(e => e.id === exerciseId);

  const [rows, setRows] = useState<SetRow[]>(() => buildRows(null));
  const [setDone, setSetDone] = useState(false);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<'weight' | 'reps' | null>(null);
  const [editValue, setEditValue] = useState('');

  const weightScale = useRef(new Animated.Value(1)).current;
  const repsScale   = useRef(new Animated.Value(1)).current;
  const weightInputRef = useRef<TextInput>(null);
  const repsInputRef   = useRef<TextInput>(null);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 種目切り替え：セッション開始 + 前回データで行初期化
  useEffect(() => {
    startSession(exerciseId);

    const prev = workouts
      .flatMap(w => w.sessions.map(s => ({ ...s, date: w.date })))
      .filter(s => s.exerciseId === exerciseId && !!s.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

    setRows(buildRows(prev?.sets ?? null));
    setSetDone(false);
    setRestSeconds(null);
    if (timerRef.current) clearInterval(timerRef.current);
    if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId]);

  // 現在のアクティブ行（最初の未完了行）
  const activeIdx = rows.findIndex(r => !r.done);
  const allDone   = activeIdx < 0;
  const activeRow = allDone ? rows[rows.length - 1] : rows[activeIdx];

  const bump = useCallback((anim: Animated.Value) => {
    anim.setValue(1);
    Animated.sequence([
      Animated.timing(anim, { toValue: 1.12, duration: 100, useNativeDriver: true }),
      Animated.spring(anim, { toValue: 1, tension: 50, friction: 5, useNativeDriver: true }),
    ]).start();
  }, []);

  function startEditing(field: 'weight' | 'reps') {
    if (allDone) return;
    const val = field === 'weight' ? activeRow.weight : activeRow.reps;
    setEditValue(val !== null ? String(val) : '');
    setEditingField(field);
    setTimeout(() => {
      if (field === 'weight') weightInputRef.current?.focus();
      else repsInputRef.current?.focus();
    }, 50);
  }

  function commitEdit() {
    if (!editingField) return;
    const num = parseFloat(editValue);
    if (!isNaN(num) && num >= 0) {
      if (editingField === 'weight') {
        const clamped = Math.max(0, Math.round(num * 10) / 10);
        setRows(prev => prev.map((r, i) => i === activeIdx ? { ...r, weight: clamped } : r));
      } else {
        const clamped = Math.max(1, Math.floor(num));
        setRows(prev => prev.map((r, i) => i === activeIdx ? { ...r, reps: clamped } : r));
      }
    }
    setEditingField(null);
    setEditValue('');
  }

  function adjustWeight(delta: number) {
    if (allDone) return;
    setRows(prev => prev.map((r, i) => {
      if (i !== activeIdx) return r;
      const cur = r.weight ?? 0;
      return { ...r, weight: Math.max(0, Math.round((cur + delta) * 10) / 10) };
    }));
    bump(weightScale);
  }

  function adjustReps(delta: number) {
    if (allDone) return;
    setRows(prev => prev.map((r, i) => {
      if (i !== activeIdx) return r;
      const cur = r.reps ?? 0;
      return { ...r, reps: Math.max(1, cur + delta) };
    }));
    bump(repsScale);
  }

  function startRestTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setRestSeconds(REST_DURATION);
    timerRef.current = setInterval(() => {
      setRestSeconds(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handleSetComplete() {
    if (allDone) return;
    addSet(activeRow.weight ?? 0, activeRow.reps ?? 0);
    setRows(prev => prev.map((r, i) => i === activeIdx ? { ...r, done: true } : r));
    setSetDone(true);
    startRestTimer();
    if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current);
    doneTimeoutRef.current = setTimeout(() => setSetDone(false), 1500);
  }

  function handleAddSet() {
    const last = rows[rows.length - 1];
    setRows(prev => [...prev, { weight: last.weight ?? null, reps: last.reps ?? null, done: false }]);
  }

  async function handleExerciseComplete() {
    await completeSession();
    const nextIndex = currentIndex + 1;
    if (nextIndex < exerciseIds.length) {
      setCurrentIndex(nextIndex);
    } else {
      navigation.popToTop();
    }
  }

  async function handleWorkoutEnd() {
    if (rows.some(r => r.done)) {
      await completeSession();
    }
    navigation.popToTop();
  }

  // 過去セッション履歴
  const sessionHistory = useMemo(() => {
    return workouts
      .flatMap(w => w.sessions.map(s => ({ ...s, date: w.date })))
      .filter(s => s.exerciseId === exerciseId && !!s.completedAt)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-5)
      .map(s => {
        const d = new Date(s.date + 'T00:00:00');
        const label = `${d.getMonth() + 1}/${d.getDate()}`;
        const maxW = s.sets.reduce<number>((m, set) => Math.max(m, set.weight ?? 0), 0);
        return { label, maxWeight: maxW };
      });
  }, [workouts, exerciseId]);

  const histAllMax = useMemo(
    () => Math.max(...sessionHistory.map(s => s.maxWeight), activeRow.weight, 1),
    [sessionHistory, activeRow.weight],
  );

  const prevBestWeight = sessionHistory.length > 0 ? sessionHistory[sessionHistory.length - 1].maxWeight : 0;
  const allTimeBest    = sessionHistory.length > 0 ? Math.max(...sessionHistory.map(s => s.maxWeight)) : 0;

  const timerText = restSeconds !== null
    ? `${String(Math.floor(restSeconds / 60)).padStart(2, '0')}:${String(restSeconds % 60).padStart(2, '0')}`
    : '';

  const isLastExercise = currentIndex === exerciseIds.length - 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.activeContent, { paddingTop: insets.top }]}
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      {/* ヘッダー */}
      <View style={styles.activeHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityLabel="種目一覧に戻る">
          <Ionicons name="chevron-back" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.timerPill}>{timerText}</Text>
      </View>

      {/* 種目名 + 進捗バッジ */}
      <View style={styles.actTop}>
        <View style={styles.actNameCol}>
          <Text style={styles.actName}>{exercise?.name ?? ''}</Text>
          <Text style={styles.actSub}>
            {exercise?.muscleDetail ?? BODY_PART_MUSCLE[exercise?.bodyPart as BodyPart] ?? ''}
          </Text>
        </View>
        <View style={styles.setBadge}>
          <Text style={styles.setBadgeText}>
            {exerciseIds.length > 1
              ? <Text><Text style={styles.setBadgeNum}>{currentIndex + 1}</Text>{`/${exerciseIds.length}`}</Text>
              : <Text>{'セット '}<Text style={styles.setBadgeNum}>{allDone ? rows.length : activeIdx + 1}</Text></Text>
            }
          </Text>
        </View>
      </View>

      {/* 数値コントロール（アクティブ行を反映） */}
      <View style={styles.numCtrl}>
        <View style={styles.numBlock}>
          <Text style={styles.numLabel}>重量</Text>
          <TouchableOpacity onPress={() => startEditing('weight')} activeOpacity={0.7}>
            <Animated.View style={{ transform: [{ scale: weightScale }] }}>
              {editingField === 'weight' ? (
                <TextInput
                  ref={weightInputRef}
                  style={styles.numValInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  onSubmitEditing={commitEdit}
                  onBlur={commitEdit}
                  selectTextOnFocus
                />
              ) : (
                <Text style={styles.numVal}>
                  {activeRow.weight === null
                    ? '—'
                    : activeRow.weight % 1 === 0 ? activeRow.weight.toString() : activeRow.weight.toFixed(1)}
                </Text>
              )}
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.numUnit}>kg</Text>
          <View style={styles.stepRow}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => adjustWeight(-2.5)} accessibilityLabel="重量−2.5kg">
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stepBtn} onPress={() => adjustWeight(2.5)} accessibilityLabel="重量＋2.5kg">
              <Text style={styles.stepBtnText}>＋</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.numBlock}>
          <Text style={styles.numLabel}>回数</Text>
          <TouchableOpacity onPress={() => startEditing('reps')} activeOpacity={0.7}>
            <Animated.View style={{ transform: [{ scale: repsScale }] }}>
              {editingField === 'reps' ? (
                <TextInput
                  ref={repsInputRef}
                  style={styles.numValInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onSubmitEditing={commitEdit}
                  onBlur={commitEdit}
                  selectTextOnFocus
                />
              ) : (
                <Text style={styles.numVal}>{activeRow.reps !== null ? String(activeRow.reps) : '—'}</Text>
              )}
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.numUnit}>reps</Text>
          <View style={styles.stepRow}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => adjustReps(-1)} accessibilityLabel="回数−1">
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stepBtn} onPress={() => adjustReps(1)} accessibilityLabel="回数＋1">
              <Text style={styles.stepBtnText}>＋</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* セット完了ボタン */}
      {!allDone && (
        <TouchableOpacity
          style={[styles.doneBtn, setDone && styles.doneBtnDone]}
          onPress={handleSetComplete}
          accessibilityLabel="セットを完了する"
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="rgba(255,255,255,0.85)" />
          <Text style={styles.doneBtnText}>セット完了</Text>
        </TouchableOpacity>
      )}

      {/* セット一覧（デフォルト5行 + 追加可） */}
      <View style={styles.slog}>
        <Text style={styles.sectionLabel}>セット</Text>
        {rows.map((row, i) => {
          const isActive = i === activeIdx;
          const isFuture = !row.done && i !== activeIdx;
          return (
            <View
              key={i}
              style={[
                styles.setRow,
                i === rows.length - 1 && !isActive && styles.setRowLast,
                isActive && styles.setRowActive,
              ]}
            >
              <Text style={[styles.setNumLabel, isActive && styles.setNumLabelActive]}>
                {i + 1}
              </Text>
              <Text style={[
                styles.setVals,
                row.done && styles.setValsDone,
                isFuture && styles.setValsFuture,
              ]}>
                {row.weight !== null && row.reps !== null
                  ? `${row.weight % 1 === 0 ? row.weight : row.weight.toFixed(1)}kg × ${row.reps}`
                  : '—'}
              </Text>
              {row.done && (
                <View style={styles.setCheck}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              )}
              {isActive && <View style={styles.setActivePip} />}
            </View>
          );
        })}

        {/* セット追加 */}
        <TouchableOpacity
          style={styles.addSetBtn}
          onPress={handleAddSet}
          accessibilityLabel="セットを追加する"
        >
          <Ionicons name="add" size={14} color={COLORS.textTertiary} />
          <Text style={styles.addSetText}>セット追加</Text>
        </TouchableOpacity>
      </View>

      {/* 種目完了 / ワークアウト終了 */}
      <TouchableOpacity
        style={[styles.doneBtn, styles.doneBtnDone]}
        onPress={handleExerciseComplete}
        accessibilityLabel={isLastExercise ? 'ワークアウトを完了する' : '次の種目へ'}
      >
        <Text style={styles.doneBtnText}>
          {isLastExercise ? '種目完了 · 終了' : `種目完了 → 次へ（${currentIndex + 2}/${exerciseIds.length}）`}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.endBtn} onPress={handleWorkoutEnd} accessibilityLabel="ワークアウトを終了する">
        <Text style={styles.endBtnText}>ワークアウト終了</Text>
      </TouchableOpacity>

      {/* 過去セッション比較バーグラフ */}
      {sessionHistory.length > 0 && (
        <View style={styles.histSection}>
          <Text style={[styles.sectionLabel, styles.sectionLabelHist]}>過去との比較</Text>
          <View style={styles.histBars}>
            {[...sessionHistory, { label: '今日', maxWeight: activeRow.weight }].map((s, i) => {
              const isToday = i === sessionHistory.length;
              const h = Math.max(((s.maxWeight ?? 0) / histAllMax) * 60, (s.maxWeight ?? 0) > 0 ? 4 : 3);
              return (
                <View key={i} style={styles.histCol}>
                  <View style={[styles.histBar, { height: h }, isToday && styles.histBarCurrent]} />
                  <Text style={[styles.histLbl, isToday && styles.histLblCurrent]}>{s.label}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.histNote}>
            <View style={styles.histDot} />
            <Text style={styles.histNoteText}>
              {prevBestWeight > 0 ? `前回 ${prevBestWeight}kg（最高 ${allTimeBest}kg）` : '初回の記録'}
            </Text>
          </View>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// ── スタイル ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── 種目選択 ────────────────────────────────────────────────────────────────
  tabsWrap: {
    flexShrink: 0,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tabsContent: {
    paddingHorizontal: SPACING.contentMargin,
    gap: 6,
  },
  tab: {
    height: 34,
    minWidth: 56,
    paddingHorizontal: 16,
    borderRadius: 17,
    backgroundColor: COLORS.surface1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.accent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  exList: {
    flex: 1,
  },
  exListContent: {
    paddingHorizontal: SPACING.contentMargin,
  },
  exListContentWithBtn: {
    paddingBottom: 88,
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
    minHeight: 52,
  },
  exRowLast: {
    borderBottomWidth: 0,
  },
  exRowSelected: {
    // 選択状態は exIcon/exName で表現
  },
  exRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  exIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  exIconSelected: {
    backgroundColor: COLORS.accent,
  },
  exIconText: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textSecondary,
  },
  exTextCol: {
    flex: 1,
  },
  exName: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  exNameSelected: {
    color: COLORS.accent,
  },
  exDet: {
    fontSize: TYPOGRAPHY.captionSmall,
    color: COLORS.textTertiary,
    marginTop: 2,
  },

  // 開始ボタン
  startWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.contentMargin,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: COLORS.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
  },
  startBtn: {
    height: BUTTON_HEIGHT.primary,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.btnCTA,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    fontSize: 17,
    fontWeight: TYPOGRAPHY.bold,
    color: '#fff',
    letterSpacing: -0.2,
  },

  // ── アクティブワークアウト ────────────────────────────────────────────────────
  activeContent: {
    paddingBottom: SPACING.md,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.contentMargin,
    paddingTop: SPACING.sm,
    paddingBottom: 0,
  },
  backBtn: {
    width: BUTTON_HEIGHT.iconSmall,
    height: BUTTON_HEIGHT.iconSmall,
    borderRadius: BUTTON_HEIGHT.iconSmall / 2,
    backgroundColor: COLORS.surface1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  timerPill: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.regular,
    color: COLORS.textTertiary,
  },
  actTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.contentMargin,
    paddingTop: 2,
    paddingBottom: 14,
  },
  actNameCol: {
    flex: 1,
    marginRight: 8,
  },
  actName: {
    fontSize: TYPOGRAPHY.exerciseName,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  actSub: {
    fontSize: TYPOGRAPHY.captionSmall,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  setBadge: {
    backgroundColor: COLORS.surface1,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 5,
    flexShrink: 0,
  },
  setBadgeText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.textSecondary,
  },
  setBadgeNum: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.heavy,
  },

  numCtrl: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: SPACING.contentMargin,
    paddingBottom: 12,
  },
  numBlock: {
    flex: 1,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.card,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 8,
  },
  numLabel: {
    fontSize: TYPOGRAPHY.captionSmall,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  numVal: {
    fontSize: TYPOGRAPHY.heroNumber,
    fontWeight: TYPOGRAPHY.heavy,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.heroNumber,
    letterSpacing: -2,
    minWidth: 72,
    textAlign: 'center',
  },
  numValInput: {
    fontSize: TYPOGRAPHY.heroNumber,
    fontWeight: TYPOGRAPHY.heavy,
    color: COLORS.accent,
    lineHeight: TYPOGRAPHY.heroNumber,
    letterSpacing: -2,
    minWidth: 72,
    textAlign: 'center',
    padding: 0,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  numUnit: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginTop: -4,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepBtn: {
    width: BUTTON_HEIGHT.icon,
    height: BUTTON_HEIGHT.icon,
    borderRadius: BUTTON_HEIGHT.icon / 2,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 22,
    fontWeight: '300',
    color: COLORS.textSecondary,
    lineHeight: 28,
    includeFontPadding: false,
  },

  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: SPACING.contentMargin,
    marginBottom: 12,
    height: BUTTON_HEIGHT.primary,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.button,
  },
  doneBtnDone: {
    backgroundColor: COLORS.success,
  },
  doneBtnText: {
    fontSize: 17,
    fontWeight: TYPOGRAPHY.bold,
    color: '#fff',
    letterSpacing: -0.2,
  },

  slog: {
    paddingHorizontal: SPACING.contentMargin,
  },
  setDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setDotDone: {
    backgroundColor: COLORS.success,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 8,
  },
  sectionLabelHist: {
    marginTop: 14,
    marginBottom: 10,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
    minHeight: 44,
  },
  setRowLast: {
    borderBottomWidth: 0,
  },
  setRowActive: {
    borderBottomWidth: 0,
  },
  setNumLabel: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.textTertiary,
    width: 28,
    flexShrink: 0,
  },
  setNumLabelActive: {
    color: COLORS.accent,
  },
  setVals: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  setValsDone: {
    color: COLORS.textTertiary,
    fontWeight: TYPOGRAPHY.regular,
  },
  setValsFuture: {
    color: 'rgba(245,245,247,0.3)',
    fontWeight: TYPOGRAPHY.regular,
  },
  setActivePip: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    flexShrink: 0,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    minHeight: 44,
  },
  addSetText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontWeight: TYPOGRAPHY.regular,
  },
  setCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  histSection: {
    paddingHorizontal: SPACING.contentMargin,
    marginTop: 8,
  },
  histBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 60,
    marginBottom: 8,
  },
  histCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  histBar: {
    width: '100%',
    backgroundColor: COLORS.surface2,
    borderRadius: 2,
  },
  histBarCurrent: {
    backgroundColor: COLORS.accent,
  },
  histLbl: {
    fontSize: 8,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  histLblCurrent: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  histNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
  },
  histDot: {
    width: 6,
    height: 6,
    backgroundColor: COLORS.surface2,
    borderRadius: 1,
    flexShrink: 0,
  },
  histNoteText: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },

  endBtn: {
    marginHorizontal: SPACING.contentMargin,
    marginTop: 10,
    height: BUTTON_HEIGHT.secondary,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtnText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.regular,
    color: COLORS.textSecondary,
  },
});
