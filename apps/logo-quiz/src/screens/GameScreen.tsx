import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import { getRandomBrands, generateChoices, brands } from '../data/brands';
import { QuizQuestion, GameResult, GamePhase } from '../types';

function calculatePoints(totalHints: number, hintsUsed: number): number {
  if (totalHints <= 0) return 100;
  const ratio = hintsUsed / totalHints;
  if (ratio <= 0.25) return 100;
  if (ratio <= 0.5) return 75;
  if (ratio <= 0.75) return 50;
  return 25;
}

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { trackAction } = useInterstitialAd();
  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd((reward) => {
    setExtraHintTokens((prev) => prev + reward.amount);
  });
  const [history, setHistory] = useLocalStorage<GameResult[]>('brand-quiz-history', []);

  const category: string | undefined = route.params?.category;
  const count: number = route.params?.count ?? 10;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('playing');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [revealedHints, setRevealedHints] = useState(1);
  const [extraHintTokens, setExtraHintTokens] = useState(0);

  const startNewQuiz = useCallback(() => {
    const selectedBrands = getRandomBrands(count, category);
    const generated: QuizQuestion[] = selectedBrands.map((brand) => {
      const { choices, correctIndex } = generateChoices(brand, brands);
      return { brand, choices, correctIndex };
    });
    setQuestions(generated);
    setCurrentIndex(0);
    setScore(0);
    setCorrectCount(0);
    setPhase('playing');
    setSelectedAnswer(null);
    setIsCorrect(false);
    setRevealedHints(1);
    setHasStarted(true);
  }, [count, category]);

  useEffect(() => {
    if (route.params?.count) {
      startNewQuiz();
    }
  }, [route.params?.category, route.params?.count, route.params?.timestamp]);

  const currentQuestion = questions[currentIndex];
  const currentBrand = currentQuestion?.brand;

  const handleRevealNextHint = () => {
    if (!currentBrand) return;
    if (revealedHints < currentBrand.hints.length) {
      if (extraHintTokens > 0) {
        setExtraHintTokens((prev) => prev - 1);
        setRevealedHints((prev) => prev + 1);
      } else if (rewardedLoaded) {
        showRewardedAd();
      }
    }
  };

  const handleAnswer = (choiceIndex: number) => {
    if (phase !== 'playing' || !currentBrand) return;

    const correct = choiceIndex === currentQuestion.correctIndex;
    setSelectedAnswer(choiceIndex);
    setIsCorrect(correct);
    if (correct) {
      const points = calculatePoints(currentBrand.hints.length, revealedHints);
      setScore((prev) => prev + points);
      setCorrectCount((prev) => prev + 1);
    }
    setRevealedHints(currentBrand.hints.length);
    setPhase('feedback');
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      const result: GameResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        category: category || 'すべて',
        correct: correctCount,
        total: questions.length,
        totalScore: score,
        questionCount: questions.length,
      };
      setHistory([result, ...history]);
      trackAction();
      setPhase('result');
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(false);
      setRevealedHints(1);
      setPhase('playing');
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
            <Ionicons
              name="briefcase-outline"
              size={64}
              color={colors.textSecondary}
              style={{ marginBottom: spacing.lg }}
            />
            <H2 align="center" style={{ marginBottom: spacing.md }}>
              ブランドクイズ
            </H2>
            <Body
              color={colors.textSecondary}
              style={{ textAlign: 'center', marginBottom: spacing.xl }}
            >
              スタートタブからカテゴリを選んで{'\n'}クイズを始めましょう
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
    const accuracy = Math.round((correctCount / questions.length) * 100);
    const maxPossible = questions.length * 100;
    let gradeIcon: React.ComponentProps<typeof Ionicons>['name'] = 'sad-outline';
    let gradeText = 'もう少しがんばろう！';
    if (accuracy === 100) {
      gradeIcon = 'trophy';
      gradeText = 'パーフェクト！すばらしい！';
    } else if (accuracy >= 80) {
      gradeIcon = 'happy';
      gradeText = 'すごい！よくできました！';
    } else if (accuracy >= 60) {
      gradeIcon = 'thumbs-up';
      gradeText = 'いい調子！もう少し！';
    } else if (accuracy >= 40) {
      gradeIcon = 'help-circle-outline';
      gradeText = 'まだまだこれから！';
    }

    return (
      <ScreenWrapper>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.resultContainer, { padding: spacing.xl }]}
        >
          <Ionicons
            name={gradeIcon}
            size={72}
            color={colors.primary}
            style={{ alignSelf: 'center', marginBottom: spacing.lg }}
          />
          <H1 align="center" style={{ marginBottom: spacing.sm }}>
            結果発表
          </H1>
          <Caption style={{ textAlign: 'center', marginBottom: spacing.xl }}>
            {category || 'すべて'}カテゴリ
          </Caption>

          <Card style={[styles.resultCard, { padding: spacing.xl, marginBottom: spacing.md }]}>
            <H1 align="center" color={colors.primary}>
              {correctCount} / {questions.length}
            </H1>
            <Body
              color={colors.textSecondary}
              style={{ textAlign: 'center', marginTop: spacing.xs }}
            >
              正答率 {accuracy}%
            </Body>
          </Card>

          <Card style={[styles.resultCard, { padding: spacing.lg, marginBottom: spacing.lg }]}>
            <H2 align="center" color={colors.primary}>
              {score} 点
            </H2>
            <Caption style={{ textAlign: 'center', marginTop: spacing.xs }}>
              最大 {maxPossible} 点中
            </Caption>
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
  const totalHints = currentBrand.hints.length;
  const canRevealMore = revealedHints < totalHints && phase === 'playing';
  const pointsPreview = calculatePoints(totalHints, revealedHints);

  return (
    <ScreenWrapper>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
      >
        <View style={[styles.header, { marginBottom: spacing.sm }]}>
          <Caption>{category || 'すべて'}</Caption>
          <Body style={{ fontWeight: 'bold' }}>
            {currentIndex + 1} / {questions.length}
          </Body>
          <Body color={colors.primary} style={{ fontWeight: 'bold' }}>
            {score}点
          </Body>
        </View>

        <View
          style={[
            styles.progressBar,
            {
              backgroundColor: colors.border,
              marginBottom: spacing.md,
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

        {phase === 'playing' && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.sm,
            }}
          >
            <Badge
              label={`ヒント ${revealedHints}/${totalHints}`}
            />
            <Caption color={colors.primary} style={{ fontWeight: 'bold' }}>
              正解で {pointsPreview}pt
            </Caption>
          </View>
        )}

        <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
          {currentBrand.hints.map((hint, index) => {
            const isRevealed = index < revealedHints;
            return (
              <Card
                key={index}
                style={[
                  styles.hintCard,
                  {
                    padding: spacing.md,
                    backgroundColor: isRevealed ? colors.surface : colors.border + '40',
                    borderWidth: 1,
                    borderColor: isRevealed
                      ? index === 0
                        ? colors.primary
                        : colors.border
                      : colors.border + '60',
                  },
                ]}
              >
                <View style={styles.hintContent}>
                  <View
                    style={[
                      styles.hintNumber,
                      {
                        backgroundColor: isRevealed ? colors.primary : colors.border,
                        marginRight: spacing.sm,
                      },
                    ]}
                  >
                    <Caption
                      color="#FFFFFF"
                      style={{ fontWeight: 'bold', fontSize: 11 }}
                    >
                      {index + 1}
                    </Caption>
                  </View>
                  {isRevealed ? (
                    <Body style={{ flex: 1 }}>{hint}</Body>
                  ) : (
                    <Body color={colors.textSecondary} style={{ flex: 1, fontStyle: 'italic' }}>
                      ???
                    </Body>
                  )}
                </View>
              </Card>
            );
          })}
        </View>

        {phase === 'playing' && canRevealMore && (
          <View style={{ marginBottom: spacing.md }}>
            <Button
              title={
                extraHintTokens > 0
                  ? `次のヒントを見る (${extraHintTokens})`
                  : '広告を見てヒントを開放'
              }
              onPress={handleRevealNextHint}
              variant="ghost"
              disabled={extraHintTokens <= 0 && !rewardedLoaded}
            />
          </View>
        )}

        <View style={[styles.choicesContainer, { gap: spacing.sm }]}>
          {currentQuestion.choices.map((choice, index) => {
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
                    padding: spacing.md,
                  },
                ]}
              >
                <Body
                  style={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: 15,
                    color: textColor,
                  }}
                >
                  {choice}
                </Body>
              </TouchableOpacity>
            );
          })}
        </View>

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
            {isCorrect && (
              <Caption style={{ textAlign: 'center', marginBottom: spacing.xs }}>
                +{calculatePoints(totalHints, revealedHints)}ポイント
              </Caption>
            )}
            <Caption style={{ textAlign: 'center', marginBottom: spacing.xs }}>
              正解: {currentBrand.name}
            </Caption>
            {currentBrand.foundedYear && (
              <Caption
                color={colors.textSecondary}
                style={{ textAlign: 'center', marginBottom: spacing.xs }}
              >
                創業: {currentBrand.foundedYear}年 / カテゴリ: {currentBrand.category}
              </Caption>
            )}

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
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  hintCard: {
    borderRadius: 10,
  },
  hintContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hintNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
