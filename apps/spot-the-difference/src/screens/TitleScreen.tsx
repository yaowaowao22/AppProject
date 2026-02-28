import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H3, Body, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import {
  DIFFICULTY_CONFIG,
  getPuzzlesByDifficulty,
} from '../data/puzzles';
import type { Difficulty } from '../data/puzzles';

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [clearedPuzzles] = useLocalStorage<number[]>(
    'spot_the_difference_cleared',
    [],
  );

  const handleStart = () => {
    navigation.navigate('Game');
  };

  const cleared = clearedPuzzles ?? [];

  const getClearedCount = (diff: Difficulty): number => {
    const puzzleIds = getPuzzlesByDifficulty(diff).map((p) => p.id);
    return cleared.filter((id) => puzzleIds.includes(id)).length;
  };

  const totalCleared = cleared.length;

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <H1 align="center">{'間違い探し'}</H1>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center', marginTop: spacing.md }}
          >
            {'2つの絵の違いを見つけよう'}
          </Body>
        </View>

        <Card style={{ padding: spacing.lg, marginBottom: spacing.xl }}>
          <H3 align="center" style={{ marginBottom: spacing.md }}>
            {'クリア状況'}
          </H3>
          {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((diff) => {
            const total = getPuzzlesByDifficulty(diff).length;
            const count = getClearedCount(diff);
            return (
              <View
                key={diff}
                style={[styles.progressRow, { paddingVertical: spacing.xs }]}
              >
                <Body>{DIFFICULTY_CONFIG[diff].label}</Body>
                <Body color={count === total ? colors.success : colors.primary}>
                  {count} / {total}
                </Body>
              </View>
            );
          })}
          <View
            style={[
              styles.progressRow,
              {
                paddingVertical: spacing.xs,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                marginTop: spacing.xs,
              },
            ]}
          >
            <Body style={{ fontWeight: 'bold' }}>合計</Body>
            <Body
              color={colors.primary}
              style={{ fontWeight: 'bold' }}
            >
              {totalCleared} / 30
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
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonArea: {
    paddingBottom: 40,
  },
});
