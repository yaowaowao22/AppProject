import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import {
  PERIODS,
  QUESTION_COUNTS,
  getQuestionsByPeriod,
  shuffleQuestions,
} from '../data/questions';
import type { Question } from '../data/questions';

interface QuizResult {
  id: string;
  date: string;
  period: string;
  correct: number;
  total: number;
  percentage: number;
}

type GamePhase = 'setup' | 'playing' | 'feedback' | 'result';

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();
  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(() => {
    handleEliminateTwo();
  });

  const [history, setHistory] = useLocalStorage<QuizResult[]>('quiz-history', []);

  const [phase, setPhase] = useState<GamePhase>('setup');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedCount, setSelectedCount] = useState(10);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [hintUsed, setHintUsed] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const startQuiz = useCallback(() => {
    const available = getQuestionsByPeriod(selectedPeriod);
    const count = Math.min(selectedCount, available.length);
    const selected = shuffleQuestions(available, count);
    setCurrentQuestions(selected);
    setCurrentIndex(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setEliminatedOptions([]);
    setHintUsed(false);
    setPhase('playing');
  }, [selectedPeriod, selectedCount]);

  const handleEliminateTwo = useCallback(() => {
    if (hintUsed || phase !== 'playing') return;
    const question = currentQuestions[currentIndex];
    if (!question) return;
    const wrongIndices = question.options
      .map((_, idx) => idx)
      .filter((idx) => idx !== question.correctIndex);
    const shuffledWrong = [...wrongIndices];
    for (let i = shuffledWrong.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledWrong[i], shuffledWrong[j]] = [shuffledWrong[j], shuffledWrong[i]];
    }
    setEliminatedOptions(shuffledWrong.slice(0, 2));
    setHintUsed(true);
  }, [hintUsed, phase, currentQuestions, currentIndex]);

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (phase !== 'playing') return;
      const question = currentQuestions[currentIndex];
      const isCorrect = answerIndex === question.correctIndex;
      setSelectedAnswer(answerIndex);
      setAnswers((prev) => [...prev, isCorrect]);
      if (isCorrect) {
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
      const percentage = Math.round((correctCount / total) * 100);
      const periodLabel =
        PERIODS.find((p) => p.key === selectedPeriod)?.label ?? selectedPeriod;
      const result: QuizResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        period: periodLabel,
        correct: correctCount,
        total,
        percentage,
      };
      setHistory([result, ...history]);
      trackAction();
      setPhase('result');
    } else {
      setCurrentIndex(nextIndex);
      setSelectedAnswer(null);
      setEliminatedOptions([]);
      setHintUsed(false);
      setPhase('playing');
    }
  }, [
    currentIndex,
    currentQuestions,
    correctCount,
    selectedPeriod,
    history,
    setHistory,
    trackAction,
  ]);

  const resetQuiz = useCallback(() => {
    setPhase('setup');
    setCurrentQuestions([]);
    setCurrentIndex(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setEliminatedOptions([]);
    setHintUsed(false);
  }, []);

  const currentQuestion = currentQuestions[currentIndex];
  const progress =
    currentQuestions.length > 0 ? (currentIndex + 1) / currentQuestions.length : 0;
  const isCorrectAnswer =
    selectedAnswer !== null && currentQuestion
      ? selectedAnswer === currentQuestion.correctIndex
      : false;

  // ===== Setup Phase =====
  if (phase === 'setup') {
    return (
      <ScreenWrapper>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.setupContainer, { padding: spacing.xl }]}
        >
          <H2 style={{ marginBottom: spacing.xl }}>クイズ設定</H2>

          <Body style={{ marginBottom: spacing.sm, fontWeight: '600' }}>
            時代を選択
          </Body>
          <View style={[styles.optionGrid, { marginBottom: spacing.xl }]}>
            {PERIODS.map((period) => {
              const isSelected = selectedPeriod === period.key;
              return (
                <Pressable
                  key={period.key}
                  onPress={() => setSelectedPeriod(period.key)}
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
                    {period.label}
                  </Body>
                </Pressable>
              );
            })}
          </View>

          <Body style={{ marginBottom: spacing.sm, fontWeight: '600' }}>
            問題数
          </Body>
          <View style={[styles.optionGrid, { marginBottom: spacing.xxl }]}>
            {QUESTION_COUNTS.map((qc) => {
              const isSelected = selectedCount === qc.value;
              const available = getQuestionsByPeriod(selectedPeriod).length;
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
            {selectedPeriod === 'all' ? '全時代' : PERIODS.find((p) => p.key === selectedPeriod)?.label}
            から{Math.min(selectedCount, getQuestionsByPeriod(selectedPeriod).length)}問出題されます
          </Caption>

          <Button title="クイズ開始" onPress={startQuiz} size="lg" />
        </ScrollView>
      </ScreenWrapper>
    );
  }

  // ===== Result Phase =====
  if (phase === 'result') {
    const total = currentQuestions.length;
    const percentage = Math.round((correctCount / total) * 100);
    const excellent = percentage >= 80;

    return (
      <ScreenWrapper>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.resultContainer, { padding: spacing.xl }]}
        >
          <View style={[styles.resultHeader, { marginBottom: spacing.xl }]}>
            <Ionicons
              name={excellent ? 'trophy' : 'ribbon'}
              size={80}
              color={excellent ? colors.success : colors.primary}
            />
            <H1
              style={{ marginTop: spacing.lg }}
              align="center"
            >
              {excellent ? '素晴らしい！' : 'お疲れ様でした'}
            </H1>
            <Caption
              color={colors.textSecondary}
              style={{ marginTop: spacing.sm, textAlign: 'center' }}
            >
              {excellent
                ? '歴史マスターの称号に相応しい結果です！'
                : '復習してさらに知識を深めましょう。'}
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
              <H2 style={{ color: excellent ? colors.success : colors.primary }}>
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
              <Body color={colors.textSecondary}>時代</Body>
              <Body>
                {PERIODS.find((p) => p.key === selectedPeriod)?.label ?? selectedPeriod}
              </Body>
            </View>
          </Card>

          <H3 style={{ marginBottom: spacing.md }}>解答一覧</H3>
          {currentQuestions.map((q, idx) => {
            const wasCorrect = answers[idx];
            return (
              <View
                key={idx}
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
                <Body style={{ fontSize: 13, marginTop: spacing.xs }}>{q.question}</Body>
                <Caption
                  color={colors.textSecondary}
                  style={{ marginTop: spacing.xs }}
                >
                  正解: {q.options[q.correctIndex]} - {q.explanation}
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

  // ===== Playing / Feedback Phase =====
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

        {/* Period badge */}
        <View style={{ marginBottom: spacing.sm }}>
          <Badge
            label={currentQuestion?.period ?? ''}
            color={colors.primary}
          />
        </View>

        {/* Question Card */}
        <Card style={[styles.questionCard, { padding: spacing.xl, marginBottom: spacing.md }]}>
          <ScrollView style={styles.questionScroll} showsVerticalScrollIndicator={false}>
            <Body style={{ fontSize: 18, lineHeight: 28 }}>
              {currentQuestion?.question}
            </Body>
          </ScrollView>
        </Card>

        {/* Feedback area */}
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
                padding: spacing.md,
                marginBottom: spacing.md,
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.feedbackHeader}>
              <Ionicons
                name={isCorrectAnswer ? 'checkmark-circle' : 'close-circle'}
                size={28}
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
              {currentQuestion.explanation}
            </Body>
          </Animated.View>
        )}

        {/* Answer buttons / Next button */}
        <View style={styles.buttonArea}>
          {phase === 'playing' ? (
            <View style={{ gap: spacing.sm }}>
              {currentQuestion?.options.map((option, idx) => {
                const isEliminated = eliminatedOptions.includes(idx);
                if (isEliminated) {
                  return (
                    <Pressable
                      key={idx}
                      disabled
                      style={[
                        styles.choiceButton,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          borderRadius: spacing.sm,
                          paddingVertical: spacing.md,
                          paddingHorizontal: spacing.lg,
                          opacity: 0.3,
                        },
                      ]}
                    >
                      <Body color={colors.textMuted} style={{ fontSize: 15 }}>
                        {option}
                      </Body>
                    </Pressable>
                  );
                }
                return (
                  <Pressable
                    key={idx}
                    onPress={() => handleAnswer(idx)}
                    style={[
                      styles.choiceButton,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderRadius: spacing.sm,
                        paddingVertical: spacing.md,
                        paddingHorizontal: spacing.lg,
                      },
                    ]}
                  >
                    <Body style={{ fontSize: 15 }}>{option}</Body>
                  </Pressable>
                );
              })}
              {!hintUsed && rewardedLoaded && (
                <Button
                  title="広告を見て2択に絞る"
                  onPress={() => showRewardedAd()}
                  variant="ghost"
                  size="sm"
                />
              )}
            </View>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {currentQuestion?.options.map((option, idx) => {
                const isCorrectOption = idx === currentQuestion.correctIndex;
                const isSelectedOption = idx === selectedAnswer;
                let bgColor = colors.surface;
                let borderColor = colors.border;
                if (isCorrectOption) {
                  bgColor = 'rgba(34, 197, 94, 0.15)';
                  borderColor = colors.success;
                } else if (isSelectedOption && !isCorrectOption) {
                  bgColor = 'rgba(239, 68, 68, 0.15)';
                  borderColor = colors.error;
                }
                return (
                  <View
                    key={idx}
                    style={[
                      styles.choiceButton,
                      {
                        backgroundColor: bgColor,
                        borderColor,
                        borderRadius: spacing.sm,
                        paddingVertical: spacing.md,
                        paddingHorizontal: spacing.lg,
                      },
                    ]}
                  >
                    <View style={styles.choiceContent}>
                      <Body style={{ fontSize: 15, flex: 1 }}>{option}</Body>
                      {isCorrectOption && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      )}
                      {isSelectedOption && !isCorrectOption && (
                        <Ionicons name="close-circle" size={20} color={colors.error} />
                      )}
                    </View>
                  </View>
                );
              })}
              <Button
                title={
                  currentIndex + 1 >= currentQuestions.length
                    ? '結果を見る'
                    : '次の問題'
                }
                onPress={handleNext}
                size="lg"
              />
            </View>
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
  choiceButton: {
    borderWidth: 1.5,
  },
  choiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
