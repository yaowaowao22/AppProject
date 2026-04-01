import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BODY_PARTS, EXERCISES_BY_PART, EXERCISES } from '../exerciseDB';
import type { BodyPart, ReportItem, WorkoutSession, WorkoutSet } from '../types';
import { SPACING, RADIUS, BUTTON_HEIGHT } from '../theme';
import type { TanrenThemeColors } from '../theme';
import { useTheme } from '../ThemeContext';
import type { DynamicTypography } from '../ThemeContext';
import { ScreenHeader } from '../components/ScreenHeader';
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
  const insets = useSafeAreaInsets();
  const { templates, deleteTemplate } = useWorkout();
  const { colors, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);
  const exercises = EXERCISES_BY_PART[selectedPart] ?? [];

  // タブ切替時に選択状態をリセット
  useFocusEffect(
    useCallback(() => {
      setSelectedIds([]);
    }, []),
  );

  function toggleExercise(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }

  function handleStart() {
    if (selectedIds.length === 0) return;
    navigation.navigate('OrderConfirm', { exerciseIds: selectedIds });
  }

  function handleTemplatePress(exerciseIds: string[]) {
    navigation.navigate('OrderConfirm', { exerciseIds });
  }

  function handleTemplateLongPress(id: string, name: string) {
    Alert.alert(
      'テンプレートを削除',
      `「${name}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: () => deleteTemplate(id) },
      ],
    );
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader title="トレーニング" showHamburger />
      <View style={styles.subHeaderRow}>
        <Text style={styles.subHeaderTitle}>種目選択</Text>
      </View>
      {/* テンプレートセクション（1件以上ある場合のみ表示） */}
      {templates.length > 0 && (
        <View style={styles.tmplSection}>
          <Text style={styles.tmplSectionLabel}>テンプレートから開始</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tmplScrollContent}
          >
            {templates.map(tmpl => (
              <TouchableOpacity
                key={tmpl.id}
                style={styles.tmplCard}
                onPress={() => handleTemplatePress(tmpl.exerciseIds)}
                onLongPress={() => handleTemplateLongPress(tmpl.id, tmpl.name)}
                delayLongPress={500}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`${tmpl.name}、${tmpl.exerciseIds.length}種目`}
              >
                <Text style={styles.tmplName} numberOfLines={1}>{tmpl.name}</Text>
                <Text style={styles.tmplMeta}>
                  {tmpl.exerciseIds.length}種目 · {formatDate(tmpl.createdAt)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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
                    ? <Ionicons name="checkmark" size={16} color={colors.onAccent} />
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
        <View style={[styles.startWrap, { paddingBottom: Math.max(insets.bottom, 16) }]}>
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

type SetRow = { weight: number | null; reps: number | null; done: boolean };

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** 既存セッションと完了済み行から更新後の WorkoutSession を生成する */
function buildUpdatedSession(
  existingSession: WorkoutSession,
  doneRows: SetRow[],
): WorkoutSession {
  const existingSetCount = existingSession.sets.length;
  const sets: WorkoutSet[] = doneRows.map((row, i) => {
    if (i < existingSetCount) {
      // 既存セットのメタデータを保持しつつ、行の値で上書き
      return { ...existingSession.sets[i], weight: row.weight, reps: row.reps };
    }
    // 新規セット
    return {
      id: newId(),
      weight: row.weight,
      reps: row.reps,
      completedAt: new Date().toISOString(),
      isPersonalRecord: false,
    };
  });
  return { ...existingSession, sets };
}

function buildRows(
  prevSets: Array<{ weight: number | null; reps: number | null }> | null,
  defaultSets: number,
  defaultWeight: number,
  defaultReps: number,
): SetRow[] {
  if (!prevSets || prevSets.length === 0) {
    return Array.from({ length: defaultSets }, (_, i) => ({
      weight: i === 0 && defaultWeight > 0 ? defaultWeight : null,
      reps:   i === 0 && defaultReps > 0   ? defaultReps   : null,
      done:   false,
    }));
  }
  const lastPrev = prevSets[prevSets.length - 1];
  return Array.from({ length: defaultSets }, (_, i) => {
    const prev = i < prevSets.length ? prevSets[i] : lastPrev;
    return {
      weight: prev?.weight ?? null,
      reps:   prev?.reps   ?? null,
      done:   false,
    };
  });
}

export function ActiveWorkoutScreen({ navigation, route }: ActiveWorkoutProps) {
  const { exerciseIds, existingWorkoutId, existingSession } = route.params;
  const { workouts, startSession, addSet, completeSession, updateSession, workoutConfig, personalRecords } = useWorkout();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const exerciseId = exerciseIds[currentIndex];
  const exercise = EXERCISES.find(e => e.id === exerciseId);

  const [rows, setRows] = useState<SetRow[]>(() => buildRows(null, workoutConfig.defaultSets, workoutConfig.defaultWeight, workoutConfig.defaultReps));
  const [setDone, setSetDone] = useState(false);
  const [editingField, setEditingField] = useState<'weight' | 'reps' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [manualActiveIdx, setManualActiveIdx] = useState<number | null>(null);
  const workoutStartedAt = useRef(new Date().toISOString());

  const weightScale = useRef(new Animated.Value(1)).current;
  const repsScale   = useRef(new Animated.Value(1)).current;
  const weightInputRef = useRef<TextInput>(null);
  const repsInputRef   = useRef<TextInput>(null);
  const doneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editingRowRef = useRef<number>(-1);
  const activeIdxRef = useRef(0);
  const commitGuardRef = useRef(false);

  // 種目切り替え：セッション開始 + 前回データで行初期化
  useEffect(() => {
    const isFirst = currentIndex === 0;
    if (isFirst && existingSession != null) {
      // update mode: 既存セッションの行を done=true で初期化し、空行を1つ追加
      const existingRows: SetRow[] = existingSession.sets.map(s => ({
        weight: s.weight,
        reps: s.reps,
        done: true,
      }));
      setRows([...existingRows, { weight: null, reps: null, done: false }]);
    } else {
      startSession(exerciseId);
      const prev = workouts
        .flatMap(w => w.sessions.map(s => ({ ...s, date: w.date })))
        .filter(s => s.exerciseId === exerciseId && !!s.completedAt)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];
      setRows(buildRows(prev?.sets ?? null, workoutConfig.defaultSets, workoutConfig.defaultWeight, workoutConfig.defaultReps));
    }
    setManualActiveIdx(null);
    setSetDone(false);
    if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current);

    return () => {
      if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId]);

  // 現在のアクティブ行（最初の未完了行、またはユーザー選択行）
  const autoActiveIdx = rows.findIndex(r => !r.done);
  const activeIdx = manualActiveIdx !== null ? manualActiveIdx : autoActiveIdx;
  activeIdxRef.current = activeIdx;
  const allDone   = activeIdx < 0;
  const activeRow = allDone ? rows[rows.length - 1] : rows[activeIdx];

  // 既存セッション更新モード（本日のメニューから遷移した場合）
  const isUpdateMode = currentIndex === 0 && existingSession != null && existingWorkoutId != null;

  const bump = useCallback((anim: Animated.Value) => {
    anim.setValue(1);
    Animated.sequence([
      Animated.timing(anim, { toValue: 1.12, duration: 100, useNativeDriver: true }),
      Animated.spring(anim, { toValue: 1, tension: 50, friction: 5, useNativeDriver: true }),
    ]).start();
  }, []);

  function startEditing(field: 'weight' | 'reps') {
    if (allDone) return;
    commitGuardRef.current = false;
    editingRowRef.current = activeIdx;
    const val = field === 'weight' ? activeRow.weight : activeRow.reps;
    setEditValue(val !== null ? String(val) : '');
    setEditingField(field);
    setTimeout(() => {
      if (field === 'weight') weightInputRef.current?.focus();
      else repsInputRef.current?.focus();
    }, 50);
  }

  function commitEdit() {
    if (!editingField || commitGuardRef.current) return;
    const num = parseFloat(editValue);
    const rowIdx = editingRowRef.current;
    if (!isNaN(num) && num >= 0) {
      if (editingField === 'weight') {
        const clamped = Math.max(0, Math.round(num * 10) / 10);
        setRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, weight: clamped } : r));
      } else {
        const clamped = Math.max(1, Math.floor(num));
        setRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, reps: clamped } : r));
      }
    }
    setEditingField(null);
    setEditValue('');
  }

  function adjustWeight(delta: number) {
    if (allDone) return;
    const idx = activeIdxRef.current;
    setRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const cur = r.weight ?? 0;
      return { ...r, weight: Math.max(0, Math.round((cur + delta) * 10) / 10) };
    }));
    bump(weightScale);
  }

  function adjustReps(delta: number) {
    if (allDone) return;
    const idx = activeIdxRef.current;
    setRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const cur = r.reps ?? 0;
      return { ...r, reps: Math.max(1, cur + delta) };
    }));
    bump(repsScale);
  }

  function handleRowTap(i: number) {
    // 編集中の値を切り替え前に確実に保存する（editingRowRef.current で正確な行を特定）
    if (editingField !== null) {
      commitGuardRef.current = true;
      const rowIdx = editingRowRef.current;
      const numVal = parseFloat(editValue);
      setRows(prev => prev.map((r, idx) => {
        if (idx === rowIdx && !isNaN(numVal) && numVal >= 0) {
          if (editingField === 'weight') return { ...r, weight: Math.max(0, Math.round(numVal * 10) / 10) };
          return { ...r, reps: Math.max(1, Math.floor(numVal)) };
        }
        // タップした行が done なら同時に解除
        if (idx === i && r.done) return { ...r, done: false };
        return r;
      }));
      setEditingField(null);
      setEditValue('');
    } else if (rows[i].done) {
      setRows(prev => prev.map((r, idx) => idx === i ? { ...r, done: false } : r));
    }
    setManualActiveIdx(i);
  }

  function handleSetComplete() {
    if (allDone) return;
    const idx = activeIdxRef.current;
    const { weight, reps } = activeRow;

    let newRows: SetRow[] = [];
    setRows(prev => {
      const updated = prev.map((r, i) => i === idx ? { ...r, done: true } : r);
      const nextIdx = updated.findIndex(r => !r.done);
      if (nextIdx >= 0) {
        // 次の未完了行に完了した行の weight/reps をコピー
        const withCopy = updated.map((r, i) => i === nextIdx ? { ...r, weight, reps } : r);
        newRows = withCopy;
        return withCopy;
      }
      // 最後の行を完了 → 新規行に最後の完了行の weight/reps をコピー
      const result = [...updated, { weight, reps, done: false }];
      newRows = result;
      return result;
    });

    if (isUpdateMode) {
      // update mode: addSet は使わず updateSession で既存セッションを更新
      const doneRows = newRows.filter(r => r.done);
      void updateSession(existingWorkoutId!, buildUpdatedSession(existingSession!, doneRows));
    } else {
      addSet(weight ?? 0, reps ?? 0);
    }

    setManualActiveIdx(null);
    setSetDone(true);
    if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current);
    doneTimeoutRef.current = setTimeout(() => setSetDone(false), 1500);
  }

  // レポート生成（currentExIdx の種目は rows から、それ以外は workouts から取得）
  function buildReport(currentExIdx: number) {
    const maxW = (sets: Array<{ weight: number | null }>) =>
      sets.reduce<number | null>((m, s) =>
        s.weight !== null ? (m === null ? s.weight : Math.max(m, s.weight)) : m, null);

    return exerciseIds.map((eid, idx) => {
      const ex = EXERCISES.find(e => e.id === eid);
      const sorted = workouts
        .flatMap(w => w.sessions.map(s => ({ ...s })))
        .filter(s => s.exerciseId === eid && !!s.completedAt)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

      if (idx === currentExIdx) {
        // 現在の種目：completeSession がまだ workouts に反映されていないので rows を使う
        const doneRows = rows.filter(r => r.done);
        const todayMax = maxW(doneRows.map(r => ({ weight: r.weight })));
        const prevMax  = sorted.length > 0 ? maxW(sorted[0].sets) : null;
        return {
          name: ex?.name ?? eid,
          sets: doneRows.length,
          maxWeight: todayMax,
          prevBest: prevMax,
          isPR: todayMax !== null && (prevMax === null || todayMax > prevMax),
        };
      } else {
        // 過去の種目：workouts の最新セッション（今日のもの）が index 0
        const todayMax = sorted.length > 0 ? maxW(sorted[0].sets) : null;
        const prevMax  = sorted.length > 1 ? maxW(sorted[1].sets) : null;
        return {
          name: ex?.name ?? eid,
          sets: sorted[0]?.sets.length ?? 0,
          maxWeight: todayMax,
          prevBest: prevMax,
          isPR: todayMax !== null && (prevMax === null || todayMax > prevMax),
        };
      }
    });
  }

  async function handleExerciseComplete() {
    await completeSession();
    const nextIndex = currentIndex + 1;
    if (nextIndex < exerciseIds.length) {
      setCurrentIndex(nextIndex);
    } else {
      navigation.replace('WorkoutComplete', {
        reportItems: buildReport(currentIndex),
        startedAt: workoutStartedAt.current,
      });
    }
  }

  async function handlePreviousExercise() {
    if (currentIndex === 0) return;
    if (rows.some(r => r.done)) {
      await completeSession();
    }
    setCurrentIndex(prev => prev - 1);
  }

  async function doWorkoutEnd() {
    if (rows.some(r => r.done)) {
      await completeSession();
    }
    navigation.replace('WorkoutComplete', {
      reportItems: buildReport(currentIndex),
      startedAt: workoutStartedAt.current,
    });
  }

  function handleWorkoutEnd() {
    const msg = rows.some(r => r.done)
      ? '現在の種目のデータを保存して終了しますか？'
      : '現在の種目はまだ記録されていません。終了しますか？';
    Alert.alert('ワークアウトを終了', msg, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '終了する', style: 'destructive', onPress: () => doWorkoutEnd() },
    ]);
  }

  const isLastExercise = currentIndex === exerciseIds.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader title="トレーニング" showHamburger />
      {/* 種目情報行: 戻るボタン + 戻り先ラベル + 種目名・進捗 */}
      <TouchableOpacity
        style={styles.detailBackRow}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="順序確認に戻る"
      >
        <Ionicons name="chevron-back" size={20} color={colors.accent} />
        <Text style={styles.detailBackText}>順序確認</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.detailBackInfo}>
          {exercise?.name ?? 'ワークアウト'}
          {exerciseIds.length > 1 ? `　${currentIndex + 1}/${exerciseIds.length}` : ''}
        </Text>
      </TouchableOpacity>

      {/* 数値コントロール（アクティブ行を反映・固定） */}
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
            <TouchableOpacity style={styles.stepBtn} onPress={() => adjustWeight(-workoutConfig.weightStep)} accessibilityLabel={`重量−${workoutConfig.weightStep}kg`}>
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stepBtn} onPress={() => adjustWeight(workoutConfig.weightStep)} accessibilityLabel={`重量＋${workoutConfig.weightStep}kg`}>
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

      {/* セット完了ボタン（固定） */}
      {!allDone && (
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={handleSetComplete}
          accessibilityLabel="セットを完了する"
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="rgba(255,255,255,0.85)" />
          <Text style={styles.doneBtnText}>セット完了</Text>
        </TouchableOpacity>
      )}

      {/* セパレーター: 固定エリアとスクロールエリアの境界 */}
      <View style={styles.setSeparator} />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.activeContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      {/* セット一覧（デフォルト5行 + 追加可） */}
      <View style={styles.slog}>
        {(() => {
          const pr = personalRecords.find(r => r.exerciseId === exerciseId);
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.sectionLabel}>セット</Text>
              {pr && (
                <View style={{ backgroundColor: colors.accentDim, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                  <Text style={{ color: colors.accent, fontWeight: TYPOGRAPHY.heavy as any, fontSize: 11 }}>
                    PR {pr.maxWeight}kg
                  </Text>
                </View>
              )}
            </View>
          );
        })()}
        {rows.map((row, i) => {
          const isActive = i === activeIdx;
          // データがなく、完了でも現在アクティブでもない行のみ薄く表示
          const isFuture = !row.done && i !== activeIdx && row.weight === null && row.reps === null;
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              onPress={() => handleRowTap(i)}
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
                {(row.weight !== null && row.reps !== null)
                  ? `${row.weight % 1 === 0 ? row.weight : row.weight.toFixed(1)}kg × ${row.reps}`
                  : '—'}
              </Text>
              {row.done && (
                <View style={styles.setCheck}>
                  <Ionicons name="checkmark" size={10} color={colors.onAccent} />
                </View>
              )}
              {isActive && <View style={styles.setActivePip} />}
            </TouchableOpacity>
          );
        })}

      </View>


      <View style={{ height: 20 }} />
      </ScrollView>

      {/* セット一覧とボタンのセパレーター */}
      <View style={styles.bottomSeparator} />

      {/* 種目完了 / ワークアウト終了（固定・横並び） */}
      <View style={styles.btnRow}>
        {currentIndex > 0 && (
          <TouchableOpacity
            style={styles.prevBtn}
            onPress={handlePreviousExercise}
            accessibilityLabel="前の種目に戻る"
          >
            <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
            <Text style={styles.prevBtnText}>前の種目</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.doneBtn, styles.btnRowItem]}
          onPress={handleExerciseComplete}
          accessibilityLabel={isLastExercise ? '種目完了' : '次の種目へ'}
        >
          <Text style={styles.doneBtnText}>
            {isLastExercise ? '種目完了' : '次の種目へ'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.endBtn, styles.btnRowEnd]}
          onPress={handleWorkoutEnd}
          accessibilityLabel="ワークアウトを終了する"
        >
          <Text style={styles.endBtnText}>終了</Text>
        </TouchableOpacity>
      </View>
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
    height: 44,
    minWidth: 56,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: c.surface1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: c.accent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.semiBold,
    color: c.textSecondary,
  },
  tabTextActive: {
    color: c.onAccent,
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
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.separator,
    minHeight: 40,
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
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: c.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  exIconSelected: {
    backgroundColor: c.accent,
  },
  exIconText: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.bold,
    color: c.textSecondary,
  },
  exTextCol: {
    flex: 1,
  },
  exName: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.semiBold,
    color: c.textPrimary,
    letterSpacing: -0.2,
  },
  exNameSelected: {
    color: c.accent,
  },
  exDet: {
    fontSize: TYPOGRAPHY.captionSmall,
    color: c.textTertiary,
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
    backgroundColor: c.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.separator,
  },
  startBtn: {
    height: BUTTON_HEIGHT.secondary,
    backgroundColor: c.accent,
    borderRadius: RADIUS.btnCTA,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    fontSize: 17,
    fontWeight: TYPOGRAPHY.bold,
    color: c.onAccent,
    letterSpacing: -0.2,
  },

  // テンプレートセクション
  tmplSection: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.separator,
  },
  tmplSectionLabel: {
    fontSize: TYPOGRAPHY.captionSmall,
    fontWeight: TYPOGRAPHY.semiBold,
    color: c.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.contentMargin,
    marginBottom: SPACING.sm,
  },
  tmplScrollContent: {
    paddingHorizontal: SPACING.contentMargin,
    gap: SPACING.cardGap,
  },
  tmplCard: {
    backgroundColor: c.surface1,
    borderRadius: RADIUS.card,
    padding: SPACING.cardPadding,
    minWidth: 120,
    maxWidth: 180,
    justifyContent: 'space-between',
    gap: 4,
  },
  tmplName: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.semiBold,
    color: c.textPrimary,
    letterSpacing: -0.2,
  },
  tmplMeta: {
    fontSize: TYPOGRAPHY.caption,
    color: c.textTertiary,
  },

  subHeaderRow: {
    paddingHorizontal: SPACING.contentMargin,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  subHeaderTitle: {
    fontSize: TYPOGRAPHY.exerciseName,
    fontWeight: TYPOGRAPHY.bold,
    color: c.textPrimary,
    letterSpacing: -0.4,
  },
  detailBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.contentMargin,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  detailBackText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.semiBold,
    color: c.accent,
  },
  detailBackInfo: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.semiBold,
    color: c.textTertiary,
  },

  // ── アクティブワークアウト ────────────────────────────────────────────────────
  muscleRow: {
    paddingHorizontal: SPACING.contentMargin,
    paddingTop: SPACING.sm,
    paddingBottom: 14,
  },
  scrollArea: {
    flex: 1,
  },
  activeContent: {
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.surface1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actNameCol: {
    flex: 1,
  },
  actName: {
    fontSize: TYPOGRAPHY.exerciseName,
    fontWeight: TYPOGRAPHY.bold,
    color: c.textPrimary,
    letterSpacing: -0.4,
  },
  actSub: {
    fontSize: TYPOGRAPHY.captionSmall,
    color: c.textTertiary,
    marginTop: 2,
  },
  setBadge: {
    backgroundColor: c.surface1,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 5,
    flexShrink: 0,
  },
  setBadgeText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.semiBold,
    color: c.textSecondary,
  },
  setBadgeNum: {
    color: c.textPrimary,
    fontWeight: TYPOGRAPHY.heavy,
  },

  numCtrl: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: SPACING.contentMargin,
    paddingBottom: 8,
  },
  numBlock: {
    flex: 1,
    backgroundColor: c.surface1,
    borderRadius: RADIUS.card,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
  },
  numLabel: {
    fontSize: TYPOGRAPHY.captionSmall,
    fontWeight: TYPOGRAPHY.semiBold,
    color: c.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  numVal: {
    fontSize: 42,
    fontWeight: TYPOGRAPHY.heavy,
    color: c.textPrimary,
    lineHeight: 46,
    letterSpacing: -1.5,
    minWidth: 64,
    textAlign: 'center',
  },
  numValInput: {
    fontSize: 42,
    fontWeight: TYPOGRAPHY.heavy,
    color: c.accent,
    lineHeight: 46,
    letterSpacing: -1.5,
    minWidth: 64,
    textAlign: 'center',
    padding: 0,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  numUnit: {
    fontSize: TYPOGRAPHY.caption,
    color: c.textTertiary,
    marginTop: -2,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 22,
    fontWeight: '300',
    color: c.textSecondary,
    lineHeight: 28,
    includeFontPadding: false,
  },

  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: SPACING.contentMargin,
    marginBottom: 8,
    alignItems: 'stretch',
  },
  btnRowItem: {
    flex: 1,
    marginHorizontal: 0,
    marginBottom: 0,
  },
  btnRowEnd: {
    marginHorizontal: 0,
    marginBottom: 0,
    paddingHorizontal: 16,
    width: 64,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 12,
    height: BUTTON_HEIGHT.secondary,
    backgroundColor: c.surface1,
    borderRadius: RADIUS.card,
  },
  prevBtnText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.regular,
    color: c.textSecondary,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: SPACING.contentMargin,
    marginBottom: 8,
    height: BUTTON_HEIGHT.secondary,
    backgroundColor: c.accent,
    borderRadius: RADIUS.button,
  },
  doneBtnDone: {
    backgroundColor: c.success,
  },
  doneBtnText: {
    fontSize: 17,
    fontWeight: TYPOGRAPHY.bold,
    color: c.onAccent,
    letterSpacing: -0.2,
  },

  slog: {
    paddingHorizontal: SPACING.contentMargin,
  },
  setDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: c.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setDotDone: {
    backgroundColor: c.success,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.semiBold,
    color: c.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 8,
  },
  sectionLabelHist: {
    marginTop: 18,
    marginBottom: 12,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.separator,
    minHeight: 44,
  },
  setRowLast: {
    borderBottomWidth: 0,
  },
  setRowActive: {
    backgroundColor: c.accentDim,
    borderRadius: 8,
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderBottomWidth: 0,
  },
  setSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.separator,
    marginHorizontal: SPACING.contentMargin,
    marginVertical: SPACING.sm,
  },
  setNumLabel: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.semiBold,
    color: c.textTertiary,
    width: 28,
    flexShrink: 0,
  },
  setNumLabelActive: {
    color: c.accent,
  },
  setVals: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.semiBold,
    color: c.textPrimary,
    flex: 1,
  },
  setValsDone: {
    color: c.textTertiary,
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
    backgroundColor: c.accent,
    flexShrink: 0,
  },
  setCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: c.success,
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
    height: 80,
    marginBottom: 8,
  },
  histCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 80,
  },
  histBar: {
    width: '80%',
    backgroundColor: c.surface2,
    borderRadius: 3,
    minWidth: 6,
  },
  histBarCurrent: {
    backgroundColor: c.accent,
  },
  histLbl: {
    fontSize: 10,
    color: c.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  histLblCurrent: {
    color: c.accent,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  histBarVal: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.semiBold,
    color: c.textSecondary,
    marginBottom: 2,
    textAlign: 'center',
  },
  histBarValCurrent: {
    color: c.accent,
    fontWeight: TYPOGRAPHY.bold,
  },
  histNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.separator,
  },
  histDot: {
    width: 6,
    height: 6,
    backgroundColor: c.surface2,
    borderRadius: 1,
    flexShrink: 0,
  },
  histNoteText: {
    fontSize: 11,
    color: c.textTertiary,
  },

  bottomSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.separator,
    marginHorizontal: SPACING.contentMargin,
    marginVertical: 8,
  },
  endBtn: {
    marginHorizontal: SPACING.contentMargin,
    marginBottom: 8,
    height: BUTTON_HEIGHT.secondary,
    backgroundColor: c.surface1,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtnText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.regular,
    color: c.textSecondary,
  },

  // ── WorkoutCompleteScreen ─────────────────────────────────────────────────
  completeContainer: {
    flex: 1,
  },
  completeContent: {
    paddingTop: SPACING.lg,
  },
  completeHeader: {
    paddingHorizontal: SPACING.contentMargin,
    paddingBottom: SPACING.md,
  },
  completeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  completeTitle: {
    fontSize: TYPOGRAPHY.screenTitle,
    fontWeight: TYPOGRAPHY.bold,
    color: c.textPrimary,
    letterSpacing: -0.5,
  },
  completeCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeSub: {
    fontSize: TYPOGRAPHY.caption,
    color: c.textTertiary,
    marginTop: 2,
  },
  completeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.contentMargin,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.separator,
  },
  completeRowLast: {
    borderBottomWidth: 0,
  },
  completeRowLeft: {
    flex: 1,
  },
  completeRowName: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.semiBold,
    color: c.textPrimary,
    letterSpacing: -0.2,
  },
  completeRowDetail: {
    fontSize: TYPOGRAPHY.captionSmall,
    color: c.textTertiary,
    marginTop: 2,
  },
  completePRBadge: {
    backgroundColor: c.accentDim,
    borderRadius: RADIUS.badge,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  completePRText: {
    fontSize: TYPOGRAPHY.captionSmall,
    fontWeight: TYPOGRAPHY.heavy,
    color: c.accent,
    letterSpacing: 0.5,
  },
  completeFooter: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.separator,
  },
  completeHomeBtn: {
    height: BUTTON_HEIGHT.primary,
    backgroundColor: c.accent,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeHomeBtnText: {
    fontSize: 17,
    fontWeight: TYPOGRAPHY.bold,
    color: c.onAccent,
    letterSpacing: -0.2,
  },
  });
}

// ── WorkoutCompleteScreen ─────────────────────────────────────────────────────

type WorkoutCompleteProps = NativeStackScreenProps<WorkoutStackParamList, 'WorkoutComplete'>;

export function WorkoutCompleteScreen({ navigation, route }: WorkoutCompleteProps) {
  const { reportItems, startedAt } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => makeCompleteStyles(colors), [colors]);

  const durationSec = Math.round((Date.now() - new Date(startedAt).getTime()) / 1000);
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  const durationLabel = `${minutes}分${seconds}秒`;

  const totalVolume = reportItems.reduce((sum, r) => {
    return sum + (r.maxWeight ?? 0) * r.sets;
  }, 0);

  const totalSets = reportItems.reduce((sum, r) => sum + r.sets, 0);
  const hasPR = reportItems.some(r => r.isPR);

  function handleGoHome() {
    // WorkoutStack をリセットしてから Home へ遷移（再表示防止）
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'ExerciseSelect' }],
      })
    );
    navigation.getParent()?.navigate('Home');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* ヘッダー：アイコン + タイトル */}
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name={hasPR ? 'trophy' : 'checkmark-circle'} size={48} color={styles.iconColor.color} />
        </View>
        <Text style={styles.title}>お疲れ様でした！</Text>
        <Text style={styles.sub}>ワークアウト完了</Text>
      </View>

      {/* サマリーカード（総ボリューム・セット数・所要時間） */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{Math.round(totalVolume).toLocaleString()}</Text>
          <Text style={styles.statLbl}>kg 総volume</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{totalSets}</Text>
          <Text style={styles.statLbl}>セット数</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{minutes}</Text>
          <Text style={styles.statLbl}>分{seconds > 0 ? `${seconds}秒` : ''}</Text>
        </View>
      </View>

      {/* 種目別レポート */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>種目別レポート</Text>
        {reportItems.map((item, i) => (
          <View key={i} style={[styles.row, i === reportItems.length - 1 && styles.rowLast]}>
            <View style={styles.rowLeft}>
              <Text style={styles.exName}>{item.name}</Text>
              <Text style={styles.exMeta}>{item.sets}セット{item.maxWeight !== null ? ` · 最大 ${item.maxWeight}kg` : ''}</Text>
            </View>
            {item.isPR && (
              <View style={styles.prBadge}>
                <Text style={styles.prText}>PR</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.doneBtn}
        onPress={handleGoHome}
        accessibilityRole="button"
        accessibilityLabel="ホームに戻る"
      >
        <Text style={styles.doneBtnText}>ホームに戻る</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function makeCompleteStyles(c: TanrenThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    header: {
      alignItems: 'center',
      paddingHorizontal: SPACING.contentMargin,
      paddingTop: 32,
      paddingBottom: 16,
    },
    iconWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.accentDim,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    iconColor: {
      color: c.accent,
    },
    title: {
      fontSize: 28,
      fontWeight: TYPOGRAPHY.bold,
      color: c.textPrimary,
      letterSpacing: -0.5,
    },
    sub: {
      fontSize: TYPOGRAPHY.bodySmall,
      color: c.textTertiary,
      marginTop: 4,
    },
    statsRow: {
      flexDirection: 'row',
      paddingHorizontal: SPACING.contentMargin,
      gap: SPACING.cardGap,
      paddingBottom: SPACING.md,
    },
    statCard: {
      flex: 1,
      backgroundColor: c.surface1,
      borderRadius: RADIUS.card,
      paddingVertical: 12,
      alignItems: 'center',
      gap: 2,
    },
    statVal: {
      fontSize: TYPOGRAPHY.exerciseName,
      fontWeight: TYPOGRAPHY.bold,
      color: c.textPrimary,
      letterSpacing: -0.5,
    },
    statLbl: {
      fontSize: TYPOGRAPHY.captionSmall,
      color: c.textTertiary,
      textAlign: 'center',
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.9,
      marginBottom: 8,
    },
    list: { flex: 1 },
    listContent: {
      paddingHorizontal: SPACING.contentMargin,
      paddingBottom: 16,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.separator,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowLeft: { flex: 1 },
    exName: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textPrimary,
    },
    exMeta: {
      fontSize: TYPOGRAPHY.caption,
      color: c.textTertiary,
      marginTop: 2,
    },
    prBadge: {
      backgroundColor: c.accentDim,
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginLeft: 8,
    },
    prText: {
      fontSize: 11,
      fontWeight: TYPOGRAPHY.bold,
      color: c.accent,
    },
    doneBtn: {
      marginHorizontal: SPACING.contentMargin,
      marginBottom: 8,
      height: BUTTON_HEIGHT.secondary,
      backgroundColor: c.accent,
      borderRadius: RADIUS.button,
      alignItems: 'center',
      justifyContent: 'center',
    },
    doneBtnText: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: TYPOGRAPHY.bold,
      color: c.onAccent,
    },
  });
}
