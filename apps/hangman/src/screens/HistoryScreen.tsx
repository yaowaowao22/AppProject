import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useTheme, H2, Body, Caption, ListItem, Divider, EmptyState, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { GameResult } from './GameScreen';

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

export function HistoryScreen() {
  const { colors, spacing } = useTheme();
  const [results] = useLocalStorage<GameResult[]>('hangman_results', []);

  const renderItem = ({ item }: { item: GameResult }) => {
    const resultColor = item.won ? colors.success : colors.error;
    const resultLabel = item.won ? '正解' : '不正解';

    return (
      <ListItem
        title={item.word}
        subtitle={`${item.category} - ${formatDate(item.date)}`}
        rightContent={
          <View style={styles.rightContent}>
            <Body
              color={resultColor}
              style={{ fontWeight: 'bold', fontSize: 16 }}
            >
              {resultLabel}
            </Body>
            <Caption color={colors.textMuted}>
              ミス {item.wrongGuesses}回
            </Caption>
          </View>
        }
      />
    );
  };

  const renderHeader = () => {
    if (results.length === 0) return null;

    const totalGames = results.length;
    const totalWins = results.filter((r) => r.won).length;
    const winRate = Math.round((totalWins / totalGames) * 100);

    return (
      <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
        <H2 style={{ marginBottom: spacing.md }}>プレイ記録</H2>
        <View style={[styles.summaryRow, { marginBottom: spacing.sm }]}>
          <Badge label={`全${totalGames}回`} />
          <Badge label={`${totalWins}勝`} />
          <Badge label={`勝率 ${winRate}%`} />
        </View>
      </View>
    );
  };

  if (results.length === 0) {
    return (
      <ScreenWrapper>
        <View style={[styles.emptyContainer, { padding: spacing.lg }]}>
          <EmptyState
            icon="📝"
            title="まだ記録がありません"
            subtitle="ゲームをプレイして記録を残しましょう"
          />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ItemSeparatorComponent={() => <Divider />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
