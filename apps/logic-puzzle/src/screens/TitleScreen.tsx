import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H3, Body, Button, Caption } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { PuzzleResult } from '../types';
import { ALL_PUZZLES } from '../data/puzzles';

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();

  const [results] = useLocalStorage<PuzzleResult[]>('logic-puzzle-results', []);

  const completedPuzzleIds = new Set((results || []).map((r) => r.puzzleId));
  const completedCount = completedPuzzleIds.size;
  const totalCount = ALL_PUZZLES.length;

  const handleStart = () => {
    navigation.navigate('Game');
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <H1 align="center">ロジックパズル</H1>
          <H3
            style={{
              textAlign: 'center',
              marginTop: spacing.sm,
              color: colors.textSecondary,
            }}
          >
            論理パズルに挑戦
          </H3>
          <View
            style={[
              styles.statsContainer,
              {
                marginTop: spacing.xl,
                backgroundColor: colors.surface,
                padding: spacing.lg,
                borderRadius: 12,
              },
            ]}
          >
            <Body color={colors.textSecondary} style={{ textAlign: 'center' }}>
              クリア済み
            </Body>
            <Body
              style={{
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: 28,
                marginTop: spacing.xs,
                color: colors.primary,
              }}
            >
              {completedCount} / {totalCount}
            </Body>
            <Caption
              style={{
                textAlign: 'center',
                marginTop: spacing.xs,
                color: colors.textMuted,
              }}
            >
              パズル
            </Caption>
          </View>
        </View>

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
  statsContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 240,
  },
  buttonArea: {
    paddingBottom: 40,
  },
});
