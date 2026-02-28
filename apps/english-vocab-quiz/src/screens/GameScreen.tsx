import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { wordData, getWordsByLevel } from '../data/words';
import type {
  QuizLevel,
  QuizCount,
  QuizMode,
  QuizQuestion,
  QuizResult,
} from '../types';

type GamePhase = 'playing' | 'feedback' | 'result';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateQuestions(
  level: QuizLevel,
  count: QuizCount,
  mode: QuizMode
): QuizQuestion[] {
  const pool = getWordsByLevel(level);
  const shuffledPool = shuffleArray(pool);
  const selected = shuffledPool.slice(0, Math.min(count, shuffledPool.length));

  return selected.map((entry) => {
    const isEnToJp = mode === 'en-to-jp';
    const correctAnswer = isEnToJp ? entry.meaning : entry.word;

    const wrongPool = pool.filter((w) => {
      if (isEnToJp) {
        return w.word !== entry.word && w.meaning !== entry.meaning;
      }
      return w.word !== entry.word && w.meaning !== entry.meaning;
    });
    const shuffledWrong = shuffleArray(wrongPool);
    const wrongAnswers: string[] = [];
    const usedAnswers = new Set<string>([correctAnswer]);

    for (const w of shuffledWrong) {
      const answer = isEnToJp ? w.meaning : w.word;
      if (!usedAnswers.has(answer) && wrongAnswers.length < 3) {
        wrongAnswers.push(answer);
        usedAnswers.add(answer);
      }
    }

    // Fallback if not enough wrong answers from same level
    if (wrongAnswers.length < 3) {
      const allWords = shuffleArray(wordData);
      for (const w of allWords) {
        const answer = isEnToJp ? w.meaning : w.word;
        if (!usedAnswers.has(answer) && wrongAnswers.length < 3) {
          wrongAnswers.push(answer);
          usedAnswers.add(answer);
        }
      }
    }

    const allChoices = [correctAnswer, ...wrongAnswers];
    const shuffledChoices = shuffleArray(allChoices);
    const correctIndex = shuffledChoices.indexOf(correctAnswer);

    return {
      entry,
      choices: shuffledChoices,
      correctIndex,
      mode,
    };
  });
}

export function GameScreen() {
  const { colors, spacing, radius } = useTheme();
  const { trackAction } = useInterstitialAd();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const level: QuizLevel = route.params?.level ?? '5-4級';
  const count: QuizCount = route.params?.count ?? 10;
  const mode: QuizMode = route.params?.mode ?? 'en-to-jp';

  const [phase, setPhase] = useState<GamePhase>('playing');
  const [questions, setQuestions] = useState<QuizQuestion[]>(() =>
    generateQuestions(level, count, mode)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [startTime] = useState(() => Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  const [history, setHistory] = useLocalStorage<QuizResult[]>(
    'english-vocab-quiz-history',
    []
  );

  const flashAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(
    () => {
      setHintRevealed(true);
    }
  );

  useEffect(() => {
    if (phase === 'playing' || phase === 'feedback') {
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

      const levelLabel = level === 'ALL' ? '全レベル' : level;
      const modeLabel = mode === 'en-to-jp' ? '英→日' : '日→英';

      const result: QuizResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        level: `${levelLabel} (${modeLabel})`,
        mode,
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
    level,
    mode,
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
    const q = generateQuestions(level, count, mode);
    setQuestions(q);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setHintRevealed(false);
    setElapsedTime(0);
    setPhase('playing');
  }, [level, count, mode]);

  const handleBackToTitle = useCallback(() => {
    navigation.navigate('Title');
  }, [navigation]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];

  const flashBgColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      colors.background,
      isCorrect ? colors.success : colors.error,
    ],
  });

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
            <Ionicons
              name={
                accuracy === 100
                  ? 'trophy'
                  : accuracy >= 80
                  ? 'happy'
                  : accuracy >= 50
                  ? 'thumbs-up'
                  : 'book'
              }
              size={64}
              color={
                accuracy >= 80
                  ? colors.success
                  : accuracy >= 50
                  ? colors.warning
                  : colors.error
              }
              style={{ alignSelf: 'center', marginBottom: spacing.md }}
            />
            <H1 align="center" style={{ marginBottom: spacing.lg }}>
              結果発表
            </H1>

            <Card style={[styles.resultCard, { marginBottom: spacing.lg }]}>
              <View style={styles.resultRow}>
                <Body color={colors.textSecondary}>レベル</Body>
                <H3>{level === 'ALL' ? '全レベル' : level}</H3>
              </View>
              <View
                style={[
                  styles.resultDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <View style={styles.resultRow}>
                <Body color={colors.textSecondary}>モード</Body>
                <H3>
                  {mode === 'en-to-jp' ? '英語→日本語' : '日本語→英語'}
                </H3>
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
              <Button title="もう一度" onPress={handleRetry} size="lg" />
              <Button
                title="設定に戻る"
                onPress={handleBackToTitle}
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
    questions.length > 0
      ? ((currentIndex + 1) / questions.length) * 100
      : 0;

  const isEnToJp = currentQuestion?.mode === 'en-to-jp';
  const questionDisplay = isEnToJp
    ? currentQuestion?.entry.word
    : currentQuestion?.entry.meaning;
  const questionLabel = isEnToJp
    ? '次の英単語の意味は？'
    : '次の日本語に合う英単語は？';

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

        {/* Question display */}
        {currentQuestion && (
          <>
            <Caption
              color={colors.textMuted}
              style={{ textAlign: 'center', marginBottom: spacing.sm }}
            >
              {questionLabel}
            </Caption>

            <Card
              style={[
                styles.wordCard,
                { marginBottom: spacing.lg },
              ]}
            >
              <View style={styles.levelBadgeRow}>
                <Badge
                  label={currentQuestion.entry.level}
                  variant="outline"
                />
              </View>
              <H1
                align="center"
                style={{
                  fontSize: isEnToJp ? 40 : 28,
                  lineHeight: isEnToJp ? 50 : 38,
                  marginTop: spacing.sm,
                }}
              >
                {questionDisplay}
              </H1>

              {hintRevealed && phase === 'playing' && (
                <Body
                  color={colors.primary}
                  style={{
                    textAlign: 'center',
                    marginTop: spacing.sm,
                    fontWeight: '600',
                  }}
                >
                  {isEnToJp
                    ? `ヒント: ${currentQuestion.entry.meaning.charAt(0)}...`
                    : `ヒント: ${currentQuestion.entry.word.charAt(0)}...`}
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
                        paddingHorizontal: spacing.sm,
                      },
                    ]}
                  >
                    <Body
                      color={textColor}
                      style={{
                        fontWeight: '600',
                        fontSize: isEnToJp ? 16 : 15,
                        textAlign: 'center',
                      }}
                    >
                      {choice}
                    </Body>
                  </Pressable>
                );
              })}
            </View>

            {/* Feedback: show example sentence */}
            {phase === 'feedback' && (
              <View style={{ marginTop: spacing.md }}>
                {!isCorrect && (
                  <Body
                    color={colors.error}
                    style={{
                      textAlign: 'center',
                      fontWeight: '600',
                      marginBottom: spacing.xs,
                    }}
                  >
                    正解:{' '}
                    {isEnToJp
                      ? currentQuestion.entry.meaning
                      : currentQuestion.entry.word}
                  </Body>
                )}
                <Card
                  style={{
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                  }}
                >
                  <Caption
                    color={colors.textMuted}
                    style={{ marginBottom: spacing.xs }}
                  >
                    例文
                  </Caption>
                  <Body
                    color={colors.textSecondary}
                    style={{ fontSize: 14, fontStyle: 'italic' }}
                  >
                    {currentQuestion.entry.example}
                  </Body>
                  <Caption
                    color={colors.textMuted}
                    style={{ marginTop: spacing.xs }}
                  >
                    {currentQuestion.entry.word} = {currentQuestion.entry.meaning}
                  </Caption>
                </Card>
              </View>
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
  wordCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  levelBadgeRow: {
    alignSelf: 'center',
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
});
