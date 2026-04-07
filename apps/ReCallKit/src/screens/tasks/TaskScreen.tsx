// ============================================================
// TaskScreen
// URL解析タスク一覧画面
// バックグラウンド処理中/完了/失敗を確認できる
// ============================================================

import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import { useTask } from '../../context/TaskContext';
import type { AnalysisTask } from '../../context/TaskContext';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { DrawerParamList, QAPreviewParams } from '../../navigation/types';

// TaskScreenは現在どのStackにも登録されていない（TaskStackの初期画面はURLImportListScreenに変更済み）
// 将来再利用する場合のために型を自己完結させておく
type TaskScreenParamList = {
  TaskList: undefined;
  QAPreview: QAPreviewParams;
};

type Props = NativeStackScreenProps<TaskScreenParamList, 'TaskList'>;

export function TaskScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { tasks, retryTask, removeTask, runningCount } = useTask();

  function handleTaskPress(task: AnalysisTask) {
    if (task.status !== 'completed' || !task.result) return;
    navigation.navigate('QAPreview', task.result);
  }

  function renderItem({ item }: { item: AnalysisTask }) {
    const isCompleted = item.status === 'completed';
    const isRunning = item.status === 'running' || item.status === 'pending';
    const isError = item.status === 'error';

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.card, opacity: pressed && isCompleted ? 0.75 : 1 },
          CardShadow,
        ]}
        onPress={() => handleTaskPress(item)}
        disabled={!isCompleted}
        accessibilityRole="button"
        accessibilityState={{ disabled: !isCompleted }}
      >
        {/* URL + 削除ボタン */}
        <View style={styles.cardHeader}>
          <Text style={[styles.urlText, { color: colors.label }]} numberOfLines={1}>
            {item.url}
          </Text>
          <Pressable
            onPress={() => removeTask(item.id)}
            hitSlop={8}
            style={styles.deleteBtn}
            accessibilityLabel="削除"
          >
            <Ionicons name="trash-outline" size={18} color={colors.labelTertiary} />
          </Pressable>
        </View>

        {/* ステータス行 */}
        <View style={styles.statusRow}>
          {isRunning && (
            <>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={[styles.statusText, { color: colors.accent }]}>解析中...</Text>
            </>
          )}
          {isCompleted && (
            <>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={[styles.statusText, { color: '#34C759' }]}>完了</Text>
              {item.result?.title ? (
                <Text
                  style={[styles.titlePreview, { color: colors.labelSecondary }]}
                  numberOfLines={1}
                >
                  {item.result.title}
                </Text>
              ) : null}
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.labelTertiary}
                style={styles.chevron}
              />
            </>
          )}
          {isError && (
            <>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text
                style={[styles.statusText, { color: colors.error, flex: 1 }]}
                numberOfLines={2}
              >
                {item.error ?? 'エラーが発生しました'}
              </Text>
              <Pressable
                style={[styles.retryBtn, { borderColor: colors.accent }]}
                onPress={() => retryTask(item.id)}
                hitSlop={8}
                accessibilityLabel="再試行"
                accessibilityRole="button"
              >
                <Text style={[styles.retryText, { color: colors.accent }]}>再試行</Text>
              </Pressable>
            </>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.backgroundGrouped }]}>
      {/* 解析中バナー */}
      {runningCount > 0 && (
        <View style={[styles.runningBanner, { backgroundColor: colors.accent + '18' }]}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={[styles.runningText, { color: colors.accent }]}>
            {runningCount}件を解析中...
          </Text>
        </View>
      )}

      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, Spacing.m) },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="clipboard-outline" size={48} color={colors.labelTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.label }]}>タスクはありません</Text>
            <Text style={[styles.emptySubtitle, { color: colors.labelSecondary }]}>
              URLを解析するとここに表示されます
            </Text>
            <Pressable
              style={[styles.ctaButton, { backgroundColor: colors.accent }]}
              onPress={() =>
                navigation.getParent<DrawerNavigationProp<DrawerParamList>>()?.navigate(
                  'Library',
                  { screen: 'URLAnalysis', params: {} }
                )
              }
            >
              <Text style={styles.ctaButtonText}>URLを解析する</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

// ============================================================
// スタイル
// ============================================================

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // 解析中バナー
  runningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  runningText: {
    ...TypeScale.footnote,
    fontWeight: '500',
  },

  // リスト
  listContent: {
    padding: Spacing.m,
    gap: Spacing.s,
  },

  // カード
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: Spacing.s,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  urlText: {
    flex: 1,
    ...TypeScale.subheadline,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // ステータス行
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minHeight: 20,
  },
  statusText: {
    ...TypeScale.footnote,
    fontWeight: '500',
  },
  titlePreview: {
    flex: 1,
    ...TypeScale.footnote,
  },
  chevron: {
    marginLeft: 'auto',
    flexShrink: 0,
  },
  retryBtn: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.m,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  retryText: {
    ...TypeScale.footnote,
    fontWeight: '600',
  },

  // 空状態
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: Spacing.s,
  },
  emptyTitle: {
    ...TypeScale.headline,
  },
  emptySubtitle: {
    ...TypeScale.subheadline,
    textAlign: 'center',
  },
  ctaButton: {
    marginTop: Spacing.s,
    paddingHorizontal: Spacing.l,
    paddingVertical: 10,
    borderRadius: Radius.full,
    alignSelf: 'center',
  },
  ctaButtonText: {
    ...TypeScale.subheadline,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
