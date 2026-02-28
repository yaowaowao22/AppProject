import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import {
  QUIZ_MODES,
  QUESTION_COUNTS,
  getQuestionsByMode,
  shuffleQuestions,
} from '../data/questions';
import type { SPIQuestion, QuizCategory, QuizResult } from '../types';

type GamePhase = 'setup' | 'playing' | 'feedback' | 'result';

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();
  const [history, setHistory] = useLocalStorage<QuizResult[]>('spi-quiz-history', []);

  const [phase, setPhase] = useState<GamePhase>('setup');
  const [selectedMode, setSelectedMode] = useState<QuizCategory>('sogo');
  const [selectedCount, setSelectedCount] = useState(10);

  const [currentQuestions, setCurrentQuestions] = useState<SPIQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const startQuiz = useCallback(() => {
    const available = getQuestionsByMode(selectedMode);
    const count = Math.min(selectedCount, available.length);
    const selected = shuffleQuestions(available, count);
    setCurrentQuestions(selected);
    setCurrentIndex(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setPhase('playing');
  }, [selectedMode, selectedCount]);

  const handleAnswer = useCallback(
    (index: number) => {
      if (selectedAnswer !== null) return;
      const question = currentQuestions[currentIndex];
      const correct = index === question.correctIndex;
      setSelectedAnswer(index);
      setIsCorrect(correct);
      if (correct) {
        setCorrectCount((prev) => prev + 1);
      }
      setPhase('feedback');
    },
    [currentQuestions, currentIndex, selectedAnswer],
  );

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= currentQuestions.length) {
      const total = currentQuestions.length;
      const accuracy = Math.round((correctCount / total) * 100);
      const modeLabel =
        QUIZ_MODES.find((m) => m.key === selectedMode)?.label ?? selectedMode;
      const result: QuizResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        mode: selectedMode,
        modeLabel,
        correct: correctCount,
        total,
        accuracy,
      };
      setHistory([result, ...history]);
      trackAction();
      setPhase('result');
    } else {
      setCurrentIndex(nextIndex);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setPhase('playing');
    }
  }, [
    currentIndex,
    currentQuestions,
    correctCount,
    selectedMode,
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
    setIsCorrect(null);
  }, []);

  const progressPercent =
    currentQuestions.length > 0
      ? ((currentIndex + 1) / currentQuestions.length) * 100
      : 0;

  if (phase === 'setup') {
    return (
      <ScreenWrapper>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        >
          <H2 style={{ marginBottom: spacing.xl }}>クイズ設定</H2>

          <Body style={{ marginBottom: spacing.sm, fontWeight: '600' }}>
            出題モード
          </Body>
          <View style={[styles.optionRow, { marginBottom: spacing.lg }]}>
            {QUIZ_MODES.map((mode) => {
              const active = selectedMode === mode.key;
              return (
                <Pressable
                  key={mode.key}
                  onPress={() => setSelectedMode(mode.key)}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: active ? colors.primary : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Body
                    color={active ? '#FFFFFF' : colors.text}
                    style={{ fontWeight: active ? 'bold' : 'normal' }}
                  >
                    {mode.label}
                  </Body>
                </Pressable>
              );
            })}
          </View>

          <Body style={{ marginBottom: spacing.sm, fontWeight: '600' }}>
            問題数
          </Body>
          <View style={[styles.optionRow, { marginBottom: spacing.xxl }]}>
            {QUESTION_COUNTS.map((qc) => {
              const active = selectedCount === qc.value;
              const available = getQuestionsByMode(selectedMode).length;
              const disabled = qc.value > available;
              return (
                <Pressable
                  key={qc.value}
                  onPress={() => !disabled && setSelectedCount(qc.value)}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: disabled
                        ? colors.surface
                        : active
                          ? colors.primary
                          : colors.surface,
                      borderColor: disabled
                        ? colors.border
                        : active
                          ? colors.primary
                          : colors.border,
                      opacity: disabled ? 0.4 : 1,
                    },
                  ]}
                >
                  <Body
                    color={active && !disabled ? '#FFFFFF' : colors.text}
                    style={{ fontWeight: active ? 'bold' : 'normal' }}
                  >
                    {qc.label}
                  </Body>
                </Pressable>
              );
            })}
          </View>

          <Caption
            color={colors.textMuted}
            style={{ marginBottom: spacing.lg, textAlign: 'center' }}
          >
            {QUIZ_MODES.find((m) => m.key === selectedMode)?.label}から
            {Math.min(selectedCount, getQuestionsByMode(selectedMode).length)}
            問出題されます
          </Caption>

          <Button title="スタート" onPress={startQuiz} size="lg" />
        </ScrollView>
      </ScreenWrapper>
    );
  }

  if (phase === 'result') {
    const total = currentQuestions.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    let gradeMessage = '';
    let gradeColor = colors.text;
    if (accuracy >= 90) {
      gradeMessage = '素晴らしい！完璧に近いスコアです！';
      gradeColor = colors.success;
    } else if (accuracy >= 70) {
      gradeMessage = 'よくできました！この調子で頑張りましょう！';
      gradeColor = colors.primary;
    } else if (accuracy >= 50) {
      gradeMessage = 'まずまずです。復習して弱点を克服しましょう。';
      gradeColor = colors.warning;
    } else {
      gradeMessage = 'もう少し学習が必要です。繰り返し挑戦しましょう！';
      gradeColor = colors.error;
    }

    return (
      <ScreenWrapper>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: 40,
            alignItems: 'center',
            justifyContent: 'center',
            flexGrow: 1,
          }}
        >
          <Ionicons
            name="trophy"
            size={72}
            color={colors.primary}
            style={{ marginBottom: spacing.lg }}
          />
          <H1 align="center" style={{ marginBottom: spacing.sm }}>
            クイズ終了！
          </H1>

          <Card
            style={{
              padding: spacing.xl,
              marginVertical: spacing.lg,
              width: '100%',
            }}
          >
            <View style={styles.resultScoreRow}>
              <View style={styles.resultStatItem}>
                <Body
                  color={colors.primary}
                  style={{
                    fontSize: 48,
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  {correctCount}
                </Body>
                <Caption style={{ textAlign: 'center' }}>
                  / {total} 正解
                </Caption>
              </View>
              <View
                style={[
                  styles.resultDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <View style={styles.resultStatItem}>
                <Body
                  color={colors.primary}
                  style={{
                    fontSize: 48,
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  {accuracy}%
                </Body>
                <Caption style={{ textAlign: 'center' }}>正答率</Caption>
              </View>
            </View>

            <Body
              color={gradeColor}
              style={{
                textAlign: 'center',
                marginTop: spacing.lg,
                fontWeight: 'bold',
                fontSize: 16,
              }}
            >
              {gradeMessage}
            </Body>
          </Card>

          <View style={{ gap: spacing.sm, width: '100%' }}>
            <Button title="もう一度挑戦する" onPress={startQuiz} size="lg" />
            <Button
              title="設定に戻る"
              onPress={resetQuiz}
              variant="outline"
              size="lg"
            />
          </View>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  // playing & feedback phases
  const question = currentQuestions[currentIndex];

  if (phase === 'feedback' && question) {
    return (
      <ScreenWrapper>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        >
          <View style={[styles.headerRow, { marginBottom: spacing.md }]}>
            <Body color={colors.textSecondary}>
              第{currentIndex + 1}問 / {currentQuestions.length}
            </Body>
            <Body color={colors.primary} style={{ fontWeight: 'bold' }}>
              {correctCount}問正解
            </Body>
          </View>

          <View
            style={[
              styles.progressBar,
              { backgroundColor: colors.surface, marginBottom: spacing.lg },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${progressPercent}%`,
                },
              ]}
            />
          </View>

          <View
            style={[
              styles.feedbackBanner,
              {
                backgroundColor: isCorrect ? colors.success : colors.error,
                marginBottom: spacing.lg,
                padding: spacing.md,
                borderRadius: 12,
              },
            ]}
          >
            <Ionicons
              name={isCorrect ? 'checkmark-circle' : 'close-circle'}
              size={36}
              color="#FFFFFF"
            />
            <H2 style={{ color: '#FFFFFF', marginLeft: spacing.sm }}>
              {isCorrect ? '正解！' : '不正解'}
            </H2>
          </View>

          <Card style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
            <Caption
              style={{
                color: colors.textMuted,
                marginBottom: spacing.xs,
              }}
            >
              {question.subcategory}
            </Caption>
            <Body style={{ marginBottom: spacing.md, lineHeight: 24 }}>
              {question.question}
            </Body>

            <View style={{ gap: spacing.xs, marginBottom: spacing.md }}>
              {question.options.map((option, index) => {
                let bgColor = 'transparent';
                let textColor = colors.text;
                let icon: 'checkmark-circle' | 'close-circle' | null = null;

                if (index === question.correctIndex) {
                  bgColor = colors.success + '22';
                  textColor = colors.success;
                  icon = 'checkmark-circle';
                } else if (index === selectedAnswer && !isCorrect) {
                  bgColor = colors.error + '22';
                  textColor = colors.error;
                  icon = 'close-circle';
                }

                return (
                  <View
                    key={index}
                    style={[
                      styles.feedbackOption,
                      {
                        backgroundColor: bgColor,
                        borderRadius: 8,
                        padding: spacing.sm,
                      },
                    ]}
                  >
                    {icon && (
                      <Ionicons
                        name={icon}
                        size={20}
                        color={textColor}
                        style={{ marginRight: spacing.xs }}
                      />
                    )}
                    <Body color={textColor} style={{ flex: 1 }}>
                      ({index + 1}) {option}
                    </Body>
                  </View>
                );
              })}
            </View>

            <View
              style={{
                backgroundColor: colors.surface,
                padding: spacing.md,
                borderRadius: 8,
              }}
            >
              <Caption
                style={{
                  color: colors.primary,
                  fontWeight: 'bold',
                  marginBottom: spacing.xs,
                }}
              >
                解説
              </Caption>
              <Body
                color={colors.textSecondary}
                style={{ lineHeight: 22, fontSize: 14 }}
              >
                {question.explanation}
              </Body>
            </View>
          </Card>

          <Button
            title={
              currentIndex + 1 >= currentQuestions.length
                ? '結果を見る'
                : '次の問題へ'
            }
            onPress={handleNext}
            size="lg"
          />
        </ScrollView>
      </ScreenWrapper>
    );
  }

  // playing phase
  if (!question) return null;

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
      >
        <View style={[styles.headerRow, { marginBottom: spacing.md }]}>
          <Body color={colors.textSecondary}>
            第{currentIndex + 1}問 / {currentQuestions.length}
          </Body>
          <Body color={colors.primary} style={{ fontWeight: 'bold' }}>
            {correctCount}問正解
          </Body>
        </View>

        <View
          style={[
            styles.progressBar,
            { backgroundColor: colors.surface, marginBottom: spacing.lg },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${progressPercent}%`,
              },
            ]}
          />
        </View>

        <Card style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
          <Caption
            style={{
              color: colors.textMuted,
              marginBottom: spacing.xs,
            }}
          >
            {question.subcategory}
          </Caption>
          <H3 style={{ lineHeight: 28 }}>{question.question}</H3>
        </Card>

        <View style={{ gap: spacing.sm }}>
          {question.options.map((option, index) => (
            <Pressable
              key={index}
              onPress={() => handleAnswer(index)}
              style={[
                styles.answerButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Body style={{ textAlign: 'center' }}>
                ({index + 1}) {option}
              </Body>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  answerButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  resultStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  resultDivider: {
    width: 1,
    height: 60,
  },
});
