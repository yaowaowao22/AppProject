import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useTheme, H2, H3, Body, Caption, Button } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useTimer, useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import type { Board, Difficulty, GameResult } from '../types';
import {
  generatePuzzle,
  cloneBoard,
  findConflicts,
  isBoardComplete,
  findHintCell,
  formatTime,
  getDifficultyLabel,
} from '../utils/sudoku';

type GameState = 'select' | 'playing' | 'completed';

export function GameScreen() {
  const { colors, spacing, radius } = useTheme();
  const { trackAction } = useInterstitialAd();
  const timer = useTimer();

  const [gameState, setGameState] = useState<GameState>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [currentBoard, setCurrentBoard] = useState<Board>([]);
  const [initialBoard, setInitialBoard] = useState<Board>([]);
  const [solution, setSolution] = useState<Board>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [conflicts, setConflicts] = useState<Set<string>>(new Set());
  const [history, setHistory] = useLocalStorage<GameResult[]>('sudoku_history', []);

  const completionHandled = useRef(false);
  const giveHintRef = useRef<() => void>(() => {});

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(() => {
    giveHintRef.current();
  });

  const startGame = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      const { puzzle, solution: sol } = generatePuzzle(diff);
      setCurrentBoard(cloneBoard(puzzle));
      setInitialBoard(cloneBoard(puzzle));
      setSolution(sol);
      setSelectedCell(null);
      setConflicts(new Set());
      setGameState('playing');
      completionHandled.current = false;
      timer.reset();
      timer.start();
    },
    [timer],
  );

  const giveHint = useCallback(() => {
    if (gameState !== 'playing') return;
    const cell = findHintCell(currentBoard, initialBoard, solution);
    if (!cell) return;
    const [row, col] = cell;
    const newBoard = cloneBoard(currentBoard);
    newBoard[row][col] = solution[row][col];
    setCurrentBoard(newBoard);
    setConflicts(findConflicts(newBoard));
    setSelectedCell([row, col]);
  }, [currentBoard, initialBoard, solution, gameState]);

  useEffect(() => {
    giveHintRef.current = giveHint;
  }, [giveHint]);

  const handleHint = useCallback(() => {
    if (rewardedLoaded) {
      showRewardedAd();
    } else {
      giveHint();
    }
  }, [rewardedLoaded, showRewardedAd, giveHint]);

  useEffect(() => {
    if (gameState !== 'playing' || completionHandled.current) return;
    if (currentBoard.length === 0) return;

    if (isBoardComplete(currentBoard)) {
      completionHandled.current = true;
      timer.stop();
      setGameState('completed');

      const result: GameResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        difficulty,
        timeSeconds: timer.seconds,
        completed: true,
      };
      setHistory([result, ...(history || [])]);
      trackAction();

      Alert.alert(
        'クリア！',
        `難易度: ${getDifficultyLabel(difficulty)}\nタイム: ${formatTime(timer.seconds)}`,
        [{ text: '新しいゲーム', onPress: () => setGameState('select') }],
      );
    }
  }, [currentBoard, gameState, timer, difficulty, history, setHistory, trackAction]);

  const handleCellPress = (row: number, col: number) => {
    if (gameState !== 'playing') return;
    setSelectedCell([row, col]);
  };

  const handleNumberPress = (num: number) => {
    if (!selectedCell || gameState !== 'playing') return;
    const [row, col] = selectedCell;
    if (initialBoard[row][col] !== 0) return;

    const newBoard = cloneBoard(currentBoard);
    newBoard[row][col] = num;
    setCurrentBoard(newBoard);
    setConflicts(findConflicts(newBoard));
  };

  const handleErase = () => {
    if (!selectedCell || gameState !== 'playing') return;
    const [row, col] = selectedCell;
    if (initialBoard[row][col] !== 0) return;

    const newBoard = cloneBoard(currentBoard);
    newBoard[row][col] = 0;
    setCurrentBoard(newBoard);
    setConflicts(findConflicts(newBoard));
  };

  const handleNewGame = () => {
    if (gameState === 'playing') {
      Alert.alert('新しいゲーム', '現在のゲームを終了しますか？', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '終了する',
          onPress: () => {
            timer.stop();
            setGameState('select');
          },
        },
      ]);
    } else {
      setGameState('select');
    }
  };

  const screenWidth = Dimensions.get('window').width;
  const boardPadding = spacing.sm * 2;
  const boardSize = Math.min(screenWidth - boardPadding * 2, 400);
  const cellSize = Math.floor(boardSize / 9);

  if (gameState === 'select') {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.xl }]}>
          <View style={styles.selectContainer}>
            <H2 align="center" style={{ marginBottom: spacing.xl }}>
              難易度を選択
            </H2>
            <View style={{ gap: spacing.md }}>
              <Button title="初級（Easy）" onPress={() => startGame('easy')} size="lg" />
              <Button
                title="中級（Medium）"
                onPress={() => startGame('medium')}
                size="lg"
                variant="secondary"
              />
              <Button
                title="上級（Hard）"
                onPress={() => startGame('hard')}
                size="lg"
                variant="outline"
              />
            </View>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.sm }]}>
        <View style={[styles.header, { marginBottom: spacing.sm, paddingHorizontal: spacing.sm }]}>
          <View style={styles.headerLeft}>
            <Caption color={colors.textSecondary}>
              {getDifficultyLabel(difficulty)}
            </Caption>
          </View>
          <View style={styles.headerCenter}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Body style={{ marginLeft: 4 }}>{formatTime(timer.seconds)}</Body>
          </View>
          <TouchableOpacity onPress={handleNewGame} style={styles.headerRight}>
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.boardContainer,
            {
              borderColor: colors.text,
              borderRadius: radius.sm,
              alignSelf: 'center',
            },
          ]}
        >
          {currentBoard.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map((cell, colIdx) => {
                const isSelected =
                  selectedCell !== null &&
                  selectedCell[0] === rowIdx &&
                  selectedCell[1] === colIdx;
                const isGiven = initialBoard[rowIdx]?.[colIdx] !== 0;
                const isConflict = conflicts.has(`${rowIdx},${colIdx}`);
                const isSameRow = selectedCell !== null && selectedCell[0] === rowIdx;
                const isSameCol = selectedCell !== null && selectedCell[1] === colIdx;
                const isSameBox =
                  selectedCell !== null &&
                  Math.floor(selectedCell[0] / 3) === Math.floor(rowIdx / 3) &&
                  Math.floor(selectedCell[1] / 3) === Math.floor(colIdx / 3);
                const isHighlighted = !isSelected && (isSameRow || isSameCol || isSameBox);

                const borderRight =
                  colIdx % 3 === 2 && colIdx < 8
                    ? { borderRightWidth: 2, borderRightColor: colors.text }
                    : { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border };
                const borderBottom =
                  rowIdx % 3 === 2 && rowIdx < 8
                    ? { borderBottomWidth: 2, borderBottomColor: colors.text }
                    : { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border };

                let bgColor = colors.surface;
                if (isSelected) {
                  bgColor = colors.primaryLight;
                } else if (isConflict) {
                  bgColor = colors.error + '22';
                } else if (isHighlighted) {
                  bgColor = colors.primaryLight + '44';
                }

                return (
                  <TouchableOpacity
                    key={colIdx}
                    onPress={() => handleCellPress(rowIdx, colIdx)}
                    activeOpacity={0.7}
                    style={[
                      styles.cell,
                      {
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: bgColor,
                      },
                      borderRight,
                      borderBottom,
                    ]}
                  >
                    {cell !== 0 && (
                      <Body
                        style={[
                          styles.cellText,
                          {
                            color: isConflict
                              ? colors.error
                              : isGiven
                                ? colors.text
                                : colors.primary,
                            fontWeight: isGiven ? '700' : '400',
                            fontSize: cellSize * 0.45,
                          },
                        ]}
                      >
                        {cell}
                      </Body>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <View style={[styles.numpadContainer, { marginTop: spacing.md }]}>
          <View style={styles.numpadRow}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberPress(num)}
                style={[
                  styles.numpadButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <H3 style={{ color: colors.primary }}>{num}</H3>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.numpadRow}>
            {[6, 7, 8, 9].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberPress(num)}
                style={[
                  styles.numpadButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <H3 style={{ color: colors.primary }}>{num}</H3>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={handleErase}
              style={[
                styles.numpadButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Ionicons name="backspace-outline" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.actionRow, { marginTop: spacing.md, gap: spacing.sm }]}>
          <Button
            title="ヒント"
            onPress={handleHint}
            variant="outline"
            size="sm"
          />
          <Button title="新しいゲーム" onPress={handleNewGame} variant="ghost" size="sm" />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  boardContainer: {
    borderWidth: 2,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    textAlign: 'center',
  },
  numpadContainer: {
    alignItems: 'center',
    gap: 8,
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  numpadButton: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
