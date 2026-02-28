import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTheme, H2, Body, ListItem, Divider, EmptyState, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { GameResult } from '../types';

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
  const [history] = useLocalStorage<GameResult[]>('game-history-2048', []);

  const renderItem = ({ item }: { item: GameResult }) => (
    <ListItem
      title={`スコア: ${item.score}`}
      subtitle={`${formatDate(item.date)}  |  最大タイル: ${item.highestTile}`}
      leftIcon={item.won ? '🏆' : '🎮'}
      rightContent={
        <Badge
          label={item.won ? '達成' : '終了'}
          variant={item.won ? 'success' : 'default'}
        />
      }
    />
  );

  const getBestScore = (): number => {
    if (!history || history.length === 0) return 0;
    return Math.max(...history.map((r) => r.score));
  };

  const bestScore = getBestScore();

  if (!history || history.length === 0) {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.lg }]}>
          <EmptyState
            icon="🏆"
            title="まだ記録がありません"
            subtitle="ゲームをプレイして記録を残しましょう"
          />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <H2 style={{ marginBottom: spacing.sm }}>プレイ記録</H2>
        <Body
          color={colors.textSecondary}
          style={{ marginBottom: spacing.lg }}
        >
          ベストスコア: {bestScore} | 合計 {history.length} 回プレイ
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
