import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTheme, Body, ListItem, Divider, EmptyState, Badge, H2 } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { Difficulty } from '../data/crosswords';
import { getDifficultyLabel } from '../data/crosswords';
import { formatTime } from '../utils/crossword';

interface GameResult {
  id: string;
  date: string;
  puzzleId: string;
  puzzleTitle: string;
  difficulty: Difficulty;
  timeSeconds: number;
  completed: boolean;
}

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${mins}`;
}

export function HistoryScreen() {
  const { colors, spacing } = useTheme();
  const [history, , loading] = useLocalStorage<GameResult[]>('crossword_jp_history', []);

  const renderItem = ({ item }: { item: GameResult }) => (
    <ListItem
      title={`${item.puzzleTitle} - ${getDifficultyLabel(item.difficulty)}`}
      subtitle={`${formatDate(item.date)}  ${formatTime(item.timeSeconds)}`}
      rightElement={
        <Badge
          label={item.completed ? 'クリア' : '未完了'}
          variant={item.completed ? 'success' : 'default'}
        />
      }
    />
  );

  const keyExtractor = (item: GameResult) => item.id;

  const renderSeparator = () => <Divider />;

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <H2 style={{ marginBottom: spacing.lg }}>プレイ履歴</H2>
        {!loading && (!history || history.length === 0) ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="🏆"
              title="まだ記録がありません"
              subtitle="パズルをクリアして記録を残しましょう"
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
