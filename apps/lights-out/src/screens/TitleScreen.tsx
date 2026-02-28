import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H3, Body, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import type { Difficulty, GameResult } from '../types';
import { DIFFICULTY_CONFIG } from '../utils/lightsOut';
import { getLevelsByDifficulty } from '../data/levels';

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [history] = useLocalStorage<GameResult[]>('lightsout_history', []);

  const handleStart = () => {
    navigation.navigate('Game');
  };

  const completedIds = (history ?? []).map((r) => r.levelId);
  const uniqueCompletedIds = [...new Set(completedIds)];

  const getClearedCount = (d: Difficulty): { cleared: number; total: number } => {
    const levels = getLevelsByDifficulty(d);
    const cleared = levels.filter((l) => uniqueCompletedIds.includes(l.id)).length;
    return { cleared, total: levels.length };
  };

  const totalCleared = uniqueCompletedIds.length;

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <Ionicons name="bulb" size={64} color={colors.primary} />
          <H1 align="center" style={{ marginTop: spacing.md }}>
            ライツアウト
          </H1>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center', marginTop: spacing.sm }}
          >
            全てのライトを消せ
          </Body>
        </View>

        <Card style={{ padding: spacing.lg, marginBottom: spacing.xl }}>
          <H3 align="center" style={{ marginBottom: spacing.md }}>
            クリア状況
          </H3>
          {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => {
            const { cleared, total } = getClearedCount(d);
            return (
              <View
                key={d}
                style={[styles.progressRow, { paddingVertical: spacing.xs }]}
              >
                <Body>{DIFFICULTY_CONFIG[d].label}</Body>
                <Body color={cleared === total && total > 0 ? colors.primary : colors.textSecondary}>
                  {cleared}/{total}
                </Body>
              </View>
            );
          })}
          <View
            style={[
              styles.progressRow,
              {
                paddingVertical: spacing.xs,
                marginTop: spacing.sm,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              },
            ]}
          >
            <Body style={{ fontWeight: 'bold' }}>合計</Body>
            <Body style={{ fontWeight: 'bold' }} color={colors.primary}>
              {totalCleared} レベルクリア
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
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonArea: {
    paddingBottom: 40,
  },
});
