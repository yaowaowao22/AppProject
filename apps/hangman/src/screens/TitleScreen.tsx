import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H2, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import type { GameResult } from './GameScreen';

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [results] = useLocalStorage<GameResult[]>('hangman_results', []);

  const totalGames = results.length;
  const totalWins = results.filter((r) => r.won).length;
  const winRate =
    totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  const handleStart = () => {
    navigation.navigate('Game');
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <Ionicons
            name="text"
            size={64}
            color={colors.primary}
            style={{ marginBottom: spacing.md }}
          />
          <H1 align="center">ハングマン</H1>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center', marginTop: spacing.sm }}
          >
            カタカナ単語推理ゲーム
          </Body>
        </View>

        {totalGames > 0 && (
          <Card style={{ marginBottom: spacing.xl, padding: spacing.lg }}>
            <H2 align="center" style={{ marginBottom: spacing.md }}>
              プレイ記録
            </H2>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Body
                  color={colors.primary}
                  style={{
                    fontSize: 28,
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  {totalGames}
                </Body>
                <Caption style={{ textAlign: 'center' }}>回プレイ</Caption>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />
              <View style={styles.statItem}>
                <Body
                  color={colors.primary}
                  style={{
                    fontSize: 28,
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  {totalWins}
                </Body>
                <Caption style={{ textAlign: 'center' }}>回正解</Caption>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />
              <View style={styles.statItem}>
                <Body
                  color={colors.primary}
                  style={{
                    fontSize: 28,
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  {winRate}%
                </Body>
                <Caption style={{ textAlign: 'center' }}>勝率</Caption>
              </View>
            </View>
          </Card>
        )}

        {totalGames === 0 && (
          <Card style={{ marginBottom: spacing.xl, padding: spacing.lg }}>
            <Body
              color={colors.textSecondary}
              style={{ textAlign: 'center' }}
            >
              カタカナの単語を一文字ずつ推理しよう{'\n'}
              7回ミスする前に単語を当てよう
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
