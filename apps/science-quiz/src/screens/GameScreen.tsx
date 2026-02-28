import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { generateQuiz, shuffleArray } from '../data/questions';
import type { Question, Subject } from '../data/questions';
import type { QuizResult } from './TitleScreen';

type GamePhase = 'playing' | 'feedback' | 'result';

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const route = useRoute<any>();
  const { trackAction } = useInterstitialAd();
  const [results, setResults] = useLocalStorage<QuizResult[]>(
    'science_quiz_results',
    []
  );

  const subjectParam: Subject | 'all' = route.params?.subject ?? 'all';
  const countParam: number = route.params?.count ?? 10;

  const [questions, setQuestions] = useState<Question[]>(() =>
    generateQuiz(subjectParam, countParam)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<GamePhase>('playing');
  const [eliminatedIndices, setEliminatedIndices] = useState<number[]>([]);
  const [hintUsed, setHintUsed] = useState(false);

  const hintUsedRef = useRef(false);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      const question = questions[currentIndex];
      const wrongIndices = question.options
        .map((_, i) => i)
        .filter((i) => i !== question.correctIndex);
      const shuffledWrong = shuffleArray(wrongIndices);
      setEliminatedIndices(shuffledWrong.slice(0, 2));
      hintUsedRef.current = true;
      setHintUsed(true);
    }
  });

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
      const subjectLabel = subjectParam === 'all' ? '全科目' : subjectParam;
      const result: QuizResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        subject: subjectLabel,
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
  }, [currentIndex, questions, score, subjectParam, results, setResults, trackAction]);

  const handleRetry = useCallback(() => {
    const newQuestions = generateQuiz(subjectParam, countParam);
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setEliminatedIndices([]);
    setHintUsed(false);
    hintUsedRef.current = false;
    setPhase('playing');
  }, [subjectParam, countParam]);

  const handleUseHint = useCallback(() => {
    if (hintUsedRef.current) return;
    if (rewardedLoaded) {
      showRewardedAd();
    }
  }, [rewardedLoaded, showRewardedAd]);

  const progressPercent =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

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
          <Caption
            style={{
              textAlign: 'center',
              marginBottom: spacing.sm,
              color: colors.primary,
            }}
          >
            [{question.subject}]
          </Caption>
          <H3
            align="center"
            style={{
              fontSize: 18,
              lineHeight: 28,
            }}
          >
            {question.question}
          </H3>
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
          <Caption
            style={{
              textAlign: 'center',
              marginBottom: spacing.xs,
              color: colors.primary,
            }}
          >
            [{question.subject}]
          </Caption>
          <H3 style={{ marginBottom: spacing.md, lineHeight: 26 }}>
            {question.question}
          </H3>

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
      gradeMessage = '素晴らしい！科学マスターレベルです！';
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
          <Button title="もう一度挑戦する" onPress={handleRetry} size="lg" />
        </View>
      </ScrollView>
    );
  };

  return (
    <ScreenWrapper>
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
