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
import { useTheme, H2, H3, Body, Button, Card, Badge, Caption } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useTimer, useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import { Puzzle, CellValue, PuzzleResult, Difficulty } from '../types';
import {
  ALL_PUZZLES,
  DIFFICULTY_INFO,
  getPuzzlesByDifficulty,
} from '../data/puzzles';
import {
  createEmptyGrid,
  toggleCellValue,
  checkSolution,
  findHintCell,
  formatTime,
  getCategoryPairs,
  getCellSymbol,
} from '../utils/logic';

type GamePhase = 'select-difficulty' | 'select-puzzle' | 'playing' | 'completed';

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();
  const { seconds, start, stop, reset } = useTimer();

  const [results, setResults] = useLocalStorage<PuzzleResult[]>('logic-puzzle-results', []);

  const [phase, setPhase] = useState<GamePhase>('select-difficulty');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [grid, setGrid] = useState<CellValue[][][]>([]);
  const [completedTime, setCompletedTime] = useState(0);

  const handleReward = useCallback(() => {
    if (!currentPuzzle || !grid.length) return;
    const hint = findHintCell(grid, currentPuzzle);
    if (hint) {
      setGrid((prev) => {
        const newGrid = prev.map((sub) => sub.map((row) => [...row]));
        newGrid[hint.pairIdx][hint.row][hint.col] = hint.value;
        return newGrid;
      });
      Alert.alert('ヒント', 'セルを1つ修正しました');
    } else {
      Alert.alert('ヒント', 'すべてのセルが正しいです！');
    }
  }, [currentPuzzle, grid]);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(handleReward);

  const completedPuzzleIds = (results || []).map((r) => r.puzzleId);

  const handleSelectDifficulty = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
    setPhase('select-puzzle');
  };

  const handleSelectPuzzle = (puzzle: Puzzle) => {
    setCurrentPuzzle(puzzle);
    setGrid(createEmptyGrid(puzzle));
    setPhase('playing');
    reset();
    start();
  };

  const handleCellPress = (pairIdx: number, row: number, col: number) => {
    setGrid((prev) => {
      const newGrid = prev.map((sub) => sub.map((r) => [...r]));
      newGrid[pairIdx][row][col] = toggleCellValue(newGrid[pairIdx][row][col]);
      return newGrid;
    });
  };

  const handleCheck = () => {
    if (!currentPuzzle) return;

    if (checkSolution(grid, currentPuzzle)) {
      stop();
      setCompletedTime(seconds);
      const result: PuzzleResult = {
        id: Date.now().toString(),
        puzzleId: currentPuzzle.id,
        puzzleName: currentPuzzle.scenario.slice(0, 30),
        difficulty: currentPuzzle.difficulty,
        date: new Date().toISOString(),
        timeSeconds: seconds,
      };
      setResults((prev) => [result, ...(prev || [])]);
      trackAction();
      setPhase('completed');
    } else {
      Alert.alert('まだ完成していません', '解答に間違いがあります。もう一度確認してください。');
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
          setGrid(createEmptyGrid(currentPuzzle));
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

  // === SELECT DIFFICULTY ===
  if (phase === 'select-difficulty') {
    return (
      <ScreenWrapper>
        <ScrollView style={[styles.container, { padding: spacing.lg }]}>
          <H2 style={{ marginBottom: spacing.xl }}>難易度を選択</H2>
          {DIFFICULTY_INFO.map((info) => {
            const puzzles = getPuzzlesByDifficulty(info.key);
            const completed = puzzles.filter((p) => completedPuzzleIds.includes(p.id)).length;
            return (
              <TouchableOpacity
                key={info.key}
                onPress={() => handleSelectDifficulty(info.key)}
                activeOpacity={0.7}
              >
                <Card
                  style={[
                    styles.difficultyCard,
                    {
                      marginBottom: spacing.md,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.difficultyCardContent}>
                    <View>
                      <H3>{info.label}</H3>
                      <Body color={colors.textSecondary}>{info.description}</Body>
                    </View>
                    <View style={styles.difficultyCardRight}>
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

  // === SELECT PUZZLE ===
  if (phase === 'select-puzzle') {
    const puzzles = getPuzzlesByDifficulty(selectedDifficulty);
    const diffInfo = DIFFICULTY_INFO.find((d) => d.key === selectedDifficulty);
    return (
      <ScreenWrapper>
        <ScrollView style={[styles.container, { padding: spacing.lg }]}>
          <View style={[styles.headerRow, { marginBottom: spacing.lg }]}>
            <TouchableOpacity onPress={() => setPhase('select-difficulty')}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <H2 style={{ marginLeft: spacing.md }}>
              {diffInfo?.label} - {diffInfo?.description}
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
                        #{index + 1}
                      </Body>
                      <Caption
                        style={{ color: colors.textSecondary, marginTop: 2 }}
                        numberOfLines={1}
                      >
                        {puzzle.scenario}
                      </Caption>
                    </View>
                    {isCompleted && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.success} />
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

  // === COMPLETED ===
  if (phase === 'completed') {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.lg, justifyContent: 'center' }]}>
          <View style={styles.completedContent}>
            <Ionicons name="trophy" size={64} color={colors.primary} />
            <H2 style={{ marginTop: spacing.lg, textAlign: 'center' }}>完成！</H2>
            <Body
              color={colors.textSecondary}
              style={{ marginTop: spacing.md, textAlign: 'center' }}
            >
              {currentPuzzle?.scenario}
            </Body>
            <Body
              color={colors.textSecondary}
              style={{ marginTop: spacing.md, textAlign: 'center' }}
            >
              クリアタイム: {formatTime(completedTime)}
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

  // === PLAYING ===
  if (!currentPuzzle) return null;

  const screenWidth = Dimensions.get('window').width;
  const numCategories = currentPuzzle.categories.length;
  const size = currentPuzzle.items[0].length;
  const pairs = getCategoryPairs(numCategories);

  // Calculate cell size based on screen width
  // We need space for row labels + grid cells
  const labelWidth = 56;
  const padding = spacing.sm * 2;
  const availableWidth = screenWidth - padding - labelWidth;
  const cellSize = Math.min(Math.floor(availableWidth / size), 40);

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

        {/* Scenario */}
        <Card style={[styles.scenarioCard, { marginBottom: spacing.sm, padding: spacing.md }]}>
          <Body style={{ fontWeight: 'bold', marginBottom: spacing.xs }}>
            {currentPuzzle.scenario}
          </Body>
          {currentPuzzle.clues.map((clue, index) => (
            <Body
              key={index}
              color={colors.textSecondary}
              style={{ fontSize: 13, marginTop: 2 }}
            >
              {index + 1}. {clue}
            </Body>
          ))}
        </Card>

        {/* Logic grid sections */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {pairs.map((pair, pairIdx) => {
              const [cat1, cat2] = pair;
              return (
                <View key={pairIdx} style={{ marginBottom: spacing.md }}>
                  {/* Section header */}
                  <Caption
                    style={{
                      color: colors.primary,
                      fontWeight: 'bold',
                      marginBottom: 4,
                      marginLeft: labelWidth,
                    }}
                  >
                    {currentPuzzle.categories[cat1]} / {currentPuzzle.categories[cat2]}
                  </Caption>

                  {/* Column headers */}
                  <View style={{ flexDirection: 'row' }}>
                    <View style={{ width: labelWidth }} />
                    {currentPuzzle.items[cat2].map((item, colIdx) => (
                      <View
                        key={colIdx}
                        style={[
                          styles.columnHeader,
                          {
                            width: cellSize,
                            height: 40,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.headerText,
                            {
                              color: colors.text,
                              fontSize: size >= 5 ? 9 : size >= 4 ? 10 : 11,
                            },
                          ]}
                          numberOfLines={2}
                        >
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Grid rows */}
                  {currentPuzzle.items[cat1].map((rowItem, rowIdx) => (
                    <View key={rowIdx} style={{ flexDirection: 'row' }}>
                      {/* Row label */}
                      <View
                        style={[
                          styles.rowLabel,
                          {
                            width: labelWidth,
                            height: cellSize,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.labelText,
                            {
                              color: colors.text,
                              fontSize: size >= 5 ? 9 : size >= 4 ? 10 : 11,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {rowItem}
                        </Text>
                      </View>

                      {/* Cells */}
                      {currentPuzzle.items[cat2].map((_, colIdx) => {
                        const cellValue = grid[pairIdx]?.[rowIdx]?.[colIdx] || 'empty';
                        return (
                          <Pressable
                            key={colIdx}
                            onPress={() => handleCellPress(pairIdx, rowIdx, colIdx)}
                            style={[
                              styles.cell,
                              {
                                width: cellSize,
                                height: cellSize,
                                borderColor: colors.border,
                                backgroundColor:
                                  cellValue === 'circle'
                                    ? colors.primary + '20'
                                    : colors.background,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.cellText,
                                {
                                  fontSize: cellSize * 0.55,
                                  color:
                                    cellValue === 'circle'
                                      ? colors.primary
                                      : cellValue === 'cross'
                                      ? colors.textMuted
                                      : colors.text,
                                  fontWeight: cellValue === 'circle' ? 'bold' : 'normal',
                                },
                              ]}
                            >
                              {getCellSymbol(cellValue)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                </View>
              );
            })}
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
  scenarioCard: {},
  difficultyCard: {
    padding: 16,
  },
  difficultyCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyCardRight: {
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
  columnHeader: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 2,
    paddingHorizontal: 1,
  },
  headerText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  rowLabel: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  labelText: {
    fontWeight: '600',
    textAlign: 'right',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
  },
  cellText: {
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
