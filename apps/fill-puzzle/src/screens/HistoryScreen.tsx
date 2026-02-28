import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTheme, H2, ListItem, Divider, EmptyState, Caption } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { Difficulty } from '../data/levels';

interface ClearRecord {
  id: string;
  levelId: string;
  difficulty: Difficulty;
  levelIndex: number;
  moves: number;
  date: string;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const h = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  return `${y}/${m}/${d} ${h}:${min}`;
}

function getDifficultyLabel(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'easy':
      return '初級';
    case 'medium':
      return '中級';
    case 'hard':
      return '上級';
    default:
      return difficulty;
  }
}

export function HistoryScreen() {
  const { colors, spacing } = useTheme();
  const [records] = useLocalStorage<ClearRecord[]>('fill-puzzle-records', []);

  const data = records || [];

  const renderItem = ({ item }: { item: ClearRecord }) => (
    <View>
      <ListItem
        title={`${getDifficultyLabel(item.difficulty)} レベル ${item.levelIndex + 1}`}
        subtitle={`${item.moves}手 | ${formatDate(item.date)}`}
        leftIcon="🏆"
      />
      <Divider />
    </View>
  );

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <H2 style={{ marginBottom: spacing.lg }}>クリア記録</H2>
        {data.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="🏆"
              title="まだ記録がありません"
              subtitle="レベルをクリアして記録を残しましょう"
            />
          </View>
        ) : (
          <>
            <Caption
              style={{
                marginBottom: spacing.md,
                color: colors.textMuted,
              }}
            >
              合計 {data.length} 件のクリア記録
            </Caption>
            <FlatList
              data={data}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
            />
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
