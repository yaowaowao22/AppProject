import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  FlatList,
} from 'react-native';
import { useTheme, H2, H3, Body, Caption, Button, Card, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import type { CrosswordPuzzle, Difficulty } from '../data/crosswords';
import {
  ALL_PUZZLES,
  getPuzzlesByDifficulty,
  getDifficultyLabel,
  getGridSizeLabel,
} from '../data/crosswords';
import {
  createEmptyBoard,
  cloneBoard,
  isBoardComplete,
  findHintCell,
  formatTime,
  getClueNumberForCell,
  getWordCells,
  KATAKANA_ROWS,
} from '../utils/crossword';
import type { Direction } from '../utils/crossword';

interface GameResult {
  id: string;
  date: string;
  puzzleId: string;
  puzzleTitle: string;
  difficulty: Difficulty;
  timeSeconds: number;
  completed: boolean;
}

type GameState = 'select-difficulty' | 'select-puzzle' | 'playing' | 'completed';

export function GameScreen() {
  const { colors, spacing, radius } = useTheme();
  const { trackAction } = useInterstitialAd();

  const [gameState, setGameState] = useState<GameState>('select-difficulty');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null);
  const [board, setBoard] = useState<string[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [direction, setDirection] = useState<Direction>('across');
  const [history, setHistory] = useLocalStorage<GameResult[]>('crossword_jp_history', []);

  // Stopwatch timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completionHandled = useRef(false);

  const giveHintRef = useRef<() => void>(() => {});
  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(() => {
    giveHintRef.current();
  });

  // Timer effect
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerRunning]);

  const startGame = useCallback((p: CrosswordPuzzle) => {
    setPuzzle(p);
    setBoard(createEmptyBoard(p));
    setSelectedCell(null);
    setDirection('across');
    setGameState('playing');
    setElapsedSeconds(0);
    setTimerRunning(true);
    completionHandled.current = false;
  }, []);

  const giveHint = useCallback(() => {
    if (!puzzle || gameState !== 'playing') return;
    const cell = findHintCell(puzzle, board);
    if (!cell) return;
    const [row, col] = cell;
    const newBoard = cloneBoard(board);
    newBoard[row][col] = puzzle.solution[row][col];
    setBoard(newBoard);
    setSelectedCell([row, col]);
  }, [puzzle, board, gameState]);

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

  // Check completion
  useEffect(() => {
    if (!puzzle || gameState !== 'playing' || completionHandled.current) return;
    if (board.length === 0) return;

    if (isBoardComplete(puzzle, board)) {
      completionHandled.current = true;
      setTimerRunning(false);
      setGameState('completed');

      const result: GameResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        puzzleId: puzzle.id,
        puzzleTitle: puzzle.title,
        difficulty: puzzle.difficulty,
        timeSeconds: elapsedSeconds,
        completed: true,
      };
      setHistory([result, ...(history || [])]);
      trackAction();

      Alert.alert(
        'クリア！',
        `パズル: ${puzzle.title}\n難易度: ${getDifficultyLabel(puzzle.difficulty)}\nタイム: ${formatTime(elapsedSeconds)}`,
        [
          { text: 'パズル選択へ', onPress: () => setGameState('select-difficulty') },
        ],
      );
    }
  }, [board, puzzle, gameState, elapsedSeconds, history, setHistory, trackAction]);

  // Current clue for selected cell
  const currentClue = useMemo(() => {
    if (!puzzle || !selectedCell) return null;
    const [row, col] = selectedCell;
    const num = getClueNumberForCell(puzzle, row, col, direction);
    if (num === null) return null;
    const clues = direction === 'across' ? puzzle.acrossClues : puzzle.downClues;
    const clue = clues.find((c) => c.number === num);
    if (!clue) return null;
    return { number: num, text: clue.text, direction };
  }, [puzzle, selectedCell, direction]);

  // Highlighted cells (same word as selected)
  const highlightedCells = useMemo(() => {
    if (!puzzle || !selectedCell) return new Set<string>();
    const [row, col] = selectedCell;
    const num = getClueNumberForCell(puzzle, row, col, direction);
    if (num === null) return new Set<string>();
    const cells = getWordCells(puzzle, num, direction);
    return new Set(cells.map(([r, c]) => `${r},${c}`));
  }, [puzzle, selectedCell, direction]);

  const handleCellPress = (row: number, col: number) => {
    if (!puzzle || gameState !== 'playing') return;
    if (puzzle.grid[row][col] === 0) return;

    if (selectedCell && selectedCell[0] === row && selectedCell[1] === col) {
      // Toggle direction on same cell
      setDirection((prev) => (prev === 'across' ? 'down' : 'across'));
    } else {
      setSelectedCell([row, col]);
    }
  };

  const handleKatakanaPress = (char: string) => {
    if (!puzzle || !selectedCell || gameState !== 'playing') return;
    const [row, col] = selectedCell;
    if (puzzle.grid[row][col] === 0) return;

    const newBoard = cloneBoard(board);
    newBoard[row][col] = char;
    setBoard(newBoard);

    // Auto-advance to next cell in current direction
    if (direction === 'across') {
      let nextCol = col + 1;
      while (nextCol < puzzle.cols && puzzle.grid[row][nextCol] === 0) {
        nextCol++;
      }
      if (nextCol < puzzle.cols && puzzle.grid[row][nextCol] === 1) {
        setSelectedCell([row, nextCol]);
      }
    } else {
      let nextRow = row + 1;
      while (nextRow < puzzle.rows && puzzle.grid[nextRow][col] === 0) {
        nextRow++;
      }
      if (nextRow < puzzle.rows && puzzle.grid[nextRow][col] === 1) {
        setSelectedCell([nextRow, col]);
      }
    }
  };

  const handleClear = () => {
    if (!puzzle || !selectedCell || gameState !== 'playing') return;
    const [row, col] = selectedCell;
    if (puzzle.grid[row][col] === 0) return;

    const newBoard = cloneBoard(board);
    newBoard[row][col] = '';
    setBoard(newBoard);
  };

  const handleNewGame = () => {
    if (gameState === 'playing') {
      Alert.alert('ゲーム終了', '現在のゲームを終了しますか？', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '終了する',
          onPress: () => {
            setTimerRunning(false);
            setGameState('select-difficulty');
          },
        },
      ]);
    } else {
      setGameState('select-difficulty');
    }
  };

  const screenWidth = Dimensions.get('window').width;

  // ------ Difficulty select ------
  if (gameState === 'select-difficulty') {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.xl }]}>
          <View style={styles.selectContainer}>
            <H2 align="center" style={{ marginBottom: spacing.xl }}>
              難易度を選択
            </H2>
            <View style={{ gap: spacing.md }}>
              <Button
                title={`初級（${getGridSizeLabel('easy')}）`}
                onPress={() => {
                  setDifficulty('easy');
                  setGameState('select-puzzle');
                }}
                size="lg"
              />
              <Button
                title={`中級（${getGridSizeLabel('medium')}）`}
                onPress={() => {
                  setDifficulty('medium');
                  setGameState('select-puzzle');
                }}
                size="lg"
                variant="secondary"
              />
              <Button
                title={`上級（${getGridSizeLabel('hard')}）`}
                onPress={() => {
                  setDifficulty('hard');
                  setGameState('select-puzzle');
                }}
                size="lg"
                variant="outline"
              />
            </View>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // ------ Puzzle select ------
  if (gameState === 'select-puzzle') {
    const puzzles = getPuzzlesByDifficulty(difficulty);
    const completedIds = new Set(
      (history || []).filter((h) => h.completed).map((h) => h.puzzleId),
    );

    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.lg }]}>
          <View style={[styles.puzzleSelectHeader, { marginBottom: spacing.lg }]}>
            <TouchableOpacity onPress={() => setGameState('select-difficulty')}>
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <H2 style={{ marginLeft: spacing.md }}>
              {getDifficultyLabel(difficulty)} - パズル選択
            </H2>
          </View>
          <FlatList
            data={puzzles}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => startGame(item)}
                style={[
                  styles.puzzleCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    padding: spacing.lg,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                <View style={styles.puzzleCardContent}>
                  <View style={{ flex: 1 }}>
                    <H3>パズル {index + 1}</H3>
                    <Caption color={colors.textSecondary}>
                      {item.title} ({item.rows}x{item.cols})
                    </Caption>
                  </View>
                  {completedIds.has(item.id) && (
                    <Badge label="クリア済" variant="success" />
                  )}
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
          />
        </View>
      </ScreenWrapper>
    );
  }

  // ------ Playing / Completed ------
  if (!puzzle) return null;

  const boardPadding = spacing.sm * 2;
  const maxBoardSize = Math.min(screenWidth - boardPadding * 2, 400);
  const cellSize = Math.floor(maxBoardSize / puzzle.cols);
  const boardSize = cellSize * puzzle.cols;

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
          ]}
        >
          <View style={styles.headerLeft}>
            <Caption color={colors.textSecondary}>
              {getDifficultyLabel(puzzle.difficulty)} - {puzzle.title}
            </Caption>
          </View>
          <View style={styles.headerCenter}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Body style={{ marginLeft: 4 }}>{formatTime(elapsedSeconds)}</Body>
          </View>
          <TouchableOpacity onPress={handleNewGame} style={styles.headerRight}>
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Clue display */}
        <View
          style={[
            styles.clueBar,
            {
              backgroundColor: colors.primaryLight,
              marginHorizontal: spacing.sm,
              padding: spacing.sm,
              borderRadius: radius.sm,
              marginBottom: spacing.sm,
              minHeight: 48,
            },
          ]}
        >
          {currentClue ? (
            <Body style={{ fontSize: 13 }}>
              <Body style={{ fontWeight: '700', fontSize: 13 }}>
                {currentClue.number}
                {currentClue.direction === 'across' ? 'ヨコ' : 'タテ'}
              </Body>
              {'  '}
              {currentClue.text}
            </Body>
          ) : (
            <Caption color={colors.textSecondary}>
              セルをタップしてください
            </Caption>
          )}
        </View>

        {/* Direction toggle */}
        <View
          style={[
            styles.directionToggle,
            { marginHorizontal: spacing.sm, marginBottom: spacing.sm, gap: spacing.xs },
          ]}
        >
          <TouchableOpacity
            onPress={() => setDirection('across')}
            style={[
              styles.directionButton,
              {
                backgroundColor: direction === 'across' ? colors.primary : colors.surface,
                borderColor: colors.border,
                borderRadius: radius.sm,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
              },
            ]}
          >
            <Caption
              color={direction === 'across' ? '#fff' : colors.text}
              style={{ fontWeight: '600' }}
            >
              ヨコ
            </Caption>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDirection('down')}
            style={[
              styles.directionButton,
              {
                backgroundColor: direction === 'down' ? colors.primary : colors.surface,
                borderColor: colors.border,
                borderRadius: radius.sm,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
              },
            ]}
          >
            <Caption
              color={direction === 'down' ? '#fff' : colors.text}
              style={{ fontWeight: '600' }}
            >
              タテ
            </Caption>
          </TouchableOpacity>
        </View>

        {/* Grid */}
        <View
          style={[
            styles.boardContainer,
            {
              borderColor: colors.text,
              borderRadius: radius.sm,
              alignSelf: 'center',
              width: boardSize + 2,
            },
          ]}
        >
          {Array.from({ length: puzzle.rows }, (_, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {Array.from({ length: puzzle.cols }, (_, colIdx) => {
                const isBlocked = puzzle.grid[rowIdx][colIdx] === 0;
                const isSelected =
                  selectedCell !== null &&
                  selectedCell[0] === rowIdx &&
                  selectedCell[1] === colIdx;
                const isHighlighted = highlightedCells.has(`${rowIdx},${colIdx}`);
                const cellNum = puzzle.cellNumbers[rowIdx][colIdx];
                const cellValue = board[rowIdx]?.[colIdx] ?? '';

                let bgColor = colors.surface;
                if (isBlocked) {
                  bgColor = colors.text;
                } else if (isSelected) {
                  bgColor = colors.primaryLight;
                } else if (isHighlighted) {
                  bgColor = colors.primaryLight + '55';
                }

                return (
                  <TouchableOpacity
                    key={colIdx}
                    onPress={() => handleCellPress(rowIdx, colIdx)}
                    activeOpacity={isBlocked ? 1 : 0.7}
                    style={[
                      styles.cell,
                      {
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: bgColor,
                        borderRightWidth: StyleSheet.hairlineWidth,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderRightColor: colors.border,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    {cellNum > 0 && !isBlocked && (
                      <Caption
                        style={[
                          styles.cellNumber,
                          { fontSize: Math.max(cellSize * 0.2, 7), color: colors.textSecondary },
                        ]}
                      >
                        {cellNum}
                      </Caption>
                    )}
                    {!isBlocked && cellValue !== '' && (
                      <Body
                        style={[
                          styles.cellText,
                          {
                            fontSize: cellSize * 0.45,
                            color: colors.text,
                            fontWeight: '600',
                          },
                        ]}
                      >
                        {cellValue}
                      </Body>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Katakana keyboard */}
        {gameState === 'playing' && (
          <View style={[styles.keyboardContainer, { marginTop: spacing.md, paddingHorizontal: spacing.xs }]}>
            {KATAKANA_ROWS.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.keyboardRow}>
                {row.map((char) => (
                  <TouchableOpacity
                    key={char}
                    onPress={() => handleKatakanaPress(char)}
                    style={[
                      styles.keyButton,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderRadius: radius.sm,
                      },
                    ]}
                  >
                    <Body style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>
                      {char}
                    </Body>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            <View style={styles.keyboardRow}>
              <TouchableOpacity
                onPress={handleClear}
                style={[
                  styles.clearButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.error,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Ionicons name="backspace-outline" size={20} color={colors.error} />
                <Caption color={colors.error} style={{ marginLeft: 4 }}>
                  消去
                </Caption>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleHint}
                style={[
                  styles.clearButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.primary,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Ionicons name="bulb-outline" size={20} color={colors.primary} />
                <Caption color={colors.primary} style={{ marginLeft: 4 }}>
                  ヒント
                </Caption>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Clue lists */}
        <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.lg }}>
          <H3 style={{ marginBottom: spacing.sm }}>ヨコのカギ</H3>
          {puzzle.acrossClues.map((clue) => (
            <TouchableOpacity
              key={`a-${clue.number}`}
              onPress={() => {
                setDirection('across');
                const cells = getWordCells(puzzle, clue.number, 'across');
                if (cells.length > 0) {
                  setSelectedCell(cells[0]);
                }
              }}
              style={[
                styles.clueItem,
                {
                  paddingVertical: spacing.xs,
                  backgroundColor:
                    currentClue?.direction === 'across' && currentClue?.number === clue.number
                      ? colors.primaryLight + '44'
                      : 'transparent',
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.xs,
                },
              ]}
            >
              <Caption style={{ fontWeight: '700', minWidth: 24 }}>{clue.number}.</Caption>
              <Caption style={{ flex: 1 }}>{clue.text}</Caption>
            </TouchableOpacity>
          ))}

          <H3 style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>タテのカギ</H3>
          {puzzle.downClues.map((clue) => (
            <TouchableOpacity
              key={`d-${clue.number}`}
              onPress={() => {
                setDirection('down');
                const cells = getWordCells(puzzle, clue.number, 'down');
                if (cells.length > 0) {
                  setSelectedCell(cells[0]);
                }
              }}
              style={[
                styles.clueItem,
                {
                  paddingVertical: spacing.xs,
                  backgroundColor:
                    currentClue?.direction === 'down' && currentClue?.number === clue.number
                      ? colors.primaryLight + '44'
                      : 'transparent',
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.xs,
                },
              ]}
            >
              <Caption style={{ fontWeight: '700', minWidth: 24 }}>{clue.number}.</Caption>
              <Caption style={{ flex: 1 }}>{clue.text}</Caption>
            </TouchableOpacity>
          ))}
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
  puzzleSelectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  puzzleCard: {
    borderWidth: 1,
  },
  puzzleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  clueBar: {
    justifyContent: 'center',
  },
  directionToggle: {
    flexDirection: 'row',
  },
  directionButton: {
    borderWidth: 1,
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
    position: 'relative',
  },
  cellNumber: {
    position: 'absolute',
    top: 1,
    left: 2,
  },
  cellText: {
    textAlign: 'center',
  },
  keyboardContainer: {
    alignItems: 'center',
    gap: 3,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
  },
  keyButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  clearButton: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  clueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
