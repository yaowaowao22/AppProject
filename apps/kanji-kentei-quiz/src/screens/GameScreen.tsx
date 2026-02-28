import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import {
  generateQuestions,
  LEVELS,
  LEVEL_LABELS,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
} from '../data/kanjiKentei';
import type { GeneratedQuestion } from '../data/kanjiKentei';
import type { KenteiLevel, QuestionType, QuizCount, QuizResult } from '../types';

type GamePhase = 'setup' | 'playing' | 'feedback' | 'result';

const COUNT_OPTIONS: { label: string; value: QuizCount }[] = [
  { label: '10問', value: 10 },
  { label: '20問', value: 20 },
  { label: '30問', value: 30 },
];

export function GameScreen() {
  const { colors, spacing, radius } = useTheme();
  const { trackAction } = useInterstitialAd();

  const [phase, setPhase] = useState<GamePhase>('setup');
  const [selectedLevel, setSelectedLevel] = useState<KenteiLevel>('10級');
  const [selectedType, setSelectedType] = useState<QuestionType>('読み');
  const [selectedCount, setSelectedCount] = useState<QuizCount>(10);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const [history, setHistory] = useLocalStorage<QuizResult[]>(
    'kanji-kentei-quiz-history',
    []
  );

  const flashAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd({
    onReward: () => {
      setHintRevealed(true);
    },
  });

  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, startTime]);

  const handleStartQuiz = useCallback(() => {
    const q = generateQuestions(selectedLevel, selectedType, selectedCount);
    if (q.length === 0) return;
    setQuestions(q);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setHintRevealed(false);
    setStartTime(Date.now());
    setElapsedTime(0);
    setPhase('playing');
  }, [selectedLevel, selectedType, selectedCount]);

  const handleAnswer = useCallback(
    (choiceIndex: number) => {
      if (selectedAnswer !== null) return;

      const question = questions[currentIndex];
      const correct = choiceIndex === question.correctIndex;

      setSelectedAnswer(choiceIndex);
      setIsCorrect(correct);

      if (correct) {
        setScore((prev) => prev + 1);
      }

      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();

      setPhase('feedback');
    },
    [selectedAnswer, questions, currentIndex, flashAnim]
  );

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      const finalTime = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(finalTime);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const result: QuizResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        level: LEVEL_LABELS[selectedLevel],
        questionType: QUESTION_TYPE_LABELS[selectedType],
        correct: score,
        total: questions.length,
        timeSeconds: finalTime,
      };

      setHistory([result, ...(history || [])]);
      trackAction();
      setPhase('result');
    } else {
      setCurrentIndex(nextIndex);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setHintRevealed(false);
      setPhase('playing');
    }
  }, [
    currentIndex,
    questions,
    startTime,
    selectedLevel,
    selectedType,
    score,
    history,
    setHistory,
    trackAction,
  ]);

  const handleHint = useCallback(() => {
    if (rewardedLoaded) {
      showRewardedAd();
    }
  }, [rewardedLoaded, showRewardedAd]);

  const handleRetry = useCallback(() => {
    setPhase('setup');
  }, []);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];

  const flashBgColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.background, isCorrect ? colors.success : colors.error],
  });

  // --- SETUP PHASE ---
  if (phase === 'setup') {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.xl }]}>
          <H2 style={{ marginBottom: spacing.xl, textAlign: 'center' }}>
            クイズ設定
          </H2>

          <Body style={{ marginBottom: spacing.sm, fontWeight: '600' }}>
            級を選択
          </Body>
          <View style={[styles.optionRow, { marginBottom: spacing.lg }]}>
            {LEVELS.map((level) => (
              <Pressable
                key={level}
                onPress={() => setSelectedLevel(level)}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      selectedLevel === level
                        ? colors.primary
                        : colors.surface,
                    borderColor:
                      selectedLevel === level
                        ? colors.primary
                        : colors.border,
                    borderRadius: radius.md,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                  },
                ]}
              >
                <Body
                  color={
                    selectedLevel === level ? '#FFFFFF' : colors.text
                  }
                  style={{ fontWeight: '600', textAlign: 'center', fontSize: 13 }}
                >
                  {level}
                </Body>
              </Pressable>
            ))}
          </View>

          <Body style={{ marginBottom: spacing.sm, fontWeight: '600' }}>
            問題の種類
          </Body>
          <View style={[styles.optionRow, { marginBottom: spacing.lg }]}>
            {QUESTION_TYPES.map((qt) => (
              <Pressable
                key={qt}
                onPress={() => setSelectedType(qt)}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      selectedType === qt
                        ? colors.primary
                        : colors.surface,
                    borderColor:
                      selectedType === qt
                        ? colors.primary
                        : colors.border,
                    borderRadius: radius.md,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                  },
                ]}
              >
                <Body
                  color={
                    selectedType === qt ? '#FFFFFF' : colors.text
                  }
                  style={{ fontWeight: '600', textAlign: 'center' }}
                >
                  {QUESTION_TYPE_LABELS[qt]}
                </Body>
              </Pressable>
            ))}
          </View>

          <Body style={{ marginBottom: spacing.sm, fontWeight: '600' }}>
            出題数
          </Body>
          <View style={[styles.optionRow, { marginBottom: spacing.xxl }]}>
            {COUNT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setSelectedCount(opt.value)}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      selectedCount === opt.value
                        ? colors.primary
                        : colors.surface,
                    borderColor:
                      selectedCount === opt.value
                        ? colors.primary
                        : colors.border,
                    borderRadius: radius.md,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                  },
                ]}
              >
                <Body
                  color={
                    selectedCount === opt.value ? '#FFFFFF' : colors.text
                  }
                  style={{ fontWeight: '600', textAlign: 'center' }}
                >
                  {opt.label}
                </Body>
              </Pressable>
            ))}
          </View>

          <Button title="スタート" onPress={handleStartQuiz} size="lg" />
        </View>
      </ScreenWrapper>
    );
  }

  // --- RESULT PHASE ---
  if (phase === 'result') {
    const accuracy =
      questions.length > 0
        ? Math.round((score / questions.length) * 100)
        : 0;

    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.xl }]}>
          <View style={styles.resultContainer}>
            <H1 align="center" style={{ marginBottom: spacing.lg }}>
              結果発表
            </H1>

            <Card style={[styles.resultCard, { marginBottom: spacing.lg }]}>
              <View style={styles.resultRow}>
                <Body color={colors.textSecondary}>級</Body>
                <H3>{LEVEL_LABELS[selectedLevel]}</H3>
              </View>
              <View
                style={[
                  styles.resultDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <View style={styles.resultRow}>
                <Body color={colors.textSecondary}>問題形式</Body>
                <H3>{QUESTION_TYPE_LABELS[selectedType]}</H3>
              </View>
              <View
                style={[
                  styles.resultDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <View style={styles.resultRow}>
                <Body color={colors.textSecondary}>スコア</Body>
                <H3>
                  {score} / {questions.length}
                </H3>
              </View>
              <View
                style={[
                  styles.resultDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <View style={styles.resultRow}>
                <Body color={colors.textSecondary}>正答率</Body>
                <H3
                  style={{
                    color:
                      accuracy >= 80
                        ? colors.success
                        : accuracy >= 50
                        ? colors.warning
                        : colors.error,
                  }}
                >
                  {accuracy}%
                </H3>
              </View>
              <View
                style={[
                  styles.resultDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <View style={styles.resultRow}>
                <Body color={colors.textSecondary}>所要時間</Body>
                <H3>{formatTime(elapsedTime)}</H3>
              </View>
            </Card>

            <Body
              align="center"
              style={{ marginBottom: spacing.xl }}
              color={colors.textSecondary}
            >
              {accuracy === 100
                ? '満点！素晴らしいです！'
                : accuracy >= 80
                ? '合格ライン！よくできました！'
                : accuracy >= 50
                ? 'もう少し頑張りましょう！'
                : '復習して再挑戦しましょう！'}
            </Body>

            <View style={{ gap: spacing.sm }}>
              <Button title="もう一度" onPress={handleStartQuiz} size="lg" />
              <Button
                title="設定に戻る"
                onPress={handleRetry}
                variant="outline"
                size="lg"
              />
            </View>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // --- PLAYING / FEEDBACK PHASE ---
  const progressPercent =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  return (
    <ScreenWrapper>
      <Animated.View
        style={[
          styles.container,
          { padding: spacing.lg, backgroundColor: flashBgColor },
        ]}
      >
        {/* Header: progress + score + timer */}
        <View style={[styles.header, { marginBottom: spacing.md }]}>
          <Caption color={colors.textSecondary}>
            {currentIndex + 1} / {questions.length}
          </Caption>
          <Caption color={colors.textSecondary}>
            {formatTime(elapsedTime)}
          </Caption>
          <Caption color={colors.textSecondary}>
            正解: {score}
          </Caption>
        </View>

        {/* Progress bar */}
        <View
          style={[
            styles.progressBarBg,
            {
              backgroundColor: colors.border,
              borderRadius: radius.sm,
              marginBottom: spacing.md,
            },
          ]}
        >
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.sm,
                width: `${progressPercent}%`,
              },
            ]}
          />
        </View>

        {/* Question type badge */}
        <View style={{ alignItems: 'center', marginBottom: spacing.sm }}>
          <Caption color={colors.textMuted}>
            {LEVEL_LABELS[selectedLevel]}・{QUESTION_TYPE_LABELS[selectedType]}
          </Caption>
        </View>

        {/* Question display */}
        {currentQuestion && (
          <>
            <Card
              style={[
                styles.questionCard,
                { marginBottom: spacing.lg },
              ]}
            >
              <H2
                align="center"
                style={{ fontSize: 24, lineHeight: 36 }}
              >
                {currentQuestion.questionText}
              </H2>

              {hintRevealed && phase === 'playing' && (
                <Body
                  color={colors.primary}
                  style={{
                    textAlign: 'center',
                    marginTop: spacing.sm,
                    fontWeight: '600',
                  }}
                >
                  ヒント: {currentQuestion.choices[currentQuestion.correctIndex].charAt(0)}...
                </Body>
              )}
            </Card>

            {/* Answer choices - 2x2 grid */}
            <View style={[styles.choicesGrid, { gap: spacing.sm }]}>
              {currentQuestion.choices.map((choice, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectAnswer =
                  index === currentQuestion.correctIndex;
                let bgColor = colors.surface;
                let borderCol = colors.border;
                let textColor = colors.text;

                if (phase === 'feedback') {
                  if (isCorrectAnswer) {
                    bgColor = colors.success;
                    borderCol = colors.success;
                    textColor = '#FFFFFF';
                  } else if (isSelected && !isCorrect) {
                    bgColor = colors.error;
                    borderCol = colors.error;
                    textColor = '#FFFFFF';
                  }
                }

                return (
                  <Pressable
                    key={`${index}-${choice}`}
                    onPress={() => handleAnswer(index)}
                    disabled={phase === 'feedback'}
                    style={[
                      styles.choiceButton,
                      {
                        backgroundColor: bgColor,
                        borderColor: borderCol,
                        borderRadius: radius.md,
                        paddingVertical: spacing.lg,
                      },
                    ]}
                  >
                    <Body
                      color={textColor}
                      style={{
                        fontWeight: '600',
                        fontSize: 18,
                        textAlign: 'center',
                      }}
                    >
                      {choice}
                    </Body>
                  </Pressable>
                );
              })}
            </View>

            {/* Feedback: explanation */}
            {phase === 'feedback' && (
              <Card style={[styles.explanationCard, { marginTop: spacing.md }]}>
                <Body
                  color={isCorrect ? colors.success : colors.error}
                  style={{
                    textAlign: 'center',
                    fontWeight: '700',
                    marginBottom: spacing.xs,
                  }}
                >
                  {isCorrect ? '正解！' : '不正解'}
                </Body>
                <Caption
                  color={colors.textSecondary}
                  style={{ textAlign: 'center' }}
                >
                  {currentQuestion.explanation}
                </Caption>
              </Card>
            )}

            {/* Bottom actions */}
            <View style={[styles.bottomActions, { marginTop: spacing.lg }]}>
              {phase === 'feedback' ? (
                <Button
                  title={
                    currentIndex + 1 >= questions.length
                      ? '結果を見る'
                      : '次の問題'
                  }
                  onPress={handleNext}
                  size="lg"
                />
              ) : (
                <Button
                  title={
                    hintRevealed
                      ? 'ヒント表示中'
                      : rewardedLoaded
                      ? '広告を見てヒント'
                      : 'ヒント（準備中）'
                  }
                  onPress={handleHint}
                  variant="ghost"
                  disabled={hintRevealed || !rewardedLoaded}
                />
              )}
            </View>
          </>
        )}
      </Animated.View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBarBg: {
    height: 6,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  questionCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  choicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  choiceButton: {
    width: '48%',
    flexGrow: 1,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  explanationCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  bottomActions: {
    alignItems: 'center',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  resultCard: {
    paddingVertical: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  resultDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    borderWidth: 2,
    minWidth: 70,
  },
});
