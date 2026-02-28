import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H2, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';

interface QuizResult {
  id: string;
  date: string;
  period: string;
  correct: number;
  total: number;
  percentage: number;
}

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [history, , loading] = useLocalStorage<QuizResult[]>('quiz-history', []);

  const handleStart = () => {
    navigation.navigate('Game');
  };

  const totalQuizzes = history.length;
  const totalCorrect = history.reduce((sum, r) => sum + r.correct, 0);
  const totalQuestions = history.reduce((sum, r) => sum + r.total, 0);
  const overallAccuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const bestScore =
    history.length > 0 ? Math.max(...history.map((r) => r.percentage)) : 0;

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <Ionicons name="globe-outline" size={64} color={colors.primary} />
          <H1 align="center" style={{ marginTop: spacing.lg }}>
            世界史クイズ
          </H1>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center', marginTop: spacing.sm, fontSize: 16 }}
          >
            世界の歴史マスター
          </Body>
        </View>

        {!loading && totalQuizzes > 0 && (
          <Card style={[styles.statsCard, { padding: spacing.lg, marginBottom: spacing.xl }]}>
            <Body style={{ fontWeight: '600', marginBottom: spacing.md }}>
              学習の記録
            </Body>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <H2 style={{ color: colors.primary }}>{totalQuizzes}</H2>
                <Caption color={colors.textMuted}>挑戦回数</Caption>
              </View>
              <View style={styles.statItem}>
                <H2 style={{ color: colors.success }}>{overallAccuracy}%</H2>
                <Caption color={colors.textMuted}>正答率</Caption>
              </View>
              <View style={styles.statItem}>
                <H2 style={{ color: colors.secondary }}>{bestScore}%</H2>
                <Caption color={colors.textMuted}>最高得点</Caption>
              </View>
            </View>
          </Card>
        )}

        {!loading && totalQuizzes === 0 && (
          <Card style={[styles.statsCard, { padding: spacing.lg, marginBottom: spacing.xl }]}>
            <Body
              color={colors.textSecondary}
              style={{ textAlign: 'center' }}
            >
              古代文明から現代まで、世界の歴史を4択クイズで学びましょう。
              {'\n'}時代を選んで挑戦できます。
            </Body>
          </Card>
        )}

        <View style={styles.buttonArea}>
          <Button title="クイズに挑戦する" onPress={handleStart} size="lg" />
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
