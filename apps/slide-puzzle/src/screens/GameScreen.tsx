import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Alert, Text } from 'react-native';
import { useTheme, H2, Body, Button, Card, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import type { GridSize, GameResult } from '../utils/slidePuzzle';
import {
  shuffleBoard,
  moveTile,
  isSolved,
  canMove,
  findHintMove,
  getTileColor,
  getTileTextColor,
  formatTime,
  getGridSizeLabel,
  getPuzzleName,
} from '../utils/slidePuzzle';

type GamePhase = 'select' | 'playing' | 'completed';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_AREA_WIDTH = Math.min(SCREEN_WIDTH - 48, 380);
const GRID_PADDING = 6;
const TILE_GAP = 4;

function calculateTileSize(size: GridSize): number {
  return Math.floor((GRID_AREA_WIDTH - GRID_PADDING * 2 - TILE_GAP * (size + 1)) / size);
}

const SIZE_OPTIONS: { size: GridSize; label: string; difficulty: string }[] = [
  { size: 3, label: '3x3', difficulty: '8パズル - かんたん' },
  { size: 4, label: '4x4', difficulty: '15パズル - ふつう' },
  { size: 5, label: '5x5', difficulty: '24パズル - むずかしい' },
];

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();

  const [history, setHistory] = useLocalStorage<GameResult[]>('slide-puzzle-history', []);
  const [bestTimes, setBestTimes] = useLocalStorage<Record<string, number>>(
    'slide-puzzle-best-times',
    {}
  );

  const [phase, setPhase] = useState<GamePhase>('select');
  const [gridSize, setGridSize] = useState<GridSize>(4);
  const [board, setBoard] = useState<number[]>([]);
  const [moveCount, setMoveCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hintTile, setHintTile] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleReward = useCallback(() => {
    if (phase !== 'playing' || board.length === 0) return;
    const hintIdx = findHintMove(board, gridSize);
    if (hintIdx >= 0) {
      setHintTile(hintIdx);
      setTimeout(() => setHintTile(null), 3000);
    } else {
      Alert.alert('ヒント', 'パズルは既に完成しています！');
    }
  }, [phase, board, gridSize]);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(handleReward);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  const startGame = useCallback(
    (size: GridSize) => {
      setGridSize(size);
      setBoard(shuffleBoard(size));
      setMoveCount(0);
      setElapsedSeconds(0);
      setIsTimerRunning(true);
      setHintTile(null);
      setPhase('playing');
    },
    []
  );

  const handleTilePress = useCallback(
    (tileIndex: number) => {
      if (phase !== 'playing') return;
      if (!canMove(board, tileIndex, gridSize)) return;

      const newBoard = moveTile(board, tileIndex, gridSize);
      if (!newBoard) return;

      setBoard(newBoard);
      setMoveCount((prev) => prev + 1);
      setHintTile(null);

      if (isSolved(newBoard, gridSize)) {
        setIsTimerRunning(false);
        const finalMoves = moveCount + 1;
        const finalTime = elapsedSeconds;

        const result: GameResult = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          gridSize,
          moves: finalMoves,
          timeSeconds: finalTime,
        };
        setHistory((prev) => [result, ...(prev || [])]);

        const key = `${gridSize}x${gridSize}`;
        const currentBest = bestTimes?.[key];
        if (!currentBest || finalTime < currentBest) {
          setBestTimes((prev) => ({ ...(prev || {}), [key]: finalTime }));
        }

        trackAction();
        setPhase('completed');
      }
    },
    [phase, board, gridSize, moveCount, elapsedSeconds, history, bestTimes, setHistory, setBestTimes, trackAction]
  );

  const handleHint = () => {
    if (rewardedLoaded) {
      showRewardedAd();
    } else {
      handleReward();
    }
  };

  const handleReset = () => {
    Alert.alert('リセット', 'パズルをリセットしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'リセット',
        style: 'destructive',
        onPress: () => startGame(gridSize),
      },
    ]);
  };

  const handleBackToSelect = () => {
    setIsTimerRunning(false);
    setPhase('select');
  };

  // Size selection phase
  if (phase === 'select') {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.lg }]}>
          <H2 style={{ marginBottom: spacing.xl, textAlign: 'center' }}>
            サイズを選択
          </H2>
          {SIZE_OPTIONS.map((option) => {
            const key = `${option.size}x${option.size}`;
            const best = bestTimes?.[key];
            return (
              <TouchableOpacity
                key={option.size}
                onPress={() => startGame(option.size)}
                activeOpacity={0.7}
              >
                <Card
                  style={[
                    styles.sizeCard,
                    { marginBottom: spacing.md, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.sizeCardContent}>
                    <View style={{ flex: 1 }}>
                      <H2>{option.label}</H2>
                      <Body color={colors.textSecondary}>{option.difficulty}</Body>
                      {best !== undefined && (
                        <Body color={colors.primary} style={{ marginTop: 2 }}>
                          ベスト: {formatTime(best)}
                        </Body>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScreenWrapper>
    );
  }

  // Completed phase
  if (phase === 'completed') {
    const lastResult = history && history.length > 0 ? history[0] : null;
    const key = `${gridSize}x${gridSize}`;
    const best = bestTimes?.[key];
    const isNewBest = lastResult && best !== undefined && lastResult.timeSeconds === best;

    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.lg, justifyContent: 'center' }]}>
          <View style={styles.completedContent}>
            <Ionicons name="trophy" size={64} color={colors.primary} />
            <H2 style={{ marginTop: spacing.lg, textAlign: 'center' }}>
              クリア！
            </H2>
            <Body
              color={colors.primary}
              style={{ textAlign: 'center', marginTop: spacing.sm, fontWeight: 'bold', fontSize: 18 }}
            >
              {getPuzzleName(gridSize)} ({getGridSizeLabel(gridSize)})
            </Body>
            {isNewBest && (
              <Badge
                label="ベスト記録更新！"
                variant="success"
              />
            )}
            <Card style={[styles.statsCard, { marginTop: spacing.lg, padding: spacing.lg }]}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                  <Body color={colors.textSecondary}>タイム</Body>
                  <H2>{lastResult ? formatTime(lastResult.timeSeconds) : '--:--'}</H2>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="swap-horizontal" size={20} color={colors.textSecondary} />
                  <Body color={colors.textSecondary}>手数</Body>
                  <H2>{lastResult ? `${lastResult.moves}手` : '--'}</H2>
                </View>
              </View>
            </Card>
          </View>
          <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
            <Button title="もう一度プレイ" onPress={() => startGame(gridSize)} />
            <Button title="サイズ選択に戻る" onPress={handleBackToSelect} variant="outline" />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // Playing phase
  const tileSize = calculateTileSize(gridSize);
  const totalTiles = gridSize * gridSize;
  const gridWidth = tileSize * gridSize + TILE_GAP * (gridSize + 1) + GRID_PADDING * 2;

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.md }]}>
        {/* Header */}
        <View style={[styles.header, { marginBottom: spacing.sm }]}>
          <TouchableOpacity onPress={handleBackToSelect}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Badge label={getPuzzleName(gridSize)} />
          <TouchableOpacity onPress={handleReset}>
            <Ionicons name="refresh" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Stats bar */}
        <View style={[styles.statsBar, { marginBottom: spacing.md }]}>
          <View style={[styles.statBox, { backgroundColor: colors.primary, borderRadius: spacing.sm, padding: spacing.sm }]}>
            <Body color="#fff" style={styles.statLabel}>タイム</Body>
            <Text style={styles.statValue}>{formatTime(elapsedSeconds)}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.primaryLight, borderRadius: spacing.sm, padding: spacing.sm }]}>
            <Body color="#fff" style={styles.statLabel}>手数</Body>
            <Text style={styles.statValue}>{moveCount}</Text>
          </View>
        </View>

        {/* Puzzle grid */}
        <View
          style={[
            styles.gridContainer,
            {
              width: gridWidth,
              backgroundColor: colors.surface,
              borderRadius: spacing.md,
              padding: GRID_PADDING,
            },
          ]}
        >
          <View style={styles.grid}>
            {board.map((value, index) => {
              const row = Math.floor(index / gridSize);
              const col = index % gridSize;
              const isEmpty = value === 0;
              const isMovable = !isEmpty && canMove(board, index, gridSize);
              const isHinted = hintTile === index;

              return (
                <TouchableOpacity
                  key={`${row}-${col}`}
                  onPress={() => handleTilePress(index)}
                  activeOpacity={isMovable ? 0.7 : 1}
                  disabled={isEmpty || !isMovable}
                  style={[
                    styles.tile,
                    {
                      width: tileSize,
                      height: tileSize,
                      margin: TILE_GAP / 2,
                      borderRadius: spacing.sm,
                      backgroundColor: isEmpty
                        ? 'transparent'
                        : getTileColor(value, totalTiles),
                      borderWidth: isEmpty ? 0 : isHinted ? 3 : 0,
                      borderColor: isHinted ? colors.warning : 'transparent',
                    },
                  ]}
                >
                  {!isEmpty && (
                    <Text
                      style={[
                        styles.tileText,
                        {
                          color: getTileTextColor(value, totalTiles),
                          fontSize: tileSize * (gridSize === 5 ? 0.32 : 0.38),
                        },
                      ]}
                    >
                      {value}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Instructions */}
        <Body
          color={colors.textMuted}
          style={{ textAlign: 'center', marginTop: spacing.md }}
        >
          数字をタップしてスライドさせよう
        </Body>

        {/* Hint button */}
        <View style={{ marginTop: spacing.md }}>
          <Button
            title="ヒント（広告を見る）"
            onPress={handleHint}
            variant="outline"
            size="sm"
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  statBox: {
    alignItems: 'center',
    minWidth: 100,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  gridContainer: {
    alignSelf: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tile: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  tileText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  sizeCard: {
    padding: 16,
  },
  sizeCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  statsCard: {
    width: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
});
