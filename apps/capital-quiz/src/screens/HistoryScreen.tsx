import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTheme, H2, Body, Caption, ListItem, Divider, EmptyState, Button } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { QuizMode, QuizResult } from '../types';

const modeLabels: Record<QuizMode, string> = {
  countryToCapital: '\u56FD\u2192\u9996\u90FD',
  capitalToCountry: '\u9996\u90FD\u2192\u56FD',
  continent: '\u5927\u9678\u5225',
  worldShuffle: '\u5168\u4E16\u754C',
};

const modeIcons: Record<QuizMode, string> = {
  countryToCapital: '\u{1F3DB}',
  capitalToCountry: '\u{1F30D}',
  continent: '\u{1F5FA}',
  worldShuffle: '\u{1F30E}',
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
  const [history, setHistory] = useLocalStorage<QuizResult[]>('capital-quiz-history', []);

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
        <H2 style={{ marginBottom: spacing.lg }}>{'\u8A18\u9332'}</H2>

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
              <Caption style={{ textAlign: 'center' }}>{'\u30D7\u30EC\u30A4\u56DE\u6570'}</Caption>
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
              <Caption style={{ textAlign: 'center' }}>{'\u5408\u8A08\u6B63\u89E3\u6570'}</Caption>
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
              <Caption style={{ textAlign: 'center' }}>{'\u6B63\u7B54\u7387'}</Caption>
            </View>
          </View>
        )}

        {totalQuizzes === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={'\u{1F3C6}'}
              title={'\u307E\u3060\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093'}
              subtitle={'\u30AF\u30A4\u30BA\u3092\u30D7\u30EC\u30A4\u3057\u3066\u8A18\u9332\u3092\u6B8B\u3057\u307E\u3057\u3087\u3046'}
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
                title={'\u8A18\u9332\u3092\u3059\u3079\u3066\u524A\u9664'}
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
