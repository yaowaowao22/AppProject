import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, H1, H2, Body, Caption, Button, Card, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage, useTimer } from '@massapp/hooks';
import type { GameMode, Difficulty, GameResult } from '../types';
import {
  getWordsByDifficulty,
  shuffleArray,
  scrambleWord,
  type WordEntry,
} from '../data/words';

type GamePhase = 'playing' | 'correct' | 'result';

const TIME_ATTACK_DURATION_MS = 60000;

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'かんたん',
  medium: 'ふつう',
  hard: 'むずかしい',
};

const modeLabels: Record<GameMode, string> = {
  normal: '通常モード',
  timeAttack: 'タイムアタック',
};

function computeScore(difficulty: Difficulty, hintUsed: boolean): number {
  const base = difficulty === 'easy' ? 100 : difficulty === 'medium' ? 200 : 300;
  return hintUsed ? Math.floor(base * 0.5) : base;
}

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { trackAction } = useInterstitialAd();
  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(() => {
    setFullHintRevealed(true);
  });
  const [history, setHistory] = useLocalStorage<GameResult[]>('anagram-history', []);

  const mode: GameMode = route.params?.mode ?? 'normal';
  const difficulty: Difficulty = route.params?.difficulty ?? 'easy';
  const count: number = route.params?.count ?? 10;

  const timer = useTimer(TIME_ATTACK_DURATION_MS);

  const [wordList, setWordList] = useState<WordEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrambledLetters, setScrambledLetters] = useState<string[]>([]);
  const [placedLetters, setPlacedLetters] = useState<(string | null)[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('playing');
  const [hasStarted, setHasStarted] = useState(false);
  const [categoryRevealed, setCategoryRevealed] = useState(false);
  const [fullHintRevealed, setFullHintRevealed] = useState(false);
  const [hintUsedForCurrent, setHintUsedForCurrent] = useState(false);
  const startTimeRef = useRef<number>(0);

  const currentWord = wordList[currentIndex];

  const initializeGame = useCallback(() => {
    const available = getWordsByDifficulty(difficulty);
    const selected = shuffleArray(available).slice(
      0,
      mode === 'normal' ? count : available.length
    );
    setWordList(selected);
    setCurrentIndex(0);
    setScore(0);
    setSolved(0);
    setPhase('playing');
    setHasStarted(true);
    setCategoryRevealed(false);
    setFullHintRevealed(false);
    setHintUsedForCurrent(false);
    startTimeRef.current = Date.now();

    if (selected.length > 0) {
      const scrambled = scrambleWord(selected[0].word);
      setScrambledLetters(scrambled);
      setPlacedLetters(new Array(selected[0].word.length).fill(null));
      setSelectedIndices([]);
    }

    if (mode === 'timeAttack') {
      timer.reset();
      setTimeout(() => timer.start(), 50);
    }
  }, [difficulty, mode, count]);

  useEffect(() => {
    if (route.params?.mode) {
      initializeGame();
    }
  }, [route.params?.mode, route.params?.difficulty, route.params?.count, route.params?.timestamp]);

  useEffect(() => {
    if (mode === 'timeAttack' && timer.isFinished && hasStarted && phase === 'playing') {
      finishGame();
    }
  }, [timer.isFinished]);

  const setupWord = (word: WordEntry) => {
    const scrambled = scrambleWord(word.word);
    setScrambledLetters(scrambled);
    setPlacedLetters(new Array(word.word.length).fill(null));
    setSelectedIndices([]);
    setCategoryRevealed(false);
    setFullHintRevealed(false);
    setHintUsedForCurrent(false);
  };

  const handleTapScrambled = (index: number) => {
    if (phase !== 'playing') return;
    if (selectedIndices.includes(index)) return;

    const nextPlaceIndex = placedLetters.indexOf(null);
    if (nextPlaceIndex === -1) return;

    const newPlaced = [...placedLetters];
    newPlaced[nextPlaceIndex] = scrambledLetters[index];
    setPlacedLetters(newPlaced);
    setSelectedIndices([...selectedIndices, index]);

    // Check if all letters are placed
    if (newPlaced.every((l) => l !== null)) {
      const answer = newPlaced.join('');
      if (answer === currentWord.word) {
        const points = computeScore(difficulty, hintUsedForCurrent);
        setScore((prev) => prev + points);
        setSolved((prev) => prev + 1);
        setPhase('correct');
      }
    }
  };

  const handleTapPlaced = (index: number) => {
    if (phase !== 'playing') return;
    if (placedLetters[index] === null) return;

    const newPlaced = [...placedLetters];
    newPlaced[index] = null;

    // Shift remaining letters left to fill the gap
    const compacted: (string | null)[] = newPlaced.filter((l) => l !== null);
    while (compacted.length < newPlaced.length) {
      compacted.push(null);
    }
    setPlacedLetters(compacted);

    const newSelectedIndices = [...selectedIndices];
    // Find the scrambled tile index that produced placedLetters[index]
    // We stored them in order, so the placed index corresponds to selectedIndices order
    const selectedOrderIndex = (() => {
      // placedLetters are filled in order, so the i-th non-null placed letter
      // corresponds to selectedIndices[i]
      let filledCount = 0;
      for (let i = 0; i < placedLetters.length; i++) {
        if (placedLetters[i] !== null) {
          if (i === index) return filledCount;
          filledCount++;
        }
      }
      return -1;
    })();

    if (selectedOrderIndex >= 0 && selectedOrderIndex < newSelectedIndices.length) {
      newSelectedIndices.splice(selectedOrderIndex, 1);
    }
    setSelectedIndices(newSelectedIndices);
  };

  const handleClearAll = () => {
    if (phase !== 'playing') return;
    setPlacedLetters(new Array(currentWord.word.length).fill(null));
    setSelectedIndices([]);
  };

  const handleShowCategory = () => {
    setCategoryRevealed(true);
    setHintUsedForCurrent(true);
  };

  const handleShowFullHint = () => {
    if (rewardedLoaded) {
      setHintUsedForCurrent(true);
      showRewardedAd();
    }
  };

  const handleNext = () => {
    if (mode === 'normal') {
      if (currentIndex + 1 >= count || currentIndex + 1 >= wordList.length) {
        finishGame();
      } else {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setupWord(wordList[nextIndex]);
        setPhase('playing');
      }
    } else {
      // Time attack: keep going if time remains
      if (!timer.isFinished && currentIndex + 1 < wordList.length) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setupWord(wordList[nextIndex]);
        setPhase('playing');
      } else {
        finishGame();
      }
    }
  };

  const handleSkip = () => {
    if (phase !== 'playing') return;
    if (mode === 'normal') {
      if (currentIndex + 1 >= count || currentIndex + 1 >= wordList.length) {
        finishGame();
      } else {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setupWord(wordList[nextIndex]);
      }
    } else {
      if (!timer.isFinished && currentIndex + 1 < wordList.length) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setupWord(wordList[nextIndex]);
      } else {
        finishGame();
      }
    }
  };

  const finishGame = () => {
    if (mode === 'timeAttack') {
      timer.pause();
    }
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    const result: GameResult = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mode,
      difficulty,
      score,
      solved,
      total: mode === 'normal' ? Math.min(count, wordList.length) : solved,
      timeSeconds: elapsed,
    };
    setHistory([result, ...history]);
    trackAction();
    setPhase('result');
  };

  const handleRetry = () => {
    initializeGame();
  };

  const handleBackToTitle = () => {
    navigation.navigate('Title');
  };

  // Not started state
  if (!hasStarted) {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.xl }]}>
          <View style={styles.emptyState}>
            <Body style={{ fontSize: 48, textAlign: 'center', marginBottom: spacing.lg }}>
              🔤
            </Body>
            <H2 align="center" style={{ marginBottom: spacing.md }}>
              アナグラム
            </H2>
            <Body
              color={colors.textSecondary}
              style={{ textAlign: 'center', marginBottom: spacing.xl }}
            >
              スタートタブからモードを選んで{'\n'}ゲームを始めましょう
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

  // Result screen
  if (phase === 'result') {
    let gradeEmoji = '😢';
    let gradeText = 'もう少しがんばろう！';

    if (mode === 'timeAttack') {
      if (solved >= 10) {
        gradeEmoji = '🎉';
        gradeText = 'すばらしい！達人レベル！';
      } else if (solved >= 7) {
        gradeEmoji = '😄';
        gradeText = 'すごい！よくできました！';
      } else if (solved >= 4) {
        gradeEmoji = '😊';
        gradeText = 'いい調子！もう少し！';
      } else if (solved >= 2) {
        gradeEmoji = '🤔';
        gradeText = 'まだまだこれから！';
      }
    } else {
      const rate = count > 0 ? solved / Math.min(count, wordList.length) : 0;
      if (rate === 1) {
        gradeEmoji = '🎉';
        gradeText = 'パーフェクト！すばらしい！';
      } else if (rate >= 0.8) {
        gradeEmoji = '😄';
        gradeText = 'すごい！よくできました！';
      } else if (rate >= 0.6) {
        gradeEmoji = '😊';
        gradeText = 'いい調子！もう少し！';
      } else if (rate >= 0.4) {
        gradeEmoji = '🤔';
        gradeText = 'まだまだこれから！';
      }
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
            {modeLabels[mode]} / {difficultyLabels[difficulty]}
          </Caption>

          <Card style={[styles.resultCard, { padding: spacing.xl, marginBottom: spacing.lg }]}>
            <H1 align="center" color={colors.primary}>
              {score}点
            </H1>
            <Body
              color={colors.textSecondary}
              style={{ textAlign: 'center', marginTop: spacing.xs }}
            >
              {mode === 'timeAttack'
                ? `${solved}問正解（60秒）`
                : `${solved} / ${Math.min(count, wordList.length)}問正解`}
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

  // Loading state
  if (!currentWord) {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.xl }]}>
          <Body style={{ textAlign: 'center' }}>読み込み中...</Body>
        </View>
      </ScreenWrapper>
    );
  }

  const timerSeconds = mode === 'timeAttack' ? Math.ceil(timer.timeLeft / 1000) : 0;
  const progress =
    mode === 'normal'
      ? (currentIndex + 1) / Math.min(count, wordList.length)
      : 0;

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        {/* Header */}
        <View style={[styles.header, { marginBottom: spacing.sm }]}>
          <Caption>{difficultyLabels[difficulty]}</Caption>
          {mode === 'timeAttack' ? (
            <Body
              style={{ fontWeight: 'bold', fontSize: 18 }}
              color={timerSeconds <= 10 ? colors.error : colors.primary}
            >
              {timerSeconds}秒
            </Body>
          ) : (
            <Body style={{ fontWeight: 'bold' }}>
              {currentIndex + 1} / {Math.min(count, wordList.length)}
            </Body>
          )}
          <Body color={colors.primary} style={{ fontWeight: 'bold' }}>
            {score}点
          </Body>
        </View>

        {/* Progress bar (normal mode only) */}
        {mode === 'normal' && (
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
        )}

        {/* Time bar (time attack mode) */}
        {mode === 'timeAttack' && (
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
                  backgroundColor: timerSeconds <= 10 ? colors.error : colors.primary,
                  width: `${(timer.timeLeft / TIME_ATTACK_DURATION_MS) * 100}%`,
                },
              ]}
            />
          </View>
        )}

        {/* Answer area */}
        <Card
          style={[
            styles.answerCard,
            {
              padding: spacing.lg,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Caption style={{ textAlign: 'center', marginBottom: spacing.md }}>
            正しい順番にタップしよう
          </Caption>
          <View style={[styles.lettersRow, { gap: spacing.xs }]}>
            {placedLetters.map((letter, index) => (
              <TouchableOpacity
                key={`placed-${index}`}
                onPress={() => handleTapPlaced(index)}
                activeOpacity={0.7}
                style={[
                  styles.letterTile,
                  {
                    backgroundColor: letter ? colors.primary : colors.surface,
                    borderColor: letter ? colors.primary : colors.border,
                    borderWidth: 2,
                    borderRadius: 8,
                    minWidth: 44,
                    minHeight: 44,
                    borderStyle: letter ? 'solid' : 'dashed',
                  },
                ]}
              >
                <Body
                  style={{
                    fontWeight: 'bold',
                    fontSize: 20,
                    color: letter ? '#FFFFFF' : 'transparent',
                    textAlign: 'center',
                  }}
                >
                  {letter ?? '　'}
                </Body>
              </TouchableOpacity>
            ))}
          </View>

          {phase === 'correct' && (
            <View style={{ marginTop: spacing.md, alignItems: 'center' }}>
              <Badge label="正解！" color={colors.success} />
            </View>
          )}
        </Card>

        {/* Scrambled letters */}
        <View style={[styles.lettersRow, { gap: spacing.sm, marginBottom: spacing.md }]}>
          {scrambledLetters.map((letter, index) => {
            const isSelected = selectedIndices.includes(index);
            return (
              <TouchableOpacity
                key={`scrambled-${index}`}
                onPress={() => handleTapScrambled(index)}
                disabled={isSelected || phase !== 'playing'}
                activeOpacity={0.7}
                style={[
                  styles.letterTile,
                  {
                    backgroundColor: isSelected
                      ? colors.border
                      : colors.surface,
                    borderColor: isSelected ? colors.border : colors.primary,
                    borderWidth: 2,
                    borderRadius: 12,
                    minWidth: 48,
                    minHeight: 48,
                    opacity: isSelected ? 0.3 : 1,
                  },
                ]}
              >
                <Body
                  style={{
                    fontWeight: 'bold',
                    fontSize: 22,
                    color: isSelected ? colors.textSecondary : colors.text,
                    textAlign: 'center',
                  }}
                >
                  {letter}
                </Body>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hint area */}
        {phase === 'playing' && (
          <Card
            style={[
              styles.hintCard,
              {
                padding: spacing.md,
                marginBottom: spacing.md,
                backgroundColor: colors.surface,
              },
            ]}
          >
            {categoryRevealed ? (
              <View style={{ alignItems: 'center', gap: spacing.xs }}>
                <Caption>カテゴリ: {currentWord.category}</Caption>
                {fullHintRevealed ? (
                  <Body style={{ textAlign: 'center', fontSize: 14 }}>
                    ヒント: {currentWord.hint}
                  </Body>
                ) : (
                  <TouchableOpacity onPress={handleShowFullHint} activeOpacity={0.7}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="play-circle" size={16} color={colors.primary} />
                      <Caption color={colors.primary}>
                        広告を見てヒントを表示
                      </Caption>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity onPress={handleShowCategory} activeOpacity={0.7}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Ionicons name="bulb-outline" size={18} color={colors.primary} />
                  <Body color={colors.primary} style={{ fontWeight: 'bold', fontSize: 14 }}>
                    ヒントを見る
                  </Body>
                </View>
              </TouchableOpacity>
            )}
          </Card>
        )}

        {/* Action buttons */}
        <View style={{ gap: spacing.sm, marginTop: 'auto' }}>
          {phase === 'correct' ? (
            <Button
              title={
                mode === 'normal' && currentIndex + 1 >= Math.min(count, wordList.length)
                  ? '結果を見る'
                  : '次の問題へ'
              }
              onPress={handleNext}
              size="lg"
            />
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Button
                    title="クリア"
                    onPress={handleClearAll}
                    variant="outline"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="スキップ"
                    onPress={handleSkip}
                    variant="ghost"
                  />
                </View>
              </View>
            </>
          )}
        </View>
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
  answerCard: {
    borderRadius: 12,
    alignItems: 'center',
  },
  lettersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterTile: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hintCard: {
    borderRadius: 10,
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
