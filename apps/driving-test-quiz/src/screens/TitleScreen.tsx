import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H2, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import type { TestResult } from '../types';

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [history, , loading] = useLocalStorage<TestResult[]>('quiz-history', []);

  const handleStart = () => {
    navigation.navigate('Game');
  };

  const totalTests = history.length;
  const passedTests = history.filter((r) => r.passed).length;
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  const totalCorrect = history.reduce((sum, r) => sum + r.correct, 0);
  const totalQuestions = history.reduce((sum, r) => sum + r.total, 0);
  const overallAccuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <Ionicons name="car-sport" size={64} color={colors.primary} />
          <H1 align="center" style={{ marginTop: spacing.lg }}>
            運転免許
          </H1>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center', marginTop: spacing.sm, fontSize: 16 }}
          >
            学科試験対策
          </Body>
        </View>

        {!loading && totalTests > 0 && (
          <Card style={[styles.statsCard, { padding: spacing.lg, marginBottom: spacing.xl }]}>
            <Body
              style={{ fontWeight: '600', marginBottom: spacing.md }}
            >
              学習の記録
            </Body>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <H2 style={{ color: colors.primary }}>{totalTests}</H2>
                <Caption color={colors.textMuted}>受験回数</Caption>
              </View>
              <View style={styles.statItem}>
                <H2 style={{ color: colors.success }}>{passRate}%</H2>
                <Caption color={colors.textMuted}>合格率</Caption>
              </View>
              <View style={styles.statItem}>
                <H2 style={{ color: colors.secondary }}>{overallAccuracy}%</H2>
                <Caption color={colors.textMuted}>正答率</Caption>
              </View>
            </View>
          </Card>
        )}

        {!loading && totalTests === 0 && (
          <Card style={[styles.statsCard, { padding: spacing.lg, marginBottom: spacing.xl }]}>
            <Body
              color={colors.textSecondary}
              style={{ textAlign: 'center' }}
            >
              ○×形式の問題で学科試験の練習ができます。
              {'\n'}90%以上の正答率で合格です。
            </Body>
          </Card>
        )}

        <View style={styles.buttonArea}>
          <Button title="試験を始める" onPress={handleStart} size="lg" />
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
  statsCard: {},
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  buttonArea: {
    paddingBottom: 40,
  },
});
