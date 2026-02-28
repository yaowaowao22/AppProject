import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Alert, Text } from 'react-native';
import { useTheme, H2, Body, Button } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useTimer, useLocalStorage } from '@massapp/hooks';
import type { Cell, Difficulty, GameResult } from '../types';
import {
  DIFFICULTY_CONFIG,
  createEmptyGrid,
  placeMines,
  revealCell,
  toggleFlag,
  checkWin,
  revealAllMines,
  countFlags,
  findSafeUnrevealedCell,
} from '../utils/minesweeper';

type GameState = 'idle' | 'playing' | 'won' | 'lost';

const NUMBER_COLORS: Record<number, string> = {
  1: '#0000FF',
  2: '#008000',
  3: '#FF0000',
  4: '#000080',
  5: '#800000',
  6: '#008080',
  7: '#000000',
  8: '#808080',
};

const SCREEN_WIDTH = Dimensions.get('window').width;

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();
  const { seconds, isRunning, start, stop, reset } = useTimer();

  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const config = DIFFICULTY_CONFIG[difficulty];
  const { rows, cols, mines } = config;

  const [grid, setGrid] = useState<Cell[][]>(() => createEmptyGrid(rows, cols));
  const [gameState, setGameState] = useState<GameState>('idle');
  const minesPlacedRef = useRef(false);

  const [history, setHistory] = useLocalStorage<GameResult[]>('minesweeper_history', []);

  const handleReward = useCallback(() => {
    if (gameState !== 'playing') return;
    setGrid((prev) => {
      const target = findSafeUnrevealedCell(prev);
      if (!target) return prev;
      const [r, c] = target;
      const newGrid = revealCell(prev, r, c, rows, cols);
      if (checkWin(newGrid)) {
        stop();
        setGameState('won');
        saveResult(true);
      }
      return newGrid;
    });
  }, [gameState, rows, cols]);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(handleReward);

  const cellSize = Math.floor((SCREEN_WIDTH - spacing.lg * 2 - 4) / cols);

  const saveResult = useCallback(
    (won: boolean) => {
      const result: GameResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        difficulty,
        timeSeconds: seconds,
        won,
      };
      setHistory((prev) => [result, ...(prev ?? [])]);
      trackAction();
    },
    [difficulty, seconds, setHistory, trackAction]
  );

  const resetGame = useCallback(
    (newDifficulty?: Difficulty) => {
      const d = newDifficulty ?? difficulty;
      const cfg = DIFFICULTY_CONFIG[d];
      setGrid(createEmptyGrid(cfg.rows, cfg.cols));
      setGameState('idle');
      minesPlacedRef.current = false;
      stop();
      reset();
      if (newDifficulty) setDifficulty(newDifficulty);
    },
    [difficulty, stop, reset]
  );

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (gameState === 'won' || gameState === 'lost') return;

      const cell = grid[row][col];
      if (cell.revealed || cell.flagged) return;

      let currentGrid = grid;

      if (!minesPlacedRef.current) {
        currentGrid = placeMines(currentGrid, rows, cols, mines, row, col);
        minesPlacedRef.current = true;
        setGameState('playing');
        start();
      }

      const newGrid = revealCell(currentGrid, row, col, rows, cols);
      setGrid(newGrid);

      if (newGrid[row][col].isMine) {
        const finalGrid = revealAllMines(newGrid);
        setGrid(finalGrid);
        setGameState('lost');
        stop();
        saveResult(false);
        Alert.alert('ゲームオーバー', '地雷を踏んでしまいました...');
        return;
      }

      if (checkWin(newGrid)) {
        setGameState('won');
        stop();
        saveResult(true);
        Alert.alert('クリア！', `${seconds}秒でクリアしました！`);
      }
    },
    [grid, gameState, rows, cols, mines, start, stop, seconds, saveResult]
  );

  const handleCellLongPress = useCallback(
    (row: number, col: number) => {
      if (gameState === 'won' || gameState === 'lost') return;
      if (gameState === 'idle') return;
      const cell = grid[row][col];
      if (cell.revealed) return;
      setGrid(toggleFlag(grid, row, col));
    },
    [grid, gameState]
  );

  const handleHint = useCallback(() => {
    if (gameState !== 'playing') return;
    if (rewardedLoaded) {
      showRewardedAd();
    } else {
      Alert.alert('ヒント', '広告の準備ができていません。少々お待ちください。');
    }
  }, [gameState, rewardedLoaded, showRewardedAd]);

  const flagCount = countFlags(grid);
  const mineDisplay = mines - flagCount;

  const getSmiley = () => {
    if (gameState === 'won') return '😎';
    if (gameState === 'lost') return '😵';
    return '🙂';
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCell = (cell: Cell, row: number, col: number) => {
    let content: React.ReactNode = null;
    let backgroundColor = colors.surface;
    let borderStyle: any = {
      borderTopColor: '#fff',
      borderLeftColor: '#fff',
      borderRightColor: '#888',
      borderBottomColor: '#888',
      borderWidth: 2,
    };

    if (cell.revealed) {
      borderStyle = {
        borderWidth: 1,
        borderColor: colors.border,
      };
      if (cell.isMine) {
        backgroundColor = colors.error;
        content = <Text style={styles.cellEmoji}>{'💣'}</Text>;
      } else if (cell.adjacentMines > 0) {
        backgroundColor = colors.background;
        content = (
          <Text
            style={[
              styles.cellNumber,
              {
                color: NUMBER_COLORS[cell.adjacentMines] || '#000',
                fontSize: Math.max(cellSize * 0.5, 10),
              },
            ]}
          >
            {cell.adjacentMines}
          </Text>
        );
      } else {
        backgroundColor = colors.background;
      }
    } else if (cell.flagged) {
      content = <Text style={styles.cellEmoji}>{'🚩'}</Text>;
    }

    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[
          styles.cell,
          {
            width: cellSize,
            height: cellSize,
            backgroundColor,
          },
          borderStyle,
        ]}
        onPress={() => handleCellPress(row, col)}
        onLongPress={() => handleCellLongPress(row, col)}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  };

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
                  backgroundColor: difficulty === d ? colors.primary : colors.surface,
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
            <Text style={[styles.statusEmoji]}>{'💣'}</Text>
            <H2>{mineDisplay}</H2>
          </View>

          <TouchableOpacity onPress={() => resetGame()} style={styles.smileyButton}>
            <Text style={styles.smiley}>{getSmiley()}</Text>
          </TouchableOpacity>

          <View style={styles.statusItem}>
            <Text style={[styles.statusEmoji]}>{'⏱️'}</Text>
            <H2>{formatTime(seconds)}</H2>
          </View>
        </View>

        <View style={styles.gridContainer}>
          <View
            style={[
              styles.grid,
              {
                borderColor: colors.border,
                borderWidth: 2,
              },
            ]}
          >
            {grid.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))}
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.bottomBar, { marginTop: spacing.sm, gap: spacing.sm }]}>
          <Button
            title="ヒント (広告)"
            onPress={handleHint}
            variant="outline"
            size="sm"
            disabled={gameState !== 'playing'}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusEmoji: {
    fontSize: 18,
  },
  smileyButton: {
    padding: 4,
  },
  smiley: {
    fontSize: 32,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellNumber: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cellEmoji: {
    fontSize: 14,
    textAlign: 'center',
  },
  bottomBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
