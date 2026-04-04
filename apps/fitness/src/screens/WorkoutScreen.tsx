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

import { BODY_PARTS, EXERCISES_BY_PART, EXERCISES, getExerciseById } from '../exerciseDB';
import type { BodyPart, Exercise, EquipmentType, ReportItem, WorkoutSession, WorkoutSet } from '../types';

import { SPACING, RADIUS, BUTTON_HEIGHT } from '../theme';
import type { TanrenThemeColors } from '../theme';
import { useTheme } from '../ThemeContext';
import type { DynamicTypography } from '../ThemeContext';
import { usePersistentHeader } from '../contexts/PersistentHeaderContext';
import { BottomSheet } from '../components/BottomSheet';
import { SwipeableRow } from '../components/SwipeableRow';
import { useWorkout } from '../WorkoutContext';
import type { WorkoutStackParamList } from '../navigation/RootNavigator';

// ── ヘルパー ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatWorkoutDateLabel(dateStr: string): string {
  const todayStr = toDateStr(new Date());
  if (dateStr === todayStr) return '今日';
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

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
  const { templates, deleteTemplate, workoutTargetDate, customExercises, addCustomExercise, deleteCustomExercise, hiddenExerciseIds, hideExercise, unhideAll } = useWorkout();
  const { colors, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPart, setNewPart] = useState<BodyPart>(BODY_PARTS[0].id as BodyPart);
  const [newEquipment, setNewEquipment] = useState<EquipmentType>('バーベル');
  const presetExercises = EXERCISES_BY_PART[selectedPart] ?? [];
  const customForPart = customExercises.filter(e => e.bodyPart === selectedPart);
  const allForPart = [...presetExercises, ...customForPart];
  const exercises = allForPart.filter(e => !hiddenExerciseIds.includes(e.id));
  const hiddenCountForPart = allForPart.filter(e => hiddenExerciseIds.includes(e.id)).length;

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

  async function handleAddExercise() {
    if (!newName.trim()) return;
    await addCustomExercise(newName.trim(), newPart, newEquipment);
    setAddModalVisible(false);
    setNewName('');
    setNewEquipment('バーベル');
  }

  function handleDeleteCustomExercise(id: string) {
    Alert.alert(
      '種目を削除',
      'この種目を削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            setSelectedIds(prev => prev.filter(x => x !== id));
            await deleteCustomExercise(id);
          },
        },
      ],
    );
  }

  function handleHideExercise(id: string, name: string) {
    Alert.alert(
      '種目を非表示',
      `「${name}」をリストから非表示にしますか？\n設定からいつでも復元できます。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '非表示にする',
          style: 'destructive',
          onPress: async () => {
            setSelectedIds(prev => prev.filter(x => x !== id));
            await hideExercise(id);
          },
        },
      ],
    );
  }

  function handleUnhideAll() {
    Alert.alert(
      '非表示の種目を復元',
      'このタブで非表示にした種目をすべて表示しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '復元する', onPress: () => unhideAll() },
      ],
    );
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  const addButtonAction = useMemo(() => (
    <TouchableOpacity
      onPress={() => {
        setNewPart(selectedPart);
        setNewName('');
        setNewEquipment('バーベル');
        setAddModalVisible(true);
      }}
      accessibilityRole="button"
      accessibilityLabel="種目を追加"
    >
      <Ionicons name="add-circle-outline" size={24} color={colors.accent} />
    </TouchableOpacity>
  ), [selectedPart, colors.accent]);

  usePersistentHeader({
    title: 'トレーニング',
    subtitle: formatWorkoutDateLabel(workoutTargetDate),
    showHamburger: true,
    rightAction: addButtonAction,
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
          const row = (
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
          if (item.isCustom) {
            return (
              <SwipeableRow onDelete={() => handleDeleteCustomExercise(item.id)}>
                {row}
              </SwipeableRow>
            );
          }
          return (
            <SwipeableRow onDelete={() => handleHideExercise(item.id, item.name)}>
              {row}
            </SwipeableRow>
          );
        }}
        ListFooterComponent={hiddenCountForPart > 0 ? (
          <TouchableOpacity
            style={styles.unhideBtn}
            onPress={handleUnhideAll}
            activeOpacity={0.7}
          >
            <Ionicons name="eye-outline" size={14} color={colors.textTertiary} />
            <Text style={styles.unhideBtnText}>非表示 {hiddenCountForPart}件 · 復元する</Text>
          </TouchableOpacity>
        ) : null}
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

      {/* 種目追加モーダル */}
      <BottomSheet
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        title="種目を追加"
      >
        <Text style={styles.addFormLabel}>種目名</Text>
        <TextInput
          style={styles.addFormInput}
          value={newName}
          onChangeText={setNewName}
          placeholder="例: インクラインダンベルロウ"
          placeholderTextColor={colors.textTertiary}
          autoFocus
          returnKeyType="done"
        />
        <Text style={styles.addFormLabel}>部位</Text>
        <View style={styles.addChipRow}>
          {BODY_PARTS.map(bp => (
            <TouchableOpacity
              key={bp.id}
              style={[styles.addChip, newPart === bp.id && styles.addChipActive]}
              onPress={() => setNewPart(bp.id as BodyPart)}
              activeOpacity={0.7}
            >
              <Text style={[styles.addChipText, newPart === bp.id && styles.addChipTextActive]}>
                {bp.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.addFormLabel}>器具</Text>
        <View style={styles.addChipRow}>
          {(['バーベル', 'ダンベル', 'マシン', 'ケーブル', '自重', 'ローラー', 'ツール'] as EquipmentType[]).map(eq => (
            <TouchableOpacity
              key={eq}
              style={[styles.addChip, newEquipment === eq && styles.addChipActive]}
              onPress={() => setNewEquipment(eq)}
              activeOpacity={0.7}
            >
              <Text style={[styles.addChipText, newEquipment === eq && styles.addChipTextActive]}>
                {eq}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.addSubmitBtn, !newName.trim() && styles.addSubmitBtnDisabled]}
          onPress={handleAddExercise}
          disabled={!newName.trim()}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="追加"
        >
          <Text style={styles.addSubmitBtnText}>追加</Text>
        </TouchableOpacity>
      </BottomSheet>
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
  notes?: string,
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
  return { ...existingSession, sets, notes: notes !== undefined ? (notes || undefined) : existingSession.notes };
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
  const { exerciseIds, existingWorkoutId, existingSession, fromHome, _ts } = route.params;
  const { workouts, startSession, completeSession, updateSession, workoutConfig, personalRecords, customExercises } = useWorkout();
  const { colors, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const safeIndex = Math.min(currentIndex, exerciseIds.length - 1);
  const exerciseId = exerciseIds[safeIndex];
  const exercise = getExerciseById(exerciseId, customExercises);

  // ホームから別日のメニューを開いた時に状態をリセット
  const prevTsRef = useRef(_ts);
  if (_ts !== undefined && _ts !== prevTsRef.current) {
    prevTsRef.current = _ts;
    if (currentIndex !== 0) {
      setCurrentIndex(0);
    }
  }

  const [rows, setRows] = useState<SetRow[]>(() => buildRows(null, workoutConfig.defaultSets, workoutConfig.defaultWeight, workoutConfig.defaultReps));
  const [setDone, setSetDone] = useState(false);
  const [editingField, setEditingField] = useState<'weight' | 'reps' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [manualActiveIdx, setManualActiveIdx] = useState<number | null>(null);
  const [memo, setMemo] = useState('');
  const [memoSheetVisible, setMemoSheetVisible] = useState(false);
  const [inputWeight, setInputWeight] = useState<number | null>(null);
  const [inputReps, setInputReps] = useState<number | null>(null);
  const workoutStartedAt = useRef(new Date().toISOString());

  const weightScale = useRef(new Animated.Value(1)).current;
  const repsScale   = useRef(new Animated.Value(1)).current;
  const weightInputRef = useRef<TextInput>(null);
  const repsInputRef   = useRef<TextInput>(null);
  const doneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editingRowRef = useRef<number>(-1);
  const activeIdxRef = useRef(0);
  const commitGuardRef = useRef(false);
  const setListScrollRef = useRef<ScrollView>(null);

  // 種目切り替え：セッション開始 + 前回データで行初期化
  // _ts を依存に含めることで、ホームから別日のメニューを開いた際も確実にリセットされる
  useEffect(() => {
    if (!exerciseId) return;

    const isFirst = safeIndex === 0;
    if (isFirst && existingSession != null) {
      // update mode: 既存セッションの行を done=true で初期化し、空行を1つ追加
      const existingRows: SetRow[] = existingSession.sets.map(s => ({
        weight: s.weight,
        reps: s.reps,
        done: true,
      }));
      setRows([...existingRows, { weight: null, reps: null, done: false }]);
      // 入力欄は最後の既存セットの値を引き継ぐ
      const lastSet = existingSession.sets[existingSession.sets.length - 1];
      setInputWeight(lastSet?.weight ?? null);
      setInputReps(lastSet?.reps ?? null);
      setMemo(existingSession.notes || '');
    } else {
      startSession(exerciseId);
      const prev = workouts
        .flatMap(w => w.sessions.map(s => ({ ...s, date: w.date })))
        .filter(s => s.exerciseId === exerciseId && !!s.completedAt)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];
      const builtRows = buildRows(prev?.sets ?? null, workoutConfig.defaultSets, workoutConfig.defaultWeight, workoutConfig.defaultReps);
      setRows(builtRows);
      // 入力欄は最初の行の値で初期化
      setInputWeight(builtRows[0]?.weight ?? null);
      setInputReps(builtRows[0]?.reps ?? null);
      setMemo('');
    }
    setManualActiveIdx(null);
    setSetDone(false);
    setEditingField(null);
    setEditValue('');
    workoutStartedAt.current = new Date().toISOString();
    if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current);

    return () => {
      if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId, _ts]);

  // 現在のアクティブ行（最初の未完了行、またはユーザー選択行）
  const autoActiveIdx = rows.findIndex(r => !r.done);
  const activeIdx = manualActiveIdx !== null ? manualActiveIdx : autoActiveIdx;
  activeIdxRef.current = activeIdx;
  const allDone   = activeIdx < 0;
  const activeRow = allDone ? rows[rows.length - 1] : rows[activeIdx];

  // 既存セッション更新モード（本日のメニューから遷移した場合）
  const isUpdateMode = safeIndex === 0 && existingSession != null && existingWorkoutId != null;

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
    const val = field === 'weight' ? inputWeight : inputReps;
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
    if (!isNaN(num) && num >= 0) {
      if (editingField === 'weight') {
        setInputWeight(Math.max(0, Math.round(num * 10) / 10));
      } else {
        setInputReps(Math.max(1, Math.floor(num)));
      }
    }
    setEditingField(null);
    setEditValue('');
  }

  function adjustWeight(delta: number) {
    if (allDone) return;
    setInputWeight(prev => Math.max(0, Math.round(((prev ?? 0) + delta) * 10) / 10));
    bump(weightScale);
  }

  function adjustReps(delta: number) {
    if (allDone) return;
    setInputReps(prev => Math.max(1, (prev ?? 0) + delta));
    bump(repsScale);
  }

  function handleRowTap(i: number) {
    // 編集中の値を inputWeight/inputReps に確定してから行切り替え
    if (editingField !== null) {
      commitGuardRef.current = true;
      const numVal = parseFloat(editValue);
      if (!isNaN(numVal) && numVal >= 0) {
        if (editingField === 'weight') setInputWeight(Math.max(0, Math.round(numVal * 10) / 10));
        else setInputReps(Math.max(1, Math.floor(numVal)));
      }
      setEditingField(null);
      setEditValue('');
      // タップした行が done なら同時に解除
      if (rows[i].done) {
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, done: false } : r));
      }
    } else if (rows[i].done) {
      setRows(prev => prev.map((r, idx) => idx === i ? { ...r, done: false } : r));
    }
    setManualActiveIdx(i);
  }

  function handleClearRow(i: number) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, weight: null, reps: null, done: false } : r));
    setManualActiveIdx(i);
  }

  function handleSetComplete() {
    if (allDone) return;
    const idx = activeIdxRef.current;
    const nextActive = idx + 1;

    // inputWeight/inputReps を現在行にコピーしてから done=true に
    setRows(prev => {
      let updated = prev.map((r, i) =>
        i === idx ? { ...r, weight: inputWeight, reps: inputReps, done: true } : r
      );
      // update mode: 既存セッションの行は常に done=true を維持（誤タップで解除された場合も復元）
      if (isUpdateMode && existingSession) {
        const existingCount = existingSession.sets.length;
        updated = updated.map((r, i) => i < existingCount ? { ...r, done: true } : r);
      }
      // 次の行がなければ空行を追加
      if (nextActive >= updated.length) {
        return [...updated, { weight: null, reps: null, done: false }];
      }
      return updated;
    });

    // 常に次の行へ移動（inputWeight/inputReps は変更しない）
    setManualActiveIdx(nextActive);
    // 新規行が追加される場合（全完了→空行追加）は末尾にスクロール
    if (nextActive >= rows.length) {
      setTimeout(() => setListScrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
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
      const ex = getExerciseById(eid, customExercises);
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
    const doneRows = rows.filter(r => r.done);
    const trimmedMemo = memo.trim();
    if (isUpdateMode && existingSession) {
      if (doneRows.length > 0) await updateSession(existingWorkoutId!, buildUpdatedSession(existingSession!, doneRows, trimmedMemo));
    } else if (doneRows.length > 0) {
      await completeSession(doneRows.map(r => ({ weight: r.weight, reps: r.reps })), trimmedMemo || undefined);
    }
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
    const doneRows = rows.filter(r => r.done);
    const trimmedMemo = memo.trim();
    if (doneRows.length > 0) {
      if (isUpdateMode && existingSession) {
        await updateSession(existingWorkoutId!, buildUpdatedSession(existingSession!, doneRows, trimmedMemo));
      } else {
        await completeSession(doneRows.map(r => ({ weight: r.weight, reps: r.reps })), trimmedMemo || undefined);
      }
    }
    setCurrentIndex(prev => prev - 1);
  }

  async function doWorkoutEnd() {
    const doneRows = rows.filter(r => r.done);
    const trimmedMemo = memo.trim();
    if (doneRows.length > 0) {
      if (isUpdateMode && existingSession) {
        await updateSession(existingWorkoutId!, buildUpdatedSession(existingSession!, doneRows, trimmedMemo));
      } else {
        await completeSession(doneRows.map(r => ({ weight: r.weight, reps: r.reps })), trimmedMemo || undefined);
      }
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

  usePersistentHeader({
    title: 'トレーニング',
    showHamburger: true,
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 種目情報行: 戻るボタン + 戻り先ラベル + 種目名・進捗 */}
      <TouchableOpacity
        style={styles.detailBackRow}
        onPress={() => fromHome ? (navigation as any).navigate('Home') : navigation.goBack()}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={fromHome ? 'ホームに戻る' : '順序確認に戻る'}
      >
        <Ionicons name="chevron-back" size={20} color={colors.accent} />
        <Text style={styles.detailBackText}>{fromHome ? 'ホーム' : '順序確認'}</Text>
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
                  {inputWeight === null
                    ? '—'
                    : inputWeight % 1 === 0 ? inputWeight.toString() : inputWeight.toFixed(1)}
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
                <Text style={styles.numVal}>{inputReps !== null ? String(inputReps) : '—'}</Text>
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
        ref={setListScrollRef}
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
          const est1RM = inputWeight !== null && inputReps !== null && inputReps > 0
            ? Math.round(inputWeight * (1 + inputReps / 30))
            : null;
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.sectionLabel}>セット</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {est1RM !== null && (
                  <Text style={styles.rmBadgeText}>
                    1RM <Text style={styles.rmBadgeValue}>{est1RM}kg</Text>
                  </Text>
                )}
                {pr && (
                  <View style={{ backgroundColor: colors.accentDim, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                    <Text style={{ color: colors.accent, fontWeight: typography.heavy as any, fontSize: typography.captionSmall }}>
                      PR {pr.maxWeight}kg
                    </Text>
                  </View>
                )}
              </View>
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
              <TouchableOpacity
                onPress={() => handleClearRow(i)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.setClearBtn}
                accessibilityLabel="クリア"
              >
                <Ionicons name="close" size={13} color={colors.textTertiary} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

      </View>

      {/* メモエリア（常時表示） */}
      <TouchableOpacity
        style={styles.memoDisplay}
        onPress={() => setMemoSheetVisible(true)}
        activeOpacity={0.7}
        accessibilityLabel={memo.trim() ? 'メモを編集' : 'メモを追加'}
      >
        <Ionicons
          name={memo.trim() ? 'document-text' : 'document-text-outline'}
          size={14}
          color={memo.trim() ? colors.accent : colors.textTertiary}
          style={{ marginTop: 1 }}
        />
        {memo.trim() ? (
          <Text style={styles.memoDisplayText} numberOfLines={3}>{memo}</Text>
        ) : (
          <Text style={styles.memoPlaceholderText}>メモを追加...</Text>
        )}
      </TouchableOpacity>

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

      {/* メモ入力BottomSheet */}
      <BottomSheet
        visible={memoSheetVisible}
        onClose={() => setMemoSheetVisible(false)}
        title="メモ"
        subtitle={exercise?.name}
      >
        <TextInput
          style={styles.memoInput}
          value={memo}
          onChangeText={setMemo}
          placeholder="トレーニングのメモを入力..."
          placeholderTextColor={colors.textTertiary}
          multiline
          autoFocus
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={styles.memoSaveBtn}
          onPress={() => setMemoSheetVisible(false)}
          activeOpacity={0.88}
        >
          <Text style={styles.memoSaveBtnText}>閉じる</Text>
        </TouchableOpacity>
      </BottomSheet>
    </SafeAreaView>
  );
}

// ── スタイル ──────────────────────────────────────────────────────────────────

function makeStyles(c: TanrenThemeColors, t: DynamicTypography) {
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
    fontSize: t.caption,
    fontWeight: t.semiBold,
    fontFamily: t.fontFamily,
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
    fontSize: t.body,
    fontWeight: t.bold,
    fontFamily: t.fontFamily,
    color: c.textSecondary,
  },
  exTextCol: {
    flex: 1,
  },
  exName: {
    fontSize: t.body,
    fontWeight: t.semiBold,
    fontFamily: t.fontFamily,
    color: c.textPrimary,
    letterSpacing: -0.2,
  },
  exNameSelected: {
    color: c.accent,
  },
  exDet: {
    fontSize: t.captionSmall,
    fontFamily: t.fontFamily,
    color: c.textTertiary,
    marginTop: 2,
  },
  unhideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.contentMargin,
    paddingVertical: 14,
  },
  unhideBtnText: {
    fontSize: t.caption,
    fontFamily: t.fontFamily,
    color: c.textTertiary,
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
    fontSize: t.body,
    fontWeight: t.bold,
    fontFamily: t.fontFamily,
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
    fontSize: t.captionSmall,
    fontWeight: t.semiBold,
    fontFamily: t.fontFamily,
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
    fontSize: t.bodySmall,
    fontWeight: t.semiBold,
    fontFamily: t.fontFamily,
    color: c.textPrimary,
    letterSpacing: -0.2,
  },
  tmplMeta: {
    fontSize: t.caption,
    fontFamily: t.fontFamily,
    color: c.textTertiary,
  },

  subHeaderRow: {
    paddingHorizontal: SPACING.contentMargin,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  subHeaderTitle: {
    fontSize: t.exerciseName,
    fontWeight: t.bold,
    fontFamily: t.fontFamily,
    color: c.textPrimary,
    letterSpacing: -0.4,
  },

  // 種目追加フォーム
  addFormLabel: {
    fontSize: t.captionSmall,
    fontWeight: t.semiBold,
    fontFamily: t.fontFamily,
    color: c.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  addFormInput: {
    height: 44,
    backgroundColor: c.surface2,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: t.body,
    fontFamily: t.fontFamily,
    color: c.textPrimary,
  },
  addChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addChip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: c.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addChipActive: {
    backgroundColor: c.accent,
  },
  addChipText: {
    fontSize: t.caption,
    fontWeight: t.semiBold,
    fontFamily: t.fontFamily,
    color: c.textSecondary,
  },
  addChipTextActive: {
    color: c.onAccent,
  },
  addSubmitBtn: {
    height: BUTTON_HEIGHT.secondary,
    backgroundColor: c.accent,
    borderRadius: RADIUS.btnCTA,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  addSubmitBtnDisabled: {
    opacity: 0.4,
  },
  addSubmitBtnText: {
    fontSize: t.body,
    fontWeight: t.bold,
    fontFamily: t.fontFamily,
    color: c.onAccent,
    letterSpacing: -0.2,
  },

  detailBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.contentMargin,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  detailBackText: {
    fontSize: t.bodySmall,
    fontWeight: t.semiBold,
    fontFamily: t.fontFamily,
    color: c.accent,
  },
  detailBackInfo: {
    fontSize: t.caption,
    fontWeight: t.semiBold,
    fontFamily: t.fontFamily,
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
    fontSize: t.exerciseName,
    fontWeight: t.bold,
    fontFamily: t.fontFamily,
    color: c.textPrimary,
    letterSpacing: -0.4,
  },
  actSub: {
    fontSize: t.captionSmall,
    fontFamily: t.fontFamily,
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
    fontSize: t.caption,
    fontWeight: t.semiBold,
    fontFamily: t.fontFamily,
    color: c.textSecondary,
  },
  setBadgeNum: {
    color: c.textPrimary,
    fontWeight: t.heavy,
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
    fontSize: t.captionSmall,
    fontWeight: t.semiBold,
    fontFamily: t.fontFamily,
    color: c.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  numVal: {
    fontSize: t.heroNumber,
    fontWeight: t.heavy,
    fontFamily: t.fontFamily,
    color: c.textPrimary,
    lineHeight: t.heroNumber + 4,
    letterSpacing: -1.5,
    minWidth: 64,
    textAlign: 'center',
  },
  numValInput: {
    fontSize: t.heroNumber,
    fontWeight: t.heavy,
    fontFamily: t.fontFamily,
    color: c.accent,
    lineHeight: t.heroNumber + 4,
    letterSpacing: -1.5,
    minWidth: 64,
    textAlign: 'center',
    padding: 0,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  numUnit: {
    fontSize: t.caption,
    fontFamily: t.fontFamily,
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

  rmBadgeText: {
    fontSize: t.captionSmall,
    fontFamily: t.fontFamily,
    color: c.textTertiary,
  },
  rmBadgeValue: {
    fontWeight: t.bold,
    color: c.accent,
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
    fontSize: t.bodySmall,
    fontWeight: t.regular,
    fontFamily: t.fontFamily,
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
    fontSize: t.body,
    fontWeight: t.bold,
    fontFamily: t.fontFamily,
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
    fontSize: t.captionSmall,
    fontWeight: t.semiBold,
    fontFamily: t.fontFamily,
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
    fontSize: t.caption,
    fontWeight: t.semiBold,
    fontFamily: t.fontFamily,
    color: c.textTertiary,
    width: 28,
    flexShrink: 0,
  },
  setNumLabelActive: {
    color: c.accent,
  },
  setVals: {
    fontSize: t.bodySmall,
    fontWeight: t.semiBold,
    fontFamily: t.fontFamily,
    color: c.textPrimary,
    flex: 1,
  },
  setValsDone: {
    color: c.textTertiary,
    fontWeight: t.regular,
  },
  setValsFuture: {
    color: 'rgba(245,245,247,0.3)',
    fontWeight: t.regular,
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
  setClearBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: 6,
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
    fontWeight: t.semiBold,
  },
  histBarVal: {
    fontSize: t.captionSmall,
    fontWeight: t.semiBold,
    fontFamily: t.fontFamily,
    color: c.textSecondary,
    marginBottom: 2,
    textAlign: 'center',
  },
  histBarValCurrent: {
    color: c.accent,
    fontWeight: t.bold,
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

  // メモ
  memoDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: SPACING.contentMargin,
    marginTop: 12,
    padding: 12,
    backgroundColor: c.surface1,
    borderRadius: RADIUS.card,
  },
  memoDisplayText: {
    flex: 1,
    fontSize: t.caption,
    fontFamily: t.fontFamily,
    color: c.textSecondary,
    lineHeight: t.caption * 1.5,
  },
  memoPlaceholderText: {
    flex: 1,
    fontSize: t.caption,
    fontFamily: t.fontFamily,
    color: c.textTertiary,
  },
  memoInput: {
    height: 120,
    backgroundColor: c.surface2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: t.body,
    fontFamily: t.fontFamily,
    color: c.textPrimary,
    marginTop: 12,
  },
  memoSaveBtn: {
    height: BUTTON_HEIGHT.secondary,
    backgroundColor: c.accent,
    borderRadius: RADIUS.btnCTA,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  memoSaveBtnText: {
    fontSize: t.body,
    fontWeight: t.bold,
    fontFamily: t.fontFamily,
    color: c.onAccent,
    letterSpacing: -0.2,
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
    fontSize: t.bodySmall,
    fontWeight: t.regular,
    fontFamily: t.fontFamily,
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
    fontSize: t.screenTitle,
    fontWeight: t.bold,
    fontFamily: t.fontFamily,
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
    fontSize: t.caption,
    fontFamily: t.fontFamily,
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
    fontSize: t.body,
    fontWeight: t.semiBold,
    fontFamily: t.fontFamily,
    color: c.textPrimary,
    letterSpacing: -0.2,
  },
  completeRowDetail: {
    fontSize: t.captionSmall,
    fontFamily: t.fontFamily,
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
    fontSize: t.captionSmall,
    fontWeight: t.heavy,
    fontFamily: t.fontFamily,
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
    fontSize: t.body,
    fontWeight: t.bold,
    fontFamily: t.fontFamily,
    color: c.onAccent,
    letterSpacing: -0.2,
  },
  });
}

// ── WorkoutCompleteScreen ─────────────────────────────────────────────────────

type WorkoutCompleteProps = NativeStackScreenProps<WorkoutStackParamList, 'WorkoutComplete'>;

export function WorkoutCompleteScreen({ navigation, route }: WorkoutCompleteProps) {
  const { reportItems, startedAt } = route.params;
  const { colors, typography } = useTheme();
  const styles = useMemo(() => makeCompleteStyles(colors, typography), [colors, typography]);

  usePersistentHeader({ title: '', visible: false });

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

function makeCompleteStyles(c: TanrenThemeColors, t: DynamicTypography) {
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
      fontSize: t.screenTitle,
      fontWeight: t.bold,
      fontFamily: t.fontFamily,
      color: c.textPrimary,
      letterSpacing: -0.5,
    },
    sub: {
      fontSize: t.bodySmall,
      fontFamily: t.fontFamily,
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
      fontSize: t.exerciseName,
      fontWeight: t.bold,
      fontFamily: t.fontFamily,
      color: c.textPrimary,
      letterSpacing: -0.5,
    },
    statLbl: {
      fontSize: t.captionSmall,
      fontFamily: t.fontFamily,
      color: c.textTertiary,
      textAlign: 'center',
    },
    sectionLabel: {
      fontSize: t.captionSmall,
      fontWeight: t.semiBold,
      fontFamily: t.fontFamily,
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
      fontSize: t.body,
      fontWeight: t.semiBold,
      fontFamily: t.fontFamily,
      color: c.textPrimary,
    },
    exMeta: {
      fontSize: t.caption,
      fontFamily: t.fontFamily,
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
      fontSize: t.captionSmall,
      fontWeight: t.bold,
      fontFamily: t.fontFamily,
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
      fontSize: t.body,
      fontWeight: t.bold,
      fontFamily: t.fontFamily,
      color: c.onAccent,
    },
  });
}
