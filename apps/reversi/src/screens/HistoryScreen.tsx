import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTheme, ListItem, Divider, EmptyState, Badge, H2 } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { GameResult } from '../types';
import { getDifficultyLabel } from '../utils/reversi';

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${mins}`;
}

function getResultLabel(item: GameResult): string {
  if (item.draw) return '引き分け';
  return item.won ? '勝利' : '敗北';
}

export function HistoryScreen() {
  const { colors, spacing } = useTheme();
  const [history, , loading] = useLocalStorage<GameResult[]>('reversi_history', []);

  const getResultColor = (item: GameResult): string => {
    if (item.draw) return colors.textSecondary;
    return item.won ? colors.success : colors.error;
  };

  const renderItem = ({ item }: { item: GameResult }) => (
    <ListItem
      title={`${getDifficultyLabel(item.difficulty)} - 黒 ${item.playerScore} vs ${item.aiScore} 白`}
      subtitle={formatDate(item.date)}
      rightElement={
        <Badge
          label={getResultLabel(item)}
          color={getResultColor(item)}
        />
      }
    />
  );

  const keyExtractor = (item: GameResult) => item.id;

  const renderSeparator = () => <Divider />;

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <H2 style={{ marginBottom: spacing.lg }}>対戦履歴</H2>
        {!loading && (!history || history.length === 0) ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="🏆"
              title="まだ記録がありません"
              subtitle="ゲームをプレイして記録を残しましょう"
            />
          </View>
        ) : (
          <FlatList
            data={history || []}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ItemSeparatorComponent={renderSeparator}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
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
});
