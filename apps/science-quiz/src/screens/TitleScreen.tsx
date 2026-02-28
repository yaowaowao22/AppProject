import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H2, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import type { Subject } from '../data/questions';

export interface QuizResult {
  id: string;
  date: string;
  subject: string;
  correct: number;
  total: number;
}

const SUBJECT_OPTIONS: { label: string; value: Subject | 'all' }[] = [
  { label: '全科目', value: 'all' },
  { label: '物理', value: '物理' },
  { label: '化学', value: '化学' },
  { label: '生物', value: '生物' },
  { label: '地学', value: '地学' },
];

const COUNT_OPTIONS = [10, 15, 20];

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [results] = useLocalStorage<QuizResult[]>('science_quiz_results', []);

  const [selectedSubject, setSelectedSubject] = useState<Subject | 'all'>('all');
  const [questionCount, setQuestionCount] = useState(10);

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
    navigation.navigate('Game', {
      subject: selectedSubject,
      count: questionCount,
    });
  };

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }}
      >
        <View style={styles.titleArea}>
          <Ionicons
            name="flask"
            size={64}
            color={colors.primary}
            style={{ marginBottom: spacing.md }}
          />
          <H1 align="center">理科クイズ</H1>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center', marginTop: spacing.sm }}
          >
            科学の知識テスト
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
              物理・化学・生物・地学の{'\n'}科学知識をクイズで挑戦しましょう
            </Body>
          </Card>
        )}

        <Body style={{ marginBottom: spacing.sm, fontWeight: 'bold' }}>
          科目を選択
        </Body>
        <View
          style={[
            styles.optionRow,
            { flexWrap: 'wrap', marginBottom: spacing.lg },
          ]}
        >
          {SUBJECT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setSelectedSubject(opt.value)}
              style={[
                styles.optionChip,
                {
                  backgroundColor:
                    selectedSubject === opt.value ? colors.primary : colors.surface,
                  borderColor:
                    selectedSubject === opt.value ? colors.primary : colors.border,
                },
              ]}
            >
              <Body
                color={selectedSubject === opt.value ? '#FFFFFF' : colors.text}
                style={{
                  fontWeight: selectedSubject === opt.value ? 'bold' : 'normal',
                }}
              >
                {opt.label}
              </Body>
            </Pressable>
          ))}
        </View>

        <Body style={{ marginBottom: spacing.sm, fontWeight: 'bold' }}>
          問題数
        </Body>
        <View style={[styles.optionRow, { marginBottom: spacing.xxl }]}>
          {COUNT_OPTIONS.map((count) => (
            <Pressable
              key={count}
              onPress={() => setQuestionCount(count)}
              style={[
                styles.optionChip,
                {
                  backgroundColor:
                    questionCount === count ? colors.primary : colors.surface,
                  borderColor:
                    questionCount === count ? colors.primary : colors.border,
                },
              ]}
            >
              <Body
                color={questionCount === count ? '#FFFFFF' : colors.text}
                style={{
                  fontWeight: questionCount === count ? 'bold' : 'normal',
                }}
              >
                {count}問
              </Body>
            </Pressable>
          ))}
        </View>

        <View style={styles.buttonArea}>
          <Button title="クイズをはじめる" onPress={handleStart} size="lg" />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  buttonArea: {
    paddingBottom: 40,
  },
});
