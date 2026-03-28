import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme';
import { useWorkout } from '../WorkoutContext';
import { EXERCISES } from '../exerciseDB';
import type { RootTabParamList } from '../navigation/RootNavigator';

// ── 型 ────────────────────────────────────────────────────────────────────────

type HomeNavProp = BottomTabNavigationProp<RootTabParamList, 'Home'>;

// ── クイックスタート定義 ──────────────────────────────────────────────────────

const QUICK_START_IDS = [
  'chest_001', // ベンチプレス
  'legs_001',  // スクワット
  'back_001',  // デッドリフト
  'shoulders_001', // ショルダープレス（推定）
  'back_003',  // 懸垂
] as const;

// ── ヘルパー ──────────────────────────────────────────────────────────────────

function formatVolume(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
}

function formatDate(): string {
  return new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { workouts, personalRecords, weeklyStats } = useWorkout();

  const today = useMemo(() => formatDate(), []);

  // 本日のメニュー: 最近のワークアウトから頻出種目を最大3件
  const todayMenu = useMemo(() => {
    const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date));
    const seen = new Set<string>();
    const ids: string[] = [];

    for (const workout of sorted) {
      for (const session of workout.sessions) {
        if (!seen.has(session.exerciseId)) {
          seen.add(session.exerciseId);
          ids.push(session.exerciseId);
        }
        if (ids.length >= 3) break;
      }
      if (ids.length >= 3) break;
    }

    return ids
      .map(id => ({
        exercise: EXERCISES.find(e => e.id === id),
        pr: personalRecords.find(r => r.exerciseId === id),
      }))
      .filter((item): item is { exercise: typeof EXERCISES[0]; pr: typeof personalRecords[0] | undefined } =>
        item.exercise != null,
      );
  }, [workouts, personalRecords]);

  function handleStartWorkout() {
    navigation.navigate('WorkoutStack');
  }

  function handleChipPress(exerciseId: string) {
    (navigation as any).navigate('WorkoutStack', {
      screen: 'ActiveWorkout',
      params: { exerciseIds: [exerciseId] },
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 日付 */}
        <Text style={styles.date}>{today}</Text>

        {/* ワークアウト開始 — オレンジ CTA（唯一の accent 使用箇所） */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleStartWorkout}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="ワークアウトを開始する"
        >
          <Text style={styles.ctaText}>ワークアウト開始</Text>
        </TouchableOpacity>

        {/* 今週 — 統計（数値は t1、accent なし） */}
        <Text style={styles.sectionLabel}>今週</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{weeklyStats.workoutCount}</Text>
            <Text style={styles.statKey}>トレーニング</Text>
          </View>
          <View style={[styles.statItem, styles.statBorder]}>
            <Text style={styles.statNum}>{formatVolume(weeklyStats.totalVolume)}</Text>
            <Text style={styles.statKey}>kg ボリューム</Text>
          </View>
          <View style={[styles.statItem, styles.statBorder]}>
            <Text style={styles.statNum}>{weeklyStats.streakDays}</Text>
            <Text style={styles.statKey}>日連続</Text>
          </View>
        </View>

        {/* クイックスタート */}
        <Text style={styles.sectionLabel}>クイックスタート</Text>
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

        {/* 本日のメニュー */}
        <Text style={[styles.sectionLabel, styles.sectionGapTop]}>本日のメニュー</Text>
        {todayMenu.length === 0 ? (
          <Text style={styles.emptyText}>記録なし</Text>
        ) : (
          <View style={styles.menuList}>
            {todayMenu.map(({ exercise, pr }) => (
              <TouchableOpacity
                key={exercise.id}
                style={styles.menuRow}
                onPress={() => handleChipPress(exercise.id)}
                activeOpacity={0.72}
                accessibilityRole="button"
                accessibilityLabel={exercise.name}
              >
                <View style={styles.menuLeft}>
                  <Text style={styles.menuName}>{exercise.name}</Text>
                  <Text style={styles.menuSub}>
                    {pr?.maxWeight != null
                      ? `前回 ${pr.maxWeight}kg`
                      : exercise.muscleDetail ?? exercise.nameEn}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: SPACING.sm,
  },

  // 日付
  date: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.regular,
    color: COLORS.textTertiary,
    paddingHorizontal: SPACING.contentMargin,
    paddingTop: 4,
    paddingBottom: 22,
  },

  // CTA ボタン（accent 使用: 1箇所目）
  ctaButton: {
    marginHorizontal: SPACING.contentMargin,
    height: 60,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.btnCTA,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 17,
    fontWeight: TYPOGRAPHY.bold,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // セクションラベル
  sectionLabel: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    paddingHorizontal: SPACING.contentMargin,
    marginTop: 28,
    marginBottom: 10,
  },
  sectionGapTop: {
    marginTop: 22,
  },

  // 統計行（数値に accent 不使用）
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.contentMargin,
    marginBottom: SPACING.md,
  },
  statItem: {
    flex: 1,
    gap: 3,
  },
  statBorder: {
    borderLeftWidth: 1,
    borderLeftColor: COLORS.separator,
    paddingLeft: SPACING.md,
  },
  statNum: {
    fontSize: 24,
    fontWeight: TYPOGRAPHY.heavy,
    color: COLORS.textPrimary,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    lineHeight: 24,
  },
  statKey: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.regular,
    color: COLORS.textTertiary,
  },

  // チップ
  chips: {
    paddingHorizontal: SPACING.contentMargin,
    gap: 7,
  },
  chip: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.chip,
    paddingVertical: 9,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.regular,
    color: COLORS.textSecondary,
  },

  // 本日のメニュー
  menuList: {
    paddingHorizontal: SPACING.contentMargin,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.separator,
    minHeight: 52,
  },
  menuLeft: {
    gap: 3,
    flex: 1,
  },
  menuName: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  menuSub: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.regular,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: COLORS.textTertiary,
    marginLeft: SPACING.sm,
  },

  // 空状態
  emptyText: {
    fontSize: TYPOGRAPHY.bodySmall,
    color: COLORS.textTertiary,
    paddingHorizontal: SPACING.contentMargin,
  },

  bottomPad: {
    height: 20,
  },
});
