import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { QuizMode, QuizResult, Question } from '../types';
import { generateQuiz } from '../data/quizGenerator';

type GamePhase = 'playing' | 'feedback' | 'result';

const modeLabels: Record<QuizMode, string> = {
  countryToCapital: '\u56FD\u2192\u9996\u90FD',
  capitalToCountry: '\u9996\u90FD\u2192\u56FD',
  continent: '\u5927\u9678\u5225',
  worldShuffle: '\u5168\u4E16\u754C',
};

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { trackAction } = useInterstitialAd();
  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd((reward) => {
    setHints((prev) => prev + reward.amount);
  });
  const [history, setHistory] = useLocalStorage<QuizResult[]>('capital-quiz-history', []);

  const mode: QuizMode = route.params?.mode ?? 'countryToCapital';
  const count: number = route.params?.count ?? 10;
  const continent: string | undefined = route.params?.continent;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('playing');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hints, setHints] = useState(0);

  const startNewQuiz = () => {
    const generated = generateQuiz(mode, count, continent);
    setQuestions(generated);
    setCurrentIndex(0);
    setScore(0);
    setPhase('playing');
    setSelectedAnswer(null);
    setIsCorrect(false);
    setHasStarted(true);
  };

  useEffect(() => {
    if (route.params?.mode) {
      startNewQuiz();
    }
  }, [route.params?.mode, route.params?.count, route.params?.continent, route.params?.timestamp]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (choiceIndex: number) => {
    if (phase !== 'playing') return;

    const correct = choiceIndex === currentQuestion.correctIndex;
    setSelectedAnswer(choiceIndex);
    setIsCorrect(correct);
    if (correct) {
      setScore((prev) => prev + 1);
    }
    setPhase('feedback');
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      const result: QuizResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        mode,
        continent,
        correct: score,
        total: questions.length,
      };
      setHistory([result, ...history]);
      trackAction();
      setPhase('result');
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(false);
      setPhase('playing');
    }
  };

  const handleUseHint = () => {
    if (phase !== 'playing' || !currentQuestion) return;

    if (hints > 0) {
      setHints((prev) => prev - 1);
      const wrongIndices = currentQuestion.choices
        .map((_, i) => i)
        .filter((i) => i !== currentQuestion.correctIndex);
      const shuffledWrong = wrongIndices.sort(() => Math.random() - 0.5);
      const removeIndex = shuffledWrong[0];
      const newChoices = currentQuestion.choices.map((c, i) =>
        i === removeIndex ? '' : c
      );
      const updatedQuestions = [...questions];
      updatedQuestions[currentIndex] = { ...currentQuestion, choices: newChoices };
      setQuestions(updatedQuestions);
    } else if (rewardedLoaded) {
      showRewardedAd();
    }
  };

  const handleRetry = () => {
    startNewQuiz();
  };

  const handleBackToTitle = () => {
    navigation.navigate('Title');
  };

  if (!hasStarted) {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.xl }]}>
          <View style={styles.emptyState}>
            <Body style={{ fontSize: 48, textAlign: 'center', marginBottom: spacing.lg }}>
              {'\u{1F3DB}'}
            </Body>
            <H2 align="center" style={{ marginBottom: spacing.md }}>
              {'\u9996\u90FD\u30AF\u30A4\u30BA'}
            </H2>
            <Body
              color={colors.textSecondary}
              style={{ textAlign: 'center', marginBottom: spacing.xl }}
            >
              {'\u30B9\u30BF\u30FC\u30C8\u30BF\u30D6\u304B\u3089\u30E2\u30FC\u30C9\u3092\u9078\u3093\u3067\n\u30AF\u30A4\u30BA\u3092\u59CB\u3081\u307E\u3057\u3087\u3046'}
            </Body>
            <Button
              title={'\u30B9\u30BF\u30FC\u30C8\u753B\u9762\u3078'}
              onPress={() => navigation.navigate('Title')}
              variant="outline"
            />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  if (phase === 'result') {
    const accuracy = Math.round((score / questions.length) * 100);
    let gradeEmoji = '\u{1F622}';
    let gradeText = '\u3082\u3046\u5C11\u3057\u304C\u3093\u3070\u308D\u3046\uFF01';
    if (accuracy === 100) {
      gradeEmoji = '\u{1F389}';
      gradeText = '\u30D1\u30FC\u30D5\u30A7\u30AF\u30C8\uFF01\u3059\u3070\u3089\u3057\u3044\uFF01';
    } else if (accuracy >= 80) {
      gradeEmoji = '\u{1F604}';
      gradeText = '\u3059\u3054\u3044\uFF01\u3088\u304F\u3067\u304D\u307E\u3057\u305F\uFF01';
    } else if (accuracy >= 60) {
      gradeEmoji = '\u{1F60A}';
      gradeText = '\u3044\u3044\u8ABF\u5B50\uFF01\u3082\u3046\u5C11\u3057\uFF01';
    } else if (accuracy >= 40) {
      gradeEmoji = '\u{1F914}';
      gradeText = '\u307E\u3060\u307E\u3060\u3053\u308C\u304B\u3089\uFF01';
    }

    return (
      <ScreenWrapper>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.resultContainer, { padding: spacing.xl }]}
        >
          <Body style={{ fontSize: 64, textAlign: 'center', marginBottom: spacing.lg }}>
            {gradeEmoji}
          </Body>
          <H1 align="center" style={{ marginBottom: spacing.sm }}>
            {'\u7D50\u679C\u767A\u8868'}
          </H1>
          <Caption style={{ textAlign: 'center', marginBottom: spacing.xl }}>
            {modeLabels[mode]}{'\u30E2\u30FC\u30C9'}{continent ? ` (${continent})` : ''}
          </Caption>

          <Card style={[styles.resultCard, { padding: spacing.xl, marginBottom: spacing.lg }]}>
            <H1 align="center" color={colors.primary}>
              {score} / {questions.length}
            </H1>
            <Body
              color={colors.textSecondary}
              style={{ textAlign: 'center', marginTop: spacing.xs }}
            >
              {'\u6B63\u7B54\u7387'} {accuracy}%
            </Body>
          </Card>

          <Body
            style={{
              textAlign: 'center',
              marginBottom: spacing.xl,
              fontSize: 16,
            }}
          >
            {gradeText}
          </Body>

          <View style={{ gap: spacing.sm }}>
            <Button title={'\u3082\u3046\u4E00\u5EA6\u30C1\u30E3\u30EC\u30F3\u30B8'} onPress={handleRetry} size="lg" />
            <Button
              title={'\u30B9\u30BF\u30FC\u30C8\u753B\u9762\u306B\u3082\u3069\u308B'}
              onPress={handleBackToTitle}
              variant="outline"
            />
          </View>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  if (!currentQuestion) {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.xl }]}>
          <Body style={{ textAlign: 'center' }}>{'\u8AAD\u307F\u8FBC\u307F\u4E2D...'}</Body>
        </View>
      </ScreenWrapper>
    );
  }

  const progress = (currentIndex + 1) / questions.length;

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <View style={[styles.header, { marginBottom: spacing.md }]}>
          <Caption>{modeLabels[mode]}{continent ? ` (${continent})` : ''}</Caption>
          <Body style={{ fontWeight: 'bold' }}>
            {currentIndex + 1} / {questions.length}
          </Body>
          <Body color={colors.primary} style={{ fontWeight: 'bold' }}>
            {score}{'\u554F\u6B63\u89E3'}
          </Body>
        </View>

        <View
          style={[
            styles.progressBar,
            {
              backgroundColor: colors.border,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${progress * 100}%`,
              },
            ]}
          />
        </View>

        <Card
          style={[
            styles.questionCard,
            {
              padding: spacing.xl,
              marginBottom: spacing.lg,
            },
          ]}
        >
          {currentQuestion.displayEmoji ? (
            <>
              <Body style={{ fontSize: 72, textAlign: 'center', marginBottom: spacing.md }}>
                {currentQuestion.displayEmoji}
              </Body>
              <H3 align="center" color={colors.textSecondary}>
                {currentQuestion.questionText}
              </H3>
            </>
          ) : (
            <H2 align="center">{currentQuestion.questionText}</H2>
          )}
        </Card>

        <View style={[styles.choicesContainer, { gap: spacing.sm }]}>
          {currentQuestion.choices.map((choice, index) => {
            if (choice === '') return <View key={index} style={styles.choiceButton} />;

            let bgColor = colors.surface;
            let borderColor = colors.border;
            let textColor = colors.text;

            if (phase === 'feedback') {
              if (index === currentQuestion.correctIndex) {
                bgColor = colors.success;
                borderColor = colors.success;
                textColor = '#FFFFFF';
              } else if (index === selectedAnswer && !isCorrect) {
                bgColor = colors.error;
                borderColor = colors.error;
                textColor = '#FFFFFF';
              }
            }

            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleAnswer(index)}
                disabled={phase !== 'playing'}
                activeOpacity={0.7}
                style={[
                  styles.choiceButton,
                  {
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                    borderWidth: 2,
                    borderRadius: 12,
                    padding: spacing.lg,
                  },
                ]}
              >
                <Body
                  style={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: 16,
                    color: textColor,
                  }}
                >
                  {choice}
                </Body>
              </TouchableOpacity>
            );
          })}
        </View>

        {phase === 'playing' && (
          <View style={{ marginTop: spacing.sm }}>
            <Button
              title={hints > 0 ? `\u30D2\u30F3\u30C8\u3092\u4F7F\u3046 (${hints})` : '\u5E83\u544A\u3092\u898B\u3066\u30D2\u30F3\u30C8\u7372\u5F97'}
              onPress={handleUseHint}
              variant="ghost"
              disabled={hints <= 0 && !rewardedLoaded}
            />
          </View>
        )}

        {phase === 'feedback' && (
          <Card
            style={[
              styles.feedbackCard,
              {
                padding: spacing.lg,
                marginTop: spacing.md,
                backgroundColor: isCorrect ? colors.success + '15' : colors.error + '15',
                borderWidth: 1,
                borderColor: isCorrect ? colors.success : colors.error,
              },
            ]}
          >
            <H3
              align="center"
              color={isCorrect ? colors.success : colors.error}
              style={{ marginBottom: spacing.xs }}
            >
              {isCorrect ? '\u6B63\u89E3\uFF01' : '\u4E0D\u6B63\u89E3...'}
            </H3>
            <Caption style={{ textAlign: 'center', marginBottom: spacing.xs }}>
              {'\u6B63\u89E3: '}{currentQuestion.correctAnswer}
            </Caption>
            <Caption
              style={{
                textAlign: 'center',
                marginBottom: spacing.sm,
                fontStyle: 'italic',
              }}
              color={colors.textSecondary}
            >
              {currentQuestion.funFact}
            </Caption>

            <View style={{ marginTop: spacing.md }}>
              <Button
                title={
                  currentIndex + 1 >= questions.length ? '\u7D50\u679C\u3092\u898B\u308B' : '\u6B21\u306E\u554F\u984C\u3078'
                }
                onPress={handleNext}
                size="lg"
              />
            </View>
          </Card>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  questionCard: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 140,
  },
  choicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  choiceButton: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 4,
  },
  feedbackCard: {
    borderRadius: 12,
  },
  resultContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  resultCard: {
    borderRadius: 16,
    alignItems: 'center',
  },
});
