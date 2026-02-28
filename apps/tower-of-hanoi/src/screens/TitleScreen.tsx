import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H3, Body, Button, Card, Caption } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import {
  getOptimalMoves,
  formatTime,
  DISK_COUNTS,
} from '../utils/hanoi';
import type { GameResult } from './GameScreen';

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [history] = useLocalStorage<GameResult[]>('hanoi_history', []);

  const handleStart = () => {
    navigation.navigate('Game');
  };

  const results = history ?? [];

  const getBestMoves = (diskCount: number): number | null => {
    const matching = results.filter((r) => r.diskCount === diskCount);
    if (matching.length === 0) return null;
    return Math.min(...matching.map((r) => r.moves));
  };

  const getBestTime = (diskCount: number): number | null => {
    const matching = results.filter((r) => r.diskCount === diskCount);
    if (matching.length === 0) return null;
    return Math.min(...matching.map((r) => r.timeSeconds));
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <H1 align="center">ハノイの塔</H1>
          <H3
            style={{
              textAlign: 'center',
              marginTop: spacing.sm,
              color: colors.textSecondary,
            }}
          >
            円盤移動パズル
          </H3>
        </View>

        <Card style={{ padding: spacing.lg, marginBottom: spacing.xl }}>
          <H3 align="center" style={{ marginBottom: spacing.md }}>
            ベスト記録
          </H3>
          {DISK_COUNTS.map((count) => {
            const bestMoves = getBestMoves(count);
            const bestTime = getBestTime(count);
            const optimal = getOptimalMoves(count);
            const isOptimal = bestMoves === optimal;

            return (
              <View
                key={count}
                style={[styles.bestRow, { paddingVertical: spacing.xs }]}
              >
                <Body>{count}枚</Body>
                <View style={styles.bestValues}>
                  {bestMoves !== null ? (
                    <>
                      <Body
                        color={isOptimal ? colors.primary : colors.text}
                        style={{ fontWeight: isOptimal ? 'bold' : 'normal' }}
                      >
                        {bestMoves}手
                      </Body>
                      <Caption style={{ color: colors.textMuted, marginLeft: 8 }}>
                        {formatTime(bestTime!)}
                      </Caption>
                    </>
                  ) : (
                    <Body color={colors.textMuted}>---</Body>
                  )}
                </View>
              </View>
            );
          })}
          <Caption
            style={{
              textAlign: 'center',
              marginTop: spacing.sm,
              color: colors.textMuted,
            }}
          >
            最少手数で解くと色が変わります
          </Caption>
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
  bestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bestValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonArea: {
    paddingBottom: 40,
  },
});
