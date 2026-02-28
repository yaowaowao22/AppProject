import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Pressable,
  Text,
} from 'react-native';
import { useTheme, H2, H3, Body, Button, Card, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useTimer } from '@massapp/hooks';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import { Puzzle, CellState, PuzzleResult } from '../types';
import { getPuzzlesBySize, PUZZLE_SIZES } from '../data/puzzles';
import {
  generateRowClues,
  generateColClues,
  createEmptyGrid,
  toggleCell,
  checkSolution,
  findRandomIncorrectCell,
  formatTime,
} from '../utils/nonogram';

type GamePhase = 'select-size' | 'select-puzzle' | 'playing' | 'completed';

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();
  const { seconds, start, stop, reset } = useTimer();

  const [results, setResults] = useLocalStorage<PuzzleResult[]>('nonogram-results', []);

  const [phase, setPhase] = useState<GamePhase>('select-size');
  const [selectedSize, setSelectedSize] = useState<number>(5);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [playerGrid, setPlayerGrid] = useState<CellState[][]>([]);
  const [rowClues, setRowClues] = useState<number[][]>([]);
  const [colClues, setColClues] = useState<number[][]>([]);
  const [completedTime, setCompletedTime] = useState(0);

  const handleReward = useCallback(() => {
    if (!currentPuzzle || !playerGrid.length) return;
    const cell = findRandomIncorrectCell(playerGrid, currentPuzzle.grid);
    if (cell) {
      setPlayerGrid((prev) => {
        const newGrid = prev.map((row) => [...row]);
        const shouldBeFilled = currentPuzzle.grid[cell.row][cell.col];
        newGrid[cell.row][cell.col] = shouldBeFilled ? 'filled' : 'marked';
        return newGrid;
      });
      Alert.alert('ヒント', `セル (${cell.row + 1}, ${cell.col + 1}) を修正しました`);
    } else {
      Alert.alert('ヒント', 'すべてのセルが正しいです！');
    }
  }, [currentPuzzle, playerGrid]);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(handleReward);

  const completedPuzzleIds = (results || []).map((r) => r.puzzleId);

  const handleSelectSize = (size: number) => {
    setSelectedSize(size);
    setPhase('select-puzzle');
  };

  const handleSelectPuzzle = (puzzle: Puzzle) => {
    setCurrentPuzzle(puzzle);
    setPlayerGrid(createEmptyGrid(puzzle.size));
    setRowClues(generateRowClues(puzzle.grid));
    setColClues(generateColClues(puzzle.grid));
    setPhase('playing');
    reset();
    start();
  };

  const handleCellPress = (row: number, col: number) => {
    setPlayerGrid((prev) => {
      const newGrid = prev.map((r) => [...r]);
      newGrid[row][col] = toggleCell(newGrid[row][col]);
      return newGrid;
    });
  };

  const handleCheck = () => {
    if (!currentPuzzle) return;

    if (checkSolution(playerGrid, currentPuzzle.grid)) {
      stop();
      setCompletedTime(seconds);
      const result: PuzzleResult = {
        id: Date.now().toString(),
        puzzleId: currentPuzzle.id,
        puzzleName: currentPuzzle.name,
        size: currentPuzzle.size,
        date: new Date().toISOString(),
        timeSeconds: seconds,
      };
      setResults((prev) => [result, ...(prev || [])]);
      trackAction();
      setPhase('completed');
    } else {
      Alert.alert('まだ完成していません', '間違いがあります。もう一度確認してください。');
    }
  };

  const handleHint = () => {
    if (rewardedLoaded) {
      showRewardedAd();
    } else {
      handleReward();
    }
  };

  const handleReset = () => {
    if (!currentPuzzle) return;
    Alert.alert('リセット', 'グリッドをリセットしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'リセット',
        style: 'destructive',
        onPress: () => {
          setPlayerGrid(createEmptyGrid(currentPuzzle.size));
          reset();
          start();
        },
      },
    ]);
  };

  const handleBackToSelect = () => {
    stop();
    reset();
    setPhase('select-size');
    setCurrentPuzzle(null);
  };

  const handleNextPuzzle = () => {
    setPhase('select-puzzle');
  };

  if (phase === 'select-size') {
    return (
      <ScreenWrapper>
        <ScrollView style={[styles.container, { padding: spacing.lg }]}>
          <H2 style={{ marginBottom: spacing.xl }}>難易度を選択</H2>
          {PUZZLE_SIZES.map((ps) => {
            const puzzles = getPuzzlesBySize(ps.size);
            const completed = puzzles.filter((p) => completedPuzzleIds.includes(p.id)).length;
            return (
              <TouchableOpacity
                key={ps.size}
                onPress={() => handleSelectSize(ps.size)}
                activeOpacity={0.7}
              >
                <Card
                  style={[
                    styles.sizeCard,
                    {
                      marginBottom: spacing.md,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.sizeCardContent}>
                    <View>
                      <H3>{ps.label}</H3>
                      <Body color={colors.textSecondary}>{ps.difficulty}</Body>
                    </View>
                    <View style={styles.sizeCardRight}>
                      <Badge label={`${completed}/${puzzles.length}`} />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ScreenWrapper>
    );
  }

  if (phase === 'select-puzzle') {
    const puzzles = getPuzzlesBySize(selectedSize);
    const sizeInfo = PUZZLE_SIZES.find((ps) => ps.size === selectedSize);
    return (
      <ScreenWrapper>
        <ScrollView style={[styles.container, { padding: spacing.lg }]}>
          <View style={[styles.headerRow, { marginBottom: spacing.lg }]}>
            <TouchableOpacity onPress={() => setPhase('select-size')}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <H2 style={{ marginLeft: spacing.md }}>
              {sizeInfo?.label} - {sizeInfo?.difficulty}
            </H2>
          </View>
          {puzzles.map((puzzle, index) => {
            const isCompleted = completedPuzzleIds.includes(puzzle.id);
            return (
              <TouchableOpacity
                key={puzzle.id}
                onPress={() => handleSelectPuzzle(puzzle)}
                activeOpacity={0.7}
              >
                <Card
                  style={[
                    styles.puzzleCard,
                    {
                      marginBottom: spacing.sm,
                      borderColor: isCompleted ? colors.success : colors.border,
                      borderWidth: isCompleted ? 2 : 1,
                    },
                  ]}
                >
                  <View style={styles.puzzleCardContent}>
                    <View style={styles.puzzleCardLeft}>
                      <Body style={{ fontWeight: 'bold' }}>
                        #{index + 1} {isCompleted ? puzzle.name : '???'}
                      </Body>
                    </View>
                    {isCompleted && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ScreenWrapper>
    );
  }

  if (phase === 'completed') {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.lg, justifyContent: 'center' }]}>
          <View style={styles.completedContent}>
            <Ionicons name="trophy" size={64} color={colors.primary} />
            <H2 style={{ marginTop: spacing.lg, textAlign: 'center' }}>完成！</H2>
            <H3
              style={{
                marginTop: spacing.md,
                textAlign: 'center',
                color: colors.primary,
              }}
            >
              「{currentPuzzle?.name}」
            </H3>
            <Body
              color={colors.textSecondary}
              style={{ marginTop: spacing.md, textAlign: 'center' }}
            >
              クリアタイム: {formatTime(completedTime)}
            </Body>
            <Body
              color={colors.textSecondary}
              style={{ textAlign: 'center' }}
            >
              サイズ: {currentPuzzle?.size}x{currentPuzzle?.size}
            </Body>
          </View>
          <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
            <Button title="次のパズル" onPress={handleNextPuzzle} />
            <Button title="パズル選択に戻る" onPress={handleBackToSelect} variant="outline" />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // Playing phase
  if (!currentPuzzle) return null;

  const screenWidth = Dimensions.get('window').width;
  const maxClueWidth = currentPuzzle.size <= 5 ? 30 : currentPuzzle.size <= 10 ? 50 : 65;
  const maxClueHeight = currentPuzzle.size <= 5 ? 30 : currentPuzzle.size <= 10 ? 50 : 65;
  const gridAreaWidth = screenWidth - spacing.lg * 2 - maxClueWidth - 8;
  const cellSize = Math.floor(gridAreaWidth / currentPuzzle.size);

  return (
    <ScreenWrapper>
      <ScrollView style={[styles.container, { padding: spacing.sm }]}>
        {/* Top bar */}
        <View style={[styles.topBar, { marginBottom: spacing.sm }]}>
          <TouchableOpacity onPress={handleBackToSelect}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Body style={{ fontWeight: 'bold' }}>
            {formatTime(seconds)}
          </Body>
          <View style={styles.topBarRight}>
            <TouchableOpacity onPress={handleHint} style={{ marginRight: spacing.md }}>
              <Ionicons name="bulb" size={24} color={colors.warning} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReset}>
              <Ionicons name="refresh" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Nonogram grid area */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Column clues + spacer */}
            <View style={{ flexDirection: 'row' }}>
              {/* Top-left spacer */}
              <View style={{ width: maxClueWidth, height: maxClueHeight }} />
              {/* Column clues */}
              <View style={{ flexDirection: 'row' }}>
                {colClues.map((clue, colIdx) => (
                  <View
                    key={colIdx}
                    style={[
                      styles.colClueCell,
                      {
                        width: cellSize,
                        height: maxClueHeight,
                        borderRightWidth: (colIdx + 1) % 5 === 0 && colIdx < currentPuzzle.size - 1 ? 2 : 0.5,
                        borderRightColor: (colIdx + 1) % 5 === 0 ? colors.text : colors.border,
                      },
                    ]}
                  >
                    {clue.map((num, i) => (
                      <Text
                        key={i}
                        style={[
                          styles.clueText,
                          {
                            color: colors.text,
                            fontSize: currentPuzzle.size >= 15 ? 8 : currentPuzzle.size >= 10 ? 10 : 12,
                          },
                        ]}
                      >
                        {num}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </View>

            {/* Rows with clues + cells */}
            {playerGrid.map((row, rowIdx) => (
              <View key={rowIdx} style={{ flexDirection: 'row' }}>
                {/* Row clue */}
                <View
                  style={[
                    styles.rowClueCell,
                    {
                      width: maxClueWidth,
                      height: cellSize,
                      borderBottomWidth: (rowIdx + 1) % 5 === 0 && rowIdx < currentPuzzle.size - 1 ? 2 : 0.5,
                      borderBottomColor: (rowIdx + 1) % 5 === 0 ? colors.text : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.clueText,
                      {
                        color: colors.text,
                        fontSize: currentPuzzle.size >= 15 ? 8 : currentPuzzle.size >= 10 ? 10 : 12,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {rowClues[rowIdx]?.join(' ')}
                  </Text>
                </View>
                {/* Grid cells */}
                {row.map((cell, colIdx) => {
                  const isThickRight =
                    (colIdx + 1) % 5 === 0 && colIdx < currentPuzzle.size - 1;
                  const isThickBottom =
                    (rowIdx + 1) % 5 === 0 && rowIdx < currentPuzzle.size - 1;

                  return (
                    <Pressable
                      key={colIdx}
                      onPress={() => handleCellPress(rowIdx, colIdx)}
                      style={[
                        styles.cell,
                        {
                          width: cellSize,
                          height: cellSize,
                          backgroundColor:
                            cell === 'filled'
                              ? colors.primary
                              : cell === 'marked'
                              ? colors.surface
                              : colors.background,
                          borderRightWidth: isThickRight ? 2 : 0.5,
                          borderBottomWidth: isThickBottom ? 2 : 0.5,
                          borderRightColor: isThickRight ? colors.text : colors.border,
                          borderBottomColor: isThickBottom ? colors.text : colors.border,
                          borderTopWidth: rowIdx === 0 ? 1 : 0,
                          borderLeftWidth: colIdx === 0 ? 1 : 0,
                          borderTopColor: colors.text,
                          borderLeftColor: colors.text,
                        },
                      ]}
                    >
                      {cell === 'marked' && (
                        <Text
                          style={{
                            color: colors.textMuted,
                            fontSize: cellSize * 0.6,
                            fontWeight: 'bold',
                            lineHeight: cellSize * 0.7,
                          }}
                        >
                          ×
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}

            {/* Bottom border for the grid */}
            <View
              style={{
                flexDirection: 'row',
                marginLeft: maxClueWidth,
              }}
            >
              <View
                style={{
                  width: cellSize * currentPuzzle.size,
                  height: 1,
                  backgroundColor: colors.text,
                }}
              />
            </View>
            {/* Right border for the grid */}
          </View>
        </ScrollView>

        {/* Action buttons */}
        <View style={{ gap: spacing.sm, marginTop: spacing.lg, paddingHorizontal: spacing.sm }}>
          <Button title="答え合わせ" onPress={handleCheck} />
          <View style={styles.bottomButtons}>
            <Button
              title="ヒント（広告）"
              onPress={handleHint}
              variant="outline"
              style={{ flex: 1 }}
            />
            <View style={{ width: spacing.sm }} />
            <Button
              title="リセット"
              onPress={handleReset}
              variant="ghost"
              style={{ flex: 1 }}
            />
          </View>
        </View>
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizeCard: {
    padding: 16,
  },
  sizeCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sizeCardRight: {
    alignItems: 'flex-end',
  },
  puzzleCard: {
    padding: 12,
  },
  puzzleCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  puzzleCardLeft: {
    flex: 1,
  },
  completedContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  colClueCell: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 2,
  },
  rowClueCell: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  clueText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomButtons: {
    flexDirection: 'row',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
