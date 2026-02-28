import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { Difficulty } from '../data/crosswords';
import { ALL_PUZZLES, getDifficultyLabel, getGridSizeLabel } from '../data/crosswords';

interface GameResult {
  id: string;
  date: string;
  puzzleId: string;
  puzzleTitle: string;
  difficulty: Difficulty;
  timeSeconds: number;
  completed: boolean;
}

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [history] = useLocalStorage<GameResult[]>('crossword_jp_history', []);

  const handleStart = () => {
    navigation.navigate('Game');
  };

  const completedIds = new Set(
    (history || []).filter((h) => h.completed).map((h) => h.puzzleId),
  );
  const totalPuzzles = ALL_PUZZLES.length;
  const completedCount = completedIds.size;

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  const getCompletedForDifficulty = (diff: Difficulty): number => {
    return ALL_PUZZLES.filter(
      (p) => p.difficulty === diff && completedIds.has(p.id),
    ).length;
  };

  const getTotalForDifficulty = (diff: Difficulty): number => {
    return ALL_PUZZLES.filter((p) => p.difficulty === diff).length;
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <H1
            align="center"
            style={{ fontSize: 48, marginBottom: spacing.sm }}
          >
            クロスワード
          </H1>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center' }}
          >
            カタカナクロスワードパズル
          </Body>
        </View>

        <Card style={[styles.statsCard, { padding: spacing.lg, marginBottom: spacing.xl }]}>
          <H3 align="center" style={{ marginBottom: spacing.md }}>
            クリア状況
          </H3>
          {difficulties.map((diff) => {
            const done = getCompletedForDifficulty(diff);
            const total = getTotalForDifficulty(diff);
            return (
              <View key={diff} style={[styles.statsRow, { marginBottom: spacing.xs }]}>
                <Body>
                  {getDifficultyLabel(diff)}（{getGridSizeLabel(diff)}）
                </Body>
                <Body
                  color={done === total && total > 0 ? colors.primary : colors.textSecondary}
                  style={{ fontWeight: done > 0 ? '600' : '400' }}
                >
                  {done} / {total}
                </Body>
              </View>
            );
          })}
          <View style={[styles.statsRow, { marginTop: spacing.sm }]}>
            <Body style={{ fontWeight: '700' }}>合計</Body>
            <Body
              color={completedCount === totalPuzzles ? colors.primary : colors.text}
              style={{ fontWeight: '700' }}
            >
              {completedCount} / {totalPuzzles}
            </Body>
          </View>
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
