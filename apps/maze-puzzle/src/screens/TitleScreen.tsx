import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H3, Body, Button, Caption } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import {
  MazeResult,
  Difficulty,
  DIFFICULTY_CONFIG,
  formatTime,
} from '../utils/mazeGenerator';

function getBestTime(
  results: MazeResult[],
  difficulty: Difficulty
): number | null {
  const filtered = results.filter((r) => r.difficulty === difficulty);
  if (filtered.length === 0) return null;
  return Math.min(...filtered.map((r) => r.timeSeconds));
}

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();

  const [results] = useLocalStorage<MazeResult[]>('maze-results', []);
  const data = results || [];

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  const handleStart = () => {
    navigation.navigate('Game');
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <H1 align="center">迷路</H1>
          <H3
            style={{
              textAlign: 'center',
              marginTop: spacing.sm,
              color: colors.textSecondary,
            }}
          >
            迷路パズル
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
            <Body
              color={colors.textSecondary}
              style={{ textAlign: 'center', marginBottom: spacing.md }}
            >
              ベストタイム
            </Body>
            {difficulties.map((diff) => {
              const best = getBestTime(data, diff);
              const config = DIFFICULTY_CONFIG[diff];
              return (
                <View
                  key={diff}
                  style={[styles.bestTimeRow, { marginBottom: spacing.xs }]}
                >
                  <Body style={{ fontWeight: 'bold', color: colors.text }}>
                    {config.label}
                  </Body>
                  <View style={styles.bestTimeValue}>
                    {best !== null ? (
                      <>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color={colors.primary}
                          style={{ marginRight: 4 }}
                        />
                        <Body
                          style={{
                            fontWeight: 'bold',
                            color: colors.primary,
                          }}
                        >
                          {formatTime(best)}
                        </Body>
                      </>
                    ) : (
                      <Caption style={{ color: colors.textMuted }}>
                        ---
                      </Caption>
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
              クリア回数: {data.length}回
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
    width: '100%',
    maxWidth: 280,
  },
  bestTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bestTimeValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonArea: {
    paddingBottom: 40,
  },
});
