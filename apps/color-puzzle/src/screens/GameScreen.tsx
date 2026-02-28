import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useTheme, H2, Body, Button } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import type { Difficulty, PuzzleColor, GameResult } from '../types';
import {
  PUZZLE_COLORS,
  DIFFICULTY_CONFIG,
  generateGrid,
  applyFloodFill,
  checkWin,
  calculateStars,
  countFloodRegionSize,
} from '../utils/colorPuzzle';

type GameState = 'idle' | 'playing' | 'won';

const SCREEN_WIDTH = Dimensions.get('window').width;

function getStarsText(stars: number): string {
  if (stars === 3) return '★★★';
  if (stars === 2) return '★★☆';
  return '★☆☆';
}

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();

  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const config = DIFFICULTY_CONFIG[difficulty];
  const { size, colorCount, targetMoves } = config;

  const [grid, setGrid] = useState<PuzzleColor[][]>(() =>
    generateGrid(size, colorCount)
  );
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState<GameState>('playing');

  const [history, setHistory] = useLocalStorage<GameResult[]>(
    'color_puzzle_history',
    []
  );

  const handleReward = useCallback(() => {
    if (gameState !== 'playing') return;
    setGrid((prev) => {
      const regionSize = countFloodRegionSize(prev, size);
      const totalCells = size * size;
      if (regionSize >= totalCells) return prev;

      const colorsInUse = new Set<PuzzleColor>();
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (prev[r][c] !== prev[0][0]) {
            colorsInUse.add(prev[r][c]);
          }
        }
      }

      let bestColor: PuzzleColor = prev[0][0];
      let bestSize = 0;
      for (const color of colorsInUse) {
        const testGrid = applyFloodFill(prev, size, color);
        const testSize = countFloodRegionSize(testGrid, size);
        if (testSize > bestSize) {
          bestSize = testSize;
          bestColor = color;
        }
      }

      const newGrid = applyFloodFill(prev, size, bestColor);
      setMoves((m) => m + 1);

      if (checkWin(newGrid, size)) {
        const finalMoves = moves + 1;
        const stars = calculateStars(finalMoves, targetMoves);
        setGameState('won');
        saveResult(finalMoves, stars);
        Alert.alert(
          'クリア！',
          `${finalMoves}手でクリア！\n${getStarsText(stars)}`
        );
      }

      return newGrid;
    });
  }, [gameState, size, moves, targetMoves]);

  const { show: showRewardedAd, loaded: rewardedLoaded } =
    useRewardedAd(handleReward);

  const cellSize = Math.floor(
    (SCREEN_WIDTH - spacing.lg * 2 - 4) / size
  );

  const saveResult = useCallback(
    (finalMoves: number, stars: number) => {
      const result: GameResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        difficulty,
        moves: finalMoves,
        targetMoves,
        stars,
      };
      setHistory((prev) => [result, ...(prev ?? [])]);
      trackAction();
    },
    [difficulty, targetMoves, setHistory, trackAction]
  );

  const resetGame = useCallback(
    (newDifficulty?: Difficulty) => {
      const d = newDifficulty ?? difficulty;
      const cfg = DIFFICULTY_CONFIG[d];
      setGrid(generateGrid(cfg.size, cfg.colorCount));
      setMoves(0);
      setGameState('playing');
      if (newDifficulty) setDifficulty(newDifficulty);
    },
    [difficulty]
  );

  const handleColorPress = useCallback(
    (colorIndex: PuzzleColor) => {
      if (gameState !== 'playing') return;
      if (grid[0][0] === colorIndex) return;

      const newGrid = applyFloodFill(grid, size, colorIndex);
      const newMoves = moves + 1;
      setGrid(newGrid);
      setMoves(newMoves);

      if (checkWin(newGrid, size)) {
        const stars = calculateStars(newMoves, targetMoves);
        setGameState('won');
        saveResult(newMoves, stars);
        Alert.alert(
          'クリア！',
          `${newMoves}手でクリア！\n${getStarsText(stars)}`
        );
      }
    },
    [grid, gameState, size, moves, targetMoves, saveResult]
  );

  const handleHint = useCallback(() => {
    if (gameState !== 'playing') return;
    if (rewardedLoaded) {
      showRewardedAd();
    } else {
      Alert.alert('ヒント', '広告の準備ができていません。少々お待ちください。');
    }
  }, [gameState, rewardedLoaded, showRewardedAd]);

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <View style={[styles.difficultyRow, { marginBottom: spacing.sm }]}>
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
                  borderRadius: spacing.xs,
                },
              ]}
              onPress={() => resetGame(d)}
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

        <View
          style={[
            styles.statusBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: spacing.xs,
              padding: spacing.sm,
              marginBottom: spacing.sm,
            },
          ]}
        >
          <View style={styles.statusItem}>
            <Body color={colors.textSecondary}>手数</Body>
            <H2>
              {moves}/{targetMoves}
            </H2>
          </View>

          <TouchableOpacity
            onPress={() => resetGame()}
            style={styles.resetButton}
          >
            <Body style={{ fontSize: 28 }}>
              {gameState === 'won' ? '😎' : '🔄'}
            </Body>
          </TouchableOpacity>

          <View style={styles.statusItem}>
            <Body color={colors.textSecondary}>目標</Body>
            <H2>{targetMoves}手</H2>
          </View>
        </View>

        <View style={styles.gridContainer}>
          <View
            style={[
              styles.grid,
              {
                borderColor: colors.border,
                borderWidth: 2,
                borderRadius: 4,
                overflow: 'hidden',
              },
            ]}
          >
            {grid.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((cellColor, colIndex) => (
                  <View
                    key={`${rowIndex}-${colIndex}`}
                    style={[
                      styles.cell,
                      {
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: PUZZLE_COLORS[cellColor],
                      },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.colorButtonsContainer, { marginTop: spacing.sm }]}>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center', marginBottom: spacing.xs }}
          >
            色を選んでタップ
          </Body>
          <View style={styles.colorButtonsRow}>
            {Array.from({ length: 6 }, (_, i) => i as PuzzleColor)
              .filter((i) => i < colorCount)
              .map((colorIndex) => {
                const isCurrentColor = grid[0][0] === colorIndex;
                return (
                  <TouchableOpacity
                    key={colorIndex}
                    style={[
                      styles.colorButton,
                      {
                        backgroundColor: PUZZLE_COLORS[colorIndex],
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        borderWidth: isCurrentColor ? 3 : 1,
                        borderColor: isCurrentColor
                          ? colors.text
                          : colors.border,
                        opacity:
                          isCurrentColor || gameState !== 'playing' ? 0.4 : 1,
                      },
                    ]}
                    onPress={() => handleColorPress(colorIndex)}
                    disabled={isCurrentColor || gameState !== 'playing'}
                    activeOpacity={0.7}
                  />
                );
              })}
          </View>
        </View>

        <View
          style={[styles.bottomBar, { marginTop: spacing.sm, gap: spacing.sm }]}
        >
          {gameState === 'won' ? (
            <Button
              title="もう一度プレイ"
              onPress={() => resetGame()}
              size="sm"
            />
          ) : (
            <Button
              title="ヒント (広告)"
              onPress={handleHint}
              variant="outline"
              size="sm"
              disabled={gameState !== 'playing'}
            />
          )}
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
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    borderWidth: 1,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  statusItem: {
    alignItems: 'center',
    gap: 2,
  },
  resetButton: {
    padding: 4,
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  colorButtonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  colorButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  colorButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
