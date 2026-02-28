import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTheme, H2, Body, Button, ListItem, Divider, EmptyState, Caption } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { formatTime, getOptimalMoves } from '../utils/hanoi';
import type { GameResult } from './GameScreen';

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
  const [history, setHistory, loading] = useLocalStorage<GameResult[]>('hanoi_history', []);

  const results = history ?? [];

  const handleClear = () => {
    setHistory([]);
  };

  const renderItem = ({ item }: { item: GameResult }) => {
    const optimal = getOptimalMoves(item.diskCount);
    const isOptimal = item.moves === optimal;
    const icon = isOptimal ? '🏆' : '🏁';
    const optimalText = isOptimal ? '（最適解）' : '';

    return (
      <ListItem
        title={`${icon} ${item.diskCount}枚 - ${item.moves}手${optimalText}`}
        subtitle={`最少${optimal}手 | ${formatTime(item.timeSeconds)} | ${formatDate(item.date)}`}
      />
    );
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.lg }]}>
          <Body color={colors.textSecondary} style={{ textAlign: 'center' }}>
            読み込み中...
          </Body>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <View style={[styles.header, { marginBottom: spacing.md }]}>
          <H2>クリア記録</H2>
          {results.length > 0 && (
            <Button title="全消去" onPress={handleClear} variant="ghost" size="sm" />
          )}
        </View>

        {results.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="🏆"
              title="まだ記録がありません"
              subtitle="ゲームをクリアして記録を残しましょう"
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
              合計 {results.length} 件のクリア記録
            </Caption>
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <Divider />}
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
