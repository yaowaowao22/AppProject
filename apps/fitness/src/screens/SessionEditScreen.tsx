import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usePersistentHeader } from '../contexts/PersistentHeaderContext';
import { useWorkout } from '../WorkoutContext';
import { getExerciseById } from '../exerciseDB';
import { BUTTON_HEIGHT, RADIUS, SPACING, TYPOGRAPHY } from '../theme';
import type { TanrenThemeColors } from '../theme';
import { useTheme } from '../ThemeContext';
import type { HistoryStackParamList } from '../navigation/RootNavigator';
import type { WorkoutSet } from '../types';

// ── 型 ────────────────────────────────────────────────────────────────────────

type NavProp = NativeStackNavigationProp<HistoryStackParamList, 'SessionEdit'>;
type RoutePropType = RouteProp<HistoryStackParamList, 'SessionEdit'>;

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── コンポーネント ─────────────────────────────────────────────────────────────

export default function SessionEditScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { workoutId, exerciseId } = route.params;
  const { workouts, updateSession, customExercises } = useWorkout();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const workout = workouts.find(w => w.id === workoutId);
  const session = workout?.sessions.find(s => s.exerciseId === exerciseId);
  const exercise = getExerciseById(exerciseId, customExercises);

  const [sets, setSets] = useState<WorkoutSet[]>(() => session?.sets ?? []);

  usePersistentHeader({
    title: exercise?.name ?? exerciseId,
    subtitle: `${sets.length}セット`,
    showBack: true,
    onBack: () => navigation.goBack(),
  });

  if (!workout || !session) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>データが見つかりません</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    await updateSession(workoutId, { ...session, sets });
    navigation.goBack();
  };

  const handleDeleteSet = (setId: string) => {
    Alert.alert('セット削除', 'このセットを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => setSets(prev => prev.filter(s => s.id !== setId)),
      },
    ]);
  };

  const handleWeightChange = (setId: string, text: string) => {
    const val = text === '' ? null : parseFloat(text);
    setSets(prev =>
      prev.map(s => s.id === setId ? { ...s, weight: isNaN(val as number) ? s.weight : val } : s),
    );
  };

  const handleRepsChange = (setId: string, text: string) => {
    const val = text === '' ? null : parseInt(text, 10);
    setSets(prev =>
      prev.map(s => s.id === setId ? { ...s, reps: isNaN(val as number) ? s.reps : val } : s),
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 列ヘッダー */}
        <View style={styles.headerRow}>
          <Text style={[styles.colLabel, styles.colSet]}>セット</Text>
          <Text style={[styles.colLabel, styles.colWeight]}>重量 (kg)</Text>
          <Text style={[styles.colLabel, styles.colReps]}>回数</Text>
          <View style={styles.colDelete} />
        </View>

        {sets.map((set, index) => (
          <View key={set.id} style={styles.setRow}>
            <View style={styles.colSet}>
              <Text style={styles.setIndex}>{index + 1}</Text>
              {set.isPersonalRecord && (
                <View style={styles.prBadge}>
                  <Text style={styles.prText}>PR</Text>
                </View>
              )}
            </View>

            <TextInput
              style={[styles.input, styles.colWeight]}
              value={set.weight !== null ? String(set.weight) : ''}
              onChangeText={text => handleWeightChange(set.id, text)}
              keyboardType="decimal-pad"
              placeholder="—"
              placeholderTextColor={colors.textTertiary}
              selectTextOnFocus
            />

            <TextInput
              style={[styles.input, styles.colReps]}
              value={set.reps !== null ? String(set.reps) : ''}
              onChangeText={text => handleRepsChange(set.id, text)}
              keyboardType="number-pad"
              placeholder="—"
              placeholderTextColor={colors.textTertiary}
              selectTextOnFocus
            />

            <TouchableOpacity
              style={[styles.colDelete, styles.deleteBtn]}
              onPress={() => handleDeleteSet(set.id)}
              activeOpacity={0.7}
              accessibilityLabel={`セット${index + 1}を削除`}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}

        {sets.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>セットがありません</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            const last = sets[sets.length - 1];
            setSets(prev => [
              ...prev,
              {
                id: newId(),
                weight: last?.weight ?? null,
                reps: last?.reps ?? null,
                completedAt: new Date().toISOString(),
              },
            ]);
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="セットを追加"
        >
          <Ionicons name="add" size={18} color={colors.accent} />
          <Text style={styles.addBtnText}>セット追加</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="変更を保存"
        >
          <Text style={styles.saveBtnText}>保存</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── スタイル ──────────────────────────────────────────────────────────────────

function makeStyles(c: TanrenThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.background,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: TYPOGRAPHY.caption,
      color: c.textTertiary,
    },
    content: {
      paddingHorizontal: SPACING.contentMargin,
      paddingBottom: SPACING.xl,
    },

    // 列ヘッダー
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.separator,
      marginBottom: SPACING.xs,
    },
    colLabel: {
      fontSize: TYPOGRAPHY.captionSmall,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    // セット行
    setRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.separator,
      minHeight: 52,
    },
    setIndex: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    prBadge: {
      backgroundColor: c.accentDim,
      borderRadius: RADIUS.badge,
      paddingHorizontal: 4,
      paddingVertical: 1,
      marginTop: 2,
    },
    prText: {
      fontSize: 8,
      fontWeight: TYPOGRAPHY.heavy,
      color: c.accent,
      letterSpacing: 0.3,
    },
    input: {
      height: 40,
      backgroundColor: c.surface1,
      borderRadius: RADIUS.card,
      paddingHorizontal: SPACING.sm,
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textPrimary,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
    },

    // 列幅
    colSet: {
      width: 48,
      alignItems: 'flex-start',
    },
    colWeight: {
      flex: 1,
      marginRight: SPACING.sm,
    },
    colReps: {
      flex: 1,
      marginRight: SPACING.sm,
    },
    colDelete: {
      width: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteBtn: {
      height: 36,
    },

    emptyState: {
      paddingVertical: SPACING.xl,
      alignItems: 'center',
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.xs,
      paddingVertical: 14,
      borderRadius: RADIUS.card,
      borderWidth: 1,
      borderColor: c.separator,
      borderStyle: 'dashed',
      marginTop: SPACING.sm,
    },
    addBtnText: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.accent,
    },

    // フッター
    footer: {
      paddingHorizontal: SPACING.contentMargin,
      paddingBottom: SPACING.lg,
      paddingTop: SPACING.sm,
      borderTopWidth: 1,
      borderTopColor: c.separator,
    },
    saveBtn: {
      backgroundColor: c.accent,
      height: BUTTON_HEIGHT.primary,
      borderRadius: RADIUS.btnCTA,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnText: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: TYPOGRAPHY.bold,
      color: c.onAccent,
      letterSpacing: -0.2,
    },
  });
}
