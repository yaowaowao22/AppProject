import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H3, Body, Button, Caption } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import type { GameResult, Difficulty } from '../utils/pipePuzzle';
import { DIFFICULTY_CONFIG } from '../utils/pipePuzzle';
import { levels } from '../data/levels';

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();

  const [results] = useLocalStorage<GameResult[]>('pipe-puzzle-results', []);
  const data = results || [];

  const totalLevels = levels.length;
  const clearedLevelIds = new Set(data.map((r) => r.levelId));
  const clearedCount = clearedLevelIds.size;

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  const handleStart = () => {
    navigation.navigate('Game');
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <H1 align="center">配管パズル</H1>
          <H3
            style={{
              textAlign: 'center',
              marginTop: spacing.sm,
              color: colors.textSecondary,
            }}
          >
            パイプをつなげ！
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
              クリア状況
            </Body>
            {difficulties.map((diff) => {
              const diffLevels = levels.filter((l) => l.difficulty === diff);
              const diffCleared = diffLevels.filter((l) =>
                clearedLevelIds.has(l.id)
              ).length;
              const config = DIFFICULTY_CONFIG[diff];
              return (
                <View
                  key={diff}
                  style={[styles.statRow, { marginBottom: spacing.xs }]}
                >
                  <Body style={{ fontWeight: 'bold', color: colors.text }}>
                    {config.label}
                  </Body>
                  <View style={styles.statValue}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={14}
                      color={
                        diffCleared === diffLevels.length
                          ? colors.primary
                          : colors.textMuted
                      }
                      style={{ marginRight: 4 }}
                    />
                    <Body
                      style={{
                        fontWeight: 'bold',
                        color:
                          diffCleared === diffLevels.length
                            ? colors.primary
                            : colors.text,
                      }}
                    >
                      {diffCleared}/{diffLevels.length}
                    </Body>
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
              全 {clearedCount}/{totalLevels} レベルクリア
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
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonArea: {
    paddingBottom: 40,
  },
});
