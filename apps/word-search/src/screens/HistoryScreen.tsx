import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTheme, H2, ListItem, Divider, EmptyState, Caption } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { formatTime } from '../utils/wordSearch';

interface GameResult {
  id: string;
  theme: string;
  themeName: string;
  gridSize: number;
  wordsFound: number;
  totalWords: number;
  timeSeconds: number;
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

function getSizeLabel(size: number): string {
  switch (size) {
    case 8:
      return '8×8 初級';
    case 10:
      return '10×10 中級';
    case 12:
      return '12×12 上級';
    default:
      return `${size}×${size}`;
  }
}

export function HistoryScreen() {
  const { colors, spacing } = useTheme();
  const [results] = useLocalStorage<GameResult[]>('wordsearch-results', []);

  const data = results || [];

  const renderItem = ({ item }: { item: GameResult }) => (
    <View>
      <ListItem
        title={`${item.themeName} — ${getSizeLabel(item.gridSize)}`}
        subtitle={`${item.wordsFound}/${item.totalWords}語発見 | ${formatTime(item.timeSeconds)} | ${formatDate(item.date)}`}
        leftIcon="🏆"
      />
      <Divider />
    </View>
  );

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <H2 style={{ marginBottom: spacing.lg }}>プレイ記録</H2>
        {data.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="🏆"
              title="まだ記録がありません"
              subtitle="ゲームをプレイして記録を残しましょう"
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
              合計 {data.length} 件のプレイ記録
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
