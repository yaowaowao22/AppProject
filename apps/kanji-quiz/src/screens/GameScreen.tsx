import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { kanjiData, getKanjiByLevel } from '../data/kanji';
import type { QuizLevel, QuizCount, QuizQuestion, QuizResult } from '../types';

type GamePhase = 'setup' | 'playing' | 'feedback' | 'result';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateQuestions(level: QuizLevel, count: QuizCount): QuizQuestion[] {
  const pool = getKanjiByLevel(level);
  const shuffledPool = shuffleArray(pool);
  const selected = shuffledPool.slice(0, Math.min(count, shuffledPool.length));

  return selected.map((kanji) => {
    const wrongPool = pool.filter(
      (k) => k.kanji !== kanji.kanji && k.reading !== kanji.reading
    );
    const shuffledWrong = shuffleArray(wrongPool);
    const wrongReadings: string[] = [];
    const usedReadings = new Set<string>([kanji.reading]);

    for (const w of shuffledWrong) {
      if (!usedReadings.has(w.reading) && wrongReadings.length < 3) {
        wrongReadings.push(w.reading);
        usedReadings.add(w.reading);
      }
    }

    while (wrongReadings.length < 3) {
      const fallback = shuffleArray(kanjiData).find(
        (k) => !usedReadings.has(k.reading)
      );
      if (fallback) {
        wrongReadings.push(fallback.reading);
        usedReadings.add(fallback.reading);
      } else {
        break;
      }
    }

    const allChoices = [kanji.reading, ...wrongReadings];
    const shuffledChoices = shuffleArray(allChoices);
    const correctIndex = shuffledChoices.indexOf(kanji.reading);

    return {
      kanji,
      choices: shuffledChoices,
      correctIndex,
    };
  });
}

const LEVEL_OPTIONS: { label: string; value: QuizLevel }[] = [
  { label: 'N5', value: 'N5' },
  { label: 'N4', value: 'N4' },
  { label: 'N3', value: 'N3' },
  { label: '全レベル', value: 'ALL' },
];

const COUNT_OPTIONS: { label: string; value: QuizCount }[] = [
  { label: '10問', value: 10 },
  { label: '20問', value: 20 },
  { label: '30問', value: 30 },
];

export function GameScreen() {
  const { colors, spacing, radius } = useTheme();
  const { trackAction } = useInterstitialAd();

  const [phase, setPhase] = useState<GamePhase>('setup');
  const [selectedLevel, setSelectedLevel] = useState<QuizLevel>('N5');
  const [selectedCount, setSelectedCount] = useState<QuizCount>(10);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const [history, setHistory] = useLocalStorage<QuizResult[]>(
    'kanji-quiz-history',
    []
  );

  const flashAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(() => {
    setHintRevealed(true);
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
    const q = generateQuestions(selectedLevel, selectedCount);
    setQuestions(q);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setHintRevealed(false);
    setStartTime(Date.now());
    setElapsedTime(0);
    setPhase('playing');
  }, [selectedLevel, selectedCount]);

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
        level: selectedLevel === 'ALL' ? '全レベル' : selectedLevel,
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

          <Body
            style={{ marginBottom: spacing.sm, fontWeight: '600' }}
          >
            JLPTレベル
          </Body>
          <View style={[styles.optionRow, { marginBottom: spacing.xl }]}>
            {LEVEL_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setSelectedLevel(opt.value)}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      selectedLevel === opt.value
                        ? colors.primary
                        : colors.surface,
                    borderColor:
                      selectedLevel === opt.value
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
                    selectedLevel === opt.value ? '#FFFFFF' : colors.text
                  }
                  style={{ fontWeight: '600', textAlign: 'center' }}
                >
                  {opt.label}
                </Body>
              </Pressable>
            ))}
          </View>

          <Body
            style={{ marginBottom: spacing.sm, fontWeight: '600' }}
          >
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
    const accuracy = questions.length > 0
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
                <Body color={colors.textSecondary}>レベル</Body>
                <H3>{selectedLevel === 'ALL' ? '全レベル' : selectedLevel}</H3>
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
                ? '完璧です！素晴らしい！'
                : accuracy >= 80
                ? 'よくできました！'
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
              marginBottom: spacing.lg,
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

        {/* Kanji display */}
        {currentQuestion && (
          <>
            <Card
              style={[
                styles.kanjiCard,
                { marginBottom: spacing.lg },
              ]}
            >
              <Body
                color={colors.textMuted}
                style={{ textAlign: 'center', marginBottom: spacing.xs }}
              >
                {currentQuestion.kanji.level}
              </Body>
              <H1
                align="center"
                style={{ fontSize: 72, lineHeight: 90 }}
              >
                {currentQuestion.kanji.kanji}
              </H1>
              <Caption
                color={colors.textSecondary}
                style={{ textAlign: 'center', marginTop: spacing.sm }}
              >
                {currentQuestion.kanji.meaning}
              </Caption>

              {hintRevealed && phase === 'playing' && (
                <Body
                  color={colors.primary}
                  style={{
                    textAlign: 'center',
                    marginTop: spacing.sm,
                    fontWeight: '600',
                  }}
                >
                  ヒント: {currentQuestion.kanji.reading.charAt(0)}...
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
                        fontSize: 20,
                        textAlign: 'center',
                      }}
                    >
                      {choice}
                    </Body>
                  </Pressable>
                );
              })}
            </View>

            {/* Feedback: show correct reading if wrong */}
            {phase === 'feedback' && !isCorrect && (
              <Body
                color={colors.error}
                style={{
                  textAlign: 'center',
                  marginTop: spacing.md,
                  fontWeight: '600',
                }}
              >
                正解: {currentQuestion.kanji.reading}
              </Body>
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
  kanjiCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
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
