import React, { useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { SwipeableRow } from '../components/SwipeableRow';
import { ScreenHeader } from '../components/ScreenHeader';
import { useWorkout } from '../WorkoutContext';
import { getExerciseById } from '../exerciseDB';
import { SPACING, TYPOGRAPHY } from '../theme';
import type { TanrenThemeColors } from '../theme';
import { useTheme } from '../ThemeContext';
import type { HistoryStackParamList } from '../navigation/RootNavigator';
import type { WorkoutSession } from '../types';

// ── 型 ────────────────────────────────────────────────────────────────────────

type NavProp = NativeStackNavigationProp<HistoryStackParamList, 'DayDetail'>;
type RoutePropType = RouteProp<HistoryStackParamList, 'DayDetail'>;

// ── ヘルパー ──────────────────────────────────────────────────────────────────

const WEEK_DAYS = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const dow = WEEK_DAYS[date.getDay()];
  return `${m}月${d}日（${dow}）`;
}

// ── コンポーネント ─────────────────────────────────────────────────────────────

export default function DayDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { workoutId } = route.params;
  const { workouts, deleteSessionFromWorkout, customExercises } = useWorkout();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const workout = workouts.find(w => w.id === workoutId);

  if (!workout) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScreenHeader title="詳細" showBack />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>データが見つかりません</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dateLabel = formatDate(workout.date);
  const totalSets = workout.sessions.reduce((sum, s) => sum + s.sets.length, 0);
  const subtitleText = `${workout.sessions.length}種目 · ${totalSets}セット · ${workout.totalVolume.toLocaleString()}kg`;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScreenHeader title={dateLabel} showBack subtitle={subtitleText} />
      <FlatList
        data={workout.sessions}
        keyExtractor={(s: WorkoutSession) => s.exerciseId}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: WorkoutSession }) => {
          const ex = getExerciseById(item.exerciseId, customExercises);
          const maxW = item.sets.reduce<number | null>((m, set) =>
            set.weight !== null ? (m === null ? set.weight : Math.max(m, set.weight)) : m, null);
          const hasPR = item.sets.some(s => s.isPersonalRecord);
          const setCount = item.sets.length;

          return (
            <SwipeableRow onDelete={() => deleteSessionFromWorkout(workoutId, item.exerciseId)}>
              <TouchableOpacity
                style={styles.row}
                onPress={() =>
                  navigation.navigate('SessionEdit', {
                    workoutId,
                    exerciseId: item.exerciseId,
                  })
                }
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${ex?.name ?? item.exerciseId} を編集`}
              >
                <View style={styles.rowLeft}>
                  <Text style={styles.name}>{ex?.name ?? item.exerciseId}</Text>
                  <Text style={styles.detail}>
                    {setCount}セット{maxW !== null ? ` · 最大${maxW}kg` : ' · 自重'}
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  {hasPR && (
                    <View style={styles.prBadge}>
                      <Text style={styles.prText}>PR</Text>
                    </View>
                  )}
                  <Text style={styles.chevron}>›</Text>
                </View>
              </TouchableOpacity>
            </SwipeableRow>
          );
        }}
      />
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
    list: {
      paddingHorizontal: SPACING.contentMargin,
      paddingBottom: SPACING.xl,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: c.separator,
      minHeight: 60,
    },
    rowLeft: {
      flex: 1,
      gap: 3,
    },
    name: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textPrimary,
    },
    detail: {
      fontSize: TYPOGRAPHY.caption,
      color: c.textTertiary,
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    prBadge: {},
    prText: {
      fontSize: TYPOGRAPHY.captionSmall,
      fontWeight: '600',
      color: c.accent,
    },
    chevron: {
      fontSize: 22,
      color: c.textTertiary,
    },
  });
}
