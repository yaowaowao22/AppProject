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
  featureToAnimal: '特徴→動物',
  emojiToName: '絵文字→名前',
  habitat: '生息地クイズ',
  trueFalse: '豆知識○×',
};

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { trackAction } = useInterstitialAd();
  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd((reward) => {
    setHints((prev) => prev + reward.amount);
  });
  const [history, setHistory] = useLocalStorage<QuizResult[]>('animal-quiz-history', []);

  const mode: QuizMode = route.params?.mode ?? 'featureToAnimal';
  const count: number = route.params?.count ?? 10;
  const category: string | undefined = route.params?.category;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('playing');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hints, setHints] = useState(0);

  const startNewQuiz = () => {
    const generated = generateQuiz(mode, count, category);
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
  }, [route.params?.mode, route.params?.count, route.params?.category, route.params?.timestamp]);

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
        category,
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

    if (currentQuestion.type === 'trueFalse') return;

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
            <Body style={{ fontSize: 64, textAlign: 'center', marginBottom: spacing.lg }}>
              🐾
            </Body>
            <H2 align="center" style={{ marginBottom: spacing.md }}>
              動物クイズ
            </H2>
            <Body
              color={colors.textSecondary}
              style={{ textAlign: 'center', marginBottom: spacing.xl }}
            >
              スタートタブからモードを選んで{'\n'}クイズを始めましょう
            </Body>
            <Button
              title="スタート画面へ"
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
    let gradeEmoji = '😢';
    let gradeText = 'もう少しがんばろう！';
    if (accuracy === 100) {
      gradeEmoji = '🎉';
      gradeText = 'パーフェクト！動物博士認定！';
    } else if (accuracy >= 80) {
      gradeEmoji = '😄';
      gradeText = 'すごい！動物に詳しいね！';
    } else if (accuracy >= 60) {
      gradeEmoji = '😊';
      gradeText = 'いい調子！もう少し！';
    } else if (accuracy >= 40) {
      gradeEmoji = '🤔';
      gradeText = 'まだまだこれから！';
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
            結果発表
          </H1>
          <Caption style={{ textAlign: 'center', marginBottom: spacing.xl }}>
            {modeLabels[mode]}モード{category ? ` (${category})` : ''}
          </Caption>

          <Card style={[styles.resultCard, { padding: spacing.xl, marginBottom: spacing.lg }]}>
            <H1 align="center" color={colors.primary}>
              {score} / {questions.length}
            </H1>
            <Body
              color={colors.textSecondary}
              style={{ textAlign: 'center', marginTop: spacing.xs }}
            >
              正答率 {accuracy}%
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
            <Button title="もう一度チャレンジ" onPress={handleRetry} size="lg" />
            <Button
              title="スタート画面にもどる"
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
          <Body style={{ textAlign: 'center' }}>読み込み中...</Body>
        </View>
      </ScreenWrapper>
    );
  }

  const progress = (currentIndex + 1) / questions.length;
  const isTrueFalse = currentQuestion.type === 'trueFalse';

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <View style={[styles.header, { marginBottom: spacing.md }]}>
          <Caption>
            {modeLabels[mode]}
            {category ? ` (${category})` : ''}
          </Caption>
          <Body style={{ fontWeight: 'bold' }}>
            {currentIndex + 1} / {questions.length}
          </Body>
          <Body color={colors.primary} style={{ fontWeight: 'bold' }}>
            {score}問正解
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
          <Body style={{ fontSize: 72, textAlign: 'center', marginBottom: spacing.md }}>
            {currentQuestion.displayEmoji}
          </Body>
          <H3 align="center" color={colors.textSecondary}>
            {currentQuestion.questionText}
          </H3>
        </Card>

        <View
          style={[
            isTrueFalse ? styles.trueFalseContainer : styles.choicesContainer,
            { gap: spacing.sm },
          ]}
        >
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
                  isTrueFalse ? styles.trueFalseButton : styles.choiceButton,
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
                    fontSize: isTrueFalse ? 20 : 16,
                    color: textColor,
                  }}
                >
                  {choice}
                </Body>
              </TouchableOpacity>
            );
          })}
        </View>

        {phase === 'playing' && !isTrueFalse && (
          <View style={{ marginTop: spacing.sm }}>
            <Button
              title={hints > 0 ? `ヒントを使う (${hints})` : '広告を見てヒント獲得'}
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
              {isCorrect ? '正解！' : '不正解...'}
            </H3>
            {!isTrueFalse && (
              <Caption style={{ textAlign: 'center', marginBottom: spacing.xs }}>
                正解: {currentQuestion.choices[currentQuestion.correctIndex]}
              </Caption>
            )}
            <Caption
              style={{
                textAlign: 'center',
                marginBottom: spacing.sm,
                fontStyle: 'italic',
              }}
            >
              💡 {currentQuestion.fact}
            </Caption>

            <View style={{ marginTop: spacing.md }}>
              <Button
                title={
                  currentIndex + 1 >= questions.length ? '結果を見る' : '次の問題へ'
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
    minHeight: 160,
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
  trueFalseContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  trueFalseButton: {
    flex: 1,
    marginHorizontal: 4,
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
