import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, H2, H3, Body, Button, Card, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import {
  getPuzzlesByDifficulty,
  DIFFICULTY_CONFIG,
} from '../data/puzzles';
import type { Difficulty, Puzzle, DiffSpot } from '../data/puzzles';

type GamePhase = 'select' | 'playing' | 'complete';

interface GameResult {
  id: string;
  date: string;
  puzzleId: number;
  difficulty: Difficulty;
  timeSeconds: number;
  penaltySeconds: number;
  cleared: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export function GameScreen() {
  const { colors, spacing, radius } = useTheme();
  const { trackAction } = useInterstitialAd();

  const [gamePhase, setGamePhase] = useState<GamePhase>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [foundDiffs, setFoundDiffs] = useState<DiffSpot[]>([]);
  const [hintedSpot, setHintedSpot] = useState<DiffSpot | null>(null);

  // Count-up timer state
  const [elapsedMs, setElapsedMs] = useState(0);
  const [penaltyMs, setPenaltyMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const accumulatedRef = useRef(0);

  const [history, setHistory] = useLocalStorage<GameResult[]>(
    'spot_the_difference_history',
    [],
  );
  const [clearedPuzzles, setClearedPuzzles] = useLocalStorage<number[]>(
    'spot_the_difference_cleared',
    [],
  );

  const handleReward = useCallback(() => {
    if (!currentPuzzle || gamePhase !== 'playing') return;
    const unfound = currentPuzzle.differences.filter(
      (d) => !foundDiffs.some((f) => f.row === d.row && f.col === d.col),
    );
    if (unfound.length > 0) {
      const hint = unfound[Math.floor(Math.random() * unfound.length)];
      setHintedSpot(hint);
    }
  }, [currentPuzzle, gamePhase, foundDiffs]);

  const { show: showRewardedAd, loaded: rewardedLoaded } =
    useRewardedAd(handleReward);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    accumulatedRef.current = 0;
    setElapsedMs(0);
    setPenaltyMs(0);
    timerRef.current = setInterval(() => {
      const now = Date.now();
      setElapsedMs(accumulatedRef.current + (now - startTimeRef.current));
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const now = Date.now();
    accumulatedRef.current =
      accumulatedRef.current + (now - startTimeRef.current);
    setElapsedMs(accumulatedRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveResult = useCallback(
    (puzzle: Puzzle, timeMs: number, penalty: number) => {
      const result: GameResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        puzzleId: puzzle.id,
        difficulty: puzzle.difficulty,
        timeSeconds: Math.floor((timeMs + penalty) / 1000),
        penaltySeconds: Math.floor(penalty / 1000),
        cleared: true,
      };
      const prevHistory = history ?? [];
      setHistory([result, ...prevHistory]);

      const cleared = clearedPuzzles ?? [];
      if (!cleared.includes(puzzle.id)) {
        setClearedPuzzles([...cleared, puzzle.id]);
      }

      trackAction();
    },
    [history, setHistory, clearedPuzzles, setClearedPuzzles, trackAction],
  );

  const handleStartPuzzle = useCallback(
    (puzzle: Puzzle) => {
      setCurrentPuzzle(puzzle);
      setFoundDiffs([]);
      setHintedSpot(null);
      setGamePhase('playing');
      startTimer();
    },
    [startTimer],
  );

  const handleCellTap = useCallback(
    (row: number, col: number) => {
      if (!currentPuzzle || gamePhase !== 'playing') return;

      const isDiff = currentPuzzle.differences.some(
        (d) => d.row === row && d.col === col,
      );
      const alreadyFound = foundDiffs.some(
        (f) => f.row === row && f.col === col,
      );

      if (alreadyFound) return;

      if (isDiff) {
        const newFound = [...foundDiffs, { row, col }];
        setFoundDiffs(newFound);
        if (hintedSpot?.row === row && hintedSpot?.col === col) {
          setHintedSpot(null);
        }

        if (newFound.length === currentPuzzle.differences.length) {
          stopTimer();
          setGamePhase('complete');
          saveResult(currentPuzzle, elapsedMs, penaltyMs);
          Alert.alert(
            'クリア！',
            `全ての違いを見つけました！\nタイム: ${formatTime(elapsedMs + penaltyMs)}`,
          );
        }
      } else {
        setPenaltyMs((prev) => prev + 5000);
        Alert.alert('はずれ', '+5秒のペナルティ！');
      }
    },
    [
      currentPuzzle,
      gamePhase,
      foundDiffs,
      hintedSpot,
      stopTimer,
      saveResult,
      elapsedMs,
      penaltyMs,
    ],
  );

  const handleHint = useCallback(() => {
    if (gamePhase !== 'playing') return;
    if (rewardedLoaded) {
      showRewardedAd();
    } else {
      Alert.alert('ヒント', '広告の準備ができていません。少々お待ちください。');
    }
  }, [gamePhase, rewardedLoaded, showRewardedAd]);

  const handleBackToSelect = useCallback(() => {
    stopTimer();
    setGamePhase('select');
    setCurrentPuzzle(null);
    setFoundDiffs([]);
    setHintedSpot(null);
  }, [stopTimer]);

  const puzzles = getPuzzlesByDifficulty(difficulty);
  const clearedSet = new Set(clearedPuzzles ?? []);

  const gridPadding = spacing.xs * 2;
  const gridGap = 2;

  const renderGrid = (grid: string[][], gridLabel: string) => {
    if (!currentPuzzle) return null;
    const gridSize = currentPuzzle.gridSize;
    const availableWidth = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2;
    const cellSize = Math.floor(
      (availableWidth - gridPadding - gridGap * (gridSize - 1)) / gridSize,
    );
    const emojiSize = Math.max(cellSize * 0.6, 12);

    return (
      <View style={{ flex: 1 }}>
        <Body
          color={colors.textSecondary}
          style={{ textAlign: 'center', marginBottom: spacing.xs, fontSize: 12 }}
        >
          {gridLabel}
        </Body>
        <View
          style={[
            styles.grid,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.sm,
              padding: spacing.xs,
            },
          ]}
        >
          {grid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.gridRow}>
              {row.map((cell, colIndex) => {
                const isFound = foundDiffs.some(
                  (f) => f.row === rowIndex && f.col === colIndex,
                );
                const isHinted =
                  hintedSpot?.row === rowIndex &&
                  hintedSpot?.col === colIndex;
                return (
                  <TouchableOpacity
                    key={`${rowIndex}-${colIndex}`}
                    style={[
                      styles.cell,
                      {
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: isFound
                          ? `${colors.success}30`
                          : isHinted
                            ? `${colors.warning}30`
                            : colors.background,
                        borderColor: isFound
                          ? colors.success
                          : isHinted
                            ? colors.warning
                            : 'transparent',
                        borderWidth: isFound || isHinted ? 2 : 0,
                        borderRadius: radius.sm,
                        margin: gridGap / 2,
                      },
                    ]}
                    onPress={() => handleCellTap(rowIndex, colIndex)}
                    activeOpacity={0.7}
                    disabled={gamePhase !== 'playing'}
                  >
                    <Text
                      style={[styles.cellEmoji, { fontSize: emojiSize }]}
                    >
                      {cell}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Level select screen
  if (gamePhase === 'select') {
    return (
      <ScreenWrapper>
        <ScrollView
          style={[styles.scrollContainer, { padding: spacing.lg }]}
          showsVerticalScrollIndicator={false}
        >
          <H2 style={{ marginBottom: spacing.md }}>レベル選択</H2>

          <View style={[styles.difficultyRow, { marginBottom: spacing.md }]}>
            {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.difficultyButton,
                  {
                    backgroundColor:
                      difficulty === d ? colors.primary : colors.surface,
                    borderColor: colors.border,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: radius.sm,
                  },
                ]}
                onPress={() => setDifficulty(d)}
              >
                <Body
                  color={difficulty === d ? '#fff' : colors.text}
                  style={{ fontSize: 13 }}
                >
                  {DIFFICULTY_CONFIG[d].label}
                </Body>
              </TouchableOpacity>
            ))}
          </View>

          <Body
            color={colors.textSecondary}
            style={{ marginBottom: spacing.sm }}
          >
            {DIFFICULTY_CONFIG[difficulty].gridSize}x
            {DIFFICULTY_CONFIG[difficulty].gridSize}グリッド /{' '}
            {DIFFICULTY_CONFIG[difficulty].diffCount}つの違い
          </Body>

          <View style={{ gap: spacing.sm, paddingBottom: spacing.xl }}>
            {puzzles.map((puzzle, index) => {
              const isCleared = clearedSet.has(puzzle.id);
              return (
                <TouchableOpacity
                  key={puzzle.id}
                  onPress={() => handleStartPuzzle(puzzle)}
                  activeOpacity={0.7}
                >
                  <Card
                    style={[
                      styles.levelCard,
                      {
                        padding: spacing.md,
                        borderColor: isCleared
                          ? colors.success
                          : colors.border,
                        borderWidth: isCleared ? 2 : 1,
                      },
                    ]}
                  >
                    <View style={styles.levelCardContent}>
                      <View style={styles.levelCardLeft}>
                        <H3>
                          レベル {index + 1}
                        </H3>
                        <Body
                          color={colors.textSecondary}
                          style={{ fontSize: 12 }}
                        >
                          {puzzle.differences.length}つの違い
                        </Body>
                      </View>
                      {isCleared ? (
                        <Badge label="クリア済" color={colors.success} />
                      ) : (
                        <Ionicons
                          name="play-circle"
                          size={28}
                          color={colors.primary}
                        />
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  // Playing / Complete screen
  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.sm }]}>
        {/* Header bar */}
        <View
          style={[
            styles.headerBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radius.sm,
              padding: spacing.sm,
              marginBottom: spacing.sm,
            },
          ]}
        >
          <TouchableOpacity onPress={handleBackToSelect}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Body style={{ fontSize: 13 }} color={colors.textSecondary}>
              {foundDiffs.length} / {currentPuzzle?.differences.length ?? 0}
            </Body>
          </View>

          <View style={styles.timerContainer}>
            <Ionicons
              name="time-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Body style={{ fontSize: 13, marginLeft: 4 }} color={colors.text}>
              {formatTime(elapsedMs + penaltyMs)}
            </Body>
          </View>
        </View>

        {penaltyMs > 0 && (
          <Body
            color={colors.error}
            style={{
              textAlign: 'center',
              fontSize: 11,
              marginBottom: spacing.xs,
            }}
          >
            ペナルティ: +{Math.floor(penaltyMs / 1000)}秒
          </Body>
        )}

        {/* Grid area */}
        <View style={styles.gridsContainer}>
          {currentPuzzle && renderGrid(currentPuzzle.gridA, '画像A')}
          <View style={{ width: spacing.xs }} />
          {currentPuzzle && renderGrid(currentPuzzle.gridB, '画像B')}
        </View>

        {/* Found indicators */}
        {currentPuzzle && (
          <View
            style={[
              styles.foundBar,
              { marginTop: spacing.sm, marginBottom: spacing.xs },
            ]}
          >
            {currentPuzzle.differences.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.foundDot,
                  {
                    backgroundColor:
                      index < foundDiffs.length
                        ? colors.success
                        : colors.border,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    marginHorizontal: 3,
                  },
                ]}
              >
                {index < foundDiffs.length && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Action buttons */}
        <View style={[styles.buttonRow, { marginTop: spacing.sm, gap: spacing.sm }]}>
          {gamePhase === 'playing' && (
            <Button
              title="ヒント (広告)"
              onPress={handleHint}
              variant="outline"
              size="sm"
            />
          )}
          {gamePhase === 'complete' && (
            <Button
              title="レベル選択に戻る"
              onPress={handleBackToSelect}
              size="sm"
            />
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    borderWidth: 1,
  },
  levelCard: {
    flexDirection: 'row',
  },
  levelCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  levelCardLeft: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    borderWidth: 1,
    alignSelf: 'center',
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellEmoji: {
    textAlign: 'center',
  },
  foundBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  foundDot: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
