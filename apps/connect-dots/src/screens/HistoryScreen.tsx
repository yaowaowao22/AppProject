import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useTheme, H2, Body, Caption, Card, EmptyState, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';

interface HistoryRecord {
  puzzleId: string;
  puzzleName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time: number;
  date: string;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '初級',
  medium: '中級',
  hard: '上級',
};

const DIFFICULTY_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
};

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const h = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  return `${y}/${m}/${day} ${h}:${min}`;
}

export function HistoryScreen() {
  const { colors, spacing } = useTheme();
  const [history] = useLocalStorage<HistoryRecord[]>('connect-dots-history', []);

  const renderItem = useCallback(
    ({ item, index }: { item: HistoryRecord; index: number }) => (
      <Card
        style={[
          styles.card,
          {
            marginHorizontal: spacing.lg,
            marginTop: index === 0 ? spacing.sm : 0,
            marginBottom: spacing.sm,
            padding: spacing.md,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Body style={{ fontWeight: '600', flex: 1 }}>{item.puzzleName}</Body>
          <Badge
            label={DIFFICULTY_LABELS[item.difficulty]}
            variant={DIFFICULTY_VARIANTS[item.difficulty]}
          />
        </View>
        <View style={[styles.cardDetails, { marginTop: spacing.sm }]}>
          <View style={styles.detailItem}>
            <Caption color={colors.textSecondary}>タイム</Caption>
            <Body style={{ fontWeight: '600' }}>{formatTime(item.time)}</Body>
          </View>
          <View style={styles.detailItem}>
            <Caption color={colors.textSecondary}>日時</Caption>
            <Caption color={colors.textSecondary}>{formatDate(item.date)}</Caption>
          </View>
        </View>
      </Card>
    ),
    [colors, spacing],
  );

  const keyExtractor = useCallback(
    (_: HistoryRecord, index: number) => `history-${index}`,
    [],
  );

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <H2 style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm }}>
          クリア記録
        </H2>

        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="📝"
              title="まだ記録がありません"
              subtitle="パズルをクリアすると記録が残ります"
            />
          </View>
        ) : (
          <FlatList
            data={history}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
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
  card: {},
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  detailItem: {},
});
