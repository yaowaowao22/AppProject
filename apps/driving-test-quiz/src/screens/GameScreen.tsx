import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import {
  CATEGORIES,
  QUESTION_COUNTS,
  PASS_THRESHOLD,
  getQuestionsByCategory,
  shuffleQuestions,
} from '../data/questions';
import type { Question, TestResult } from '../types';

type GamePhase = 'setup' | 'playing' | 'feedback' | 'result';

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();

  const [history, setHistory] = useLocalStorage<TestResult[]>('quiz-history', []);

  const [phase, setPhase] = useState<GamePhase>('setup');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCount, setSelectedCount] = useState(10);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [userAnswer, setUserAnswer] = useState<boolean | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const startQuiz = useCallback(() => {
    const available = getQuestionsByCategory(selectedCategory);
    const count = Math.min(selectedCount, available.length);
    const selected = shuffleQuestions(available, count);
    setCurrentQuestions(selected);
    setCurrentIndex(0);
    setCorrectCount(0);
    setUserAnswer(null);
    setAnswers([]);
    setPhase('playing');
  }, [selectedCategory, selectedCount]);

  const handleAnswer = useCallback(
    (answer: boolean) => {
      if (phase !== 'playing') return;
      const question = currentQuestions[currentIndex];
      const isCorrectAnswer = answer === question.isCorrect;
      setUserAnswer(answer);
      setAnswers((prev) => [...prev, isCorrectAnswer]);
      if (isCorrectAnswer) {
        setCorrectCount((prev) => prev + 1);
      }
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setPhase('feedback');
    },
    [phase, currentQuestions, currentIndex, fadeAnim],
  );

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= currentQuestions.length) {
      const total = currentQuestions.length;
      const passed = correctCount / total >= PASS_THRESHOLD;
      const categoryLabel =
        CATEGORIES.find((c) => c.key === selectedCategory)?.label ?? selectedCategory;
      const result: TestResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        category: categoryLabel,
        correct: correctCount,
        total,
        passed,
      };
      setHistory([result, ...history]);
      trackAction();
      setPhase('result');
    } else {
      setCurrentIndex(nextIndex);
      setUserAnswer(null);
      setPhase('playing');
    }
  }, [
    currentIndex,
    currentQuestions,
    correctCount,
    selectedCategory,
    history,
    setHistory,
    trackAction,
  ]);

  const resetQuiz = useCallback(() => {
    setPhase('setup');
    setCurrentQuestions([]);
    setCurrentIndex(0);
    setCorrectCount(0);
    setUserAnswer(null);
    setAnswers([]);
  }, []);

  const currentQuestion = currentQuestions[currentIndex];
  const progress =
    currentQuestions.length > 0 ? (currentIndex + 1) / currentQuestions.length : 0;
  const isCorrectAnswer =
    userAnswer !== null && currentQuestion
      ? userAnswer === currentQuestion.isCorrect
      : false;

  if (phase === 'setup') {
    return (
      <ScreenWrapper>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.setupContainer, { padding: spacing.xl }]}
        >
          <H2 style={{ marginBottom: spacing.xl }}>試験設定</H2>

          <Body
            style={{ marginBottom: spacing.sm, fontWeight: '600' }}
          >
            カテゴリ
          </Body>
          <View style={[styles.optionGrid, { marginBottom: spacing.xl }]}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => setSelectedCategory(cat.key)}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.lg,
                      borderRadius: spacing.sm,
                      marginRight: spacing.sm,
                      marginBottom: spacing.sm,
                    },
                  ]}
                >
                  <Body
                    color={isSelected ? '#FFFFFF' : colors.text}
                    style={{ fontSize: 14 }}
                  >
                    {cat.label}
                  </Body>
                </Pressable>
              );
            })}
          </View>

          <Body
            style={{ marginBottom: spacing.sm, fontWeight: '600' }}
          >
            問題数
          </Body>
          <View style={[styles.optionGrid, { marginBottom: spacing.xxl }]}>
            {QUESTION_COUNTS.map((qc) => {
              const isSelected = selectedCount === qc.value;
              const available = getQuestionsByCategory(selectedCategory).length;
              const disabled = qc.value > available;
              return (
                <Pressable
                  key={qc.value}
                  onPress={() => !disabled && setSelectedCount(qc.value)}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: disabled
                        ? colors.surface
                        : isSelected
                          ? colors.primary
                          : colors.surface,
                      borderColor: disabled
                        ? colors.border
                        : isSelected
                          ? colors.primary
                          : colors.border,
                      opacity: disabled ? 0.4 : 1,
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.xl,
                      borderRadius: spacing.sm,
                      marginRight: spacing.sm,
                      marginBottom: spacing.sm,
                    },
                  ]}
                >
                  <Body
                    color={isSelected && !disabled ? '#FFFFFF' : colors.text}
                    style={{ fontSize: 14 }}
                  >
                    {qc.label}
                  </Body>
                </Pressable>
              );
            })}
          </View>

          <Caption color={colors.textMuted} style={{ marginBottom: spacing.lg, textAlign: 'center' }}>
            {selectedCategory === 'all' ? '全' : CATEGORIES.find((c) => c.key === selectedCategory)?.label}
            カテゴリから{Math.min(selectedCount, getQuestionsByCategory(selectedCategory).length)}問出題されます
          </Caption>

          <Button title="試験開始" onPress={startQuiz} size="lg" />
        </ScrollView>
      </ScreenWrapper>
    );
  }

  if (phase === 'result') {
    const total = currentQuestions.length;
    const percentage = Math.round((correctCount / total) * 100);
    const passed = correctCount / total >= PASS_THRESHOLD;

    return (
      <ScreenWrapper>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.resultContainer, { padding: spacing.xl }]}
        >
          <View style={[styles.resultHeader, { marginBottom: spacing.xl }]}>
            <Ionicons
              name={passed ? 'checkmark-circle' : 'close-circle'}
              size={80}
              color={passed ? colors.success : colors.error}
            />
            <H1
              style={{ marginTop: spacing.lg }}
              align="center"
            >
              {passed ? '合格' : '不合格'}
            </H1>
            <Caption
              color={colors.textSecondary}
              style={{ marginTop: spacing.sm, textAlign: 'center' }}
            >
              {passed ? 'おめでとうございます！' : '90%以上で合格です。もう一度挑戦しましょう。'}
            </Caption>
          </View>

          <Card style={[styles.scoreCard, { padding: spacing.xl, marginBottom: spacing.xl }]}>
            <View style={styles.scoreRow}>
              <Body color={colors.textSecondary}>正解数</Body>
              <H2>{correctCount} / {total}</H2>
            </View>
            <View
              style={[
                styles.scoreDivider,
                { backgroundColor: colors.border, marginVertical: spacing.md },
              ]}
            />
            <View style={styles.scoreRow}>
              <Body color={colors.textSecondary}>正答率</Body>
              <H2 style={{ color: passed ? colors.success : colors.error }}>
                {percentage}%
              </H2>
            </View>
            <View
              style={[
                styles.scoreDivider,
                { backgroundColor: colors.border, marginVertical: spacing.md },
              ]}
            />
            <View style={styles.scoreRow}>
              <Body color={colors.textSecondary}>合格基準</Body>
              <Body>90%以上</Body>
            </View>
          </Card>

          <H3 style={{ marginBottom: spacing.md }}>解答一覧</H3>
          {currentQuestions.map((q, idx) => {
            const wasCorrect = answers[idx];
            return (
              <View
                key={q.id}
                style={[
                  styles.answerReview,
                  {
                    backgroundColor: colors.surface,
                    borderLeftColor: wasCorrect ? colors.success : colors.error,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                    borderRadius: spacing.xs,
                  },
                ]}
              >
                <View style={styles.answerReviewHeader}>
                  <Caption color={colors.textMuted}>問{idx + 1}</Caption>
                  <Ionicons
                    name={wasCorrect ? 'checkmark-circle' : 'close-circle'}
                    size={18}
                    color={wasCorrect ? colors.success : colors.error}
                  />
                </View>
                <Body style={{ fontSize: 13, marginTop: spacing.xs }}>{q.text}</Body>
                <Caption
                  color={colors.textSecondary}
                  style={{ marginTop: spacing.xs }}
                >
                  正解: {q.isCorrect ? '○' : '×'} - {q.explanation}
                </Caption>
              </View>
            );
          })}

          <View style={{ marginTop: spacing.xl, gap: spacing.sm, paddingBottom: spacing.xxl }}>
            <Button title="もう一度挑戦" onPress={startQuiz} size="lg" />
            <Button title="設定に戻る" onPress={resetQuiz} variant="outline" size="lg" />
          </View>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        {/* Progress bar */}
        <View style={{ marginBottom: spacing.md }}>
          <View style={styles.progressHeader}>
            <Caption color={colors.textSecondary}>
              問題 {currentIndex + 1} / {currentQuestions.length}
            </Caption>
            <Caption color={colors.textSecondary}>
              正解: {correctCount}
            </Caption>
          </View>
          <View
            style={[
              styles.progressBarBg,
              {
                backgroundColor: colors.surface,
                borderRadius: spacing.xs,
                marginTop: spacing.sm,
              },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.primary,
                  borderRadius: spacing.xs,
                  width: `${progress * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Category badge */}
        <Caption
          color={colors.textMuted}
          style={{ marginBottom: spacing.sm }}
        >
          {currentQuestion?.category}
        </Caption>

        {/* Question Card */}
        <Card style={[styles.questionCard, { padding: spacing.xl, marginBottom: spacing.lg }]}>
          <ScrollView style={styles.questionScroll} showsVerticalScrollIndicator={false}>
            <Body style={{ fontSize: 18, lineHeight: 28 }}>
              {currentQuestion?.text}
            </Body>
          </ScrollView>
        </Card>

        {/* Feedback overlay */}
        {phase === 'feedback' && currentQuestion && (
          <Animated.View
            style={[
              styles.feedbackContainer,
              {
                backgroundColor: isCorrectAnswer
                  ? 'rgba(34, 197, 94, 0.08)'
                  : 'rgba(239, 68, 68, 0.08)',
                borderColor: isCorrectAnswer ? colors.success : colors.error,
                borderRadius: spacing.md,
                padding: spacing.lg,
                marginBottom: spacing.lg,
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.feedbackHeader}>
              <Ionicons
                name={isCorrectAnswer ? 'checkmark-circle' : 'close-circle'}
                size={32}
                color={isCorrectAnswer ? colors.success : colors.error}
              />
              <H3
                style={{
                  marginLeft: spacing.sm,
                  color: isCorrectAnswer ? colors.success : colors.error,
                }}
              >
                {isCorrectAnswer ? '正解！' : '不正解'}
              </H3>
            </View>
            <Body style={{ fontSize: 13, marginTop: spacing.sm, lineHeight: 20 }}>
              正解は{currentQuestion.isCorrect ? '○' : '×'}です。{currentQuestion.explanation}
            </Body>
          </Animated.View>
        )}

        {/* Answer buttons / Next button */}
        <View style={styles.buttonArea}>
          {phase === 'playing' ? (
            <View style={styles.answerButtons}>
              <Pressable
                onPress={() => handleAnswer(true)}
                style={[
                  styles.answerButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.success,
                    borderRadius: spacing.md,
                    padding: spacing.lg,
                  },
                ]}
              >
                <Body
                  style={{
                    fontSize: 40,
                    fontWeight: '700',
                    color: colors.success,
                    textAlign: 'center',
                  }}
                >
                  ○
                </Body>
                <Caption color={colors.textSecondary} style={{ textAlign: 'center', marginTop: spacing.xs }}>
                  正しい
                </Caption>
              </Pressable>

              <Pressable
                onPress={() => handleAnswer(false)}
                style={[
                  styles.answerButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.error,
                    borderRadius: spacing.md,
                    padding: spacing.lg,
                  },
                ]}
              >
                <Body
                  style={{
                    fontSize: 40,
                    fontWeight: '700',
                    color: colors.error,
                    textAlign: 'center',
                  }}
                >
                  ×
                </Body>
                <Caption color={colors.textSecondary} style={{ textAlign: 'center', marginTop: spacing.xs }}>
                  間違い
                </Caption>
              </Pressable>
            </View>
          ) : (
            <Button
              title={
                currentIndex + 1 >= currentQuestions.length
                  ? '結果を見る'
                  : '次の問題'
              }
              onPress={handleNext}
              size="lg"
            />
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  setupContainer: {
    flexGrow: 1,
  },
  resultContainer: {
    flexGrow: 1,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    borderWidth: 1.5,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBarBg: {
    height: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  questionCard: {
    flex: 1,
    justifyContent: 'center',
  },
  questionScroll: {
    flex: 1,
  },
  feedbackContainer: {
    borderWidth: 1,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonArea: {
    paddingBottom: 8,
  },
  answerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  answerButton: {
    flex: 1,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultHeader: {
    alignItems: 'center',
    paddingTop: 20,
  },
  scoreCard: {},
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreDivider: {
    height: 1,
  },
  answerReview: {
    borderLeftWidth: 3,
  },
  answerReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
