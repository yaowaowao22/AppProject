import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H2, Body, Caption, Button, Card, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { QuizResult } from '../types';

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();

  const [history] = useLocalStorage<QuizResult[]>(
    'kanji-kentei-quiz-history',
    []
  );

  const handleStart = () => {
    navigation.navigate('Game');
  };

  const totalQuizzes = history?.length ?? 0;
  const averageAccuracy =
    totalQuizzes > 0
      ? Math.round(
          (history!.reduce(
            (sum, r) => sum + (r.total > 0 ? (r.correct / r.total) * 100 : 0),
            0
          ) /
            totalQuizzes)
        )
      : 0;
  const totalCorrect = history?.reduce((sum, r) => sum + r.correct, 0) ?? 0;
  const totalQuestions = history?.reduce((sum, r) => sum + r.total, 0) ?? 0;

  const levelSet = new Set(history?.map((r) => r.level) ?? []);
  const levelsPlayed = levelSet.size;

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <H1
            align="center"
            style={{ fontSize: 42, marginBottom: spacing.sm }}
          >
            漢検対策
          </H1>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center', fontSize: 18 }}
          >
            級別漢字テスト
          </Body>
          <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md, justifyContent: 'center' }}>
            <Badge label="読み" />
            <Badge label="書き" variant="outline" />
            <Badge label="部首" variant="outline" />
            <Badge label="四字熟語" variant="outline" />
          </View>
        </View>

        {totalQuizzes > 0 && (
          <Card style={[styles.statsCard, { marginBottom: spacing.xl }]}>
            <Body
              color={colors.textSecondary}
              style={{
                textAlign: 'center',
                marginBottom: spacing.md,
                fontWeight: '600',
              }}
            >
              あなたの記録
            </Body>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <H2 align="center" style={{ color: colors.primary }}>
                  {totalQuizzes}
                </H2>
                <Caption
                  color={colors.textMuted}
                  style={{ textAlign: 'center' }}
                >
                  回プレイ
                </Caption>
              </View>
              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <View style={styles.statItem}>
                <H2 align="center" style={{ color: colors.primary }}>
                  {averageAccuracy}%
                </H2>
                <Caption
                  color={colors.textMuted}
                  style={{ textAlign: 'center' }}
                >
                  平均正答率
                </Caption>
              </View>
              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <View style={styles.statItem}>
                <H2 align="center" style={{ color: colors.primary }}>
                  {totalCorrect}/{totalQuestions}
                </H2>
                <Caption
                  color={colors.textMuted}
                  style={{ textAlign: 'center' }}
                >
                  累計正解
                </Caption>
              </View>
            </View>
            {levelsPlayed > 1 && (
              <Caption
                color={colors.textMuted}
                style={{ textAlign: 'center', marginTop: spacing.sm }}
              >
                {levelsPlayed}つの級に挑戦済み
              </Caption>
            )}
          </Card>
        )}

        <View style={styles.buttonArea}>
          <Button title="クイズをはじめる" onPress={handleStart} size="lg" />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  titleArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  buttonArea: {
    paddingBottom: 40,
  },
});
