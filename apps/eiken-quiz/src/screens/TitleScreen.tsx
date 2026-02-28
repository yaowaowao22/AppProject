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
  const [results] = useLocalStorage<QuizResult[]>('eiken_results', []);

  const totalQuizzes = results.length;
  const averageScore =
    totalQuizzes > 0
      ? Math.round(
          results.reduce((sum, r) => sum + (r.correct / r.total) * 100, 0) /
            totalQuizzes
        )
      : 0;
  const totalCorrect = results.reduce((sum, r) => sum + r.correct, 0);
  const totalQuestions = results.reduce((sum, r) => sum + r.total, 0);

  const handleStart = () => {
    navigation.navigate('Game');
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <Ionicons
            name="school"
            size={64}
            color={colors.primary}
            style={{ marginBottom: spacing.md }}
          />
          <H1 align="center">英検対策</H1>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center', marginTop: spacing.sm }}
          >
            級別英語テスト
          </Body>
        </View>

        {totalQuizzes > 0 && (
          <Card style={{ marginBottom: spacing.xl, padding: spacing.lg }}>
            <H2 align="center" style={{ marginBottom: spacing.md }}>
              学習記録
            </H2>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Body
                  color={colors.primary}
                  style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'center' }}
                >
                  {totalQuizzes}
                </Body>
                <Caption style={{ textAlign: 'center' }}>回受験</Caption>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />
              <View style={styles.statItem}>
                <Body
                  color={colors.primary}
                  style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'center' }}
                >
                  {averageScore}%
                </Body>
                <Caption style={{ textAlign: 'center' }}>平均正答率</Caption>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />
              <View style={styles.statItem}>
                <Body
                  color={colors.primary}
                  style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'center' }}
                >
                  {totalCorrect}/{totalQuestions}
                </Body>
                <Caption style={{ textAlign: 'center' }}>正解数</Caption>
              </View>
            </View>
          </Card>
        )}

        {totalQuizzes === 0 && (
          <Card style={{ marginBottom: spacing.xl, padding: spacing.lg }}>
            <Body
              color={colors.textSecondary}
              style={{ textAlign: 'center' }}
            >
              英検の語彙・文法・会話問題を{'\n'}クイズ形式で対策しましょう
            </Body>
          </Card>
        )}

        <View style={styles.buttonArea}>
          <Button title="クイズをはじめる" onPress={handleStart} size="lg" />
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
