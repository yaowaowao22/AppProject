import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import { generateQuiz, eliminateWrongOptions } from '../data/quizEngine';
import type { QuizQuestion, QuizResult, QuizSettings, QuizType, QuizLevel } from '../types';

type GamePhase = 'setup' | 'playing' | 'feedback' | 'result';

const TYPE_OPTIONS: { label: string; value: QuizType }[] = [
  { label: '単語', value: 'vocabulary' },
  { label: '文法', value: 'grammar' },
  { label: 'ミックス', value: 'mixed' },
];

const LEVEL_OPTIONS: { label: string; value: QuizLevel }[] = [
  { label: '基礎', value: 'basic' },
  { label: '中級', value: 'intermediate' },
  { label: '上級', value: 'advanced' },
  { label: '全レベル', value: 'all' },
];

const COUNT_OPTIONS = [10, 20, 30];

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();
  const [results, setResults] = useLocalStorage<QuizResult[]>('quiz_results', []);

  const [phase, setPhase] = useState<GamePhase>('setup');
  const [quizType, setQuizType] = useState<QuizType>('vocabulary');
  const [quizLevel, setQuizLevel] = useState<QuizLevel>('basic');
  const [questionCount, setQuestionCount] = useState(10);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [eliminatedIndices, setEliminatedIndices] = useState<number[]>([]);
  const [hintUsed, setHintUsed] = useState(false);

  const hintUsedRef = useRef(false);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      const removed = eliminateWrongOptions(questions[currentIndex]);
      setEliminatedIndices(removed);
      hintUsedRef.current = true;
      setHintUsed(true);
    }
  });

  const startQuiz = useCallback(() => {
    const settings: QuizSettings = {
      type: quizType,
      level: quizLevel,
      questionCount,
    };
    const generated = generateQuiz(settings);
    setQuestions(generated);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setEliminatedIndices([]);
    setHintUsed(false);
    hintUsedRef.current = false;
    setPhase('playing');
  }, [quizType, quizLevel, questionCount]);

  const handleAnswer = useCallback(
    (index: number) => {
      if (selectedAnswer !== null) return;
      const question = questions[currentIndex];
      const correct = index === question.correctIndex;
      setSelectedAnswer(index);
      setIsCorrect(correct);
      if (correct) {
        setScore((prev) => prev + 1);
      }
      setPhase('feedback');
    },
    [currentIndex, questions, selectedAnswer]
  );

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      const finalScore = score;
      const result: QuizResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        type: quizType,
        level: quizLevel === 'all' ? '全レベル' : quizLevel === 'basic' ? '基礎' : quizLevel === 'intermediate' ? '中級' : '上級',
        correct: finalScore,
        total: questions.length,
      };
      setResults([result, ...results]);
      trackAction();
      setPhase('result');
    } else {
      setCurrentIndex(nextIndex);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setEliminatedIndices([]);
      setHintUsed(false);
      hintUsedRef.current = false;
      setPhase('playing');
    }
  }, [currentIndex, questions, score, quizType, quizLevel, results, setResults, trackAction]);

  const handleRetry = useCallback(() => {
    setPhase('setup');
  }, []);

  const handleUseHint = useCallback(() => {
    if (hintUsedRef.current) return;
    if (rewardedLoaded) {
      showRewardedAd();
    }
  }, [rewardedLoaded, showRewardedAd]);

  const progressPercent =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const renderSetup = () => (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
    >
      <H2 style={{ marginBottom: spacing.xl }}>クイズ設定</H2>

      <Body style={{ marginBottom: spacing.sm, fontWeight: 'bold' }}>
        出題タイプ
      </Body>
      <View style={[styles.optionRow, { marginBottom: spacing.lg }]}>
        {TYPE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setQuizType(opt.value)}
            style={[
              styles.optionChip,
              {
                backgroundColor:
                  quizType === opt.value ? colors.primary : colors.surface,
                borderColor:
                  quizType === opt.value ? colors.primary : colors.border,
              },
            ]}
          >
            <Body
              color={quizType === opt.value ? '#FFFFFF' : colors.text}
              style={{ fontWeight: quizType === opt.value ? 'bold' : 'normal' }}
            >
              {opt.label}
            </Body>
          </Pressable>
        ))}
      </View>

      <Body style={{ marginBottom: spacing.sm, fontWeight: 'bold' }}>
        レベル
      </Body>
      <View
        style={[
          styles.optionRow,
          { flexWrap: 'wrap', marginBottom: spacing.lg },
        ]}
      >
        {LEVEL_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setQuizLevel(opt.value)}
            style={[
              styles.optionChip,
              {
                backgroundColor:
                  quizLevel === opt.value ? colors.primary : colors.surface,
                borderColor:
                  quizLevel === opt.value ? colors.primary : colors.border,
              },
            ]}
          >
            <Body
              color={quizLevel === opt.value ? '#FFFFFF' : colors.text}
              style={{
                fontWeight: quizLevel === opt.value ? 'bold' : 'normal',
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

      <Button title="スタート" onPress={startQuiz} size="lg" />
    </ScrollView>
  );

  const renderPlaying = () => {
    if (questions.length === 0) return null;
    const question = questions[currentIndex];

    return (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
      >
        <View style={[styles.headerRow, { marginBottom: spacing.md }]}>
          <Body color={colors.textSecondary}>
            第{currentIndex + 1}問 / {questions.length}
          </Body>
          <Body color={colors.primary} style={{ fontWeight: 'bold' }}>
            {score}問正解
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
          {question.source === 'vocabulary' && (
            <Caption
              style={{
                textAlign: 'center',
                marginBottom: spacing.sm,
                color: colors.textMuted,
              }}
            >
              次の英単語の意味は？
            </Caption>
          )}
          {question.source === 'grammar' && (
            <Caption
              style={{
                textAlign: 'center',
                marginBottom: spacing.sm,
                color: colors.textMuted,
              }}
            >
              空欄に当てはまる語句は？
            </Caption>
          )}
          <H2
            align="center"
            style={{
              fontSize: question.source === 'vocabulary' ? 32 : 18,
              lineHeight: question.source === 'vocabulary' ? 40 : 28,
            }}
          >
            {question.questionText}
          </H2>
          {question.subText && (
            <Caption
              style={{
                textAlign: 'center',
                marginTop: spacing.xs,
                color: colors.textMuted,
              }}
            >
              {question.subText}
            </Caption>
          )}
        </Card>

        <View style={{ gap: spacing.sm }}>
          {question.options.map((option, index) => {
            const isEliminated = eliminatedIndices.includes(index);
            if (isEliminated) {
              return (
                <Pressable
                  key={index}
                  disabled
                  style={[
                    styles.answerButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      opacity: 0.3,
                    },
                  ]}
                >
                  <Body color={colors.textMuted} style={{ textAlign: 'center' }}>
                    ---
                  </Body>
                </Pressable>
              );
            }

            return (
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
                  ({String.fromCharCode(65 + index)}) {option}
                </Body>
              </Pressable>
            );
          })}
        </View>

        {!hintUsed && rewardedLoaded && (
          <Button
            title="ヒント（広告を見て2択に絞る）"
            onPress={handleUseHint}
            variant="ghost"
            style={{ marginTop: spacing.md }}
          />
        )}
      </ScrollView>
    );
  };

  const renderFeedback = () => {
    if (questions.length === 0) return null;
    const question = questions[currentIndex];

    return (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
      >
        <View style={[styles.headerRow, { marginBottom: spacing.md }]}>
          <Body color={colors.textSecondary}>
            第{currentIndex + 1}問 / {questions.length}
          </Body>
          <Body color={colors.primary} style={{ fontWeight: 'bold' }}>
            {score}問正解
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
          <H3 style={{ marginBottom: spacing.sm }}>
            {question.source === 'vocabulary' ? question.questionText : '問題文'}
          </H3>
          {question.source === 'grammar' && (
            <Body style={{ marginBottom: spacing.md, lineHeight: 24 }}>
              {question.questionText}
            </Body>
          )}

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
                    ({String.fromCharCode(65 + index)}) {option}
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
            currentIndex + 1 >= questions.length ? '結果を見る' : '次の問題へ'
          }
          onPress={handleNext}
          size="lg"
        />
      </ScrollView>
    );
  };

  const renderResult = () => {
    const accuracy =
      questions.length > 0
        ? Math.round((score / questions.length) * 100)
        : 0;

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
                {score}
              </Body>
              <Caption style={{ textAlign: 'center' }}>
                / {questions.length} 正解
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
            onPress={handleRetry}
            variant="outline"
            size="lg"
          />
        </View>
      </ScrollView>
    );
  };

  return (
    <ScreenWrapper>
      {phase === 'setup' && renderSetup()}
      {phase === 'playing' && renderPlaying()}
      {phase === 'feedback' && renderFeedback()}
      {phase === 'result' && renderResult()}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
