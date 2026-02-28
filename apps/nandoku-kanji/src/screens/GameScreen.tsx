import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import {
  CATEGORIES,
  QUESTION_COUNTS,
  nandokuKanjiData,
  getEntriesByCategory,
  shuffleEntries,
  generateChoices,
} from '../data/nandokuKanji';
import type { NandokuEntry } from '../data/nandokuKanji';
import type { QuizResult } from '../types';

type GamePhase = 'setup' | 'playing' | 'feedback' | 'result';

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();
  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd((reward) => {
    setHints((prev) => prev + reward.amount);
  });

  const [history, setHistory] = useLocalStorage<QuizResult[]>('nandoku-history', []);

  const [phase, setPhase] = useState<GamePhase>('setup');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCount, setSelectedCount] = useState(10);
  const [currentQuestions, setCurrentQuestions] = useState<NandokuEntry[]>([]);
  const [currentChoices, setCurrentChoices] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [hints, setHints] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const generateChoicesForIndex = useCallback(
    (questions: NandokuEntry[], index: number) => {
      const entry = questions[index];
      return generateChoices(entry, nandokuKanjiData);
    },
    [],
  );

  const startQuiz = useCallback(() => {
    const available = getEntriesByCategory(selectedCategory);
    const count = Math.min(selectedCount, available.length);
    const selected = shuffleEntries(available, count);
    setCurrentQuestions(selected);
    setCurrentIndex(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setHintUsed(false);
    setCurrentChoices(generateChoicesForIndex(selected, 0));
    setPhase('playing');
  }, [selectedCategory, selectedCount, generateChoicesForIndex]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (phase !== 'playing') return;
      const question = currentQuestions[currentIndex];
      const isCorrect = answer === question.reading;
      setSelectedAnswer(answer);
      setAnswers((prev) => [...prev, isCorrect]);
      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
      }
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setPhase('feedback');
    },
    [phase, currentQuestions, currentIndex, fadeAnim],
  );

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= currentQuestions.length) {
      const total = currentQuestions.length;
      const percentage = Math.round((correctCount / total) * 100);
      const categoryLabel =
        CATEGORIES.find((c) => c.key === selectedCategory)?.label ?? selectedCategory;
      const result: QuizResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        category: categoryLabel,
        correct: correctCount,
        total,
        percentage,
      };
      setHistory([result, ...history]);
      trackAction();
      setPhase('result');
    } else {
      setCurrentIndex(nextIndex);
      setSelectedAnswer(null);
      setHintUsed(false);
      setCurrentChoices(generateChoicesForIndex(currentQuestions, nextIndex));
      setPhase('playing');
    }
  }, [
    currentIndex,
    currentQuestions,
    correctCount,
    selectedCategory,
    history,
    setHistory,
    trackAction,
    generateChoicesForIndex,
  ]);

  const handleUseHint = useCallback(() => {
    if (hintUsed) return;
    if (hints > 0) {
      setHints((prev) => prev - 1);
      setHintUsed(true);
      const question = currentQuestions[currentIndex];
      // ヒント：不正解の選択肢を2つ消す
      const wrongChoices = currentChoices.filter((c) => c !== question.reading);
      const keepWrong = wrongChoices.length > 0 ? wrongChoices[0] : null;
      const newChoices = keepWrong
        ? [question.reading, keepWrong].sort(() => Math.random() - 0.5)
        : [question.reading];
      setCurrentChoices(newChoices);
    } else if (rewardedLoaded) {
      showRewardedAd();
    }
  }, [hints, hintUsed, rewardedLoaded, showRewardedAd, currentQuestions, currentIndex, currentChoices]);

  const resetQuiz = useCallback(() => {
    setPhase('setup');
    setCurrentQuestions([]);
    setCurrentIndex(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setHintUsed(false);
  }, []);

  const currentQuestion = currentQuestions[currentIndex];
  const progress =
    currentQuestions.length > 0 ? (currentIndex + 1) / currentQuestions.length : 0;
  const isCorrectAnswer =
    selectedAnswer !== null && currentQuestion
      ? selectedAnswer === currentQuestion.reading
      : false;

  // ─── 設定画面 ───
  if (phase === 'setup') {
    return (
      <ScreenWrapper>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.setupContainer, { padding: spacing.xl }]}
        >
          <H2 style={{ marginBottom: spacing.xl }}>クイズ設定</H2>

          <Body style={{ marginBottom: spacing.sm, fontWeight: '600' }}>
            カテゴリ
          </Body>
          <View style={[styles.optionGrid, { marginBottom: spacing.xl }]}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => setSelectedCategory(cat.key)}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.lg,
                      borderRadius: spacing.sm,
                      marginRight: spacing.sm,
                      marginBottom: spacing.sm,
                    },
                  ]}
                >
                  <Body
                    color={isSelected ? '#FFFFFF' : colors.text}
                    style={{ fontSize: 14 }}
                  >
                    {cat.label}
                  </Body>
                </Pressable>
              );
            })}
          </View>

          <Body style={{ marginBottom: spacing.sm, fontWeight: '600' }}>
            問題数
          </Body>
          <View style={[styles.optionGrid, { marginBottom: spacing.xxl }]}>
            {QUESTION_COUNTS.map((qc) => {
              const isSelected = selectedCount === qc.value;
              const available = getEntriesByCategory(selectedCategory).length;
              const disabled = qc.value > available;
              return (
                <Pressable
                  key={qc.value}
                  onPress={() => !disabled && setSelectedCount(qc.value)}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: disabled
                        ? colors.surface
                        : isSelected
                          ? colors.primary
                          : colors.surface,
                      borderColor: disabled
                        ? colors.border
                        : isSelected
                          ? colors.primary
                          : colors.border,
                      opacity: disabled ? 0.4 : 1,
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.xl,
                      borderRadius: spacing.sm,
                      marginRight: spacing.sm,
                      marginBottom: spacing.sm,
                    },
                  ]}
                >
                  <Body
                    color={isSelected && !disabled ? '#FFFFFF' : colors.text}
                    style={{ fontSize: 14 }}
                  >
                    {qc.label}
                  </Body>
                </Pressable>
              );
            })}
          </View>

          <Caption color={colors.textMuted} style={{ marginBottom: spacing.lg, textAlign: 'center' }}>
            {selectedCategory === 'all'
              ? '全カテゴリ'
              : CATEGORIES.find((c) => c.key === selectedCategory)?.label}
            から{Math.min(selectedCount, getEntriesByCategory(selectedCategory).length)}問出題されます
          </Caption>

          <Button title="クイズ開始" onPress={startQuiz} size="lg" />
        </ScrollView>
      </ScreenWrapper>
    );
  }

  // ─── 結果画面 ───
  if (phase === 'result') {
    const total = currentQuestions.length;
    const percentage = Math.round((correctCount / total) * 100);
    const excellent = percentage >= 80;

    return (
      <ScreenWrapper>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.resultContainer, { padding: spacing.xl }]}
        >
          <View style={[styles.resultHeader, { marginBottom: spacing.xl }]}>
            <Ionicons
              name={excellent ? 'trophy' : 'ribbon'}
              size={80}
              color={excellent ? colors.success : colors.primary}
            />
            <H1
              style={{ marginTop: spacing.lg }}
              align="center"
            >
              {excellent ? '素晴らしい！' : 'お疲れ様！'}
            </H1>
            <Caption
              color={colors.textSecondary}
              style={{ marginTop: spacing.sm, textAlign: 'center' }}
            >
              {excellent
                ? '難読漢字マスターへの道を歩んでいます！'
                : 'もっと練習して漢字力を磨きましょう！'}
            </Caption>
          </View>

          <Card style={[styles.scoreCard, { padding: spacing.xl, marginBottom: spacing.xl }]}>
            <View style={styles.scoreRow}>
              <Body color={colors.textSecondary}>正解数</Body>
              <H2>{correctCount} / {total}</H2>
            </View>
            <View
              style={[
                styles.scoreDivider,
                { backgroundColor: colors.border, marginVertical: spacing.md },
              ]}
            />
            <View style={styles.scoreRow}>
              <Body color={colors.textSecondary}>正答率</Body>
              <H2 style={{ color: excellent ? colors.success : colors.primary }}>
                {percentage}%
              </H2>
            </View>
          </Card>

          <H3 style={{ marginBottom: spacing.md }}>解答一覧</H3>
          {currentQuestions.map((q, idx) => {
            const wasCorrect = answers[idx];
            return (
              <View
                key={`${q.kanji}-${idx}`}
                style={[
                  styles.answerReview,
                  {
                    backgroundColor: colors.surface,
                    borderLeftColor: wasCorrect ? colors.success : colors.error,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                    borderRadius: spacing.xs,
                  },
                ]}
              >
                <View style={styles.answerReviewHeader}>
                  <Body style={{ fontSize: 20, fontWeight: '700' }}>{q.kanji}</Body>
                  <Ionicons
                    name={wasCorrect ? 'checkmark-circle' : 'close-circle'}
                    size={18}
                    color={wasCorrect ? colors.success : colors.error}
                  />
                </View>
                <Caption color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
                  読み: {q.reading}　意味: {q.meaning}
                </Caption>
              </View>
            );
          })}

          <View style={{ marginTop: spacing.xl, gap: spacing.sm, paddingBottom: spacing.xxl }}>
            <Button title="もう一度挑戦" onPress={startQuiz} size="lg" />
            <Button title="設定に戻る" onPress={resetQuiz} variant="outline" size="lg" />
          </View>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  // ─── クイズ画面 ───
  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        {/* 進捗バー */}
        <View style={{ marginBottom: spacing.md }}>
          <View style={styles.progressHeader}>
            <Caption color={colors.textSecondary}>
              問題 {currentIndex + 1} / {currentQuestions.length}
            </Caption>
            <Caption color={colors.textSecondary}>
              正解: {correctCount}
            </Caption>
          </View>
          <View
            style={[
              styles.progressBarBg,
              {
                backgroundColor: colors.surface,
                borderRadius: spacing.xs,
                marginTop: spacing.sm,
              },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.primary,
                  borderRadius: spacing.xs,
                  width: `${progress * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* カテゴリ表示 */}
        <Caption
          color={colors.textMuted}
          style={{ marginBottom: spacing.sm }}
        >
          {currentQuestion?.category}
        </Caption>

        {/* 漢字表示カード */}
        <Card style={[styles.kanjiCard, { padding: spacing.xl, marginBottom: spacing.lg }]}>
          <Body
            color={colors.textMuted}
            style={{ textAlign: 'center', marginBottom: spacing.sm, fontSize: 13 }}
          >
            この漢字の読みは？
          </Body>
          <H1
            align="center"
            style={{ fontSize: 48, lineHeight: 64 }}
          >
            {currentQuestion?.kanji}
          </H1>
        </Card>

        {/* フィードバック */}
        {phase === 'feedback' && currentQuestion && (
          <Animated.View
            style={[
              styles.feedbackContainer,
              {
                backgroundColor: isCorrectAnswer
                  ? 'rgba(34, 197, 94, 0.08)'
                  : 'rgba(239, 68, 68, 0.08)',
                borderColor: isCorrectAnswer ? colors.success : colors.error,
                borderRadius: spacing.md,
                padding: spacing.lg,
                marginBottom: spacing.lg,
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.feedbackHeader}>
              <Ionicons
                name={isCorrectAnswer ? 'checkmark-circle' : 'close-circle'}
                size={28}
                color={isCorrectAnswer ? colors.success : colors.error}
              />
              <H3
                style={{
                  marginLeft: spacing.sm,
                  color: isCorrectAnswer ? colors.success : colors.error,
                }}
              >
                {isCorrectAnswer ? '正解！' : '不正解'}
              </H3>
            </View>
            <Body style={{ fontSize: 14, marginTop: spacing.sm }}>
              読み: {currentQuestion.reading}
            </Body>
            <Caption color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
              意味: {currentQuestion.meaning}
            </Caption>
          </Animated.View>
        )}

        {/* 選択肢 / 次へボタン */}
        <View style={styles.buttonArea}>
          {phase === 'playing' ? (
            <View style={{ gap: spacing.sm }}>
              <View style={styles.choiceGrid}>
                {currentChoices.map((choice, idx) => (
                  <Pressable
                    key={`${choice}-${idx}`}
                    onPress={() => handleAnswer(choice)}
                    style={[
                      styles.choiceButton,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderRadius: spacing.md,
                        padding: spacing.md,
                      },
                    ]}
                  >
                    <Body style={{ fontSize: 18, textAlign: 'center', fontWeight: '600' }}>
                      {choice}
                    </Body>
                  </Pressable>
                ))}
              </View>
              <Button
                title={hints > 0 ? `ヒントを使う（残り${hints}）` : '広告を見てヒント獲得'}
                onPress={handleUseHint}
                variant="ghost"
                disabled={hintUsed}
              />
            </View>
          ) : (
            <Button
              title={
                currentIndex + 1 >= currentQuestions.length
                  ? '結果を見る'
                  : '次の問題'
              }
              onPress={handleNext}
              size="lg"
            />
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  setupContainer: {
    flexGrow: 1,
  },
  resultContainer: {
    flexGrow: 1,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    borderWidth: 1.5,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBarBg: {
    height: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  kanjiCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackContainer: {
    borderWidth: 1,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choiceButton: {
    borderWidth: 1.5,
    width: '48%',
    flexGrow: 1,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonArea: {
    paddingBottom: 8,
  },
  resultHeader: {
    alignItems: 'center',
    paddingTop: 20,
  },
  scoreCard: {},
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreDivider: {
    height: 1,
  },
  answerReview: {
    borderLeftWidth: 3,
  },
  answerReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
