import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H2, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import type { QuizResult } from '../types';

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [history, , loading] = useLocalStorage<QuizResult[]>('spi-quiz-history', []);

  const handleStart = () => {
    navigation.navigate('Game');
  };

  const totalTests = history.length;
  const totalCorrect = history.reduce((sum, r) => sum + r.correct, 0);
  const totalQuestions = history.reduce((sum, r) => sum + r.total, 0);
  const overallAccuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const bestAccuracy =
    history.length > 0 ? Math.max(...history.map((r) => r.accuracy)) : 0;

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <Ionicons name="school" size={64} color={colors.primary} />
          <H1 align="center" style={{ marginTop: spacing.lg }}>
            SPI対策クイズ
          </H1>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center', marginTop: spacing.sm, fontSize: 16 }}
          >
            就活SPI試験の練習問題
          </Body>
        </View>

        {!loading && totalTests > 0 && (
          <Card style={[styles.statsCard, { padding: spacing.lg, marginBottom: spacing.xl }]}>
            <Body style={{ fontWeight: '600', marginBottom: spacing.md }}>
              学習の記録
            </Body>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <H2 style={{ color: colors.primary }}>{totalTests}</H2>
                <Caption color={colors.textMuted}>受験回数</Caption>
              </View>
              <View style={styles.statItem}>
                <H2 style={{ color: colors.success }}>{overallAccuracy}%</H2>
                <Caption color={colors.textMuted}>平均正答率</Caption>
              </View>
              <View style={styles.statItem}>
                <H2 style={{ color: colors.secondary }}>{bestAccuracy}%</H2>
                <Caption color={colors.textMuted}>最高正答率</Caption>
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
              言語・非言語・総合から出題モードを選択できます。
              {'\n'}4択形式で解説付きの練習問題に挑戦しましょう。
            </Body>
          </Card>
        )}

        <View style={styles.buttonArea}>
          <Button title="クイズを始める" onPress={handleStart} size="lg" />
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
