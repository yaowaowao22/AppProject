import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTheme, H2, Body, Caption, ListItem, Divider, EmptyState, Button } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { QuizMode, QuizResult } from '../types';

const modeLabels: Record<QuizMode, string> = {
  flagToName: '国旗→国名',
  nameToFlag: '国名→国旗',
  continent: '大陸別',
};

const modeIcons: Record<QuizMode, string> = {
  flagToName: '\u{1F1EF}\u{1F1F5}',
  nameToFlag: '\u{1F30D}',
  continent: '\u{1F5FA}',
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

function getAccuracyColor(accuracy: number, colors: any): string {
  if (accuracy >= 80) return colors.success;
  if (accuracy >= 60) return colors.warning;
  return colors.error;
}

export function HistoryScreen() {
  const { colors, spacing } = useTheme();
  const [history, setHistory] = useLocalStorage<QuizResult[]>('flag-quiz-history', []);

  const totalQuizzes = history.length;
  const totalCorrect = history.reduce((sum, r) => sum + r.correct, 0);
  const totalQuestions = history.reduce((sum, r) => sum + r.total, 0);
  const overallAccuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const handleClearHistory = () => {
    setHistory([]);
  };

  const renderItem = ({ item }: { item: QuizResult }) => {
    const accuracy = Math.round((item.correct / item.total) * 100);
    const subtitle = item.continent
      ? `${formatDate(item.date)} - ${item.continent}`
      : formatDate(item.date);
    return (
      <>
        <ListItem
          title={modeLabels[item.mode]}
          subtitle={subtitle}
          leftIcon={modeIcons[item.mode]}
          rightContent={
            <View style={styles.scoreContainer}>
              <Body
                style={{ fontWeight: 'bold' }}
                color={getAccuracyColor(accuracy, colors)}
              >
                {item.correct}/{item.total}
              </Body>
              <Caption color={getAccuracyColor(accuracy, colors)}>{accuracy}%</Caption>
            </View>
          }
        />
        <Divider />
      </>
    );
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <H2 style={{ marginBottom: spacing.lg }}>記録</H2>

        {totalQuizzes > 0 && (
          <View
            style={[
              styles.summaryRow,
              {
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: spacing.lg,
                marginBottom: spacing.lg,
                gap: spacing.md,
              },
            ]}
          >
            <View style={styles.summaryItem}>
              <H2 align="center" color={colors.primary}>
                {totalQuizzes}
              </H2>
              <Caption style={{ textAlign: 'center' }}>プレイ回数</Caption>
            </View>
            <View
              style={{
                width: 1,
                backgroundColor: colors.border,
                alignSelf: 'stretch',
              }}
            />
            <View style={styles.summaryItem}>
              <H2 align="center" color={colors.primary}>
                {totalCorrect}/{totalQuestions}
              </H2>
              <Caption style={{ textAlign: 'center' }}>合計正解数</Caption>
            </View>
            <View
              style={{
                width: 1,
                backgroundColor: colors.border,
                alignSelf: 'stretch',
              }}
            />
            <View style={styles.summaryItem}>
              <H2 align="center" color={getAccuracyColor(overallAccuracy, colors)}>
                {overallAccuracy}%
              </H2>
              <Caption style={{ textAlign: 'center' }}>正答率</Caption>
            </View>
          </View>
        )}

        {totalQuizzes === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="\u{1F3C6}"
              title="まだ記録がありません"
              subtitle="クイズをプレイして記録を残しましょう"
            />
          </View>
        ) : (
          <>
            <FlatList
              data={history}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
            />
            <View style={{ paddingTop: spacing.md }}>
              <Button
                title="記録をすべて削除"
                onPress={handleClearHistory}
                variant="ghost"
              />
            </View>
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
