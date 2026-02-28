import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, Text, PanResponder, Dimensions, Alert } from 'react-native';
import { useTheme, H2, Body, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import type { Grid, GameResult } from '../types';
import {
  initializeGrid,
  move,
  addRandomTile,
  hasValidMoves,
  hasWon,
  getHighestTile,
  cloneGrid,
  getTileColor,
  getTileTextColor,
  getTileFontSize,
  Direction,
} from '../utils/game2048';

const GRID_SIZE = 4;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_PADDING = 8;
const TILE_MARGIN = 4;
const GRID_WIDTH = Math.min(SCREEN_WIDTH - 32, 400);
const TILE_SIZE = (GRID_WIDTH - GRID_PADDING * 2 - TILE_MARGIN * 2 * GRID_SIZE) / GRID_SIZE;

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();

  const [grid, setGrid] = useState<Grid>(initializeGrid);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [wonReached, setWonReached] = useState(false);
  const [wonShown, setWonShown] = useState(false);
  const [bestScore, setBestScore] = useLocalStorage<number>('best-score-2048', 0);
  const [history, setHistory] = useLocalStorage<GameResult[]>('game-history-2048', []);

  const previousState = useRef<{ grid: Grid; score: number } | null>(null);
  const [canUndo, setCanUndo] = useState(false);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(() => {
    if (previousState.current) {
      setGrid(previousState.current.grid);
      setScore(previousState.current.score);
      setGameOver(false);
      setCanUndo(false);
      previousState.current = null;
    }
  });

  const saveGameResult = useCallback(
    (finalScore: number, finalGrid: Grid, won: boolean) => {
      const result: GameResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        score: finalScore,
        highestTile: getHighestTile(finalGrid),
        won,
      };
      setHistory((prev) => [result, ...(prev || [])]);
      if (finalScore > (bestScore || 0)) {
        setBestScore(finalScore);
      }
      trackAction();
    },
    [bestScore, setBestScore, setHistory, trackAction]
  );

  const handleMove = useCallback(
    (direction: Direction) => {
      if (gameOver) return;

      const { newGrid, score: moveScore, moved } = move(grid, direction);
      if (!moved) return;

      previousState.current = { grid: cloneGrid(grid), score };
      setCanUndo(true);

      const gridWithNewTile = addRandomTile(newGrid);
      const newScore = score + moveScore;
      setGrid(gridWithNewTile);
      setScore(newScore);

      if (newScore > (bestScore || 0)) {
        setBestScore(newScore);
      }

      if (hasWon(gridWithNewTile) && !wonReached) {
        setWonReached(true);
        setWonShown(true);
        Alert.alert(
          '2048達成!',
          `スコア: ${newScore}\nおめでとうございます！続けてプレイできます。`,
          [{ text: '続ける', style: 'default' }]
        );
      }

      if (!hasValidMoves(gridWithNewTile)) {
        setGameOver(true);
        saveGameResult(newScore, gridWithNewTile, wonReached || hasWon(gridWithNewTile));
      }
    },
    [grid, score, gameOver, bestScore, wonReached, setBestScore, saveGameResult]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderRelease: (_, gestureState) => {
          const { dx, dy } = gestureState;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          if (Math.max(absDx, absDy) < 20) return;
          if (absDx > absDy) {
            handleMove(dx > 0 ? 'right' : 'left');
          } else {
            handleMove(dy > 0 ? 'down' : 'up');
          }
        },
      }),
    [handleMove]
  );

  const handleNewGame = () => {
    setGrid(initializeGrid());
    setScore(0);
    setGameOver(false);
    setWonReached(false);
    setWonShown(false);
    setCanUndo(false);
    previousState.current = null;
  };

  const handleUndo = () => {
    if (rewardedLoaded && canUndo) {
      showRewardedAd();
    } else if (canUndo && !rewardedLoaded) {
      if (previousState.current) {
        setGrid(previousState.current.grid);
        setScore(previousState.current.score);
        setGameOver(false);
        setCanUndo(false);
        previousState.current = null;
      }
    }
  };

  const renderTile = (value: number | null, rowIndex: number, colIndex: number) => {
    const bgColor = value !== null ? getTileColor(value) : colors.border;
    const textColor = value !== null ? getTileTextColor(value) : 'transparent';
    const fontSize = getTileFontSize(value, TILE_SIZE);

    return (
      <View
        key={`${rowIndex}-${colIndex}`}
        style={[
          styles.tile,
          {
            width: TILE_SIZE,
            height: TILE_SIZE,
            backgroundColor: value !== null ? bgColor : 'transparent',
            borderWidth: value === null ? 1 : 0,
            borderColor: colors.border,
            borderRadius: spacing.sm,
            margin: TILE_MARGIN,
          },
        ]}
      >
        {value !== null && (
          <Text
            style={[
              styles.tileText,
              {
                color: textColor,
                fontSize,
                fontWeight: value >= 8 ? '700' : '600',
              },
            ]}
          >
            {value}
          </Text>
        )}
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <View style={[styles.scoreBar, { marginBottom: spacing.md }]}>
          <View style={[styles.scoreBox, { backgroundColor: colors.primary, borderRadius: spacing.sm, padding: spacing.sm }]}>
            <Body color="#fff" style={styles.scoreLabel}>スコア</Body>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>
          <View style={[styles.scoreBox, { backgroundColor: colors.primaryLight, borderRadius: spacing.sm, padding: spacing.sm }]}>
            <Body color="#fff" style={styles.scoreLabel}>ベスト</Body>
            <Text style={styles.scoreValue}>{bestScore || 0}</Text>
          </View>
        </View>

        <View style={[styles.buttonRow, { marginBottom: spacing.md, gap: spacing.sm }]}>
          <Button title="新しいゲーム" onPress={handleNewGame} size="sm" />
          <Button
            title="元に戻す"
            onPress={handleUndo}
            size="sm"
            variant="outline"
            disabled={!canUndo}
          />
        </View>

        <View
          style={[
            styles.gridContainer,
            {
              width: GRID_WIDTH,
              backgroundColor: colors.surface,
              borderRadius: spacing.md,
              padding: GRID_PADDING,
            },
          ]}
          {...panResponder.panHandlers}
        >
          {grid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell, colIndex) => renderTile(cell, rowIndex, colIndex))}
            </View>
          ))}
        </View>

        {gameOver && (
          <View style={[styles.gameOverOverlay, { marginTop: spacing.lg }]}>
            <Card style={[styles.gameOverCard, { padding: spacing.xl }]}>
              <H2 align="center">ゲームオーバー</H2>
              <Body
                color={colors.textSecondary}
                style={{ textAlign: 'center', marginTop: spacing.sm }}
              >
                最終スコア: {score}
              </Body>
              <Body
                color={colors.textSecondary}
                style={{ textAlign: 'center', marginTop: spacing.xs }}
              >
                最大タイル: {getHighestTile(grid)}
              </Body>
              <View style={{ marginTop: spacing.lg }}>
                <Button title="もう一度プレイ" onPress={handleNewGame} />
              </View>
            </Card>
          </View>
        )}

        {!gameOver && (
          <Body
            color={colors.textMuted}
            style={{ textAlign: 'center', marginTop: spacing.md }}
          >
            スワイプしてタイルを動かそう
          </Body>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  scoreBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  scoreBox: {
    alignItems: 'center',
    minWidth: 100,
  },
  scoreLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  scoreValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  gridContainer: {
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  tile: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  gameOverOverlay: {
    width: '100%',
  },
  gameOverCard: {
    alignItems: 'center',
  },
});
