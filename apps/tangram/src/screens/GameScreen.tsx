import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Text,
} from 'react-native';
import { useTheme, H2, H3, Body, Button, Card, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useTimer } from '@massapp/hooks';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import {
  TangramPuzzle,
  PuzzleResult,
  getPuzzlesByDifficulty,
  DIFFICULTY_LEVELS,
  rotatePiece,
  formatTime,
} from '../data/puzzles';

type GamePhase = 'select-difficulty' | 'select-puzzle' | 'playing' | 'completed';

interface PlacedPiece {
  pieceId: string;
  shape: boolean[][];
  color: string;
  row: number;
  col: number;
}

function createEmptyGrid(size: number): (string | null)[][] {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

function canPlacePiece(
  grid: (string | null)[][],
  shape: boolean[][],
  startRow: number,
  startCol: number,
  gridSize: number,
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const gr = startRow + r;
      const gc = startCol + c;
      if (gr < 0 || gr >= gridSize || gc < 0 || gc >= gridSize) return false;
      if (grid[gr][gc] !== null) return false;
    }
  }
  return true;
}

function placePieceOnGrid(
  grid: (string | null)[][],
  shape: boolean[][],
  startRow: number,
  startCol: number,
  pieceId: string,
): (string | null)[][] {
  const newGrid = grid.map((row) => [...row]);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        newGrid[startRow + r][startCol + c] = pieceId;
      }
    }
  }
  return newGrid;
}

function removePieceFromGrid(
  grid: (string | null)[][],
  pieceId: string,
): (string | null)[][] {
  return grid.map((row) => row.map((cell) => (cell === pieceId ? null : cell)));
}

function checkSolution(
  grid: (string | null)[][],
  target: boolean[][],
): boolean {
  for (let r = 0; r < target.length; r++) {
    for (let c = 0; c < target[r].length; c++) {
      const shouldBeFilled = target[r][c];
      const isFilled = grid[r][c] !== null;
      if (shouldBeFilled !== isFilled) return false;
    }
  }
  return true;
}

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();
  const { seconds, start, stop, reset } = useTimer();

  const [results, setResults] = useLocalStorage<PuzzleResult[]>('tangram-results', []);

  const [phase, setPhase] = useState<GamePhase>('select-difficulty');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('easy');
  const [currentPuzzle, setCurrentPuzzle] = useState<TangramPuzzle | null>(null);
  const [grid, setGrid] = useState<(string | null)[][]>([]);
  const [placedPieces, setPlacedPieces] = useState<PlacedPiece[]>([]);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [pieceShapes, setPieceShapes] = useState<Record<string, boolean[][]>>({});
  const [completedTime, setCompletedTime] = useState(0);
  const [hintShown, setHintShown] = useState(false);

  const handleReward = useCallback(() => {
    if (!currentPuzzle) return;
    setHintShown(true);
    Alert.alert(
      'ヒント',
      '正解の形がハイライトされました。ピースを正しい位置に配置してみましょう。',
    );
  }, [currentPuzzle]);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(handleReward);

  const completedPuzzleIds = (results || []).map((r) => r.puzzleId);

  const handleSelectDifficulty = (diffKey: string) => {
    setSelectedDifficulty(diffKey);
    setPhase('select-puzzle');
  };

  const handleSelectPuzzle = (puzzle: TangramPuzzle) => {
    setCurrentPuzzle(puzzle);
    setGrid(createEmptyGrid(puzzle.gridSize));
    setPlacedPieces([]);
    setSelectedPieceId(null);
    setHintShown(false);
    const shapes: Record<string, boolean[][]> = {};
    puzzle.pieces.forEach((p) => {
      shapes[p.id] = p.shape;
    });
    setPieceShapes(shapes);
    setPhase('playing');
    reset();
    start();
  };

  const handleRotate = () => {
    if (!selectedPieceId) return;
    const isPlaced = placedPieces.find((pp) => pp.pieceId === selectedPieceId);
    if (isPlaced) return;
    setPieceShapes((prev) => ({
      ...prev,
      [selectedPieceId]: rotatePiece(prev[selectedPieceId]),
    }));
  };

  const handleGridPress = (row: number, col: number) => {
    if (!currentPuzzle) return;

    const cellPieceId = grid[row][col];
    if (cellPieceId !== null) {
      const placed = placedPieces.find((pp) => pp.pieceId === cellPieceId);
      if (placed) {
        const newGrid = removePieceFromGrid(grid, cellPieceId);
        setGrid(newGrid);
        setPlacedPieces((prev) => prev.filter((pp) => pp.pieceId !== cellPieceId));
        setPieceShapes((prev) => ({
          ...prev,
          [cellPieceId]: placed.shape,
        }));
        setSelectedPieceId(cellPieceId);
        return;
      }
    }

    if (!selectedPieceId) return;
    const isAlreadyPlaced = placedPieces.find((pp) => pp.pieceId === selectedPieceId);
    if (isAlreadyPlaced) return;

    const shape = pieceShapes[selectedPieceId];
    if (!shape) return;

    if (canPlacePiece(grid, shape, row, col, currentPuzzle.gridSize)) {
      const newGrid = placePieceOnGrid(grid, shape, row, col, selectedPieceId);
      setGrid(newGrid);
      const piece = currentPuzzle.pieces.find((p) => p.id === selectedPieceId);
      if (piece) {
        setPlacedPieces((prev) => [
          ...prev,
          { pieceId: selectedPieceId, shape, color: piece.color, row, col },
        ]);
      }
      setSelectedPieceId(null);
    }
  };

  const handleCheck = () => {
    if (!currentPuzzle) return;

    if (checkSolution(grid, currentPuzzle.target)) {
      stop();
      setCompletedTime(seconds);
      const result: PuzzleResult = {
        id: Date.now().toString(),
        puzzleId: currentPuzzle.id,
        puzzleName: currentPuzzle.name,
        difficulty: currentPuzzle.difficulty,
        date: new Date().toISOString(),
        timeSeconds: seconds,
      };
      setResults((prev) => [result, ...(prev || [])]);
      trackAction();
      setPhase('completed');
    } else {
      Alert.alert('まだ完成していません', 'ピースの配置を確認してください。');
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
    Alert.alert('リセット', 'ピースをすべて取り除きますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'リセット',
        style: 'destructive',
        onPress: () => {
          setGrid(createEmptyGrid(currentPuzzle.gridSize));
          setPlacedPieces([]);
          setSelectedPieceId(null);
          setHintShown(false);
          const shapes: Record<string, boolean[][]> = {};
          currentPuzzle.pieces.forEach((p) => {
            shapes[p.id] = p.shape;
          });
          setPieceShapes(shapes);
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
  };

  const handleNextPuzzle = () => {
    setPhase('select-puzzle');
  };

  // === Select Difficulty ===
  if (phase === 'select-difficulty') {
    return (
      <ScreenWrapper>
        <ScrollView style={[styles.container, { padding: spacing.lg }]}>
          <H2 style={{ marginBottom: spacing.xl }}>難易度を選択</H2>
          {DIFFICULTY_LEVELS.map((dl) => {
            const puzzles = getPuzzlesByDifficulty(dl.key);
            const completed = puzzles.filter((p) =>
              completedPuzzleIds.includes(p.id),
            ).length;
            return (
              <TouchableOpacity
                key={dl.key}
                onPress={() => handleSelectDifficulty(dl.key)}
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
                      <Body color={colors.textSecondary}>{dl.difficulty}</Body>
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
    const diffInfo = DIFFICULTY_LEVELS.find((dl) => dl.key === selectedDifficulty);
    return (
      <ScreenWrapper>
        <ScrollView style={[styles.container, { padding: spacing.lg }]}>
          <View style={[styles.headerRow, { marginBottom: spacing.lg }]}>
            <TouchableOpacity onPress={() => setPhase('select-difficulty')}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <H2 style={{ marginLeft: spacing.md }}>
              {diffInfo?.label} - {diffInfo?.difficulty}
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
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Body style={{ fontWeight: 'bold' }}>
                          #{index + 1} {puzzle.name}
                        </Body>
                        <Body
                          color={colors.textMuted}
                          style={{ marginLeft: spacing.sm, fontSize: 12 }}
                        >
                          {puzzle.pieces.length}ピース
                        </Body>
                      </View>
                    </View>
                    {isCompleted && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={colors.success}
                      />
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </ScreenWrapper>
    );
  }

  // === Completed ===
  if (phase === 'completed') {
    return (
      <ScreenWrapper>
        <View
          style={[
            styles.container,
            { padding: spacing.lg, justifyContent: 'center' },
          ]}
        >
          <View style={styles.completedContent}>
            <Ionicons name="trophy" size={64} color={colors.primary} />
            <H2 style={{ marginTop: spacing.lg, textAlign: 'center' }}>
              完成！
            </H2>
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
              難易度:{' '}
              {
                DIFFICULTY_LEVELS.find(
                  (dl) => dl.key === currentPuzzle?.difficulty,
                )?.difficulty
              }
            </Body>
          </View>
          <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
            <Button title="次のパズル" onPress={handleNextPuzzle} />
            <Button
              title="パズル選択に戻る"
              onPress={handleBackToSelect}
              variant="outline"
            />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // === Playing ===
  if (!currentPuzzle) return null;

  const screenWidth = Dimensions.get('window').width;
  const gridPadding = spacing.sm * 2;
  const gridAreaWidth = screenWidth - gridPadding - spacing.lg * 2;
  const cellSize = Math.floor(gridAreaWidth / currentPuzzle.gridSize);

  const availablePieces = currentPuzzle.pieces.filter(
    (p) => !placedPieces.find((pp) => pp.pieceId === p.id),
  );

  const pieceColorMap: Record<string, string> = {};
  currentPuzzle.pieces.forEach((p) => {
    pieceColorMap[p.id] = p.color;
  });

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
            <TouchableOpacity
              onPress={handleHint}
              style={{ marginRight: spacing.md }}
            >
              <Ionicons name="bulb" size={24} color={colors.warning} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReset}>
              <Ionicons name="refresh" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Puzzle name */}
        <Body
          style={{
            textAlign: 'center',
            fontWeight: 'bold',
            marginBottom: spacing.sm,
          }}
        >
          「{currentPuzzle.name}」を作ろう
        </Body>

        {/* Grid */}
        <View style={[styles.gridContainer, { alignSelf: 'center' }]}>
          {Array.from({ length: currentPuzzle.gridSize }).map((_, rowIdx) => (
            <View key={rowIdx} style={{ flexDirection: 'row' }}>
              {Array.from({ length: currentPuzzle.gridSize }).map((_, colIdx) => {
                const isTarget = currentPuzzle.target[rowIdx][colIdx];
                const placedId = grid[rowIdx][colIdx];
                const placedColor = placedId ? pieceColorMap[placedId] : null;
                const isHintCell = hintShown && isTarget && !placedId;

                let bgColor = colors.background;
                if (placedColor) {
                  bgColor = placedColor;
                } else if (isHintCell) {
                  bgColor = colors.primary + '30';
                } else if (isTarget) {
                  bgColor = colors.surface;
                }

                return (
                  <TouchableOpacity
                    key={colIdx}
                    onPress={() => handleGridPress(rowIdx, colIdx)}
                    activeOpacity={0.7}
                    style={[
                      styles.cell,
                      {
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: bgColor,
                        borderColor: isTarget ? colors.textMuted : colors.border,
                        borderWidth: isTarget ? 1.5 : 0.5,
                      },
                    ]}
                  >
                    {placedColor && (
                      <View
                        style={[
                          styles.filledCell,
                          { backgroundColor: placedColor, borderRadius: 2 },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Rotate button */}
        <View style={{ alignItems: 'center', marginTop: spacing.md }}>
          <TouchableOpacity
            onPress={handleRotate}
            style={[
              styles.rotateButton,
              {
                backgroundColor: selectedPieceId ? colors.primary : colors.surface,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                borderRadius: 8,
              },
            ]}
            disabled={!selectedPieceId}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name="refresh"
                size={20}
                color={selectedPieceId ? '#FFFFFF' : colors.textMuted}
              />
              <Text
                style={{
                  marginLeft: 6,
                  color: selectedPieceId ? '#FFFFFF' : colors.textMuted,
                  fontWeight: 'bold',
                }}
              >
                回転
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Available pieces */}
        <Body
          style={{
            fontWeight: 'bold',
            marginTop: spacing.md,
            marginBottom: spacing.sm,
            paddingHorizontal: spacing.sm,
          }}
        >
          ピース（タップで選択）
        </Body>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ paddingHorizontal: spacing.sm }}
          contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.lg }}
        >
          {availablePieces.map((piece) => {
            const shape = pieceShapes[piece.id] || piece.shape;
            const isSelected = selectedPieceId === piece.id;
            const pieceRows = shape.length;
            const pieceCols = shape[0]?.length || 0;
            const pieceCellSize = 24;

            return (
              <TouchableOpacity
                key={piece.id}
                onPress={() =>
                  setSelectedPieceId(isSelected ? null : piece.id)
                }
                activeOpacity={0.7}
                style={[
                  styles.pieceContainer,
                  {
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 3 : 1,
                    backgroundColor: isSelected
                      ? colors.primary + '15'
                      : colors.surface,
                    padding: spacing.sm,
                    borderRadius: 8,
                  },
                ]}
              >
                {Array.from({ length: pieceRows }).map((_, r) => (
                  <View key={r} style={{ flexDirection: 'row' }}>
                    {Array.from({ length: pieceCols }).map((_, c) => (
                      <View
                        key={c}
                        style={{
                          width: pieceCellSize,
                          height: pieceCellSize,
                          backgroundColor: shape[r][c]
                            ? piece.color
                            : 'transparent',
                          borderWidth: shape[r][c] ? 1 : 0,
                          borderColor: shape[r][c]
                            ? piece.color + '80'
                            : 'transparent',
                          borderRadius: 2,
                          margin: 1,
                        }}
                      />
                    ))}
                  </View>
                ))}
              </TouchableOpacity>
            );
          })}
          {availablePieces.length === 0 && (
            <Body color={colors.textMuted} style={{ paddingVertical: spacing.md }}>
              すべてのピースを配置しました
            </Body>
          )}
        </ScrollView>

        {/* Action buttons */}
        <View
          style={{
            gap: spacing.sm,
            marginTop: spacing.lg,
            paddingHorizontal: spacing.sm,
          }}
        >
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
  gridContainer: {
    alignItems: 'center',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  filledCell: {
    width: '85%',
    height: '85%',
  },
  rotateButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  bottomButtons: {
    flexDirection: 'row',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
