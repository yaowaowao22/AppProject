import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H3, Body, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { Difficulty, GameResult } from '../types';
import { DIFFICULTY_CONFIG } from '../utils/minesweeper';

function formatTime(s: number): string {
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [history] = useLocalStorage<GameResult[]>('minesweeper_history', []);

  const handleStart = () => {
    navigation.navigate('Game');
  };

  const getBestTime = (diff: Difficulty): number | null => {
    const results = (history ?? []).filter((r) => r.difficulty === diff && r.won);
    if (results.length === 0) return null;
    return Math.min(...results.map((r) => r.timeSeconds));
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <H1 align="center">{'マインスイーパー'}</H1>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center', marginTop: spacing.md }}
          >
            {'地雷除去パズル'}
          </Body>
        </View>

        <Card style={{ padding: spacing.lg, marginBottom: spacing.xl }}>
          <H3 align="center" style={{ marginBottom: spacing.md }}>
            {'ベストタイム'}
          </H3>
          {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((diff) => {
            const best = getBestTime(diff);
            return (
              <View
                key={diff}
                style={[styles.bestTimeRow, { paddingVertical: spacing.xs }]}
              >
                <Body>{DIFFICULTY_CONFIG[diff].label}</Body>
                <Body color={best !== null ? colors.primary : colors.textMuted}>
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
  bestTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonArea: {
    paddingBottom: 40,
  },
});
