import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage, useTimer } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import type { GameMode, GuessEntry, GameResult } from '../types';

type GamePhase = 'setup' | 'playing' | 'result';

const MODE_OPTIONS: { label: string; value: GameMode; description: string }[] = [
  { label: 'クラシック', value: 'classic', description: '1~100の数を当てよう' },
  { label: 'ハード', value: 'hard', description: '1~1000の数を当てよう' },
  { label: 'タイムアタック', value: 'timeattack', description: '60秒で何問当てられる？' },
];

function generateTarget(mode: GameMode): number {
  const max = mode === 'hard' ? 1000 : 100;
  return Math.floor(Math.random() * max) + 1;
}

function getRangeMax(mode: GameMode): number {
  return mode === 'hard' ? 1000 : 100;
}

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();
  const [results, setResults] = useLocalStorage<GameResult[]>('number_guessing_history', []);

  const [phase, setPhase] = useState<GamePhase>('setup');
  const [mode, setMode] = useState<GameMode>('classic');

  const [target, setTarget] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [guessHistory, setGuessHistory] = useState<GuessEntry[]>([]);
  const [rangeLow, setRangeLow] = useState(1);
  const [rangeHigh, setRangeHigh] = useState(100);
  const [feedback, setFeedback] = useState<'higher' | 'lower' | 'correct' | null>(null);
  const [hintUsed, setHintUsed] = useState(false);

  // Time attack state
  const [timeAttackScore, setTimeAttackScore] = useState(0);
  const timer = useTimer(60000);

  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const hintUsedRef = useRef(false);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(() => {
    // Narrow the range by 50%
    const midLow = Math.floor((rangeLow + target) / 2);
    const midHigh = Math.ceil((target + rangeHigh) / 2);
    if (target > rangeLow) setRangeLow(midLow);
    if (target < rangeHigh) setRangeHigh(midHigh);
    hintUsedRef.current = true;
    setHintUsed(true);
  });

  // Time attack: when timer finishes, end game
  useEffect(() => {
    if (mode === 'timeattack' && timer.isFinished && phase === 'playing') {
      const result: GameResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        mode: 'timeattack',
        target,
        guessCount: guessHistory.length,
        won: true,
        timeAttackScore,
        rangeMax: 100,
      };
      setResults([result, ...results]);
      trackAction();
      setPhase('result');
    }
  }, [timer.isFinished, mode, phase]);

  const startGame = useCallback(() => {
    const newTarget = generateTarget(mode);
    const max = getRangeMax(mode);
    setTarget(newTarget);
    setInputValue('');
    setGuessHistory([]);
    setRangeLow(1);
    setRangeHigh(max);
    setFeedback(null);
    setHintUsed(false);
    hintUsedRef.current = false;
    celebrationAnim.setValue(0);

    if (mode === 'timeattack') {
      setTimeAttackScore(0);
      timer.reset();
      timer.start();
    }

    setPhase('playing');
  }, [mode, timer]);

  const animateFeedback = useCallback(() => {
    feedbackAnim.setValue(0);
    Animated.sequence([
      Animated.timing(feedbackAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(feedbackAnim, {
        toValue: 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [feedbackAnim]);

  const animateCelebration = useCallback(() => {
    celebrationAnim.setValue(0);
    Animated.spring(celebrationAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [celebrationAnim]);

  const handleSubmitGuess = useCallback(() => {
    const guess = parseInt(inputValue, 10);
    if (isNaN(guess) || guess < 1 || guess > getRangeMax(mode)) return;

    if (guess === target) {
      const entry: GuessEntry = { value: guess, direction: 'correct' };
      const newHistory = [...guessHistory, entry];
      setGuessHistory(newHistory);
      setFeedback('correct');
      setInputValue('');
      animateCelebration();

      if (mode === 'timeattack') {
        // Continue with new number
        setTimeAttackScore((prev) => prev + 1);
        const newTarget = generateTarget(mode);
        setTarget(newTarget);
        setGuessHistory([]);
        setRangeLow(1);
        setRangeHigh(getRangeMax(mode));
        setFeedback(null);
        setHintUsed(false);
        hintUsedRef.current = false;
      } else {
        // End game for classic/hard
        const result: GameResult = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          mode,
          target,
          guessCount: newHistory.length,
          won: true,
          rangeMax: getRangeMax(mode),
        };
        setResults([result, ...results]);
        trackAction();
        setPhase('result');
      }
    } else if (guess < target) {
      const entry: GuessEntry = { value: guess, direction: 'higher' };
      setGuessHistory((prev) => [...prev, entry]);
      setFeedback('higher');
      if (guess >= rangeLow) setRangeLow(guess + 1);
      setInputValue('');
      animateFeedback();
    } else {
      const entry: GuessEntry = { value: guess, direction: 'lower' };
      setGuessHistory((prev) => [...prev, entry]);
      setFeedback('lower');
      if (guess <= rangeHigh) setRangeHigh(guess - 1);
      setInputValue('');
      animateFeedback();
    }
  }, [inputValue, target, mode, guessHistory, rangeLow, rangeHigh, results, setResults, trackAction, animateFeedback, animateCelebration]);

  const handleNumberPad = useCallback((digit: string) => {
    if (digit === 'clear') {
      setInputValue('');
      return;
    }
    if (digit === 'back') {
      setInputValue((prev) => prev.slice(0, -1));
      return;
    }
    setInputValue((prev) => {
      const next = prev + digit;
      const max = mode === 'hard' ? 1000 : 100;
      if (parseInt(next, 10) > max) return prev;
      if (next.length > (mode === 'hard' ? 4 : 3)) return prev;
      return next;
    });
  }, [mode]);

  const handleUseHint = useCallback(() => {
    if (hintUsedRef.current) return;
    if (rewardedLoaded) {
      showRewardedAd();
    }
  }, [rewardedLoaded, showRewardedAd]);

  const handleRetry = useCallback(() => {
    timer.reset();
    setPhase('setup');
  }, [timer]);

  const timeLeftSeconds = Math.ceil(timer.timeLeft / 1000);

  const renderSetup = () => (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
    >
      <H2 style={{ marginBottom: spacing.xl }}>モード選択</H2>

      <View style={{ gap: spacing.md }}>
        {MODE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setMode(opt.value)}
            style={[
              styles.modeCard,
              {
                backgroundColor: mode === opt.value ? colors.primary + '18' : colors.surface,
                borderColor: mode === opt.value ? colors.primary : colors.border,
                padding: spacing.lg,
              },
            ]}
          >
            <View style={styles.modeHeader}>
              <H3 color={mode === opt.value ? colors.primary : colors.text}>
                {opt.label}
              </H3>
              {mode === opt.value && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </View>
            <Caption color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
              {opt.description}
            </Caption>
          </Pressable>
        ))}
      </View>

      <Button
        title="ゲームスタート"
        onPress={startGame}
        size="lg"
        style={{ marginTop: spacing.xl }}
      />
    </ScrollView>
  );

  const renderNumberPad = () => {
    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'];

    return (
      <View style={styles.numberPad}>
        {digits.map((digit) => {
          let label = digit;
          let icon: string | null = null;
          if (digit === 'clear') label = 'C';
          if (digit === 'back') icon = 'backspace-outline';

          return (
            <Pressable
              key={digit}
              onPress={() => handleNumberPad(digit)}
              style={[
                styles.numberKey,
                {
                  backgroundColor: digit === 'clear' ? colors.error + '22' : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              {icon ? (
                <Ionicons name={icon as any} size={24} color={colors.text} />
              ) : (
                <Body
                  style={{
                    fontSize: digit === 'clear' ? 18 : 22,
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                  color={digit === 'clear' ? colors.error : colors.text}
                >
                  {label}
                </Body>
              )}
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderFeedbackIndicator = () => {
    if (!feedback || feedback === 'correct') return null;

    const arrowTranslate = feedbackAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, feedback === 'higher' ? -15 : 15],
    });

    return (
      <Animated.View
        style={[
          styles.feedbackContainer,
          {
            backgroundColor: feedback === 'higher' ? colors.primary + '22' : colors.warning + '22',
            padding: spacing.md,
            borderRadius: 12,
            marginBottom: spacing.md,
            transform: [{ translateY: arrowTranslate }],
            opacity: feedbackAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.4, 1, 1] }),
          },
        ]}
      >
        <Ionicons
          name={feedback === 'higher' ? 'arrow-up-circle' : 'arrow-down-circle'}
          size={36}
          color={feedback === 'higher' ? colors.primary : colors.warning}
        />
        <H2
          style={{ marginLeft: spacing.sm }}
          color={feedback === 'higher' ? colors.primary : colors.warning}
        >
          {feedback === 'higher' ? 'もっと大きい！' : 'もっと小さい！'}
        </H2>
      </Animated.View>
    );
  };

  const renderGuessHistory = () => {
    if (guessHistory.length === 0) return null;

    return (
      <View style={{ marginBottom: spacing.md }}>
        <Caption color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
          予想履歴
        </Caption>
        <View style={styles.historyList}>
          {guessHistory.map((entry, index) => (
            <View
              key={index}
              style={[
                styles.historyItem,
                {
                  backgroundColor:
                    entry.direction === 'correct'
                      ? colors.success + '22'
                      : entry.direction === 'higher'
                        ? colors.primary + '15'
                        : colors.warning + '15',
                  borderRadius: 8,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                },
              ]}
            >
              <Body
                style={{ fontWeight: 'bold', fontSize: 14 }}
                color={
                  entry.direction === 'correct'
                    ? colors.success
                    : entry.direction === 'higher'
                      ? colors.primary
                      : colors.warning
                }
              >
                {entry.value}
              </Body>
              <Ionicons
                name={
                  entry.direction === 'correct'
                    ? 'checkmark-circle'
                    : entry.direction === 'higher'
                      ? 'arrow-up'
                      : 'arrow-down'
                }
                size={14}
                color={
                  entry.direction === 'correct'
                    ? colors.success
                    : entry.direction === 'higher'
                      ? colors.primary
                      : colors.warning
                }
              />
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPlaying = () => {
    const max = getRangeMax(mode);

    return (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
      >
        {/* Status bar */}
        <View style={[styles.statusBar, { marginBottom: spacing.md }]}>
          <View style={styles.statusItem}>
            <Caption color={colors.textSecondary}>回数</Caption>
            <Body style={{ fontWeight: 'bold', fontSize: 20 }} color={colors.primary}>
              {guessHistory.length}
            </Body>
          </View>

          {mode === 'timeattack' && (
            <View style={styles.statusItem}>
              <Caption color={colors.textSecondary}>スコア</Caption>
              <Body style={{ fontWeight: 'bold', fontSize: 20 }} color={colors.success}>
                {timeAttackScore}
              </Body>
            </View>
          )}

          {mode === 'timeattack' && (
            <View style={styles.statusItem}>
              <Caption color={timeLeftSeconds <= 10 ? colors.error : colors.textSecondary}>
                残り時間
              </Caption>
              <Body
                style={{ fontWeight: 'bold', fontSize: 20 }}
                color={timeLeftSeconds <= 10 ? colors.error : colors.primary}
              >
                {timeLeftSeconds}秒
              </Body>
            </View>
          )}

          <View style={styles.statusItem}>
            <Caption color={colors.textSecondary}>範囲</Caption>
            <Body style={{ fontWeight: 'bold', fontSize: 16 }} color={colors.text}>
              {rangeLow}~{rangeHigh}
            </Body>
          </View>
        </View>

        {/* Range bar indicator */}
        <View
          style={[
            styles.rangeBar,
            { backgroundColor: colors.surface, marginBottom: spacing.md },
          ]}
        >
          <View
            style={[
              styles.rangeFill,
              {
                backgroundColor: colors.primary + '44',
                left: `${((rangeLow - 1) / max) * 100}%`,
                right: `${((max - rangeHigh) / max) * 100}%`,
              },
            ]}
          />
        </View>

        {/* Feedback indicator */}
        {renderFeedbackIndicator()}

        {/* Input display */}
        <Card style={{ padding: spacing.lg, marginBottom: spacing.md, alignItems: 'center' }}>
          <Caption color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>
            1~{max}の数を入力
          </Caption>
          <View style={[styles.inputDisplay, { borderBottomColor: colors.primary }]}>
            <H1
              align="center"
              color={inputValue ? colors.text : colors.textMuted}
              style={{ fontSize: 48 }}
            >
              {inputValue || '?'}
            </H1>
          </View>
        </Card>

        {/* Number pad */}
        {renderNumberPad()}

        {/* Submit button */}
        <Button
          title="予想する"
          onPress={handleSubmitGuess}
          size="lg"
          style={{ marginTop: spacing.md }}
          disabled={!inputValue}
        />

        {/* Hint button */}
        {!hintUsed && rewardedLoaded && mode !== 'timeattack' && (
          <Button
            title="ヒント（広告を見て範囲を50%に絞る）"
            onPress={handleUseHint}
            variant="ghost"
            style={{ marginTop: spacing.sm }}
          />
        )}

        {/* Guess history */}
        {renderGuessHistory()}
      </ScrollView>
    );
  };

  const renderResult = () => {
    const celebrationScale = celebrationAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    });

    if (mode === 'timeattack') {
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
            name="timer"
            size={72}
            color={colors.primary}
            style={{ marginBottom: spacing.lg }}
          />
          <H1 align="center" style={{ marginBottom: spacing.sm }}>
            タイムアップ！
          </H1>

          <Card
            style={{
              padding: spacing.xl,
              marginVertical: spacing.lg,
              width: '100%',
            }}
          >
            <View style={styles.resultRow}>
              <View style={styles.resultStatItem}>
                <Body
                  color={colors.primary}
                  style={{ fontSize: 48, fontWeight: 'bold', textAlign: 'center' }}
                >
                  {timeAttackScore}
                </Body>
                <Caption style={{ textAlign: 'center' }}>正解数</Caption>
              </View>
            </View>

            <Body
              color={colors.success}
              style={{
                textAlign: 'center',
                marginTop: spacing.lg,
                fontWeight: 'bold',
                fontSize: 16,
              }}
            >
              {timeAttackScore >= 10
                ? '素晴らしい！達人レベルです！'
                : timeAttackScore >= 5
                  ? 'なかなかの腕前です！'
                  : 'もっと素早く推理しよう！'}
            </Body>
          </Card>

          <View style={{ gap: spacing.sm, width: '100%' }}>
            <Button title="もう一度挑戦する" onPress={startGame} size="lg" />
            <Button title="モード選択に戻る" onPress={handleRetry} variant="outline" size="lg" />
          </View>
        </ScrollView>
      );
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
        <Animated.View style={{ transform: [{ scale: celebrationScale }] }}>
          <Ionicons
            name="trophy"
            size={72}
            color={colors.primary}
            style={{ marginBottom: spacing.lg }}
          />
        </Animated.View>
        <H1 align="center" style={{ marginBottom: spacing.sm }}>
          正解！
        </H1>
        <Body
          color={colors.textSecondary}
          style={{ textAlign: 'center', marginBottom: spacing.md }}
        >
          答えは {target} でした
        </Body>

        <Card
          style={{
            padding: spacing.xl,
            marginVertical: spacing.lg,
            width: '100%',
          }}
        >
          <View style={styles.resultRow}>
            <View style={styles.resultStatItem}>
              <Body
                color={colors.primary}
                style={{ fontSize: 48, fontWeight: 'bold', textAlign: 'center' }}
              >
                {guessHistory.length}
              </Body>
              <Caption style={{ textAlign: 'center' }}>回で正解</Caption>
            </View>
            <View style={[styles.resultDivider, { backgroundColor: colors.border }]} />
            <View style={styles.resultStatItem}>
              <Body
                color={colors.primary}
                style={{ fontSize: 48, fontWeight: 'bold', textAlign: 'center' }}
              >
                {mode === 'classic' ? '100' : '1000'}
              </Body>
              <Caption style={{ textAlign: 'center' }}>中から的中</Caption>
            </View>
          </View>

          <Body
            color={
              guessHistory.length <= (mode === 'classic' ? 5 : 8)
                ? colors.success
                : guessHistory.length <= (mode === 'classic' ? 7 : 12)
                  ? colors.primary
                  : colors.warning
            }
            style={{
              textAlign: 'center',
              marginTop: spacing.lg,
              fontWeight: 'bold',
              fontSize: 16,
            }}
          >
            {guessHistory.length <= (mode === 'classic' ? 5 : 8)
              ? '素晴らしい！天才的な推理力！'
              : guessHistory.length <= (mode === 'classic' ? 7 : 12)
                ? 'よくできました！'
                : 'もっと効率的に絞り込もう！'}
          </Body>
        </Card>

        <View style={{ gap: spacing.sm, width: '100%' }}>
          <Button title="もう一度挑戦する" onPress={startGame} size="lg" />
          <Button title="モード選択に戻る" onPress={handleRetry} variant="outline" size="lg" />
        </View>
      </ScrollView>
    );
  };

  return (
    <ScreenWrapper>
      {phase === 'setup' && renderSetup()}
      {phase === 'playing' && renderPlaying()}
      {phase === 'result' && renderResult()}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  modeCard: {
    borderRadius: 12,
    borderWidth: 1,
  },
  modeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statusItem: {
    alignItems: 'center',
  },
  rangeBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  rangeFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputDisplay: {
    borderBottomWidth: 3,
    paddingHorizontal: 24,
    paddingBottom: 4,
    minWidth: 120,
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  numberKey: {
    width: '30%',
    aspectRatio: 2,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultRow: {
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
