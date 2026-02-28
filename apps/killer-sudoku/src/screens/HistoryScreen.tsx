import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTheme, Body, ListItem, Divider, EmptyState, Badge, H2 } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { GameResult } from '../types';
import { formatTime, getDifficultyLabel } from '../utils/killerSudoku';

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
  const [history, , loading] = useLocalStorage<GameResult[]>('killer_sudoku_history', []);

  const renderItem = ({ item }: { item: GameResult }) => (
    <ListItem
      title={`${getDifficultyLabel(item.difficulty)} - ${formatTime(item.timeSeconds)}`}
      subtitle={formatDate(item.date)}
      rightElement={
        <Badge
          label={item.completed ? '\u30AF\u30EA\u30A2' : '\u672A\u5B8C\u4E86'}
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
        <H2 style={{ marginBottom: spacing.lg }}>{'\u30D7\u30EC\u30A4\u5C65\u6B74'}</H2>
        {!loading && (!history || history.length === 0) ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="\uD83C\uDFC6"
              title={'\u307E\u3060\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093'}
              subtitle={'\u30B2\u30FC\u30E0\u3092\u30D7\u30EC\u30A4\u3057\u3066\u8A18\u9332\u3092\u6B8B\u3057\u307E\u3057\u3087\u3046'}
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
