import React from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { useTheme, H2, Body, Caption, Button, Badge, ListItem, Divider, EmptyState } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { GameResult, Difficulty } from '../types';

const DIFF_LABELS: Record<Difficulty, string> = {
  easy: '初級',
  medium: '中級',
  hard: '上級',
};

const DIFF_COLORS: Record<Difficulty, string> = {
  easy: '#4CAF50',
  medium: '#FF9800',
  hard: '#F44336',
};

export function HistoryScreen() {
  const { colors, spacing } = useTheme();
  const [history, setHistory] = useLocalStorage<GameResult[]>('lightsout_history', []);

  const clearHistory = () => {
    Alert.alert('履歴を削除', 'すべての記録を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => setHistory([]) },
    ]);
  };

  const sorted = [...(history || [])].reverse();

  const bestByDifficulty = (diff: Difficulty) => {
    const matching = (history || []).filter((r) => r.difficulty === diff);
    if (matching.length === 0) return null;
    return Math.min(...matching.map((r) => r.moves));
  };

  if (!history || history.length === 0) {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.lg }]}>
          <EmptyState
            icon="💡"
            title="まだ記録がありません"
            subtitle="ゲームをプレイして記録を残しましょう"
          />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.md }]}>
        <View style={[styles.header, { marginBottom: spacing.md }]}>
          <H2>クリア履歴</H2>
          <Button title="全削除" onPress={clearHistory} variant="ghost" size="sm" />
        </View>

        <View style={[styles.statsRow, { marginBottom: spacing.md, gap: spacing.sm }]}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, padding: spacing.sm, borderRadius: 8 }]}>
            <Caption>プレイ回数</Caption>
            <Body style={{ fontWeight: 'bold', fontSize: 18 }}>{history.length}</Body>
          </View>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => {
            const best = bestByDifficulty(diff);
            return (
              <View
                key={diff}
                style={[styles.statCard, { backgroundColor: colors.surface, padding: spacing.sm, borderRadius: 8 }]}
              >
                <Caption color={DIFF_COLORS[diff]}>{DIFF_LABELS[diff]}最少</Caption>
                <Body style={{ fontWeight: 'bold', fontSize: 18 }}>
                  {best != null ? `${best}手` : '-'}
                </Body>
              </View>
            );
          })}
        </View>

        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={Divider}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const date = new Date(item.date);
            const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            return (
              <ListItem
                title={item.levelName}
                subtitle={`${dateStr}  ${item.gridSize}×${item.gridSize}`}
                right={
                  <View style={styles.rightCol}>
                    <Badge label={DIFF_LABELS[item.difficulty]} color={DIFF_COLORS[item.difficulty]} />
                    <Body style={{ fontWeight: 'bold' }}>{item.moves}手</Body>
                  </View>
                }
              />
            );
          }}
        />
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
  statsRow: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
});
