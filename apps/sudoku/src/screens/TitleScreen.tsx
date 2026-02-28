import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { GameResult, Difficulty } from '../types';
import { formatTime, getDifficultyLabel } from '../utils/sudoku';

export function TitleScreen() {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<any>();
  const [history] = useLocalStorage<GameResult[]>('sudoku_history', []);

  const handleStart = () => {
    navigation.navigate('Game');
  };

  const getBestTime = (diff: Difficulty): number | null => {
    if (!history || history.length === 0) return null;
    const completed = history.filter((r) => r.difficulty === diff && r.completed);
    if (completed.length === 0) return null;
    return Math.min(...completed.map((r) => r.timeSeconds));
  };

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <H1
            align="center"
            style={{ fontSize: 56, marginBottom: spacing.sm }}
          >
            数独
          </H1>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center' }}
          >
            クラシック数独パズル
          </Body>
        </View>

        <Card style={[styles.bestTimesCard, { padding: spacing.lg, marginBottom: spacing.xl }]}>
          <H3 align="center" style={{ marginBottom: spacing.md }}>
            ベストタイム
          </H3>
          {difficulties.map((diff) => {
            const best = getBestTime(diff);
            return (
              <View key={diff} style={[styles.bestTimeRow, { marginBottom: spacing.xs }]}>
                <Body>{getDifficultyLabel(diff)}</Body>
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
  bestTimesCard: {
    width: '100%',
  },
  bestTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonArea: {
    paddingBottom: 40,
  },
});
