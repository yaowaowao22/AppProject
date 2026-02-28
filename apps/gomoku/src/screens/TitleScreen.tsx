import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H3, Body, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { GameResult } from '../types';

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [history] = useLocalStorage<GameResult[]>('gomoku_history', []);

  const handleStart = () => {
    navigation.navigate('Game');
  };

  const stats = React.useMemo(() => {
    if (!history || history.length === 0) {
      return { wins: 0, losses: 0, draws: 0, total: 0 };
    }
    const wins = history.filter((r) => r.won).length;
    const draws = history.filter((r) => r.draw).length;
    const losses = history.length - wins - draws;
    return { wins, losses, draws, total: history.length };
  }, [history]);

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <H1
            align="center"
            style={{ fontSize: 56, marginBottom: spacing.sm }}
          >
            五目並べ
          </H1>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center' }}
          >
            五目並べ対戦
          </Body>
        </View>

        <Card style={[styles.statsCard, { padding: spacing.lg, marginBottom: spacing.xl }]}>
          <H3 align="center" style={{ marginBottom: spacing.md }}>
            戦績
          </H3>
          <View style={[styles.statsRow, { marginBottom: spacing.xs }]}>
            <Body>勝利</Body>
            <Body
              color={stats.wins > 0 ? colors.primary : colors.textMuted}
              style={{ fontWeight: stats.wins > 0 ? '600' : '400' }}
            >
              {stats.wins}
            </Body>
          </View>
          <View style={[styles.statsRow, { marginBottom: spacing.xs }]}>
            <Body>敗北</Body>
            <Body
              color={stats.losses > 0 ? colors.primary : colors.textMuted}
              style={{ fontWeight: stats.losses > 0 ? '600' : '400' }}
            >
              {stats.losses}
            </Body>
          </View>
          <View style={[styles.statsRow, { marginBottom: spacing.xs }]}>
            <Body>引き分け</Body>
            <Body
              color={stats.draws > 0 ? colors.primary : colors.textMuted}
              style={{ fontWeight: stats.draws > 0 ? '600' : '400' }}
            >
              {stats.draws}
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
