import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
  useTheme,
  H2,
  Body,
  Caption,
  ListItem,
  Divider,
  EmptyState,
  Button,
  Badge,
} from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { QuizResult } from '../types';

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function HistoryScreen() {
  const { colors, spacing } = useTheme();
  const [history, setHistory] = useLocalStorage<QuizResult[]>(
    'english-vocab-quiz-history',
    []
  );

  const handleClearHistory = useCallback(() => {
    Alert.alert('履歴を削除', 'すべての記録を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => setHistory([]),
      },
    ]);
  }, [setHistory]);

  const renderItem = useCallback(
    ({ item }: { item: QuizResult }) => {
      const accuracy =
        item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
      const accuracyColor =
        accuracy >= 80
          ? colors.success
          : accuracy >= 50
          ? colors.warning
          : colors.error;

      return (
        <ListItem
          title={`${item.level}  ${item.correct}/${item.total}問正解`}
          subtitle={`${formatDate(item.date)}  |  ${formatTime(item.timeSeconds)}`}
          rightElement={
            <View style={styles.accuracyBadge}>
              <Body
                style={{ fontWeight: '700', color: accuracyColor }}
              >
                {accuracy}%
              </Body>
            </View>
          }
        />
      );
    },
    [colors]
  );

  const keyExtractor = useCallback((item: QuizResult) => item.id, []);

  const historyList = history || [];

  if (historyList.length === 0) {
    return (
      <ScreenWrapper>
        <View style={[styles.emptyContainer, { padding: spacing.lg }]}>
          <EmptyState
            icon="🏆"
            title="まだ記録がありません"
            subtitle="クイズをプレイして記録を残しましょう"
          />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <View
          style={[
            styles.headerRow,
            { marginBottom: spacing.md },
          ]}
        >
          <H2>クイズ履歴</H2>
          <Button
            title="全削除"
            onPress={handleClearHistory}
            variant="ghost"
            size="sm"
          />
        </View>

        <Caption
          color={colors.textMuted}
          style={{ marginBottom: spacing.md }}
        >
          全{historyList.length}件
        </Caption>

        <FlatList
          data={historyList}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={() => <Divider />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accuracyBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
});
