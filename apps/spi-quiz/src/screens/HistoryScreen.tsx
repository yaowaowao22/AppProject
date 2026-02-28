import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTheme, H2, Body, Caption, ListItem, Divider, Badge, EmptyState } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { QuizResult } from '../types';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${d} ${h}:${min}`;
}

function getAccuracyColor(accuracy: number, colors: { success: string; warning: string; error: string; primary: string }): string {
  if (accuracy >= 80) return colors.success;
  if (accuracy >= 60) return colors.primary;
  if (accuracy >= 40) return colors.warning;
  return colors.error;
}

export function HistoryScreen() {
  const { colors, spacing } = useTheme();
  const [history, , loading] = useLocalStorage<QuizResult[]>('spi-quiz-history', []);

  const totalTests = history.length;
  const totalCorrect = history.reduce((sum, r) => sum + r.correct, 0);
  const totalQuestions = history.reduce((sum, r) => sum + r.total, 0);
  const overallAccuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const renderItem = ({ item }: { item: QuizResult }) => (
    <ListItem
      title={`${item.modeLabel} (${item.total}問)`}
      subtitle={formatDate(item.date)}
      rightElement={
        <View style={styles.rightContent}>
          <Body style={{ fontWeight: '600' }}>
            {item.correct}/{item.total} ({item.accuracy}%)
          </Body>
          <Badge
            label={item.accuracy >= 70 ? '合格圏' : '要復習'}
            color={getAccuracyColor(item.accuracy, colors)}
          />
        </View>
      }
    />
  );

  const renderSeparator = () => <Divider />;

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.lg }]}>
          <Body color={colors.textMuted} style={{ textAlign: 'center' }}>
            読み込み中...
          </Body>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <H2 style={{ marginBottom: spacing.sm }}>学習履歴</H2>

        {totalTests > 0 && (
          <Caption
            color={colors.textMuted}
            style={{ marginBottom: spacing.lg }}
          >
            受験回数: {totalTests}回 / 総合正答率: {overallAccuracy}%
          </Caption>
        )}

        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="📝"
              title="まだ記録がありません"
              subtitle="クイズに挑戦して学習履歴を確認しましょう"
            />
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ItemSeparatorComponent={renderSeparator}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.xxl }}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  rightContent: {
    alignItems: 'flex-end',
    gap: 4,
  },
});
