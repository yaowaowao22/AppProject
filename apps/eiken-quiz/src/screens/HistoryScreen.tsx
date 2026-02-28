import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useTheme, H2, Body, Caption, ListItem, Divider, EmptyState, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { QuizResult } from '../types';

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

function getAccuracyColor(accuracy: number, colors: any): string {
  if (accuracy >= 90) return colors.success;
  if (accuracy >= 70) return colors.primary;
  if (accuracy >= 50) return colors.warning;
  return colors.error;
}

export function HistoryScreen() {
  const { colors, spacing } = useTheme();
  const [results] = useLocalStorage<QuizResult[]>('eiken_results', []);

  const renderItem = ({ item }: { item: QuizResult }) => {
    const accuracy = Math.round((item.correct / item.total) * 100);
    const accuracyColor = getAccuracyColor(accuracy, colors);

    return (
      <ListItem
        title={`${item.level} - ${item.type}`}
        subtitle={formatDate(item.date)}
        rightContent={
          <View style={styles.rightContent}>
            <Body
              color={accuracyColor}
              style={{ fontWeight: 'bold', fontSize: 18 }}
            >
              {accuracy}%
            </Body>
            <Caption color={colors.textMuted}>
              {item.correct}/{item.total}問正解
            </Caption>
          </View>
        }
      />
    );
  };

  const renderHeader = () => {
    if (results.length === 0) return null;

    const totalQuizzes = results.length;
    const avgAccuracy = Math.round(
      results.reduce((sum, r) => sum + (r.correct / r.total) * 100, 0) /
        totalQuizzes
    );

    return (
      <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
        <H2 style={{ marginBottom: spacing.md }}>学習記録</H2>
        <View style={[styles.summaryRow, { marginBottom: spacing.sm }]}>
          <Badge label={`全${totalQuizzes}回`} />
          <Badge label={`平均正答率 ${avgAccuracy}%`} />
        </View>
      </View>
    );
  };

  if (results.length === 0) {
    return (
      <ScreenWrapper>
        <View style={[styles.emptyContainer, { padding: spacing.lg }]}>
          <EmptyState
            icon="📝"
            title="まだ記録がありません"
            subtitle="クイズに挑戦して記録を残しましょう"
          />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ItemSeparatorComponent={() => <Divider />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
