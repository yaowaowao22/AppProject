import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import type { ListRenderItem } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useWorkout } from '../WorkoutContext';
import { BODY_PARTS, EXERCISES } from '../exerciseDB';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import type { DailyWorkout } from '../types';
import type { RootTabParamList } from '../navigation/RootNavigator';

// ── 定数 ──────────────────────────────────────────────────────────────────────

// getItemLayout 用の推定カード高さ（px）。タグが1行以内に収まる想定
const CARD_HEIGHT = 118;

// ── ヘルパー ──────────────────────────────────────────────────────────────────

const WEEK_DAYS = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日 ${WEEK_DAYS[date.getDay()]}`;
}

function formatDuration(seconds: number): string {
  const min = Math.round(seconds / 60);
  return `${min}分`;
}

/** セッションの exerciseId から部位ラベル（日本語）を重複なく抽出 */
function getBodyPartLabels(workout: DailyWorkout): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const session of workout.sessions) {
    const ex = EXERCISES.find(e => e.id === session.exerciseId);
    if (!ex) continue;
    const bp = BODY_PARTS.find(b => b.id === ex.bodyPart);
    if (bp && !seen.has(bp.id)) {
      seen.add(bp.id);
      labels.push(bp.label);
    }
  }
  return labels;
}

function getUniqueExerciseCount(workout: DailyWorkout): number {
  return new Set(workout.sessions.map(s => s.exerciseId)).size;
}

function getTotalSets(workout: DailyWorkout): number {
  return workout.sessions.reduce((sum, s) => sum + s.sets.length, 0);
}

// ── コンポーネント ────────────────────────────────────────────────────────────

type NavProp = BottomTabNavigationProp<RootTabParamList, 'History'>;

export function HistoryScreen() {
  const { workouts } = useWorkout();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();

  // 日付降順
  const sorted = useMemo(
    () => [...workouts].sort((a, b) => b.date.localeCompare(a.date)),
    [workouts],
  );

  const showDetail = useCallback((workout: DailyWorkout) => {
    const lines = workout.sessions.map(s => {
      const ex = EXERCISES.find(e => e.id === s.exerciseId);
      const name = ex?.name ?? s.exerciseId;
      return `${name}  ${s.sets.length}セット`;
    });
    Alert.alert(formatDate(workout.date), lines.join('\n'), [{ text: '閉じる' }]);
  }, []);

  const renderItem: ListRenderItem<DailyWorkout> = useCallback(
    ({ item }) => {
      const bodyParts = getBodyPartLabels(item);
      const exerciseCount = getUniqueExerciseCount(item);
      const totalSets = getTotalSets(item);
      const volume = Math.round(item.totalVolume);

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => showDetail(item)}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel={`${formatDate(item.date)}のワークアウト詳細を見る`}
        >
          {/* 上段: 日付 + 所要時間 */}
          <View style={styles.cardTop}>
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
            <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
          </View>

          {/* 中段: 部位タグ */}
          {bodyParts.length > 0 && (
            <View style={styles.tagsRow}>
              {bodyParts.map(label => (
                <View key={label} style={styles.tag}>
                  <Text style={styles.tagText}>{label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 下段: 種目数・セット数・ボリューム */}
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statValue}>{exerciseCount}</Text>
              <Text style={styles.statKey}>種目</Text>
            </View>
            <View>
              <Text style={styles.statValue}>{totalSets}</Text>
              <Text style={styles.statKey}>セット</Text>
            </View>
            <View>
              <Text style={styles.statValue}>{volume.toLocaleString()}</Text>
              <Text style={styles.statKey}>kg ボリューム</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [showDetail],
  );

  const keyExtractor = useCallback((item: DailyWorkout) => item.id, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<DailyWorkout> | null | undefined, index: number) => ({
      length: CARD_HEIGHT,
      offset: CARD_HEIGHT * index,
      index,
    }),
    [],
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>まだトレーニング記録がありません</Text>
      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => navigation.navigate('WorkoutStack')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="トレーニングを開始する"
      >
        <Text style={styles.ctaText}>トレーニングを開始</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.screenTitle}>履歴</Text>
      <FlatList
        data={sorted}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={10}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          sorted.length === 0 && styles.listContentEmpty,
        ]}
      />
    </View>
  );
}

// ── スタイル ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenTitle: {
    fontSize: TYPOGRAPHY.screenTitle,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    paddingHorizontal: SPACING.contentMargin,
    paddingTop: SPACING.sm,
    marginBottom: SPACING.sectionGap,
  },
  listContent: {
    paddingHorizontal: SPACING.contentMargin,
    paddingBottom: SPACING.xl,
  },
  listContentEmpty: {
    flex: 1,
  },

  // ── 履歴カード（hcard） ──────────────────────────────────────────────────────
  card: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.separator,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  dateText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  durationText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.regular,
    color: COLORS.textTertiary,
  },

  // ── 部位タグ（htag） ─────────────────────────────────────────────────────────
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: COLORS.surface2,
    borderRadius: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.regular,
    color: COLORS.textSecondary,
  },

  // ── 統計行（hc-stats） ───────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statValue: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  statKey: {
    fontSize: TYPOGRAPHY.captionSmall,
    fontWeight: TYPOGRAPHY.regular,
    color: COLORS.textTertiary,
  },

  // ── 空状態 ───────────────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.contentMargin,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  ctaButton: {
    backgroundColor: COLORS.accent,
    height: 60,
    borderRadius: 18,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 200,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
});
