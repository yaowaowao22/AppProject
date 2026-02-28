import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTheme, H2, Body, ListItem, Divider, EmptyState, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { GameResult } from '../utils/slidePuzzle';
import { formatTime, getGridSizeLabel, getPuzzleName } from '../utils/slidePuzzle';

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

export function HistoryScreen() {
  const { colors, spacing } = useTheme();
  const [history] = useLocalStorage<GameResult[]>('slide-puzzle-history', []);
  const [bestTimes] = useLocalStorage<Record<string, number>>(
    'slide-puzzle-best-times',
    {}
  );

  const renderItem = ({ item }: { item: GameResult }) => {
    const key = `${item.gridSize}x${item.gridSize}`;
    const isBest = bestTimes?.[key] === item.timeSeconds;

    return (
      <ListItem
        title={`${getPuzzleName(item.gridSize)} (${getGridSizeLabel(item.gridSize)})`}
        subtitle={`${formatDate(item.date)}  |  ${formatTime(item.timeSeconds)}  |  ${item.moves}手`}
        leftIcon="🧩"
        rightContent={
          isBest ? (
            <Badge label="ベスト" variant="success" />
          ) : (
            <Badge label="クリア" variant="default" />
          )
        }
      />
    );
  };

  if (!history || history.length === 0) {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.lg }]}>
          <EmptyState
            icon="🧩"
            title="まだ記録がありません"
            subtitle="パズルをクリアして記録を残しましょう"
          />
        </View>
      </ScreenWrapper>
    );
  }

  const totalGames = history.length;
  const avgMoves =
    Math.round(history.reduce((sum, r) => sum + r.moves, 0) / totalGames);

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <H2 style={{ marginBottom: spacing.sm }}>プレイ記録</H2>
        <Body
          color={colors.textSecondary}
          style={{ marginBottom: spacing.lg }}
        >
          合計 {totalGames} 回クリア | 平均 {avgMoves} 手
        </Body>
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <Divider />}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
