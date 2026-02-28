import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H3, Body, Button, Card, Caption } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { PuzzleResult, Difficulty } from '../types';
import { PUZZLES, DIFFICULTY_LABELS, getPuzzlesByDifficulty } from '../data/puzzles';

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [history] = useLocalStorage<PuzzleResult[]>('kakuro_hard_history', []);

  const results = history ?? [];

  const handleStart = () => {
    navigation.navigate('Game');
  };

  const getCompletedCount = (diff: Difficulty): number => {
    const puzzleIds = getPuzzlesByDifficulty(diff).map((p) => p.id);
    const completedIds = new Set(
      results.filter((r) => puzzleIds.includes(r.puzzleId)).map((r) => r.puzzleId)
    );
    return completedIds.size;
  };

  const getTotalCount = (diff: Difficulty): number => {
    return getPuzzlesByDifficulty(diff).length;
  };

  const totalCompleted = new Set(results.map((r) => r.puzzleId)).size;

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <H1 align="center">{'カックロ上級'}</H1>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center', marginTop: spacing.sm }}
          >
            {'上級クロスサムパズル'}
          </Body>
          <Caption
            color={colors.textMuted}
            style={{ textAlign: 'center', marginTop: spacing.xs }}
          >
            {`全${PUZZLES.length}問 | クリア${totalCompleted}問`}
          </Caption>
        </View>

        <Card style={{ padding: spacing.lg, marginBottom: spacing.xl }}>
          <H3 align="center" style={{ marginBottom: spacing.md }}>
            {'クリア状況'}
          </H3>
          {(['medium', 'hard', 'expert'] as Difficulty[]).map((diff) => {
            const completed = getCompletedCount(diff);
            const total = getTotalCount(diff);
            return (
              <View
                key={diff}
                style={[styles.progressRow, { paddingVertical: spacing.xs }]}
              >
                <Body>{DIFFICULTY_LABELS[diff]}</Body>
                <Body color={completed > 0 ? colors.primary : colors.textMuted}>
                  {`${completed} / ${total}`}
                </Body>
              </View>
            );
          })}
        </Card>

        <View style={styles.buttonArea}>
          <Button title="ゲームスタート" onPress={handleStart} size="lg" />
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
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonArea: {
    paddingBottom: 40,
  },
});
