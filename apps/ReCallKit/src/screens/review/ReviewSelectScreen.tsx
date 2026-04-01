// ============================================================
// ReviewSelectScreen - 復習内容選択画面
// 今日の復習 or グループ選択 → ReviewScreen へナビゲート
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDatabase } from '../../hooks/useDatabase';
import { getDueItems } from '../../db/reviewRepository';
import {
  getReviewGroups,
  getItemIdsByGroup,
  type ReviewGroupWithCount,
} from '../../db/reviewGroupRepository';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import type { ReviewStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ReviewStackParamList, 'ReviewSelect'>;

export function ReviewSelectScreen({ navigation }: Props) {
  const { db, isReady } = useDatabase();
  const { colors, isDark } = useTheme();

  const [dueCount, setDueCount] = useState(0);
  const [groups, setGroups] = useState<ReviewGroupWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!db || !isReady) return;
    setLoading(true);
    try {
      const [due, reviewGroups] = await Promise.all([
        getDueItems(db),
        getReviewGroups(db),
      ]);
      setDueCount(due.length);
      setGroups(reviewGroups);
    } finally {
      setLoading(false);
    }
  }, [db, isReady]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleStartAll = useCallback(() => {
    navigation.navigate('Review', {});
  }, [navigation]);

  const handleStartGroup = useCallback(async (groupId: number) => {
    if (!db) return;
    const itemIds = await getItemIdsByGroup(db, groupId);
    navigation.navigate('Review', { reviewIds: itemIds });
  }, [db, navigation]);

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
      {/* 今日の復習カード */}
      <View style={[styles.todayCard, { backgroundColor: colors.card }, cardShadow]}>
        <View style={styles.todayCardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: colors.accent + '1A' }]}>
            <Ionicons name="today-outline" size={24} color={colors.accent} />
          </View>
          <View style={styles.todayCardInfo}>
            <Text style={[styles.todayCardTitle, { color: colors.label }]}>今日の復習</Text>
            <Text style={[styles.todayCardSub, { color: colors.labelSecondary }]}>
              {dueCount > 0 ? `${dueCount}件が待機中` : '本日分は完了です'}
            </Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            { backgroundColor: pressed ? colors.accent + 'CC' : colors.accent },
            dueCount === 0 && styles.startButtonDisabled,
          ]}
          onPress={handleStartAll}
          disabled={dueCount === 0}
          accessibilityRole="button"
          accessibilityLabel="復習を開始"
        >
          <Text style={styles.startButtonText}>
            {dueCount > 0 ? 'スタート' : '完了済み'}
          </Text>
        </Pressable>
      </View>

      {/* グループから復習セクション */}
      {groups.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>
            グループから復習
          </Text>
          {groups.map((group) => (
            <Pressable
              key={group.id}
              style={({ pressed }) => [
                styles.groupCard,
                { backgroundColor: colors.card },
                cardShadow,
                pressed && { opacity: 0.85 },
                group.item_count === 0 && { opacity: 0.5 },
              ]}
              onPress={() => handleStartGroup(group.id)}
              disabled={group.item_count === 0}
              accessibilityRole="button"
              accessibilityLabel={`${group.name}を復習`}
            >
              {/* 左アクセントバー */}
              <View style={[styles.groupAccent, { backgroundColor: colors.accent }]} />

              <View style={[styles.groupIcon, { backgroundColor: colors.accent + '18' }]}>
                <Ionicons name="layers" size={20} color={colors.accent} />
              </View>
              <View style={styles.groupInfo}>
                <Text style={[styles.groupName, { color: colors.label }]} numberOfLines={1}>
                  {group.name}
                </Text>
                {group.description ? (
                  <Text
                    style={[styles.groupDesc, { color: colors.labelSecondary }]}
                    numberOfLines={1}
                  >
                    {group.description}
                  </Text>
                ) : null}
              </View>
              <View style={styles.groupRight}>
                {/* カウントピルバッジ */}
                <View style={[styles.groupCountBadge, { backgroundColor: colors.accent + '18' }]}>
                  <Text style={[styles.groupCountText, { color: colors.accent }]}>
                    {group.item_count}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
              </View>
            </Pressable>
          ))}
        </>
      )}

      {/* グループなし案内 */}
      {groups.length === 0 && (
        <View style={[styles.emptyGroups, { backgroundColor: colors.card }, cardShadow]}>
          <Ionicons name="layers-outline" size={32} color={colors.labelTertiary} />
          <Text style={[styles.emptyGroupsText, { color: colors.labelSecondary }]}>
            ライブラリでグループを作成すると{'\n'}絞り込んで復習できます
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.m,
    paddingBottom: Spacing.xxl,
    gap: Spacing.m,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---- 今日の復習カード ----
  todayCard: {
    borderRadius: Radius.l,
    padding: Spacing.l,
    gap: Spacing.m,
  },
  todayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCardInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  todayCardTitle: {
    ...TypeScale.headline,
  },
  todayCardSub: {
    ...TypeScale.subheadline,
  },
  startButton: {
    borderRadius: Radius.m,
    paddingVertical: Spacing.m,
    alignItems: 'center',
  },
  startButtonDisabled: {
    opacity: 0.4,
  },
  startButtonText: {
    ...TypeScale.headline,
    color: '#FFFFFF',
  },

  // ---- セクションタイトル ----
  sectionTitle: {
    ...TypeScale.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: Spacing.xs,
    marginBottom: -Spacing.xs,
  },

  // ---- グループカード ----
  groupCard: {
    borderRadius: Radius.m,
    padding: Spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    overflow: 'hidden',
  },
  groupAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: Radius.m,
    borderBottomLeftRadius: Radius.m,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.s,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: {
    flex: 1,
    gap: 2,
  },
  groupName: {
    ...TypeScale.body,
    fontWeight: '500' as const,
  },
  groupDesc: {
    ...TypeScale.caption1,
  },
  groupRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  groupCountBadge: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 3,
    borderRadius: Radius.full,
    minWidth: 28,
    alignItems: 'center',
  },
  groupCountText: {
    ...TypeScale.caption1,
    fontWeight: '600' as const,
  },

  // ---- グループなし状態 ----
  emptyGroups: {
    borderRadius: Radius.m,
    padding: Spacing.l,
    alignItems: 'center',
    gap: Spacing.s,
  },
  emptyGroupsText: {
    ...TypeScale.caption1,
    textAlign: 'center',
    lineHeight: 18,
  },
});
