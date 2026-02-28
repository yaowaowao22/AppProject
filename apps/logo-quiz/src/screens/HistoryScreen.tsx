import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTheme, H2, Body, Caption, ListItem, Divider, EmptyState, Button } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { GameResult } from '../types';

const categoryIcons: Record<string, string> = {
  'IT': '\u{1F4BB}',
  '\u{81EA}\u{52D5}\u{8ECA}': '\u{1F697}',
  '\u{98F2}\u{98DF}': '\u{1F354}',
  '\u{30D5}\u{30A1}\u{30C3}\u{30B7}\u{30E7}\u{30F3}': '\u{1F45C}',
  '\u{30A8}\u{30F3}\u{30BF}\u{30E1}': '\u{1F3AC}',
  '\u{65E5}\u{7528}\u{54C1}': '\u{1F9F4}',
  '\u{5C0F}\u{58F2}': '\u{1F6D2}',
  '\u{4EA4}\u{901A}': '\u{2708}\uFE0F',
  '\u{91D1}\u{878D}': '\u{1F3E6}',
  '\u{5BB6}\u{96FB}': '\u{1F4FA}',
  '\u{88FD}\u{85AC}': '\u{1F48A}',
  '\u{901A}\u{4FE1}': '\u{1F4F1}',
  '\u{3059}\u{3079}\u{3066}': '\u{1F30D}',
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
  const [history, setHistory] = useLocalStorage<GameResult[]>('brand-quiz-history', []);

  const totalGames = history.length;
  const totalCorrect = history.reduce((sum, r) => sum + r.correct, 0);
  const totalQuestions = history.reduce((sum, r) => sum + r.total, 0);
  const totalScore = history.reduce((sum, r) => sum + r.totalScore, 0);
  const overallAccuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const handleClearHistory = () => {
    setHistory([]);
  };

  const renderItem = ({ item }: { item: GameResult }) => {
    const accuracy = Math.round((item.correct / item.total) * 100);
    const subtitle = `${formatDate(item.date)} - ${item.totalScore}pt`;
    return (
      <>
        <ListItem
          title={`${item.category}カテゴリ`}
          subtitle={subtitle}
          leftIcon={categoryIcons[item.category] || '\u{1F3E2}'}
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

        {totalGames > 0 && (
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
                {totalGames}
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
                {totalScore}
              </H2>
              <Caption style={{ textAlign: 'center' }}>累計スコア</Caption>
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

        {totalGames === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="\u{1F3C6}"
              title="まだ記録がありません"
              subtitle="ブランドクイズをプレイして記録を残しましょう"
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
