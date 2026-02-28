import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTheme, H2, Body, Caption, ListItem, Divider, Badge, EmptyState } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { CATEGORY_ICONS } from '../data/emojiQuestions';
import type { Category } from '../data/emojiQuestions';
import type { QuizResult } from './TitleScreen';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${d} ${h}:${min}`;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function HistoryScreen() {
  const { colors, spacing } = useTheme();
  const [history] = useLocalStorage<QuizResult[]>('emoji-quiz-history', []);

  const data = history || [];

  const totalQuizzes = data.length;
  const totalCorrect = data.reduce((sum, r) => sum + r.correct, 0);
  const totalQuestions = data.reduce((sum, r) => sum + r.total, 0);
  const overallAccuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const renderItem = ({ item }: { item: QuizResult }) => {
    const excellent = item.percentage >= 80;
    const icon =
      CATEGORY_ICONS[item.category as Category] ?? '🧩';

    return (
      <ListItem
        title={`${icon} ${item.category}（${item.total}問）`}
        subtitle={`${formatDate(item.date)} | ${formatTime(item.timeSeconds)}`}
        rightElement={
          <View style={styles.rightContent}>
            <Body style={{ fontWeight: '600' }}>
              {item.correct}/{item.total}（{item.percentage}%）
            </Body>
            <Badge
              label={excellent ? '高得点' : '挑戦済'}
              color={excellent ? colors.success : colors.primary}
            />
          </View>
        }
      />
    );
  };

  const renderSeparator = () => <Divider />;

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <H2 style={{ marginBottom: spacing.sm }}>挑戦履歴</H2>

        {totalQuizzes > 0 && (
          <Caption
            color={colors.textMuted}
            style={{ marginBottom: spacing.lg }}
          >
            挑戦回数: {totalQuizzes}回 / 全体正答率: {overallAccuracy}%
          </Caption>
        )}

        {data.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="🧩"
              title="まだ記録がありません"
              subtitle="絵文字クイズに挑戦して記録を残しましょう"
            />
          </View>
        ) : (
          <FlatList
            data={data}
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
