import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { GameResult, Difficulty } from '../types';
import { formatTime, getDifficultyLabel } from '../utils/killerSudoku';
import { puzzles } from '../data/puzzles';

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [history] = useLocalStorage<GameResult[]>('killer_sudoku_history', []);

  const handleStart = () => {
    navigation.navigate('Game');
  };

  const getCompletedCount = (diff: Difficulty): number => {
    if (!history || history.length === 0) return 0;
    const completedIds = new Set(
      history.filter((r) => r.difficulty === diff && r.completed).map((r) => r.puzzleId),
    );
    return completedIds.size;
  };

  const getTotalCount = (diff: Difficulty): number => {
    return puzzles.filter((p) => p.difficulty === diff).length;
  };

  const getBestTime = (diff: Difficulty): number | null => {
    if (!history || history.length === 0) return null;
    const completed = history.filter((r) => r.difficulty === diff && r.completed);
    if (completed.length === 0) return null;
    return Math.min(...completed.map((r) => r.timeSeconds));
  };

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  const totalCompleted = history
    ? new Set(history.filter((r) => r.completed).map((r) => r.puzzleId)).size
    : 0;

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <H1
            align="center"
            style={{ fontSize: 48, marginBottom: spacing.sm }}
          >
            {'\u30AD\u30E9\u30FC\u6570\u72EC'}
          </H1>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center' }}
          >
            {'\u8DB3\u3057\u7B97\u30EB\u30FC\u30EB\u4ED8\u304D\u6570\u72EC'}
          </Body>
          <Caption
            color={colors.textMuted}
            style={{ textAlign: 'center', marginTop: spacing.xs }}
          >
            {`\u30AF\u30EA\u30A2\u6E08\u307F: ${totalCompleted} / ${puzzles.length}`}
          </Caption>
        </View>

        <Card style={[styles.statsCard, { padding: spacing.lg, marginBottom: spacing.xl }]}>
          <H3 align="center" style={{ marginBottom: spacing.md }}>
            {'\u30D9\u30B9\u30C8\u30BF\u30A4\u30E0'}
          </H3>
          {difficulties.map((diff) => {
            const best = getBestTime(diff);
            const completed = getCompletedCount(diff);
            const total = getTotalCount(diff);
            return (
              <View key={diff} style={[styles.statsRow, { marginBottom: spacing.xs }]}>
                <Body>{getDifficultyLabel(diff)} ({completed}/{total})</Body>
                <Body
                  color={best !== null ? colors.primary : colors.textMuted}
                  style={{ fontWeight: best !== null ? '600' : '400' }}
                >
                  {best !== null ? formatTime(best) : '---'}
                </Body>
              </View>
            );
          })}
        </Card>

        <View style={styles.buttonArea}>
          <Button title={'\u30B2\u30FC\u30E0\u30B9\u30BF\u30FC\u30C8'} onPress={handleStart} size="lg" />
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
    width: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonArea: {
    paddingBottom: 40,
  },
});
