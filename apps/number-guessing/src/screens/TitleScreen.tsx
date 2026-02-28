import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H2, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import type { GameResult } from '../types';

function getModeLabel(mode: string): string {
  switch (mode) {
    case 'classic':
      return 'クラシック';
    case 'hard':
      return 'ハード';
    case 'timeattack':
      return 'タイムアタック';
    default:
      return mode;
  }
}

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [results] = useLocalStorage<GameResult[]>('number_guessing_history', []);

  const totalGames = results.length;

  const classicResults = results.filter((r) => r.mode === 'classic' && r.won);
  const hardResults = results.filter((r) => r.mode === 'hard' && r.won);
  const timeAttackResults = results.filter((r) => r.mode === 'timeattack');

  const bestClassic =
    classicResults.length > 0
      ? Math.min(...classicResults.map((r) => r.guessCount))
      : null;
  const bestHard =
    hardResults.length > 0
      ? Math.min(...hardResults.map((r) => r.guessCount))
      : null;
  const bestTimeAttack =
    timeAttackResults.length > 0
      ? Math.max(...timeAttackResults.map((r) => r.timeAttackScore ?? 0))
      : null;

  const handleStart = () => {
    navigation.navigate('Game');
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <Ionicons
            name="help-circle"
            size={64}
            color={colors.primary}
            style={{ marginBottom: spacing.md }}
          />
          <H1 align="center">数当てゲーム</H1>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center', marginTop: spacing.sm }}
          >
            1~100の数を当てろ！
          </Body>
        </View>

        {totalGames > 0 && (
          <Card style={{ marginBottom: spacing.xl, padding: spacing.lg }}>
            <H2 align="center" style={{ marginBottom: spacing.md }}>
              ベスト記録
            </H2>
            <View style={styles.statsRow}>
              {bestClassic !== null && (
                <View style={styles.statItem}>
                  <Body
                    color={colors.primary}
                    style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'center' }}
                  >
                    {bestClassic}回
                  </Body>
                  <Caption style={{ textAlign: 'center' }}>クラシック</Caption>
                </View>
              )}
              {bestClassic !== null && (bestHard !== null || bestTimeAttack !== null) && (
                <View
                  style={[styles.statDivider, { backgroundColor: colors.border }]}
                />
              )}
              {bestHard !== null && (
                <View style={styles.statItem}>
                  <Body
                    color={colors.primary}
                    style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'center' }}
                  >
                    {bestHard}回
                  </Body>
                  <Caption style={{ textAlign: 'center' }}>ハード</Caption>
                </View>
              )}
              {bestHard !== null && bestTimeAttack !== null && (
                <View
                  style={[styles.statDivider, { backgroundColor: colors.border }]}
                />
              )}
              {bestTimeAttack !== null && (
                <View style={styles.statItem}>
                  <Body
                    color={colors.primary}
                    style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'center' }}
                  >
                    {bestTimeAttack}問
                  </Body>
                  <Caption style={{ textAlign: 'center' }}>タイムアタック</Caption>
                </View>
              )}
            </View>
          </Card>
        )}

        {totalGames === 0 && (
          <Card style={{ marginBottom: spacing.xl, padding: spacing.lg }}>
            <Body
              color={colors.textSecondary}
              style={{ textAlign: 'center' }}
            >
              数字を予想して{'\n'}ヒントを頼りに正解を見つけよう！
            </Body>
          </Card>
        )}

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
    alignItems: 'center',
    marginBottom: 32,
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
