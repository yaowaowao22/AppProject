import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Dimensions, ScrollView } from 'react-native';
import { useTheme, H2, H3, Body, Caption, Button } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useTimer, useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import type { Board, Difficulty, GameResult, NotesBoard, Cage } from '../types';
import { getPuzzlesByDifficulty } from '../data/puzzles';
import {
  cloneBoard,
  createNotesBoard,
  cloneNotesBoard,
  findConflicts,
  isBoardComplete,
  findHintCell,
  formatTime,
  getDifficultyLabel,
  getCageColor,
  getCageForCell,
  isFirstCellInCage,
  getCageBorders,
} from '../utils/killerSudoku';

type GameState = 'select' | 'playing' | 'completed';

export function GameScreen() {
  const { colors, spacing, radius } = useTheme();
  const { trackAction } = useInterstitialAd();
  const timer = useTimer();

  const [gameState, setGameState] = useState<GameState>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [puzzleId, setPuzzleId] = useState('');
  const [currentBoard, setCurrentBoard] = useState<Board>([]);
  const [givenBoard, setGivenBoard] = useState<Board>([]);
  const [solution, setSolution] = useState<Board>([]);
  const [cages, setCages] = useState<Cage[]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [conflicts, setConflicts] = useState<Set<string>>(new Set());
  const [notesMode, setNotesMode] = useState(false);
  const [notesBoard, setNotesBoard] = useState<NotesBoard>(createNotesBoard());
  const [history, setHistory] = useLocalStorage<GameResult[]>('killer_sudoku_history', []);

  const completionHandled = useRef(false);
  const giveHintRef = useRef<() => void>(() => {});

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(() => {
    giveHintRef.current();
  });

  const startGame = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      const available = getPuzzlesByDifficulty(diff);
      const completed = (history || []).filter((r) => r.difficulty === diff && r.completed).map((r) => r.puzzleId);
      const unplayed = available.filter((p) => !completed.includes(p.id));
      const puzzle = unplayed.length > 0
        ? unplayed[Math.floor(Math.random() * unplayed.length)]
        : available[Math.floor(Math.random() * available.length)];

      setPuzzleId(puzzle.id);
      setCurrentBoard(cloneBoard(puzzle.given));
      setGivenBoard(cloneBoard(puzzle.given));
      setSolution(cloneBoard(puzzle.grid));
      setCages(puzzle.cages);
      setSelectedCell(null);
      setConflicts(new Set());
      setNotesMode(false);
      setNotesBoard(createNotesBoard());
      setGameState('playing');
      completionHandled.current = false;
      timer.reset();
      timer.start();
    },
    [timer, history],
  );

  const giveHint = useCallback(() => {
    if (gameState !== 'playing') return;
    const cell = findHintCell(currentBoard, givenBoard, solution);
    if (!cell) return;
    const [row, col] = cell;
    const newBoard = cloneBoard(currentBoard);
    newBoard[row][col] = solution[row][col];
    const newNotes = cloneNotesBoard(notesBoard);
    newNotes[row][col].clear();
    setCurrentBoard(newBoard);
    setNotesBoard(newNotes);
    setConflicts(findConflicts(newBoard, cages));
    setSelectedCell([row, col]);
  }, [currentBoard, givenBoard, solution, gameState, cages, notesBoard]);

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

    if (isBoardComplete(currentBoard, cages)) {
      completionHandled.current = true;
      timer.stop();
      setGameState('completed');

      const result: GameResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        difficulty,
        puzzleId,
        timeSeconds: timer.seconds,
        completed: true,
      };
      setHistory([result, ...(history || [])]);
      trackAction();

      Alert.alert(
        '\u30AF\u30EA\u30A2\uFF01',
        `\u96E3\u6613\u5EA6: ${getDifficultyLabel(difficulty)}\n\u30BF\u30A4\u30E0: ${formatTime(timer.seconds)}`,
        [{ text: '\u65B0\u3057\u3044\u30B2\u30FC\u30E0', onPress: () => setGameState('select') }],
      );
    }
  }, [currentBoard, gameState, timer, difficulty, puzzleId, history, setHistory, trackAction, cages]);

  const handleCellPress = (row: number, col: number) => {
    if (gameState !== 'playing') return;
    setSelectedCell([row, col]);
  };

  const handleNumberPress = (num: number) => {
    if (!selectedCell || gameState !== 'playing') return;
    const [row, col] = selectedCell;
    if (givenBoard[row][col] !== 0) return;

    if (notesMode) {
      const newNotes = cloneNotesBoard(notesBoard);
      if (newNotes[row][col].has(num)) {
        newNotes[row][col].delete(num);
      } else {
        newNotes[row][col].add(num);
      }
      setNotesBoard(newNotes);
    } else {
      const newBoard = cloneBoard(currentBoard);
      newBoard[row][col] = num;
      const newNotes = cloneNotesBoard(notesBoard);
      newNotes[row][col].clear();
      setCurrentBoard(newBoard);
      setNotesBoard(newNotes);
      setConflicts(findConflicts(newBoard, cages));
    }
  };

  const handleErase = () => {
    if (!selectedCell || gameState !== 'playing') return;
    const [row, col] = selectedCell;
    if (givenBoard[row][col] !== 0) return;

    const newBoard = cloneBoard(currentBoard);
    newBoard[row][col] = 0;
    const newNotes = cloneNotesBoard(notesBoard);
    newNotes[row][col].clear();
    setCurrentBoard(newBoard);
    setNotesBoard(newNotes);
    setConflicts(findConflicts(newBoard, cages));
  };

  const handleNewGame = () => {
    if (gameState === 'playing') {
      Alert.alert('\u65B0\u3057\u3044\u30B2\u30FC\u30E0', '\u73FE\u5728\u306E\u30B2\u30FC\u30E0\u3092\u7D42\u4E86\u3057\u307E\u3059\u304B\uFF1F', [
        { text: '\u30AD\u30E3\u30F3\u30BB\u30EB', style: 'cancel' },
        {
          text: '\u7D42\u4E86\u3059\u308B',
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
              {'\u96E3\u6613\u5EA6\u3092\u9078\u629E'}
            </H2>
            <View style={{ gap: spacing.md }}>
              <Button title={'\u521D\u7D1A\uFF08Easy\uFF09'} onPress={() => startGame('easy')} size="lg" />
              <Button
                title={'\u4E2D\u7D1A\uFF08Medium\uFF09'}
                onPress={() => startGame('medium')}
                size="lg"
                variant="secondary"
              />
              <Button
                title={'\u4E0A\u7D1A\uFF08Hard\uFF09'}
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
      <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.sm, paddingBottom: spacing.xl }}>
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
                const isGiven = givenBoard[rowIdx]?.[colIdx] !== 0;
                const isConflict = conflicts.has(`${rowIdx},${colIdx}`);
                const isSameRow = selectedCell !== null && selectedCell[0] === rowIdx;
                const isSameCol = selectedCell !== null && selectedCell[1] === colIdx;
                const isSameBox =
                  selectedCell !== null &&
                  Math.floor(selectedCell[0] / 3) === Math.floor(rowIdx / 3) &&
                  Math.floor(selectedCell[1] / 3) === Math.floor(colIdx / 3);
                const isHighlighted = !isSelected && (isSameRow || isSameCol || isSameBox);

                const boxBorderRight =
                  colIdx % 3 === 2 && colIdx < 8
                    ? { borderRightWidth: 2, borderRightColor: colors.text }
                    : { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border };
                const boxBorderBottom =
                  rowIdx % 3 === 2 && rowIdx < 8
                    ? { borderBottomWidth: 2, borderBottomColor: colors.text }
                    : { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border };

                const cageInfo = getCageForCell(rowIdx, colIdx, cages);
                const cageColor = cageInfo ? getCageColor(cageInfo.index) : 'transparent';
                const showCageSum = cageInfo ? isFirstCellInCage(rowIdx, colIdx, cageInfo.cage) : false;
                const cageBorders = cageInfo ? getCageBorders(rowIdx, colIdx, cageInfo.cage) : null;

                let bgColor = colors.surface;
                if (isSelected) {
                  bgColor = colors.primaryLight;
                } else if (isConflict) {
                  bgColor = colors.error + '22';
                } else if (isHighlighted) {
                  bgColor = colors.primaryLight + '44';
                }

                const cellNotes = notesBoard[rowIdx]?.[colIdx];
                const hasNotes = cell === 0 && cellNotes && cellNotes.size > 0;

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
                      boxBorderRight,
                      boxBorderBottom,
                    ]}
                  >
                    {cageBorders && (
                      <View
                        style={[
                          StyleSheet.absoluteFill,
                          {
                            borderTopWidth: cageBorders.top ? 2 : 0,
                            borderBottomWidth: cageBorders.bottom ? 2 : 0,
                            borderLeftWidth: cageBorders.left ? 2 : 0,
                            borderRightWidth: cageBorders.right ? 2 : 0,
                            borderColor: cageColor,
                            borderStyle: 'dashed',
                          },
                        ]}
                        pointerEvents="none"
                      />
                    )}

                    {showCageSum && cageInfo && (
                      <View style={styles.cageSumContainer} pointerEvents="none">
                        <Body
                          style={[
                            styles.cageSumText,
                            {
                              color: cageColor,
                              fontSize: Math.max(cellSize * 0.22, 8),
                            },
                          ]}
                        >
                          {cageInfo.cage.sum}
                        </Body>
                      </View>
                    )}

                    {cell !== 0 ? (
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
                    ) : hasNotes ? (
                      <View style={styles.notesGrid}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                          <Body
                            key={n}
                            style={[
                              styles.noteText,
                              {
                                color: cellNotes.has(n) ? colors.textSecondary : 'transparent',
                                fontSize: Math.max(cellSize * 0.18, 6),
                                width: cellSize / 3,
                                height: cellSize / 3,
                              },
                            ]}
                          >
                            {n}
                          </Body>
                        ))}
                      </View>
                    ) : null}
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
            title={notesMode ? '\u30E1\u30E2 ON' : '\u30E1\u30E2 OFF'}
            onPress={() => setNotesMode(!notesMode)}
            variant={notesMode ? 'secondary' : 'outline'}
            size="sm"
          />
          <Button
            title={'\u30D2\u30F3\u30C8'}
            onPress={handleHint}
            variant="outline"
            size="sm"
          />
          <Button title={'\u65B0\u3057\u3044\u30B2\u30FC\u30E0'} onPress={handleNewGame} variant="ghost" size="sm" />
        </View>
      </ScrollView>
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
    overflow: 'hidden',
  },
  cellText: {
    textAlign: 'center',
  },
  cageSumContainer: {
    position: 'absolute',
    top: 1,
    left: 2,
  },
  cageSumText: {
    fontWeight: '700',
    lineHeight: 12,
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteText: {
    textAlign: 'center',
    lineHeight: 12,
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
