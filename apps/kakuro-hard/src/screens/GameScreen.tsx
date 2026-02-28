import React, { useState, useCallback, useMemo } from 'react';
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
import { useTheme, H2, Body, Button, Badge, Caption } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useTimer, useLocalStorage } from '@massapp/hooks';
import type { KakuroPuzzle, KakuroCellDef, Difficulty, PuzzleResult } from '../types';
import {
  createEmptyPlayerGrid,
  checkCompletion,
  getErrorCells,
  findHintCell,
  formatTime,
  countEmptyCells,
  countFilledCells,
} from '../utils/kakuro';
import { DIFFICULTY_LABELS, getPuzzlesByDifficulty } from '../data/puzzles';

type GamePhase = 'select' | 'playing' | 'complete';

const SCREEN_WIDTH = Dimensions.get('window').width;

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();
  const { seconds, start, stop, reset } = useTimer();

  const [history, setHistory] = useLocalStorage<PuzzleResult[]>('kakuro_hard_history', []);
  const [gamePhase, setGamePhase] = useState<GamePhase>('select');
  const [currentPuzzle, setCurrentPuzzle] = useState<KakuroPuzzle | null>(null);
  const [playerGrid, setPlayerGrid] = useState<number[][]>([]);
  const [notesGrid, setNotesGrid] = useState<Set<number>[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [notesMode, setNotesMode] = useState(false);

  const handleReward = useCallback(() => {
    if (!currentPuzzle || gamePhase !== 'playing') return;
    setPlayerGrid((prev) => {
      const hint = findHintCell(currentPuzzle, prev);
      if (!hint) return prev;
      const newGrid = prev.map((row) => [...row]);
      newGrid[hint.row][hint.col] = hint.value;
      setNotesGrid((prevNotes) => {
        const newNotes = prevNotes.map((row) => row.map((s) => new Set(s)));
        newNotes[hint.row][hint.col] = new Set();
        return newNotes;
      });
      if (checkCompletion(currentPuzzle, newGrid)) {
        stop();
        setGamePhase('complete');
        saveResult(currentPuzzle);
        Alert.alert('クリア！', `${formatTime(seconds)}でクリアしました！`);
      }
      return newGrid;
    });
  }, [currentPuzzle, gamePhase, seconds, stop]);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(handleReward);

  const errorCells = useMemo(() => {
    if (!currentPuzzle || gamePhase !== 'playing') return new Set<string>();
    return getErrorCells(currentPuzzle, playerGrid);
  }, [currentPuzzle, playerGrid, gamePhase]);

  const saveResult = useCallback(
    (puzzle: KakuroPuzzle) => {
      const result: PuzzleResult = {
        id: Date.now().toString(),
        puzzleId: puzzle.id,
        puzzleName: puzzle.name,
        difficulty: puzzle.difficulty,
        size: `${puzzle.rows}x${puzzle.cols}`,
        date: new Date().toISOString(),
        timeSeconds: seconds,
      };
      setHistory((prev) => [result, ...(prev ?? [])]);
      trackAction();
    },
    [seconds, setHistory, trackAction]
  );

  const startPuzzle = useCallback(
    (puzzle: KakuroPuzzle) => {
      setCurrentPuzzle(puzzle);
      setPlayerGrid(createEmptyPlayerGrid(puzzle));
      setNotesGrid(
        Array.from({ length: puzzle.rows }, () =>
          Array.from({ length: puzzle.cols }, () => new Set<number>())
        )
      );
      setSelectedCell(null);
      setNotesMode(false);
      setGamePhase('playing');
      reset();
      start();
    },
    [reset, start]
  );

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (!currentPuzzle || gamePhase !== 'playing') return;
      if (currentPuzzle.grid[row][col].type !== 'empty') return;
      setSelectedCell({ row, col });
    },
    [currentPuzzle, gamePhase]
  );

  const handleNumberInput = useCallback(
    (num: number) => {
      if (!currentPuzzle || !selectedCell || gamePhase !== 'playing') return;
      const { row, col } = selectedCell;

      if (notesMode) {
        setNotesGrid((prev) => {
          const newNotes = prev.map((r) => r.map((s) => new Set(s)));
          const cellNotes = newNotes[row][col];
          if (cellNotes.has(num)) {
            cellNotes.delete(num);
          } else {
            cellNotes.add(num);
          }
          return newNotes;
        });
        setPlayerGrid((prev) => {
          if (prev[row][col] !== 0) {
            const newGrid = prev.map((r) => [...r]);
            newGrid[row][col] = 0;
            return newGrid;
          }
          return prev;
        });
      } else {
        setPlayerGrid((prev) => {
          const newGrid = prev.map((r) => [...r]);
          newGrid[row][col] = num;
          setNotesGrid((prevNotes) => {
            const newNotes = prevNotes.map((r) => r.map((s) => new Set(s)));
            newNotes[row][col] = new Set();
            return newNotes;
          });
          if (checkCompletion(currentPuzzle, newGrid)) {
            stop();
            setGamePhase('complete');
            saveResult(currentPuzzle);
            setTimeout(() => {
              Alert.alert('クリア！', `${formatTime(seconds)}でクリアしました！`);
            }, 300);
          }
          return newGrid;
        });
      }
    },
    [currentPuzzle, selectedCell, gamePhase, notesMode, stop, seconds, saveResult]
  );

  const handleErase = useCallback(() => {
    if (!currentPuzzle || !selectedCell || gamePhase !== 'playing') return;
    const { row, col } = selectedCell;
    setPlayerGrid((prev) => {
      const newGrid = prev.map((r) => [...r]);
      newGrid[row][col] = 0;
      return newGrid;
    });
    setNotesGrid((prev) => {
      const newNotes = prev.map((r) => r.map((s) => new Set(s)));
      newNotes[row][col] = new Set();
      return newNotes;
    });
  }, [currentPuzzle, selectedCell, gamePhase]);

  const handleHint = useCallback(() => {
    if (gamePhase !== 'playing') return;
    if (rewardedLoaded) {
      showRewardedAd();
    } else {
      Alert.alert('ヒント', '広告の準備ができていません。少々お待ちください。');
    }
  }, [gamePhase, rewardedLoaded, showRewardedAd]);

  const handleBack = useCallback(() => {
    stop();
    reset();
    setGamePhase('select');
    setCurrentPuzzle(null);
    setSelectedCell(null);
  }, [stop, reset]);

  if (gamePhase === 'select') {
    return (
      <ScreenWrapper>
        <ScrollView style={[styles.selectContainer, { padding: spacing.lg }]}>
          <H2 style={{ marginBottom: spacing.md }}>{'パズルを選択'}</H2>
          {(['medium', 'hard', 'expert'] as Difficulty[]).map((diff) => {
            const puzzles = getPuzzlesByDifficulty(diff);
            const completedIds = new Set(
              (history ?? [])
                .filter((r) => r.difficulty === diff)
                .map((r) => r.puzzleId)
            );
            return (
              <View key={diff} style={{ marginBottom: spacing.lg }}>
                <Body
                  style={{
                    fontWeight: 'bold',
                    fontSize: 16,
                    marginBottom: spacing.sm,
                  }}
                  color={colors.primary}
                >
                  {DIFFICULTY_LABELS[diff]}
                </Body>
                {puzzles.map((puzzle) => {
                  const isCompleted = completedIds.has(puzzle.id);
                  return (
                    <TouchableOpacity
                      key={puzzle.id}
                      style={[
                        styles.puzzleItem,
                        {
                          backgroundColor: colors.surface,
                          borderColor: isCompleted ? colors.primary : colors.border,
                          borderRadius: spacing.sm,
                          padding: spacing.md,
                          marginBottom: spacing.xs,
                        },
                      ]}
                      onPress={() => startPuzzle(puzzle)}
                    >
                      <View style={styles.puzzleItemContent}>
                        <Body>{puzzle.name}</Body>
                        <View style={styles.puzzleItemRight}>
                          <Caption
                            color={colors.textMuted}
                            style={{ marginRight: spacing.sm }}
                          >
                            {`${puzzle.rows}x${puzzle.cols}`}
                          </Caption>
                          {isCompleted && (
                            <Badge label="クリア" color={colors.success} />
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </ScreenWrapper>
    );
  }

  if (!currentPuzzle) return null;

  const maxGridWidth = SCREEN_WIDTH - spacing.lg * 2;
  const cellSize = Math.floor(
    Math.min(maxGridWidth / currentPuzzle.cols, 42)
  );

  const filledCount = countFilledCells(currentPuzzle, playerGrid);
  const totalEmpty = countEmptyCells(currentPuzzle);

  const renderClueCell = (cell: KakuroCellDef, size: number) => {
    if (cell.type !== 'clue') return null;
    const clue = cell as { type: 'clue'; right?: number; down?: number };
    const fontSize = Math.max(size * 0.25, 8);
    return (
      <View style={[styles.clueCell, { width: size, height: size, backgroundColor: colors.text }]}>
        <View style={styles.clueDiagonal}>
          <View
            style={[
              styles.clueDiagonalLine,
              {
                backgroundColor: colors.textMuted,
                width: size * 1.42,
                top: size / 2 - 0.5,
                left: -(size * 0.21),
                transform: [{ rotate: '-45deg' }],
              },
            ]}
          />
        </View>
        {clue.right !== undefined && (
          <Text
            style={[
              styles.clueTextBottom,
              { color: '#fff', fontSize, left: 2, bottom: 1 },
            ]}
          >
            {clue.right}
          </Text>
        )}
        {clue.down !== undefined && (
          <Text
            style={[
              styles.clueTextTop,
              { color: '#fff', fontSize, right: 2, top: 1 },
            ]}
          >
            {clue.down}
          </Text>
        )}
      </View>
    );
  };

  const renderEmptyCell = (
    row: number,
    col: number,
    size: number
  ) => {
    const value = playerGrid[row]?.[col] ?? 0;
    const notes = notesGrid[row]?.[col] ?? new Set<number>();
    const isSelected =
      selectedCell?.row === row && selectedCell?.col === col;
    const isError = errorCells.has(`${row}-${col}`);

    let bgColor = colors.background;
    if (isSelected) {
      bgColor = colors.primaryLight;
    } else if (isError && value !== 0) {
      bgColor = '#FFCCCC';
    }

    return (
      <TouchableOpacity
        style={[
          styles.emptyCell,
          {
            width: size,
            height: size,
            backgroundColor: bgColor,
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 0.5,
          },
        ]}
        onPress={() => handleCellPress(row, col)}
        activeOpacity={0.7}
      >
        {value !== 0 ? (
          <Text
            style={[
              styles.cellValue,
              {
                fontSize: Math.max(size * 0.5, 12),
                color: isError ? colors.error : colors.text,
                fontWeight: 'bold',
              },
            ]}
          >
            {value}
          </Text>
        ) : notes.size > 0 ? (
          <View style={styles.notesContainer}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <Text
                key={n}
                style={[
                  styles.noteText,
                  {
                    fontSize: Math.max(size * 0.18, 6),
                    color: notes.has(n) ? colors.primary : 'transparent',
                    width: size / 3,
                    height: size / 3,
                    lineHeight: size / 3,
                  },
                ]}
              >
                {n}
              </Text>
            ))}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.sm }]}>
        <View style={[styles.topBar, { marginBottom: spacing.xs }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Body style={{ fontWeight: 'bold' }}>
            {currentPuzzle.name}
          </Body>
          <Body color={colors.primary} style={{ fontWeight: 'bold' }}>
            {formatTime(seconds)}
          </Body>
        </View>

        <View style={[styles.infoBar, { marginBottom: spacing.xs }]}>
          <Body color={colors.textSecondary} style={{ fontSize: 12 }}>
            {DIFFICULTY_LABELS[currentPuzzle.difficulty]}
          </Body>
          <Body color={colors.textSecondary} style={{ fontSize: 12 }}>
            {`${filledCount} / ${totalEmpty}`}
          </Body>
        </View>

        <ScrollView
          horizontal
          contentContainerStyle={styles.gridScrollContent}
          showsHorizontalScrollIndicator={false}
        >
          <ScrollView
            contentContainerStyle={styles.gridScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.gridOuter,
                {
                  borderColor: colors.text,
                  borderWidth: 2,
                  borderRadius: 2,
                },
              ]}
            >
              {currentPuzzle.grid.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.gridRow}>
                  {row.map((cell, colIndex) => {
                    if (cell.type === 'blocked') {
                      return (
                        <View
                          key={`${rowIndex}-${colIndex}`}
                          style={[
                            styles.blockedCell,
                            {
                              width: cellSize,
                              height: cellSize,
                              backgroundColor: colors.text,
                            },
                          ]}
                        />
                      );
                    }
                    if (cell.type === 'clue') {
                      return (
                        <View key={`${rowIndex}-${colIndex}`}>
                          {renderClueCell(cell, cellSize)}
                        </View>
                      );
                    }
                    return (
                      <View key={`${rowIndex}-${colIndex}`}>
                        {renderEmptyCell(rowIndex, colIndex, cellSize)}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>

        <View style={[styles.controlsArea, { marginTop: spacing.xs }]}>
          <View style={[styles.modeRow, { marginBottom: spacing.xs }]}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                {
                  backgroundColor: !notesMode ? colors.primary : colors.surface,
                  borderColor: colors.primary,
                  borderRadius: spacing.xs,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                },
              ]}
              onPress={() => setNotesMode(false)}
            >
              <Body
                color={!notesMode ? '#fff' : colors.primary}
                style={{ fontSize: 13, fontWeight: 'bold' }}
              >
                {'入力'}
              </Body>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                {
                  backgroundColor: notesMode ? colors.primary : colors.surface,
                  borderColor: colors.primary,
                  borderRadius: spacing.xs,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                },
              ]}
              onPress={() => setNotesMode(true)}
            >
              <Ionicons
                name="pencil"
                size={14}
                color={notesMode ? '#fff' : colors.primary}
                style={{ marginRight: 4 }}
              />
              <Body
                color={notesMode ? '#fff' : colors.primary}
                style={{ fontSize: 13, fontWeight: 'bold' }}
              >
                {'メモ'}
              </Body>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: spacing.xs,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                },
              ]}
              onPress={handleErase}
            >
              <Ionicons name="backspace-outline" size={16} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: spacing.xs,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                },
              ]}
              onPress={handleHint}
            >
              <Ionicons name="bulb-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.numpadRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.numpadButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: spacing.xs,
                  },
                ]}
                onPress={() => handleNumberInput(num)}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    styles.numpadText,
                    { color: colors.text },
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {gamePhase === 'complete' && (
          <View style={[styles.completeBar, { marginTop: spacing.sm }]}>
            <Button
              title="パズル選択に戻る"
              onPress={handleBack}
              size="sm"
            />
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  selectContainer: {
    flex: 1,
  },
  puzzleItem: {
    borderWidth: 1,
  },
  puzzleItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  puzzleItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridOuter: {
    alignSelf: 'center',
  },
  gridRow: {
    flexDirection: 'row',
  },
  blockedCell: {
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  clueCell: {
    position: 'relative',
    overflow: 'hidden',
  },
  clueDiagonal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  clueDiagonalLine: {
    position: 'absolute',
    height: 1,
  },
  clueTextBottom: {
    position: 'absolute',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  clueTextTop: {
    position: 'absolute',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellValue: {
    textAlign: 'center',
  },
  notesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  controlsArea: {
    alignItems: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  numpadRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  numpadButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  numpadText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  completeBar: {
    alignItems: 'center',
  },
});
