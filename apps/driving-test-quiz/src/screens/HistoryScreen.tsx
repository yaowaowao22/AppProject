import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTheme, H2, Body, Caption, ListItem, Divider, Badge, EmptyState } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { TestResult } from '../types';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${d} ${h}:${min}`;
}

export function HistoryScreen() {
  const { colors, spacing } = useTheme();
  const [history, , loading] = useLocalStorage<TestResult[]>('quiz-history', []);

  const totalTests = history.length;
  const passedTests = history.filter((r) => r.passed).length;

  const renderItem = ({ item }: { item: TestResult }) => {
    const percentage = Math.round((item.correct / item.total) * 100);
    return (
      <ListItem
        title={`${item.category} (${item.total}問)`}
        subtitle={formatDate(item.date)}
        rightElement={
          <View style={styles.rightContent}>
            <Body style={{ fontWeight: '600' }}>
              {item.correct}/{item.total} ({percentage}%)
            </Body>
            <Badge
              label={item.passed ? '合格' : '不合格'}
              color={item.passed ? colors.success : colors.error}
            />
          </View>
        }
      />
    );
  };

  const renderSeparator = () => <Divider />;

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.lg }]}>
          <Body color={colors.textMuted} style={{ textAlign: 'center' }}>
            読み込み中...
          </Body>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <H2 style={{ marginBottom: spacing.sm }}>試験履歴</H2>

        {totalTests > 0 && (
          <Caption
            color={colors.textMuted}
            style={{ marginBottom: spacing.lg }}
          >
            受験回数: {totalTests}回 / 合格: {passedTests}回
          </Caption>
        )}

        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="📝"
              title="まだ記録がありません"
              subtitle="試験を受けて結果を確認しましょう"
            />
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ItemSeparatorComponent={renderSeparator}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.xxl }}
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
  rightContent: {
    alignItems: 'flex-end',
    gap: 4,
  },
});
