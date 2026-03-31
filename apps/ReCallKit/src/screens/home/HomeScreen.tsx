// ============================================================
// HomeScreen - 今日のダッシュボード
// ストリーク・復習件数・スタートボタン・統計を表示
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useDatabase } from '../../hooks/useDatabase';
import {
  getDueItems,
  getStreakDays,
  getTodayCompletedCount,
  getTotalItemCount,
} from '../../db/reviewRepository';
import { StreakBadge } from '../../components/StreakBadge';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import type { HomeStackParamList, MainTabParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { db, isReady } = useDatabase();
  const { colors, isDark } = useTheme();

  const [dueCount, setDueCount] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!db || !isReady) return;
    setLoading(true);
    try {
      const [due, streak, completed, total] = await Promise.all([
        getDueItems(db),
        getStreakDays(db),
        getTodayCompletedCount(db),
        getTotalItemCount(db),
      ]);
      setDueCount(due.length);
      setStreakDays(streak);
      setTodayCompleted(completed);
      setTotalItems(total);
    } finally {
      setLoading(false);
    }
  }, [db, isReady]);

  // 復習完了後に戻ってきたときもデータを更新する
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleStartReview = () => {
    // Review は ReviewTab/ReviewStack に移動したためクロスタブナビゲーション
    const tabNav = navigation.getParent<BottomTabNavigationProp<MainTabParamList>>();
    tabNav?.navigate('ReviewTab' as never);
  };

  if (!isReady || loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.backgroundGrouped }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const cardShadow = isDark ? {} : CardShadow;

  return (
    <ScrollView
      style={{ backgroundColor: colors.backgroundGrouped }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ストリークバッジ */}
      {streakDays > 0 && (
        <View style={styles.streakRow}>
          <StreakBadge days={streakDays} />
        </View>
      )}

      {/* 今日の復習カード */}
      <View style={[styles.reviewCard, { backgroundColor: colors.card }, cardShadow]}>
        <Text style={[styles.cardLabel, { color: colors.labelSecondary }]}>今日の復習</Text>

        <View style={styles.countRow}>
          <Text style={[styles.countNumber, { color: colors.accent }]}>{dueCount}</Text>
          <Text style={[styles.countUnit, { color: colors.labelSecondary }]}>件</Text>
        </View>

        {dueCount > 0 ? (
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              { backgroundColor: pressed ? colors.accent + 'CC' : colors.accent },
            ]}
            onPress={handleStartReview}
            accessibilityRole="button"
            accessibilityLabel="復習を始める"
          >
            <Text style={styles.startButtonText}>復習を始める</Text>
          </Pressable>
        ) : (
          <View style={styles.allDoneRow}>
            <Text style={[styles.allDoneIcon, { color: colors.success }]}>✓</Text>
            <Text style={[styles.allDoneText, { color: colors.success }]}>
              今日の復習は完了です
            </Text>
          </View>
        )}
      </View>

      {/* 統計セクション */}
      <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>統計</Text>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card }, cardShadow]}>
          <Text style={[styles.statValue, { color: colors.label }]}>{todayCompleted}</Text>
          <Text style={[styles.statLabel, { color: colors.labelSecondary }]}>今日完了</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }, cardShadow]}>
          <Text style={[styles.statValue, { color: colors.label }]}>{totalItems}</Text>
          <Text style={[styles.statLabel, { color: colors.labelSecondary }]}>総アイテム</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: Spacing.m,
    paddingBottom: Spacing.xxl,
  },
  streakRow: {
    marginBottom: Spacing.m,
  },

  // 復習カード
  reviewCard: {
    borderRadius: Radius.l,
    padding: Spacing.l,
    marginBottom: Spacing.m,
    gap: Spacing.m,
  },
  cardLabel: {
    ...TypeScale.subheadline,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  countNumber: {
    fontSize: 56,
    fontWeight: '700',
    lineHeight: 64,
    letterSpacing: -2,
  },
  countUnit: {
    ...TypeScale.title3,
    paddingBottom: Spacing.s,
  },
  startButton: {
    borderRadius: Radius.m,
    paddingVertical: Spacing.m,
    alignItems: 'center',
  },
  startButtonText: {
    ...TypeScale.headline,
    color: '#FFFFFF',
  },
  allDoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.s,
  },
  allDoneIcon: {
    ...TypeScale.body,
  },
  allDoneText: {
    ...TypeScale.body,
  },

  // 統計
  sectionTitle: {
    ...TypeScale.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.s,
    marginLeft: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.m,
  },
  statCard: {
    flex: 1,
    borderRadius: Radius.m,
    padding: Spacing.m,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    ...TypeScale.title1,
  },
  statLabel: {
    ...TypeScale.caption1,
  },
});
