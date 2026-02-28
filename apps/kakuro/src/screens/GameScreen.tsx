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
import { KakuroPuzzle, PuzzleResult } from '../types';
import { getPuzzlesByDifficulty, DIFFICULTY_LEVELS } from '../data/puzzles';
import {
  createEmptyPlayerGrid,
  checkCompletion,
  findHintCell,
  getErrorCells,
  formatTime,
} from '../utils/kakuro';

type GamePhase = 'select-difficulty' | 'select-puzzle' | 'playing' | 'completed';

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();
  const { seconds, start, stop, reset } = useTimer();

  const [results, setResults] = useLocalStorage<PuzzleResult[]>('kakuro-results', []);

  const [phase, setPhase] = useState<GamePhase>('select-difficulty');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('easy');
  const [currentPuzzle, setCurrentPuzzle] = useState<KakuroPuzzle | null>(null);
  const [playerGrid, setPlayerGrid] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [completedTime, setCompletedTime] = useState(0);
  const [showErrors, setShowErrors] = useState(false);

  const handleReward = useCallback(() => {
    if (!currentPuzzle || !playerGrid.length) return;
    const hint = findHintCell(currentPuzzle, playerGrid);
    if (hint) {
      setPlayerGrid((prev) => {
        const newGrid = prev.map((row) => [...row]);
        newGrid[hint.row][hint.col] = hint.value;
        return newGrid;
      });
      Alert.alert('ヒント', `セル (${hint.row + 1}, ${hint.col + 1}) に正解を入れました`);
    } else {
      Alert.alert('ヒント', 'すべてのセルが正しいです！');
    }
  }, [currentPuzzle, playerGrid]);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(handleReward);

  const completedPuzzleIds = (results || []).map((r) => r.puzzleId);

  const handleSelectDifficulty = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    setPhase('select-puzzle');
  };

  const handleSelectPuzzle = (puzzle: KakuroPuzzle) => {
    setCurrentPuzzle(puzzle);
    setPlayerGrid(createEmptyPlayerGrid(puzzle));
    setSelectedCell(null);
    setShowErrors(false);
    setPhase('playing');
    reset();
    start();
  };

  const handleCellPress = (row: number, col: number) => {
    if (!currentPuzzle) return;
    if (currentPuzzle.grid[row][col].type !== 'empty') return;
    setSelectedCell({ row, col });
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    setPlayerGrid((prev) => {
      const newGrid = prev.map((row) => [...row]);
      newGrid[selectedCell.row][selectedCell.col] = num;
      return newGrid;
    });
    setShowErrors(false);
  };

  const handleClearCell = () => {
    if (!selectedCell) return;
    setPlayerGrid((prev) => {
      const newGrid = prev.map((row) => [...row]);
      newGrid[selectedCell.row][selectedCell.col] = 0;
      return newGrid;
    });
    setShowErrors(false);
  };

  const handleCheck = () => {
    if (!currentPuzzle) return;

    if (checkCompletion(currentPuzzle, playerGrid)) {
      stop();
      setCompletedTime(seconds);
      const result: PuzzleResult = {
        id: Date.now().toString(),
        puzzleId: currentPuzzle.id,
        puzzleName: currentPuzzle.name,
        difficulty: currentPuzzle.difficulty,
        size: `${currentPuzzle.rows}x${currentPuzzle.cols}`,
        date: new Date().toISOString(),
        timeSeconds: seconds,
      };
      setResults((prev) => [result, ...(prev || [])]);
      trackAction();
      setPhase('completed');
    } else {
      setShowErrors(true);
      Alert.alert('まだ完成していません', '間違いがあります。赤くなったセルを確認してください。');
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
          setPlayerGrid(createEmptyPlayerGrid(currentPuzzle));
          setSelectedCell(null);
          setShowErrors(false);
          reset();
          start();
        },
      },
    ]);
  };

  const handleBackToSelect = () => {
    stop();
    reset();
    setPhase('select-difficulty');
    setCurrentPuzzle(null);
    setSelectedCell(null);
  };

  const handleNextPuzzle = () => {
    setPhase('select-puzzle');
    setSelectedCell(null);
  };

  // === Select Difficulty ===
  if (phase === 'select-difficulty') {
    return (
      <ScreenWrapper>
        <ScrollView style={[styles.container, { padding: spacing.lg }]}>
          <H2 style={{ marginBottom: spacing.xl }}>難易度を選択</H2>
          {DIFFICULTY_LEVELS.map((dl) => {
            const puzzles = getPuzzlesByDifficulty(dl.difficulty);
            const completed = puzzles.filter((p) => completedPuzzleIds.includes(p.id)).length;
            return (
              <TouchableOpacity
                key={dl.difficulty}
                onPress={() => handleSelectDifficulty(dl.difficulty)}
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
                      <H3>{dl.label}</H3>
                      <Body color={colors.textSecondary}>{dl.displayName}</Body>
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

  // === Select Puzzle ===
  if (phase === 'select-puzzle') {
    const puzzles = getPuzzlesByDifficulty(selectedDifficulty);
    const diffInfo = DIFFICULTY_LEVELS.find((dl) => dl.difficulty === selectedDifficulty);
    return (
      <ScreenWrapper>
        <ScrollView style={[styles.container, { padding: spacing.lg }]}>
          <View style={[styles.headerRow, { marginBottom: spacing.lg }]}>
            <TouchableOpacity onPress={() => setPhase('select-difficulty')}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <H2 style={{ marginLeft: spacing.md }}>
              {diffInfo?.label} - {diffInfo?.displayName}
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
                        #{index + 1} {puzzle.name}
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

  // === Completed ===
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
            <Body color={colors.textSecondary} style={{ textAlign: 'center' }}>
              サイズ: {currentPuzzle?.rows}x{currentPuzzle?.cols}
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

  // === Playing ===
  if (!currentPuzzle) return null;

  const screenWidth = Dimensions.get('window').width;
  const gridPadding = spacing.sm * 2;
  const cellSize = Math.min(
    Math.floor((screenWidth - gridPadding - 16) / currentPuzzle.cols),
    50
  );

  const errorCells = showErrors ? getErrorCells(currentPuzzle, playerGrid) : new Set<string>();

  const renderClueCell = (row: number, col: number) => {
    const cell = currentPuzzle.grid[row][col];
    if (cell.type !== 'clue') return null;
    const clueCell = cell as { type: 'clue'; right?: number; down?: number };
    const hasRight = clueCell.right !== undefined;
    const hasDown = clueCell.down !== undefined;

    return (
      <View
        key={`${row}-${col}`}
        style={[
          styles.gridCell,
          {
            width: cellSize,
            height: cellSize,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Diagonal line */}
        <View
          style={[
            styles.diagonalLine,
            {
              backgroundColor: colors.border,
              width: Math.sqrt(2) * cellSize,
              top: cellSize / 2,
              left: -(Math.sqrt(2) * cellSize - cellSize) / 2,
            },
          ]}
        />
        {/* Down clue (top-right) */}
        {hasDown && (
          <Text
            style={[
              styles.clueText,
              {
                color: colors.text,
                fontSize: cellSize <= 30 ? 8 : cellSize <= 40 ? 10 : 12,
                position: 'absolute',
                bottom: 2,
                left: 3,
              },
            ]}
            numberOfLines={1}
          >
            {clueCell.down}
          </Text>
        )}
        {/* Right clue (bottom-left) */}
        {hasRight && (
          <Text
            style={[
              styles.clueText,
              {
                color: colors.text,
                fontSize: cellSize <= 30 ? 8 : cellSize <= 40 ? 10 : 12,
                position: 'absolute',
                top: 2,
                right: 3,
              },
            ]}
            numberOfLines={1}
          >
            {clueCell.right}
          </Text>
        )}
      </View>
    );
  };

  const renderEmptyCell = (row: number, col: number) => {
    const value = playerGrid[row]?.[col] || 0;
    const isSelected =
      selectedCell !== null && selectedCell.row === row && selectedCell.col === col;
    const isError = errorCells.has(`${row}-${col}`);

    let bgColor = colors.background;
    if (isSelected) {
      bgColor = colors.primaryLight || colors.primary + '30';
    } else if (isError && value !== 0) {
      bgColor = (colors.error || '#ff0000') + '30';
    }

    return (
      <Pressable
        key={`${row}-${col}`}
        onPress={() => handleCellPress(row, col)}
        style={[
          styles.gridCell,
          {
            width: cellSize,
            height: cellSize,
            backgroundColor: bgColor,
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
      >
        {value !== 0 && (
          <Text
            style={{
              color: isError ? colors.error || '#ff0000' : colors.text,
              fontSize: cellSize <= 30 ? 14 : cellSize <= 40 ? 18 : 22,
              fontWeight: 'bold',
            }}
          >
            {value}
          </Text>
        )}
      </Pressable>
    );
  };

  const renderBlockedCell = (row: number, col: number) => (
    <View
      key={`${row}-${col}`}
      style={[
        styles.gridCell,
        {
          width: cellSize,
          height: cellSize,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    />
  );

  return (
    <ScreenWrapper>
      <ScrollView style={[styles.container, { padding: spacing.sm }]}>
        {/* Top bar */}
        <View style={[styles.topBar, { marginBottom: spacing.sm }]}>
          <TouchableOpacity onPress={handleBackToSelect}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Body style={{ fontWeight: 'bold' }}>{formatTime(seconds)}</Body>
          <View style={styles.topBarRight}>
            <TouchableOpacity onPress={handleHint} style={{ marginRight: spacing.md }}>
              <Ionicons name="bulb" size={24} color={colors.warning} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReset}>
              <Ionicons name="refresh" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Kakuro Grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.gridContainer}>
            {currentPuzzle.grid.map((row, rowIdx) => (
              <View key={rowIdx} style={{ flexDirection: 'row' }}>
                {row.map((cell, colIdx) => {
                  if (cell.type === 'clue') {
                    return renderClueCell(rowIdx, colIdx);
                  }
                  if (cell.type === 'empty') {
                    return renderEmptyCell(rowIdx, colIdx);
                  }
                  return renderBlockedCell(rowIdx, colIdx);
                })}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Number Pad */}
        <View style={[styles.numberPad, { marginTop: spacing.md }]}>
          <View style={styles.numberRow}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberInput(num)}
                style={[
                  styles.numberButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.numberButtonText,
                    { color: colors.text },
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.numberRow}>
            {[6, 7, 8, 9].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberInput(num)}
                style={[
                  styles.numberButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.numberButtonText,
                    { color: colors.text },
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={handleClearCell}
              style={[
                styles.numberButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="backspace-outline" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action buttons */}
        <View style={{ gap: spacing.sm, marginTop: spacing.md, paddingHorizontal: spacing.sm }}>
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
  gridContainer: {
    alignSelf: 'center',
  },
  gridCell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  diagonalLine: {
    position: 'absolute',
    height: 1,
    transform: [{ rotate: '45deg' }],
  },
  clueText: {
    fontWeight: '700',
  },
  numberPad: {
    alignItems: 'center',
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
  },
  numberButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  numberButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomButtons: {
    flexDirection: 'row',
  },
});
