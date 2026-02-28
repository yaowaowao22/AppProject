import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTheme, H2, Body, Caption, ListItem, Divider, EmptyState, Button } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { GameMode, Difficulty, GameResult } from '../types';

const modeLabels: Record<GameMode, string> = {
  normal: '通常',
  timeAttack: 'タイムアタック',
};

const modeIcons: Record<GameMode, string> = {
  normal: '📝',
  timeAttack: '⏱️',
};

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'かんたん',
  medium: 'ふつう',
  hard: 'むずかしい',
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

function getScoreColor(score: number, colors: any): string {
  if (score >= 2000) return colors.success;
  if (score >= 1000) return colors.warning;
  return colors.error;
}

export function HistoryScreen() {
  const { colors, spacing } = useTheme();
  const [history, setHistory] = useLocalStorage<GameResult[]>('anagram-history', []);

  const totalGames = history.length;
  const totalScore = history.reduce((sum, r) => sum + r.score, 0);
  const totalSolved = history.reduce((sum, r) => sum + r.solved, 0);
  const bestScore = totalGames > 0 ? Math.max(...history.map((r) => r.score)) : 0;

  const handleClearHistory = () => {
    setHistory([]);
  };

  const renderItem = ({ item }: { item: GameResult }) => {
    const subtitle = `${formatDate(item.date)} / ${difficultyLabels[item.difficulty]}`;
    const scoreText = `${item.score}点`;

    return (
      <>
        <ListItem
          title={`${modeLabels[item.mode]}`}
          subtitle={subtitle}
          leftIcon={modeIcons[item.mode]}
          rightContent={
            <View style={styles.scoreContainer}>
              <Body
                style={{ fontWeight: 'bold' }}
                color={getScoreColor(item.score, colors)}
              >
                {scoreText}
              </Body>
              <Caption color={colors.textSecondary}>
                {item.mode === 'timeAttack'
                  ? `${item.solved}問正解`
                  : `${item.solved}/${item.total}問`}
              </Caption>
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
                {bestScore}
              </H2>
              <Caption style={{ textAlign: 'center' }}>最高スコア</Caption>
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
                {totalSolved}
              </H2>
              <Caption style={{ textAlign: 'center' }}>合計正解数</Caption>
            </View>
          </View>
        )}

        {totalGames === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="🏆"
              title="まだ記録がありません"
              subtitle="ゲームをプレイして記録を残しましょう"
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
