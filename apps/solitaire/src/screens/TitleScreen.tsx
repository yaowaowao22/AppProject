import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, Body, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { GameResult } from '../types';

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [history] = useLocalStorage<GameResult[]>('solitaire_history', []);

  const totalGames = history.length;
  const gamesWon = history.filter((g) => g.won).length;
  const winRate = totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0;

  const bestTime = history
    .filter((g) => g.won)
    .reduce((best, g) => (g.timeSeconds < best ? g.timeSeconds : best), Infinity);

  const bestMoves = history
    .filter((g) => g.won)
    .reduce((best, g) => (g.moves < best ? g.moves : best), Infinity);

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    navigation.navigate('Game');
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <Text style={[styles.suitDecorations, { color: colors.primary }]}>
            {'\u2660 \u2665 \u2666 \u2663'}
          </Text>
          <H1 align="center">{'\u30bd\u30ea\u30c6\u30a3\u30a2'}</H1>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center', marginTop: spacing.sm }}
          >
            {'\u30af\u30e9\u30b7\u30c3\u30af\u30fb\u30af\u30ed\u30f3\u30c0\u30a4\u30af'}
          </Body>
        </View>

        {totalGames > 0 && (
          <Card style={{ marginBottom: spacing.xl }}>
            <Body
              color={colors.textSecondary}
              style={{ textAlign: 'center', marginBottom: spacing.md, fontWeight: '600' }}
            >
              {'\u6210\u7e3e'}
            </Body>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {totalGames}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {'\u30d7\u30ec\u30a4\u6570'}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {gamesWon}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {'\u52dd\u5229\u6570'}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {winRate}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {'\u52dd\u7387'}
                </Text>
              </View>
            </View>
            {gamesWon > 0 && (
              <View style={[styles.statsGrid, { marginTop: spacing.md }]}>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {formatTime(bestTime)}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    {'\u6700\u77ed\u6642\u9593'}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {isFinite(bestMoves) ? bestMoves : '--'}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    {'\u6700\u5c11\u624b\u6570'}
                  </Text>
                </View>
              </View>
            )}
          </Card>
        )}

        <View style={styles.buttonArea}>
          <Button
            title={'\u30b2\u30fc\u30e0\u30b9\u30bf\u30fc\u30c8'}
            onPress={handleStart}
            size="lg"
          />
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
  suitDecorations: {
    fontSize: 32,
    marginBottom: 8,
    letterSpacing: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    minWidth: 60,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  buttonArea: {
    paddingBottom: 40,
  },
});
