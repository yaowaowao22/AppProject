import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H2, H3, Body, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { GridSize } from '../utils/slidePuzzle';
import { formatTime, getGridSizeLabel } from '../utils/slidePuzzle';

const SIZES: GridSize[] = [3, 4, 5];

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [bestTimes] = useLocalStorage<Record<string, number>>(
    'slide-puzzle-best-times',
    {}
  );

  const handleStart = () => {
    navigation.navigate('Game');
  };

  const hasBestTimes = bestTimes && SIZES.some((s) => bestTimes[`${s}x${s}`] !== undefined);

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <View
            style={[
              styles.titleBox,
              {
                backgroundColor: colors.primary,
                borderRadius: spacing.md,
                padding: spacing.xl,
                marginBottom: spacing.lg,
              },
            ]}
          >
            <H1 align="center" style={{ color: '#fff', fontSize: 32 }}>
              スライドパズル
            </H1>
          </View>
          <H3 align="center" style={{ marginBottom: spacing.md }}>
            数字並べ替えパズル
          </H3>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center', marginTop: spacing.sm }}
          >
            数字を順番に並べ替えよう！
          </Body>
        </View>

        {hasBestTimes && (
          <Card
            style={[
              styles.bestTimesCard,
              { padding: spacing.lg, marginBottom: spacing.xl },
            ]}
          >
            <H3
              align="center"
              style={{ marginBottom: spacing.md }}
            >
              ベスト記録
            </H3>
            <View style={styles.bestTimesRow}>
              {SIZES.map((size) => {
                const key = `${size}x${size}`;
                const best = bestTimes?.[key];
                return (
                  <View key={size} style={styles.bestTimeItem}>
                    <Body
                      color={colors.textSecondary}
                      style={{ textAlign: 'center', fontWeight: 'bold' }}
                    >
                      {getGridSizeLabel(size)}
                    </Body>
                    <H2
                      align="center"
                      style={{ color: best !== undefined ? colors.primary : colors.textMuted }}
                    >
                      {best !== undefined ? formatTime(best) : '--:--'}
                    </H2>
                  </View>
                );
              })}
            </View>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBox: {
    minWidth: 200,
    alignItems: 'center',
  },
  bestTimesCard: {
    alignItems: 'center',
  },
  bestTimesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  bestTimeItem: {
    alignItems: 'center',
    gap: 4,
  },
  buttonArea: {
    paddingBottom: 40,
  },
});
