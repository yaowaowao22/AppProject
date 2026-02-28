import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTheme, H2, Body, Caption, ListItem, Divider, Badge, EmptyState } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';

interface QuizResult {
  id: string;
  date: string;
  period: string;
  correct: number;
  total: number;
  percentage: number;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${d} ${h}:${min}`;
}

function getScoreColor(percentage: number, colors: { success: string; primary: string; error: string }): string {
  if (percentage >= 80) return colors.success;
  if (percentage >= 50) return colors.primary;
  return colors.error;
}

export function HistoryScreen() {
  const { colors, spacing } = useTheme();
  const [history, , loading] = useLocalStorage<QuizResult[]>('quiz-history', []);

  const totalQuizzes = history.length;
  const totalCorrect = history.reduce((sum, r) => sum + r.correct, 0);
  const totalQuestions = history.reduce((sum, r) => sum + r.total, 0);
  const overallAccuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const renderItem = ({ item }: { item: QuizResult }) => {
    const scoreColor = getScoreColor(item.percentage, colors);
    return (
      <ListItem
        title={`${item.period} (${item.total}問)`}
        subtitle={formatDate(item.date)}
        rightElement={
          <View style={styles.rightContent}>
            <Body style={{ fontWeight: '600' }}>
              {item.correct}/{item.total} ({item.percentage}%)
            </Body>
            <Badge
              label={item.percentage >= 80 ? '優秀' : item.percentage >= 50 ? '合格' : '再挑戦'}
              color={scoreColor}
            />
          </View>
        }
      />
    );
  };

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
        <H2 style={{ marginBottom: spacing.sm }}>挑戦履歴</H2>

        {totalQuizzes > 0 && (
          <Caption
            color={colors.textMuted}
            style={{ marginBottom: spacing.lg }}
          >
            挑戦回数: {totalQuizzes}回 / 総合正答率: {overallAccuracy}%
          </Caption>
        )}

        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="📚"
              title="まだ記録がありません"
              subtitle="クイズに挑戦して記録を残しましょう"
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
