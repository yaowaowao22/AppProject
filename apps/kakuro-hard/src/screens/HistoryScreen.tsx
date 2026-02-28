import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTheme, EmptyState, ListItem, Divider, H2, Body, Button } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { PuzzleResult } from '../types';
import { DIFFICULTY_LABELS } from '../data/puzzles';

function formatTime(s: number): string {
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

export function HistoryScreen() {
  const { colors, spacing } = useTheme();
  const [history, setHistory, loading] = useLocalStorage<PuzzleResult[]>(
    'kakuro_hard_history',
    []
  );

  const results = history ?? [];

  const handleClear = () => {
    setHistory([]);
  };

  const renderItem = ({ item }: { item: PuzzleResult }) => {
    const diffLabel = DIFFICULTY_LABELS[item.difficulty] ?? item.difficulty;
    return (
      <ListItem
        title={`${item.puzzleName} - ${formatDate(item.date)}`}
        subtitle={`${diffLabel} | ${item.size} | ${formatTime(item.timeSeconds)}`}
      />
    );
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.lg }]}>
          <Body color={colors.textSecondary} style={{ textAlign: 'center' }}>
            {'読み込み中...'}
          </Body>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <View style={[styles.header, { marginBottom: spacing.md }]}>
          <H2>{'クリア記録'}</H2>
          {results.length > 0 && (
            <Button title="全消去" onPress={handleClear} variant="ghost" size="sm" />
          )}
        </View>

        {results.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="🏆"
              title="まだ記録がありません"
              subtitle="パズルをクリアして記録を残しましょう"
            />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <Divider />}
            showsVerticalScrollIndicator={false}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
