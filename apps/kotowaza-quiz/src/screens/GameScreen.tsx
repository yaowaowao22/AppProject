import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { kotowazaData, getKotowazaByLevel, getLevelLabel } from '../data/kotowaza';
import type {
  Kotowaza,
  QuizMode,
  QuizLevel,
  QuizCount,
  QuizQuestion,
  QuizResult,
} from '../types';

type GamePhase = 'setup' | 'playing' | 'feedback' | 'result';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createFillInBlank(proverb: string): { blanked: string; answer: string } {
  const segments: string[] = [];
  let current = '';

  for (const char of proverb) {
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(char)) {
      if (current && !/[\u3040-\u309F\u30A0-\u30FF]/.test(current[0])) {
        segments.push(current);
        current = '';
      }
      current += char;
    } else if (/[\u4E00-\u9FFF]/.test(char)) {
      if (current && !/[\u4E00-\u9FFF]/.test(current[0])) {
        segments.push(current);
        current = '';
      }
      current += char;
    } else {
      if (current) {
        segments.push(current);
        current = '';
      }
      segments.push(char);
    }
  }
  if (current) {
    segments.push(current);
  }

  const kanjiSegments = segments
    .map((seg, idx) => ({ seg, idx }))
    .filter(({ seg }) => /[\u4E00-\u9FFF]/.test(seg[0]));

  if (kanjiSegments.length > 0) {
    const target = kanjiSegments[Math.floor(Math.random() * kanjiSegments.length)];
    const blanked = segments
      .map((seg, idx) => (idx === target.idx ? '○○' : seg))
      .join('');
    return { blanked, answer: target.seg };
  }

  const hiraganaSegments = segments
    .map((seg, idx) => ({ seg, idx }))
    .filter(({ seg }) => /[\u3040-\u309F]/.test(seg[0]) && seg.length >= 2);

  if (hiraganaSegments.length > 0) {
    const target = hiraganaSegments[Math.floor(Math.random() * hiraganaSegments.length)];
    const blanked = segments
      .map((seg, idx) => (idx === target.idx ? '○○' : seg))
      .join('');
    return { blanked, answer: target.seg };
  }

  const firstChars = proverb.slice(0, 2);
  const rest = proverb.slice(2);
  return { blanked: '○○' + rest, answer: firstChars };
}

function generateWrongProverbs(
  correct: Kotowaza,
  pool: Kotowaza[],
  count: number
): string[] {
  const wrong: string[] = [];
  const used = new Set<string>([correct.proverb]);
  const shuffled = shuffleArray(pool);

  for (const k of shuffled) {
    if (!used.has(k.proverb) && wrong.length < count) {
      wrong.push(k.proverb);
      used.add(k.proverb);
    }
  }

  if (wrong.length < count) {
    const allShuffled = shuffleArray(kotowazaData);
    for (const k of allShuffled) {
      if (!used.has(k.proverb) && wrong.length < count) {
        wrong.push(k.proverb);
        used.add(k.proverb);
      }
    }
  }

  return wrong;
}

function generateWrongMeanings(
  correct: Kotowaza,
  pool: Kotowaza[],
  count: number
): string[] {
  const wrong: string[] = [];
  const used = new Set<string>([correct.meaning]);
  const shuffled = shuffleArray(pool);

  for (const k of shuffled) {
    if (!used.has(k.meaning) && wrong.length < count) {
      wrong.push(k.meaning);
      used.add(k.meaning);
    }
  }

  if (wrong.length < count) {
    const allShuffled = shuffleArray(kotowazaData);
    for (const k of allShuffled) {
      if (!used.has(k.meaning) && wrong.length < count) {
        wrong.push(k.meaning);
        used.add(k.meaning);
      }
    }
  }

  return wrong;
}

function generateWrongBlanks(
  correctAnswer: string,
  pool: Kotowaza[],
  count: number
): string[] {
  const wrong: string[] = [];
  const used = new Set<string>([correctAnswer]);

  const shuffled = shuffleArray(pool);
  for (const k of shuffled) {
    const { answer } = createFillInBlank(k.proverb);
    if (!used.has(answer) && wrong.length < count) {
      wrong.push(answer);
      used.add(answer);
    }
  }

  if (wrong.length < count) {
    const allShuffled = shuffleArray(kotowazaData);
    for (const k of allShuffled) {
      const { answer } = createFillInBlank(k.proverb);
      if (!used.has(answer) && wrong.length < count) {
        wrong.push(answer);
        used.add(answer);
      }
    }
  }

  return wrong;
}

const QUIZ_MODES: QuizMode[] = ['meaning-to-proverb', 'fill-in-blank', 'select-meaning'];

function generateQuestions(
  level: QuizLevel,
  count: QuizCount,
  mode: QuizMode | 'mixed'
): QuizQuestion[] {
  const pool = getKotowazaByLevel(level);
  const shuffledPool = shuffleArray(pool);
  const selected = shuffledPool.slice(0, Math.min(count, shuffledPool.length));

  return selected.map((kotowaza, idx) => {
    const questionMode =
      mode === 'mixed'
        ? QUIZ_MODES[idx % QUIZ_MODES.length]
        : mode;

    switch (questionMode) {
      case 'meaning-to-proverb': {
        const wrongProverbs = generateWrongProverbs(kotowaza, pool, 3);
        const allChoices = shuffleArray([kotowaza.proverb, ...wrongProverbs]);
        return {
          kotowaza,
          mode: questionMode,
          questionText: kotowaza.meaning,
          choices: allChoices,
          correctIndex: allChoices.indexOf(kotowaza.proverb),
        };
      }
      case 'fill-in-blank': {
        const { blanked, answer } = createFillInBlank(kotowaza.proverb);
        const wrongBlanks = generateWrongBlanks(answer, pool, 3);
        const allChoices = shuffleArray([answer, ...wrongBlanks]);
        return {
          kotowaza,
          mode: questionMode,
          questionText: blanked,
          choices: allChoices,
          correctIndex: allChoices.indexOf(answer),
        };
      }
      case 'select-meaning': {
        const wrongMeanings = generateWrongMeanings(kotowaza, pool, 3);
        const allChoices = shuffleArray([kotowaza.meaning, ...wrongMeanings]);
        return {
          kotowaza,
          mode: questionMode,
          questionText: kotowaza.proverb,
          choices: allChoices,
          correctIndex: allChoices.indexOf(kotowaza.meaning),
        };
      }
    }
  });
}

function getModeLabel(mode: QuizMode | 'mixed'): string {
  switch (mode) {
    case 'meaning-to-proverb':
      return '意味→ことわざ';
    case 'fill-in-blank':
      return '穴埋め';
    case 'select-meaning':
      return '意味選択';
    case 'mixed':
      return 'ミックス';
  }
}

function getQuestionLabel(mode: QuizMode): string {
  switch (mode) {
    case 'meaning-to-proverb':
      return 'この意味のことわざは？';
    case 'fill-in-blank':
      return '○○に入る言葉は？';
    case 'select-meaning':
      return 'このことわざの意味は？';
  }
}

const LEVEL_OPTIONS: { label: string; value: QuizLevel }[] = [
  { label: '初級', value: 'basic' },
  { label: '中級', value: 'intermediate' },
  { label: '上級', value: 'advanced' },
  { label: '全レベル', value: 'ALL' },
];

const MODE_OPTIONS: { label: string; value: QuizMode | 'mixed' }[] = [
  { label: '意味→ことわざ', value: 'meaning-to-proverb' },
  { label: '穴埋め', value: 'fill-in-blank' },
  { label: '意味選択', value: 'select-meaning' },
  { label: 'ミックス', value: 'mixed' },
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
  const [selectedLevel, setSelectedLevel] = useState<QuizLevel>('basic');
  const [selectedMode, setSelectedMode] = useState<QuizMode | 'mixed'>('mixed');
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
    'kotowaza-quiz-history',
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
    const q = generateQuestions(selectedLevel, selectedCount, selectedMode);
    setQuestions(q);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setHintRevealed(false);
    setStartTime(Date.now());
    setElapsedTime(0);
    setPhase('playing');
  }, [selectedLevel, selectedCount, selectedMode]);

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
        level: getLevelLabel(selectedLevel),
        mode: getModeLabel(selectedMode),
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
    selectedMode,
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
            難易度
          </Body>
          <View style={[styles.optionRow, { marginBottom: spacing.lg }]}>
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

          <Body style={{ marginBottom: spacing.sm, fontWeight: '600' }}>
            出題モード
          </Body>
          <View style={[styles.optionRow, { marginBottom: spacing.lg }]}>
            {MODE_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setSelectedMode(opt.value)}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      selectedMode === opt.value
                        ? colors.primary
                        : colors.surface,
                    borderColor:
                      selectedMode === opt.value
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
                    selectedMode === opt.value ? '#FFFFFF' : colors.text
                  }
                  style={{ fontWeight: '600', textAlign: 'center' }}
                >
                  {opt.label}
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
                <Body color={colors.textSecondary}>難易度</Body>
                <H3>{getLevelLabel(selectedLevel)}</H3>
              </View>
              <View
                style={[
                  styles.resultDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <View style={styles.resultRow}>
                <Body color={colors.textSecondary}>モード</Body>
                <H3>{getModeLabel(selectedMode)}</H3>
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
                ? '完璧です！ことわざマスター！'
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

        {/* Question display */}
        {currentQuestion && (
          <>
            <Card
              style={[
                styles.questionCard,
                { marginBottom: spacing.lg },
              ]}
            >
              <Caption
                color={colors.textMuted}
                style={{ textAlign: 'center', marginBottom: spacing.xs }}
              >
                {getQuestionLabel(currentQuestion.mode)}
              </Caption>
              <H2
                align="center"
                style={{
                  fontSize: currentQuestion.mode === 'select-meaning' ? 28 : 20,
                  lineHeight: currentQuestion.mode === 'select-meaning' ? 40 : 30,
                }}
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
                  ヒント: {currentQuestion.kotowaza.example}
                </Body>
              )}
            </Card>

            {/* Answer choices */}
            <View style={[styles.choicesContainer, { gap: spacing.sm }]}>
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
                        paddingVertical: spacing.md,
                        paddingHorizontal: spacing.md,
                      },
                    ]}
                  >
                    <Body
                      color={textColor}
                      style={{
                        fontWeight: '600',
                        fontSize: currentQuestion.mode === 'select-meaning' ? 14 : 16,
                        textAlign: 'center',
                      }}
                    >
                      {choice}
                    </Body>
                  </Pressable>
                );
              })}
            </View>

            {/* Feedback: show explanation */}
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
                  {isCorrect ? '正解！' : '不正解...'}
                </Body>
                <Body
                  color={colors.text}
                  style={{
                    textAlign: 'center',
                    fontWeight: '600',
                    marginBottom: spacing.xs,
                  }}
                >
                  {currentQuestion.kotowaza.proverb}
                </Body>
                <Caption
                  color={colors.textSecondary}
                  style={{ textAlign: 'center' }}
                >
                  {currentQuestion.kotowaza.meaning}
                </Caption>
                <Caption
                  color={colors.textMuted}
                  style={{ textAlign: 'center', marginTop: spacing.xs }}
                >
                  例: {currentQuestion.kotowaza.example}
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
  choicesContainer: {
    flexDirection: 'column',
  },
  choiceButton: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
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
