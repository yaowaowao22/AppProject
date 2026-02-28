import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import { generateQuiz, eliminateWrongOptions } from '../data/quizEngine';
import type { QuizQuestion, QuizResult, QuizSettings, EikenLevel, QuestionType } from '../types';

type GamePhase = 'setup' | 'playing' | 'feedback' | 'result';

const LEVEL_OPTIONS: { label: string; value: EikenLevel | 'all' }[] = [
  { label: '5級', value: '5級' },
  { label: '4級', value: '4級' },
  { label: '3級', value: '3級' },
  { label: '準2級', value: '準2級' },
  { label: '2級', value: '2級' },
  { label: '全級', value: 'all' },
];

const TYPE_OPTIONS: { label: string; value: QuestionType | 'mixed' }[] = [
  { label: '語彙', value: 'vocabulary' },
  { label: '文法', value: 'grammar' },
  { label: '会話', value: 'conversation' },
  { label: 'ミックス', value: 'mixed' },
];

const COUNT_OPTIONS = [10, 15, 20];

function getTypeLabel(type: string): string {
  switch (type) {
    case 'vocabulary':
      return '語彙';
    case 'grammar':
      return '文法';
    case 'conversation':
      return '会話';
    default:
      return type;
  }
}

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();
  const [results, setResults] = useLocalStorage<QuizResult[]>('eiken_results', []);

  const [phase, setPhase] = useState<GamePhase>('setup');
  const [quizLevel, setQuizLevel] = useState<EikenLevel | 'all'>('5級');
  const [quizType, setQuizType] = useState<QuestionType | 'mixed'>('mixed');
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
      level: quizLevel,
      type: quizType,
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
  }, [quizLevel, quizType, questionCount]);

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
      const levelLabel = quizLevel === 'all' ? '全級' : quizLevel;
      const typeLabel = quizType === 'mixed' ? 'ミックス' : getTypeLabel(quizType);
      const result: QuizResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        level: levelLabel,
        type: typeLabel,
        correct: score,
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
  }, [currentIndex, questions, score, quizLevel, quizType, results, setResults, trackAction]);

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
        級を選択
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
              style={{ fontWeight: quizLevel === opt.value ? 'bold' : 'normal' }}
            >
              {opt.label}
            </Body>
          </Pressable>
        ))}
      </View>

      <Body style={{ marginBottom: spacing.sm, fontWeight: 'bold' }}>
        出題タイプ
      </Body>
      <View style={[styles.optionRow, { flexWrap: 'wrap', marginBottom: spacing.lg }]}>
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

    const instructionText =
      question.source === 'vocabulary'
        ? '次の文の空欄に入る最も適切な語を選びなさい。'
        : question.source === 'grammar'
        ? '次の文の空欄に入る最も適切なものを選びなさい。'
        : '次の会話の空欄に入る最も適切なものを選びなさい。';

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
          <Caption
            style={{
              textAlign: 'center',
              marginBottom: spacing.sm,
              color: colors.textMuted,
            }}
          >
            {instructionText}
          </Caption>
          <H3
            align="center"
            style={{
              fontSize: 18,
              lineHeight: 28,
            }}
          >
            {question.questionText}
          </H3>
          {question.level && (
            <Caption
              style={{
                textAlign: 'center',
                marginTop: spacing.xs,
                color: colors.primary,
              }}
            >
              [{question.level}]
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
                  ({index + 1}) {option}
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
          <H3 style={{ marginBottom: spacing.sm }}>問題文</H3>
          <Body style={{ marginBottom: spacing.md, lineHeight: 24 }}>
            {question.questionText}
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
      gradeMessage = '素晴らしい！合格レベルの実力です！';
      gradeColor = colors.success;
    } else if (accuracy >= 70) {
      gradeMessage = 'よくできました！もう少しで完璧です！';
      gradeColor = colors.primary;
    } else if (accuracy >= 50) {
      gradeMessage = 'まずまずです。苦手な分野を復習しましょう。';
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
