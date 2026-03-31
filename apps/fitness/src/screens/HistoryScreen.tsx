import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SwipeableRow } from '../components/SwipeableRow';
import { ScreenHeader } from '../components/ScreenHeader';
import { useWorkout } from '../WorkoutContext';
import { BODY_PARTS, EXERCISES } from '../exerciseDB';
import { SPACING, TYPOGRAPHY, RADIUS, BUTTON_HEIGHT } from '../theme';
import type { TanrenThemeColors } from '../theme';
import { useTheme } from '../ThemeContext';
import type {
  BodyPart,
  DailyWorkout,
  WorkoutSession,
  WorkoutSet,
  HistoryTabType,
} from '../types';
import type { HistoryStackParamList } from '../navigation/RootNavigator';
import { LineChart } from '../components/LineChart';

// ── 定数 ──────────────────────────────────────────────────────────────────────

const CHART_H = 120;

const WEEK_DAYS = ['日', '月', '火', '水', '木', '金', '土'];

const TABS: { id: HistoryTabType; label: string }[] = [
  { id: 'daily',    label: '日別' },
  { id: 'bodyPart', label: '部位別' },
  { id: 'exercise', label: '種目別' },
];

const BP_FILTERS: Array<{ id: BodyPart | 'all'; label: string }> = [
  { id: 'all',       label: '全て' },
  { id: 'chest',     label: '胸' },
  { id: 'back',      label: '背中' },
  { id: 'legs',      label: '脚' },
  { id: 'shoulders', label: '肩' },
  { id: 'arms',      label: '腕' },
  { id: 'core',      label: '体幹' },
];

// ── 静的スタイル（カラー非依存） ─────────────────────────────────────────────

const S = StyleSheet.create({
  bpCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    minHeight: 110,
    justifyContent: 'center',
    gap: 4,
  },
  filterScrollContent: {
    paddingHorizontal: SPACING.contentMargin,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xs,
    gap: SPACING.xs,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    height: 32,
    borderRadius: RADIUS.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: SPACING.sm,
  },
  exListIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exListInfo: {
    flex: 1,
  },
  chartWrap: {
    marginHorizontal: SPACING.contentMargin,
    marginBottom: 4,
    borderRadius: RADIUS.card,
    padding: SPACING.sm,
    overflow: 'hidden',
  },
  detailBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.contentMargin,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  sessionBlock: {
    marginHorizontal: SPACING.contentMargin,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  setTableHeader: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingBottom: 5,
    alignItems: 'center',
  },
  setTableRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    alignItems: 'center',
  },
  setColNo:    { width: 28 },
  setColWt:    { flex: 1 },
  setColReps:  { flex: 1 },
  setColBadge: { width: 36, alignItems: 'flex-end' },
});

// ── ヘルパー ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日（${WEEK_DAYS[d.getDay()]}）`;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDuration(seconds: number): string {
  return `${Math.round(seconds / 60)}分`;
}

function getMaxWeight(session: WorkoutSession): number | null {
  let max: number | null = null;
  for (const s of session.sets) {
    if (s.weight !== null && (max === null || s.weight > max)) max = s.weight;
  }
  return max;
}

function getVolume(session: WorkoutSession): number {
  return session.sets.reduce(
    (sum, s) => (s.weight !== null && s.reps !== null ? sum + s.weight * s.reps : sum),
    0,
  );
}

/** dateStr の週の月曜日を YYYY-MM-DD で返す */
function getWeekMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d.toISOString().split('T')[0];
}

// ── ナビ型 ────────────────────────────────────────────────────────────────────

type NavProp = NativeStackNavigationProp<HistoryStackParamList, 'HistoryList'>;

// ── 日別タブ ──────────────────────────────────────────────────────────────────

function DailyTab({ styles, colors }: { styles: ReturnType<typeof makeStyles>; colors: TanrenThemeColors }) {
  const { workouts, deleteWorkout } = useWorkout();
  const navigation = useNavigation<NavProp>();

  const sorted = useMemo(
    () => [...workouts].sort((a, b) => b.date.localeCompare(a.date)),
    [workouts],
  );

  const renderItem = useCallback(({ item }: { item: DailyWorkout }) => {
    const bodyParts = [
      ...new Set(
        item.sessions
          .map(s => EXERCISES.find(e => e.id === s.exerciseId)?.bodyPart)
          .filter((bp): bp is BodyPart => bp !== undefined),
      ),
    ];
    const volume = Math.round(item.totalVolume);
    const totalSets = item.sessions.reduce((sum, s) => sum + s.sets.length, 0);

    return (
      <SwipeableRow onDelete={() => deleteWorkout(item.id)}>
        <TouchableOpacity
          style={styles.dailyCard}
          onPress={() => navigation.navigate('DayDetail', { workoutId: item.id })}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel={`${formatDate(item.date)}のワークアウト詳細を見る`}
        >
          <View style={styles.cardTop}>
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
            <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
          </View>

          {bodyParts.length > 0 && (
            <View style={styles.bodyPartsRow}>
              {bodyParts.map(bpId => {
                const bp = BODY_PARTS.find(b => b.id === bpId);
                if (!bp) return null;
                return (
                  <View key={bp.id} style={styles.bpTag}>
                    <Ionicons name={bp.icon as any} size={12} color={colors.accent} />
                    <Text style={styles.bpTagText}>{bp.label}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {item.sessions.map(session => {
            const ex = EXERCISES.find(e => e.id === session.exerciseId);
            const vol = Math.round(getVolume(session));
            return (
              <View key={session.id} style={styles.exerciseRow}>
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {ex?.name ?? session.exerciseId}
                </Text>
                <Text style={styles.exerciseStat}>
                  {session.sets.length}セット{vol > 0 ? ` · ${vol.toLocaleString()}kg` : ' · 自重'}
                </Text>
              </View>
            );
          })}

          <View style={styles.statsRow}>
            <Text style={styles.statItem}>{volume.toLocaleString()} kg</Text>
            <Text style={styles.statDot}>·</Text>
            <Text style={styles.statItem}>{totalSets}セット</Text>
          </View>
        </TouchableOpacity>
      </SwipeableRow>
    );
  }, [navigation, deleteWorkout, styles, colors]);

  if (sorted.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>まだトレーニング記録がありません</Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => (navigation as any).navigate('WorkoutStack')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="トレーニングを開始する"
        >
          <Text style={styles.ctaText}>トレーニングを開始</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={sorted}
      renderItem={renderItem}
      keyExtractor={(item: DailyWorkout) => item.id}
      initialNumToRender={10}
      maxToRenderPerBatch={8}
      windowSize={8}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.thinSeparator} />}
    />
  );
}

// ── 部位別タブ ────────────────────────────────────────────────────────────────

function BodyPartListView({ onSelect }: { onSelect: (bp: BodyPart) => void }) {
  const { workouts } = useWorkout();
  const { colors } = useTheme();

  const cards = useMemo(() => {
    return BODY_PARTS.map(bp => {
      let sessionCount = 0;
      let totalVolume = 0;
      for (const w of workouts) {
        for (const s of w.sessions) {
          const ex = EXERCISES.find(e => e.id === s.exerciseId);
          if (ex?.bodyPart === bp.id) {
            sessionCount++;
            totalVolume += getVolume(s);
          }
        }
      }
      return { ...bp, sessionCount, totalVolume: Math.round(totalVolume) };
    });
  }, [workouts]);

  if (workouts.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: TYPOGRAPHY.bodySmall, fontWeight: TYPOGRAPHY.semiBold, color: colors.textSecondary }}>
          まだトレーニング記録がありません
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={cards}
      keyExtractor={item => item.id}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        padding: SPACING.contentMargin,
        paddingBottom: SPACING.xl,
      }}
      columnWrapperStyle={{ gap: SPACING.sm, marginBottom: SPACING.sm }}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[S.bpCard, { backgroundColor: colors.cardBackground }]}
          onPress={() => onSelect(item.id)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${item.label}の詳細を見る`}
        >
          <Ionicons name={item.icon as any} size={28} color={colors.accent} />
          <Text style={{ fontSize: TYPOGRAPHY.body, fontWeight: TYPOGRAPHY.bold, color: colors.textPrimary }}>
            {item.label}
          </Text>
          <Text style={{ fontSize: TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>
            {item.sessionCount}セッション
          </Text>
          {item.totalVolume > 0 && (
            <Text style={{ fontSize: TYPOGRAPHY.captionSmall, color: colors.textTertiary, fontVariant: ['tabular-nums'] }}>
              {item.totalVolume.toLocaleString()} kg
            </Text>
          )}
        </TouchableOpacity>
      )}
    />
  );
}

type BPDetailSession = {
  key: string;
  date: string;
  workoutId: string;
  exerciseName: string;
  setCount: number;
  maxWeight: number | null;
  volume: number;
};

type DayGroup = {
  date: string;
  workoutId: string;
  items: BPDetailSession[];
};

function BodyPartDetailView({
  bodyPart,
  onBack,
}: {
  bodyPart: BodyPart;
  onBack: () => void;
}) {
  const { workouts } = useWorkout();
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();

  const bp = BODY_PARTS.find(b => b.id === bodyPart)!;

  // 週別ボリューム（直近8週）
  const chartData = useMemo(() => {
    const today = new Date();
    const weekKeys: string[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i * 7);
      weekKeys.push(getWeekMonday(d.toISOString().split('T')[0]));
    }
    const volByWeek: Record<string, number> = {};
    for (const w of workouts) {
      const wk = getWeekMonday(w.date);
      if (!weekKeys.includes(wk)) continue;
      for (const s of w.sessions) {
        const ex = EXERCISES.find(e => e.id === s.exerciseId);
        if (ex?.bodyPart !== bodyPart) continue;
        volByWeek[wk] = (volByWeek[wk] ?? 0) + getVolume(s);
      }
    }
    return weekKeys.map(k => ({
      label: formatDateShort(k),
      value: Math.round(volByWeek[k] ?? 0),
    }));
  }, [workouts, bodyPart]);

  // セッション一覧（日付降順）
  const sessions = useMemo<BPDetailSession[]>(() => {
    const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date));
    const result: BPDetailSession[] = [];
    for (const w of sorted) {
      for (const s of w.sessions) {
        const ex = EXERCISES.find(e => e.id === s.exerciseId);
        if (ex?.bodyPart !== bodyPart) continue;
        result.push({
          key:          `${w.id}-${s.id}`,
          date:         w.date,
          workoutId:    w.id,
          exerciseName: ex.name,
          setCount:     s.sets.length,
          maxWeight:    getMaxWeight(s),
          volume:       Math.round(getVolume(s)),
        });
      }
    }
    return result;
  }, [workouts, bodyPart]);

  // 日付でグループ化
  const dayGroups = useMemo<DayGroup[]>(() => {
    const groups: DayGroup[] = [];
    let currentDate = '';
    for (const s of sessions) {
      if (s.date !== currentDate) {
        currentDate = s.date;
        groups.push({ date: s.date, workoutId: s.workoutId, items: [s] });
      } else {
        groups[groups.length - 1].items.push(s);
      }
    }
    return groups;
  }, [sessions]);

  return (
    <View style={{ flex: 1 }}>
      {/* 戻るボタン */}
      <TouchableOpacity
        style={S.detailBackRow}
        onPress={onBack}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="部位一覧に戻る"
      >
        <Ionicons name="chevron-back" size={20} color={colors.accent} />
        <Text style={{ fontSize: TYPOGRAPHY.bodySmall, fontWeight: TYPOGRAPHY.semiBold, color: colors.accent }}>
          部位一覧
        </Text>
        <View style={{ flex: 1 }} />
        <Ionicons name={bp.icon as any} size={16} color={colors.textTertiary} />
        <Text style={{ fontSize: TYPOGRAPHY.bodySmall, fontWeight: TYPOGRAPHY.bold, color: colors.textPrimary, marginLeft: 4 }}>
          {bp.label}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={dayGroups}
        keyExtractor={group => group.date}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SPACING.xl }}
        ListHeaderComponent={
          <View style={{ marginBottom: SPACING.sm }}>
            <View style={[S.chartWrap, { backgroundColor: colors.cardBackground }]}>
              <LineChart
                data={chartData}
                height={CHART_H}
                lineColor={colors.accent}
                fillColor={colors.accentDim}
                gridColor={colors.separator}
                labelColor={colors.textTertiary}
                highlightLast
                highlightColor={colors.accent}
              />
            </View>
            <Text style={{
              marginHorizontal: SPACING.contentMargin,
              fontSize: TYPOGRAPHY.captionSmall,
              color: colors.textTertiary,
              marginBottom: SPACING.sm,
              marginTop: 2,
            }}>
              週別ボリューム（直近8週）
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => (
          <View style={{ height: SPACING.sm }} />
        )}
        renderItem={({ item: group }) => (
          <TouchableOpacity
            style={{ paddingHorizontal: SPACING.contentMargin }}
            onPress={() => navigation.navigate('DayDetail', { workoutId: group.workoutId })}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel={`${formatDate(group.date)}の詳細`}
          >
            {/* 日付ヘッダー */}
            <Text style={{
              fontSize: TYPOGRAPHY.caption,
              fontWeight: TYPOGRAPHY.bold,
              color: colors.textPrimary,
              paddingVertical: SPACING.sm,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.separator,
              marginBottom: 2,
            }}>
              {formatDate(group.date)}
            </Text>
            {/* 種目リスト */}
            {group.items.map(item => (
              <View
                key={item.key}
                style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingVertical: SPACING.xs }}
              >
                <Text style={{
                  fontSize: TYPOGRAPHY.caption,
                  fontWeight: TYPOGRAPHY.semiBold,
                  color: colors.textSecondary,
                  flex: 1,
                }} numberOfLines={1}>
                  {item.exerciseName}
                </Text>
                <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
                  <Text style={{ fontSize: TYPOGRAPHY.captionSmall, color: colors.textTertiary, fontVariant: ['tabular-nums'] }}>
                    {item.setCount}セット
                  </Text>
                  {item.maxWeight !== null && (
                    <Text style={{ fontSize: TYPOGRAPHY.captionSmall, color: colors.textTertiary, fontVariant: ['tabular-nums'] }}>
                      {item.maxWeight}kg
                    </Text>
                  )}
                  {item.volume > 0 && (
                    <Text style={{ fontSize: TYPOGRAPHY.captionSmall, color: colors.textTertiary, fontVariant: ['tabular-nums'] }}>
                      {item.volume.toLocaleString()}vol
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ paddingTop: SPACING.xl, alignItems: 'center' }}>
            <Text style={{ fontSize: TYPOGRAPHY.bodySmall, color: colors.textTertiary }}>記録なし</Text>
          </View>
        }
      />
    </View>
  );
}

function BodyPartTab() {
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | null>(null);

  if (selectedBodyPart !== null) {
    return (
      <BodyPartDetailView
        bodyPart={selectedBodyPart}
        onBack={() => setSelectedBodyPart(null)}
      />
    );
  }
  return <BodyPartListView onSelect={setSelectedBodyPart} />;
}

// ── 種目別タブ ────────────────────────────────────────────────────────────────

function ExerciseListView({ onSelect }: { onSelect: (exerciseId: string) => void }) {
  const { workouts } = useWorkout();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<BodyPart | 'all'>('all');

  type ExRow = {
    id: string;
    name: string;
    icon: string;
    bodyPart: BodyPart;
    recordCount: number;
  };

  const exercises = useMemo<ExRow[]>(() => {
    const exIdSet = new Set<string>();
    for (const w of workouts) {
      for (const s of w.sessions) exIdSet.add(s.exerciseId);
    }
    const result: ExRow[] = [];
    for (const exId of exIdSet) {
      const ex = EXERCISES.find(e => e.id === exId);
      if (!ex) continue;
      if (filter !== 'all' && ex.bodyPart !== filter) continue;
      let recordCount = 0;
      for (const w of workouts) {
        if (w.sessions.some(s => s.exerciseId === exId)) recordCount++;
      }
      result.push({
        id:          exId,
        name:        ex.name,
        icon:        ex.icon,
        bodyPart:    ex.bodyPart,
        recordCount,
      });
    }
    return result.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  }, [workouts, filter]);

  if (workouts.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: TYPOGRAPHY.bodySmall, fontWeight: TYPOGRAPHY.semiBold, color: colors.textSecondary }}>
          まだトレーニング記録がありません
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* 部位フィルタータブ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={S.filterScrollContent}
        style={{ flexGrow: 0 }}
      >
        {BP_FILTERS.map(f => {
          const active = filter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[S.filterChip, { backgroundColor: active ? colors.accent : colors.surface2 }]}
              onPress={() => setFilter(f.id as BodyPart | 'all')}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={f.label}
            >
              <Text style={{
                fontSize: TYPOGRAPHY.caption,
                fontWeight: TYPOGRAPHY.semiBold,
                color: active ? colors.onAccent : colors.textSecondary,
              }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 種目リスト */}
      <FlatList
        data={exercises}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: SPACING.contentMargin,
          paddingBottom: SPACING.xl,
        }}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: colors.separator }} />
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={S.exListRow}
            onPress={() => onSelect(item.id)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${item.name}の詳細を見る`}
          >
            <View style={[S.exListIconBox, { backgroundColor: colors.accentDim }]}>
              <Ionicons name={item.icon as any} size={18} color={colors.accent} />
            </View>
            <View style={S.exListInfo}>
              <Text style={{
                fontSize: TYPOGRAPHY.bodySmall,
                fontWeight: TYPOGRAPHY.semiBold,
                color: colors.textPrimary,
              }} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={{ fontSize: TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>
                {BODY_PARTS.find(b => b.id === item.bodyPart)?.label ?? ''} · {item.recordCount}回記録
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ paddingTop: SPACING.xl, alignItems: 'center' }}>
            <Text style={{ fontSize: TYPOGRAPHY.bodySmall, color: colors.textTertiary }}>
              この部位の記録はありません
            </Text>
          </View>
        }
      />
    </View>
  );
}

type ExDetailSession = {
  key: string;
  date: string;
  session: WorkoutSession;
  maxWeight: number | null;
};

function ExerciseDetailView({
  exerciseId,
  onBack,
}: {
  exerciseId: string;
  onBack: () => void;
}) {
  const { workouts, personalRecords } = useWorkout();
  const { colors } = useTheme();

  const ex  = EXERCISES.find(e => e.id === exerciseId);
  const pr  = personalRecords.find(p => p.exerciseId === exerciseId);

  // 最大重量推移チャート（直近12回）
  const chartData = useMemo(() => {
    const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));
    const result: { label: string; value: number }[] = [];
    for (const w of sorted) {
      const matched = w.sessions.filter(s => s.exerciseId === exerciseId);
      for (const session of matched) {
        const maxW = getMaxWeight(session);
        result.push({ label: formatDateShort(w.date), value: maxW ?? 0 });
      }
    }
    return result.slice(-12);
  }, [workouts, exerciseId]);

  // セッション一覧（日付降順）
  const sessions = useMemo<ExDetailSession[]>(() => {
    const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date));
    const result: ExDetailSession[] = [];
    for (const w of sorted) {
      const matched = w.sessions.filter(s => s.exerciseId === exerciseId);
      for (const session of matched) {
        result.push({
          key:       `${w.id}-${session.id}`,
          date:      w.date,
          session,
          maxWeight: getMaxWeight(session),
        });
      }
    }
    return result;
  }, [workouts, exerciseId]);

  const renderSetTable = (session: WorkoutSession) => (
    <View style={{ paddingBottom: SPACING.sm, backgroundColor: colors.cardBackground }}>
      {/* ヘッダー行 */}
      <View style={[S.setTableHeader, { paddingTop: 8, paddingBottom: 6 }]}>
        <Text style={[S.setColNo, { fontSize: TYPOGRAPHY.captionSmall, fontWeight: TYPOGRAPHY.semiBold, color: colors.textTertiary }]}>
          SET
        </Text>
        <Text style={[S.setColWt, { fontSize: TYPOGRAPHY.captionSmall, fontWeight: TYPOGRAPHY.semiBold, color: colors.textTertiary }]}>
          重量
        </Text>
        <Text style={[S.setColReps, { fontSize: TYPOGRAPHY.captionSmall, fontWeight: TYPOGRAPHY.semiBold, color: colors.textTertiary }]}>
          回数
        </Text>
        <View style={S.setColBadge} />
      </View>

      {/* セット行 */}
      {session.sets.map((set: WorkoutSet, idx: number) => {
        const isPR =
          set.isPersonalRecord === true ||
          (pr?.maxWeight != null &&
            set.weight !== null &&
            set.weight >= pr.maxWeight);
        return (
          <View
            key={set.id}
            style={S.setTableRow}
          >
            <Text style={[S.setColNo, { fontSize: TYPOGRAPHY.caption, color: colors.textTertiary, fontVariant: ['tabular-nums'] }]}>
              {idx + 1}
            </Text>
            <Text style={[S.setColWt, { fontSize: TYPOGRAPHY.caption, fontWeight: TYPOGRAPHY.semiBold, color: colors.textPrimary, fontVariant: ['tabular-nums'] }]}>
              {set.weight !== null ? `${set.weight} kg` : '自重'}
            </Text>
            <Text style={[S.setColReps, { fontSize: TYPOGRAPHY.caption, color: colors.textSecondary, fontVariant: ['tabular-nums'] }]}>
              {set.reps !== null ? `${set.reps} 回` : '—'}
            </Text>
            <View style={[S.setColBadge, { justifyContent: 'center', alignItems: 'flex-end' }]}>
              {isPR && (
                <Text style={{ fontSize: TYPOGRAPHY.captionSmall, fontWeight: '600', color: colors.accent }}>
                  PR
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* 戻るボタン */}
      <TouchableOpacity
        style={S.detailBackRow}
        onPress={onBack}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="種目一覧に戻る"
      >
        <Ionicons name="chevron-back" size={20} color={colors.accent} />
        <Text style={{ fontSize: TYPOGRAPHY.bodySmall, fontWeight: TYPOGRAPHY.semiBold, color: colors.accent }}>
          種目一覧
        </Text>
        <View style={{ flex: 1 }} />
        {ex && (
          <>
            <Ionicons name={ex.icon as any} size={16} color={colors.textTertiary} />
            <Text style={{ fontSize: TYPOGRAPHY.bodySmall, fontWeight: TYPOGRAPHY.bold, color: colors.textPrimary, marginLeft: 4 }}>
              {ex.name}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <FlatList
        data={sessions}
        keyExtractor={item => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SPACING.xl }}
        ListHeaderComponent={
          <View style={{ marginBottom: SPACING.sm }}>
            <View style={[S.chartWrap, { backgroundColor: colors.surface2 }]}>
              <LineChart
                data={chartData}
                height={CHART_H}
                lineColor={colors.accent}
                fillColor={colors.accentDim}
                gridColor={colors.separator}
                labelColor={colors.textTertiary}
                highlightLast
                highlightColor={colors.accent}
              />
            </View>
            <Text style={{
              marginHorizontal: SPACING.contentMargin,
              fontSize: TYPOGRAPHY.captionSmall,
              color: colors.textTertiary,
              marginBottom: SPACING.sm,
              marginTop: 2,
            }}>
              最大重量の推移（直近12回）
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        renderItem={({ item }) => (
          <View style={[S.sessionBlock, { backgroundColor: colors.cardBackground }]}>
            {/* セッションヘッダー */}
            <View style={[S.sessionHeader, { borderBottomWidth: 1, borderBottomColor: colors.separator }]}>
              <Text style={{ fontSize: TYPOGRAPHY.caption, fontWeight: TYPOGRAPHY.semiBold, color: colors.textSecondary }}>
                {formatDate(item.date)}
              </Text>
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <Text style={{ fontSize: TYPOGRAPHY.captionSmall, color: colors.textTertiary, fontVariant: ['tabular-nums'] }}>
                  {item.session.sets.length}セット
                </Text>
                {item.maxWeight !== null && (
                  <Text style={{ fontSize: TYPOGRAPHY.captionSmall, color: colors.textTertiary, fontVariant: ['tabular-nums'] }}>
                    max {item.maxWeight} kg
                  </Text>
                )}
              </View>
            </View>
            {/* セットテーブル */}
            {renderSetTable(item.session)}
          </View>
        )}
        ListEmptyComponent={
          <View style={{ paddingTop: SPACING.xl, alignItems: 'center' }}>
            <Text style={{ fontSize: TYPOGRAPHY.bodySmall, color: colors.textTertiary }}>記録なし</Text>
          </View>
        }
      />
    </View>
  );
}

function ExerciseTab() {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  if (selectedExerciseId !== null) {
    return (
      <ExerciseDetailView
        exerciseId={selectedExerciseId}
        onBack={() => setSelectedExerciseId(null)}
      />
    );
  }
  return <ExerciseListView onSelect={setSelectedExerciseId} />;
}

// ── メインコンポーネント ───────────────────────────────────────────────────────

export function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<HistoryTabType>('daily');
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader title="履歴" showHamburger />

      {/* タブバー */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* タブコンテンツ */}
      {activeTab === 'daily'    && <DailyTab    styles={styles} colors={colors} />}
      {activeTab === 'bodyPart' && <BodyPartTab />}
      {activeTab === 'exercise' && <ExerciseTab />}
    </SafeAreaView>
  );
}

// ── スタイル（DailyTab + 共通要素） ──────────────────────────────────────────

function makeStyles(c: TanrenThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },

    // ── タブバー ──
    tabBar: {
      flexDirection: 'row',
      paddingHorizontal: SPACING.contentMargin,
      paddingVertical: SPACING.sm,
      gap: SPACING.sm,
    },
    tabItem: {
      flex: 1,
      height: 36,
      borderRadius: RADIUS.chip,
      backgroundColor: c.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabItemActive: {
      backgroundColor: c.accent,
    },
    tabText: {
      fontSize: TYPOGRAPHY.caption,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textSecondary,
    },
    tabTextActive: {
      color: c.onAccent,
    },

    // ── 共通 ──
    listContent: {
      paddingHorizontal: SPACING.contentMargin,
      paddingBottom: SPACING.xl,
    },
    thinSeparator: {
      height: 1,
      backgroundColor: c.separator,
    },

    // ── 日別カード ──
    dailyCard: {
      paddingVertical: SPACING.md,
    },
    cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: SPACING.sm,
    },
    dateText: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.bold,
      color: c.textPrimary,
      letterSpacing: -0.2,
    },
    durationText: {
      fontSize: TYPOGRAPHY.caption,
      fontWeight: TYPOGRAPHY.regular,
      color: c.textTertiary,
    },
    bodyPartsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 5,
      marginBottom: SPACING.sm,
    },
    bpTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: c.accentDim,
      borderRadius: 5,
      paddingVertical: 3,
      paddingHorizontal: 7,
    },
    bpTagText: {
      fontSize: 11,
      fontWeight: TYPOGRAPHY.regular,
      color: c.accent,
    },
    exerciseRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      paddingVertical: 2,
    },
    exerciseName: {
      flex: 1,
      fontSize: TYPOGRAPHY.caption,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textSecondary,
      marginRight: SPACING.sm,
    },
    exerciseStat: {
      fontSize: TYPOGRAPHY.captionSmall,
      fontWeight: TYPOGRAPHY.regular,
      color: c.textTertiary,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      marginTop: SPACING.sm,
    },
    statItem: {
      fontSize: TYPOGRAPHY.captionSmall,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textTertiary,
      fontVariant: ['tabular-nums'],
    },
    statDot: {
      fontSize: TYPOGRAPHY.captionSmall,
      color: c.textTertiary,
    },

    // ── 空状態 ──
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: SPACING.contentMargin,
    },
    emptyText: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textSecondary,
      textAlign: 'center',
      marginBottom: SPACING.lg,
    },
    ctaButton: {
      backgroundColor: c.accent,
      height: BUTTON_HEIGHT.primary,
      borderRadius: RADIUS.btnCTA,
      paddingHorizontal: SPACING.xl,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 200,
    },
    ctaText: {
      fontSize: 17,
      fontWeight: TYPOGRAPHY.bold,
      color: c.onAccent,
      letterSpacing: -0.2,
    },
  });
}
