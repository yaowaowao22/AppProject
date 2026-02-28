import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H3, Body, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { Difficulty, GameResult } from '../types';
import { DIFFICULTY_CONFIG } from '../utils/colorPuzzle';

function getStarsText(stars: number): string {
  if (stars === 3) return '★★★';
  if (stars === 2) return '★★☆';
  return '★☆☆';
}

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [history] = useLocalStorage<GameResult[]>('color_puzzle_history', []);

  const handleStart = () => {
    navigation.navigate('Game');
  };

  const results = history ?? [];

  const getStats = (diff: Difficulty) => {
    const filtered = results.filter((r) => r.difficulty === diff);
    if (filtered.length === 0) return null;
    const bestMoves = Math.min(...filtered.map((r) => r.moves));
    const bestStars = Math.max(...filtered.map((r) => r.stars));
    return { bestMoves, bestStars, gamesPlayed: filtered.length };
  };

  const totalGames = results.length;
  const averageStars =
    totalGames > 0
      ? (results.reduce((sum, r) => sum + r.stars, 0) / totalGames).toFixed(1)
      : '---';

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <H1 align="center">{'カラーパズル'}</H1>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center', marginTop: spacing.md }}
          >
            {'色塗りパズル'}
          </Body>
        </View>

        <Card style={{ padding: spacing.lg, marginBottom: spacing.xl }}>
          <H3 align="center" style={{ marginBottom: spacing.md }}>
            {'ベスト記録'}
          </H3>
          {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((diff) => {
            const stats = getStats(diff);
            return (
              <View
                key={diff}
                style={[styles.statsRow, { paddingVertical: spacing.xs }]}
              >
                <Body>{DIFFICULTY_CONFIG[diff].label}</Body>
                <Body color={stats ? colors.primary : colors.textMuted}>
                  {stats
                    ? `${stats.bestMoves}手 ${getStarsText(stats.bestStars)}`
                    : '---'}
                </Body>
              </View>
            );
          })}
          <View
            style={[
              styles.statsRow,
              {
                paddingVertical: spacing.xs,
                marginTop: spacing.sm,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              },
            ]}
          >
            <Body color={colors.textSecondary}>プレイ回数</Body>
            <Body color={colors.textSecondary}>{totalGames}回</Body>
          </View>
          <View style={[styles.statsRow, { paddingVertical: spacing.xs }]}>
            <Body color={colors.textSecondary}>平均スター</Body>
            <Body color={colors.textSecondary}>{averageStars}</Body>
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonArea: {
    paddingBottom: 40,
  },
});
