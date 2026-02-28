import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useTheme, H2, H3, Body, Button, Card, Badge, Caption } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import type { Level, Difficulty } from '../data/levels';
import { DIFFICULTIES, getLevelsByDifficulty } from '../data/levels';

type Direction = 'up' | 'down' | 'left' | 'right';

interface ClearRecord {
  id: string;
  levelId: string;
  difficulty: Difficulty;
  levelIndex: number;
  moves: number;
  date: string;
}

type GamePhase = 'select-difficulty' | 'select-level' | 'playing' | 'completed';

interface GameState {
  grid: ('empty' | 'filled' | 'blocked')[][];
  position: [number, number];
  moveCount: number;
  moveHistory: { grid: ('empty' | 'filled' | 'blocked')[][]; position: [number, number] }[];
}

function createInitialGrid(level: Level): ('empty' | 'filled' | 'blocked')[][] {
  const grid: ('empty' | 'filled' | 'blocked')[][] = [];
  for (let r = 0; r < level.size; r++) {
    grid[r] = [];
    for (let c = 0; c < level.size; c++) {
      grid[r][c] = 'empty';
    }
  }
  for (const [br, bc] of level.blocked) {
    grid[br][bc] = 'blocked';
  }
  grid[level.start[0]][level.start[1]] = 'filled';
  return grid;
}

function cloneGrid(grid: ('empty' | 'filled' | 'blocked')[][]): ('empty' | 'filled' | 'blocked')[][] {
  return grid.map((row) => [...row]);
}

function countEmpty(grid: ('empty' | 'filled' | 'blocked')[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell === 'empty') count++;
    }
  }
  return count;
}

function totalNonBlocked(level: Level): number {
  return level.size * level.size - level.blocked.length;
}

const DIR_DELTAS: Record<Direction, [number, number]> = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
};

function moveBlock(
  grid: ('empty' | 'filled' | 'blocked')[][],
  position: [number, number],
  direction: Direction,
  size: number
): { newGrid: ('empty' | 'filled' | 'blocked')[][]; newPosition: [number, number]; moved: boolean } {
  const [dr, dc] = DIR_DELTAS[direction];
  const newGrid = cloneGrid(grid);
  let [r, c] = position;
  let moved = false;

  while (true) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
    if (newGrid[nr][nc] === 'blocked') break;
    if (newGrid[nr][nc] === 'filled') break;
    r = nr;
    c = nc;
    newGrid[r][c] = 'filled';
    moved = true;
  }

  return { newGrid, newPosition: [r, c], moved };
}

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();

  const [records, setRecords] = useLocalStorage<ClearRecord[]>('fill-puzzle-records', []);

  const [phase, setPhase] = useState<GamePhase>('select-difficulty');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [hintMoves, setHintMoves] = useState<Direction[]>([]);
  const [showHints, setShowHints] = useState(false);

  const handleReward = useCallback(() => {
    if (currentLevel && currentLevel.hintMoves.length > 0) {
      setHintMoves(currentLevel.hintMoves.slice(0, 3));
      setShowHints(true);
      Alert.alert('ヒント表示', '最初の3手が表示されます');
    }
  }, [currentLevel]);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(handleReward);

  const completedLevelIds = new Set((records || []).map((r) => r.levelId));

  const handleSelectDifficulty = (diff: Difficulty) => {
    setSelectedDifficulty(diff);
    setPhase('select-level');
  };

  const handleSelectLevel = (level: Level, index: number) => {
    setCurrentLevel(level);
    setCurrentLevelIndex(index);
    const grid = createInitialGrid(level);
    setGameState({
      grid,
      position: [level.start[0], level.start[1]],
      moveCount: 0,
      moveHistory: [],
    });
    setHintMoves([]);
    setShowHints(false);
    setPhase('playing');
  };

  const handleMove = useCallback(
    (direction: Direction) => {
      if (!gameState || !currentLevel) return;

      const { newGrid, newPosition, moved } = moveBlock(
        gameState.grid,
        gameState.position,
        direction,
        currentLevel.size
      );

      if (!moved) return;

      const historyEntry = {
        grid: cloneGrid(gameState.grid),
        position: gameState.position,
      };

      const newMoveCount = gameState.moveCount + 1;
      const newState: GameState = {
        grid: newGrid,
        position: newPosition,
        moveCount: newMoveCount,
        moveHistory: [...gameState.moveHistory, historyEntry],
      };

      setGameState(newState);

      // Check win condition
      if (countEmpty(newGrid) === 0) {
        const record: ClearRecord = {
          id: Date.now().toString(),
          levelId: currentLevel.id,
          difficulty: currentLevel.difficulty,
          levelIndex: currentLevelIndex,
          moves: newMoveCount,
          date: new Date().toISOString(),
        };
        setRecords((prev) => [record, ...(prev || [])]);
        trackAction();
        setPhase('completed');
      }
    },
    [gameState, currentLevel, currentLevelIndex, setRecords, trackAction]
  );

  const handleUndo = useCallback(() => {
    if (!gameState || gameState.moveHistory.length === 0) return;

    const lastState = gameState.moveHistory[gameState.moveHistory.length - 1];
    setGameState({
      grid: lastState.grid,
      position: lastState.position,
      moveCount: gameState.moveCount - 1,
      moveHistory: gameState.moveHistory.slice(0, -1),
    });
  }, [gameState]);

  const handleReset = useCallback(() => {
    if (!currentLevel) return;
    Alert.alert('リセット', 'このレベルを最初からやり直しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'リセット',
        style: 'destructive',
        onPress: () => {
          const grid = createInitialGrid(currentLevel);
          setGameState({
            grid,
            position: [currentLevel.start[0], currentLevel.start[1]],
            moveCount: 0,
            moveHistory: [],
          });
        },
      },
    ]);
  }, [currentLevel]);

  const handleHint = useCallback(() => {
    if (rewardedLoaded) {
      showRewardedAd();
    } else {
      handleReward();
    }
  }, [rewardedLoaded, showRewardedAd, handleReward]);

  const handleBackToLevelList = () => {
    setPhase('select-level');
    setCurrentLevel(null);
    setGameState(null);
    setShowHints(false);
  };

  const handleNextLevel = () => {
    const levels = getLevelsByDifficulty(selectedDifficulty);
    const nextIndex = currentLevelIndex + 1;
    if (nextIndex < levels.length) {
      handleSelectLevel(levels[nextIndex], nextIndex);
    } else {
      setPhase('select-level');
    }
  };

  // Use ref to always access latest handleMove in PanResponder
  const handleMoveRef = useRef(handleMove);
  handleMoveRef.current = handleMove;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
        },
        onPanResponderRelease: (_, gestureState) => {
          const { dx, dy } = gestureState;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          if (absDx < 15 && absDy < 15) return;

          if (absDx > absDy) {
            handleMoveRef.current(dx > 0 ? 'right' : 'left');
          } else {
            handleMoveRef.current(dy > 0 ? 'down' : 'up');
          }
        },
      }),
    []
  );

  // ─── Select Difficulty ─────────────────────────────────────
  if (phase === 'select-difficulty') {
    return (
      <ScreenWrapper>
        <ScrollView style={[styles.container, { padding: spacing.lg }]}>
          <H2 style={{ marginBottom: spacing.xl }}>難易度を選択</H2>
          {DIFFICULTIES.map((diff) => {
            const levels = getLevelsByDifficulty(diff.key);
            const completed = levels.filter((l) => completedLevelIds.has(l.id)).length;
            return (
              <TouchableOpacity
                key={diff.key}
                onPress={() => handleSelectDifficulty(diff.key)}
                activeOpacity={0.7}
              >
                <Card
                  style={[
                    styles.diffCard,
                    {
                      marginBottom: spacing.md,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.diffCardContent}>
                    <View>
                      <H3>{diff.label}</H3>
                      <Body color={colors.textSecondary}>{diff.description}</Body>
                    </View>
                    <View style={styles.diffCardRight}>
                      <Badge label={`${completed}/${levels.length}`} />
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

  // ─── Select Level ──────────────────────────────────────────
  if (phase === 'select-level') {
    const levels = getLevelsByDifficulty(selectedDifficulty);
    const diffInfo = DIFFICULTIES.find((d) => d.key === selectedDifficulty);
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
          {levels.map((level, index) => {
            const isCompleted = completedLevelIds.has(level.id);
            const bestRecord = (records || []).find((r) => r.levelId === level.id);
            return (
              <TouchableOpacity
                key={level.id}
                onPress={() => handleSelectLevel(level, index)}
                activeOpacity={0.7}
              >
                <Card
                  style={[
                    styles.levelCard,
                    {
                      marginBottom: spacing.sm,
                      borderColor: isCompleted ? colors.success : colors.border,
                      borderWidth: isCompleted ? 2 : 1,
                    },
                  ]}
                >
                  <View style={styles.levelCardContent}>
                    <View style={styles.levelCardLeft}>
                      <Body style={{ fontWeight: 'bold' }}>
                        レベル {index + 1}
                      </Body>
                      {isCompleted && bestRecord && (
                        <Caption color={colors.textSecondary}>
                          {bestRecord.moves}手でクリア
                        </Caption>
                      )}
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

  // ─── Completed ─────────────────────────────────────────────
  if (phase === 'completed') {
    const diffInfo = DIFFICULTIES.find((d) => d.key === selectedDifficulty);
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.lg, justifyContent: 'center' }]}>
          <View style={styles.completedContent}>
            <Ionicons name="trophy" size={64} color={colors.primary} />
            <H2 style={{ marginTop: spacing.lg, textAlign: 'center' }}>クリア！</H2>
            <H3
              style={{
                marginTop: spacing.md,
                textAlign: 'center',
                color: colors.primary,
              }}
            >
              {diffInfo?.label} レベル {currentLevelIndex + 1}
            </H3>
            <Body
              color={colors.textSecondary}
              style={{ marginTop: spacing.md, textAlign: 'center' }}
            >
              {gameState?.moveCount}手でクリア
            </Body>
          </View>
          <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
            <Button title="次のレベル" onPress={handleNextLevel} />
            <Button title="レベル選択に戻る" onPress={handleBackToLevelList} variant="outline" />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // ─── Playing ───────────────────────────────────────────────
  if (!currentLevel || !gameState) return null;

  const screenWidth = Dimensions.get('window').width;
  const gridPadding = spacing.lg * 2;
  const cellSize = Math.floor((screenWidth - gridPadding - 16) / currentLevel.size);
  const gridSize = cellSize * currentLevel.size;

  const filledCount = totalNonBlocked(currentLevel) - countEmpty(gameState.grid);
  const totalCells = totalNonBlocked(currentLevel);

  return (
    <ScreenWrapper>
      <ScrollView style={[styles.container, { padding: spacing.sm }]}>
        {/* Top bar */}
        <View style={[styles.topBar, { marginBottom: spacing.sm, paddingHorizontal: spacing.sm }]}>
          <TouchableOpacity onPress={handleBackToLevelList}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Body style={{ fontWeight: 'bold' }}>
            {filledCount}/{totalCells} マス
          </Body>
          <Body style={{ fontWeight: 'bold' }}>
            {gameState.moveCount}手
          </Body>
          <View style={styles.topBarRight}>
            <TouchableOpacity onPress={handleUndo} style={{ marginRight: spacing.md }}>
              <Ionicons
                name="arrow-undo"
                size={24}
                color={gameState.moveHistory.length > 0 ? colors.text : colors.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReset}>
              <Ionicons name="refresh" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hint display */}
        {showHints && hintMoves.length > 0 && (
          <View
            style={[
              styles.hintBar,
              { backgroundColor: colors.surface, padding: spacing.sm, marginBottom: spacing.sm, marginHorizontal: spacing.sm, borderRadius: 8 },
            ]}
          >
            <Caption color={colors.textSecondary}>
              ヒント（最初の3手）：{hintMoves.map((m) => {
                switch (m) {
                  case 'up': return '上';
                  case 'down': return '下';
                  case 'left': return '左';
                  case 'right': return '右';
                }
              }).join(' → ')}
            </Caption>
          </View>
        )}

        {/* Grid */}
        <View
          style={[styles.gridContainer, { alignSelf: 'center' }]}
          {...panResponder.panHandlers}
        >
          <View
            style={[
              styles.grid,
              {
                width: gridSize,
                height: gridSize,
                borderColor: colors.border,
                borderWidth: 2,
                borderRadius: 4,
              },
            ]}
          >
            {gameState.grid.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.gridRow}>
                {row.map((cell, colIdx) => {
                  const isCurrentPos =
                    gameState.position[0] === rowIdx && gameState.position[1] === colIdx;

                  let cellBg = colors.surface;
                  if (cell === 'blocked') {
                    cellBg = colors.textMuted;
                  } else if (cell === 'filled') {
                    cellBg = isCurrentPos ? colors.primary : colors.primaryLight;
                  }

                  return (
                    <View
                      key={colIdx}
                      style={[
                        styles.cell,
                        {
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: cellBg,
                          borderColor: colors.border,
                          borderWidth: 0.5,
                        },
                      ]}
                    >
                      {isCurrentPos && (
                        <View
                          style={[
                            styles.currentMarker,
                            {
                              backgroundColor: colors.primary,
                              width: cellSize * 0.5,
                              height: cellSize * 0.5,
                              borderRadius: cellSize * 0.25,
                            },
                          ]}
                        />
                      )}
                      {cell === 'blocked' && (
                        <Ionicons
                          name="close"
                          size={cellSize * 0.5}
                          color={colors.background}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Direction buttons */}
        <View style={[styles.controlsContainer, { marginTop: spacing.lg }]}>
          <View style={styles.controlRow}>
            <View style={styles.controlSpacer} />
            <TouchableOpacity
              style={[styles.dirButton, { backgroundColor: colors.primary }]}
              onPress={() => handleMove('up')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-up" size={28} color={colors.background} />
            </TouchableOpacity>
            <View style={styles.controlSpacer} />
          </View>
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[styles.dirButton, { backgroundColor: colors.primary }]}
              onPress={() => handleMove('left')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={28} color={colors.background} />
            </TouchableOpacity>
            <View style={styles.controlCenter}>
              <Ionicons name="move" size={20} color={colors.textMuted} />
            </View>
            <TouchableOpacity
              style={[styles.dirButton, { backgroundColor: colors.primary }]}
              onPress={() => handleMove('right')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-forward" size={28} color={colors.background} />
            </TouchableOpacity>
          </View>
          <View style={styles.controlRow}>
            <View style={styles.controlSpacer} />
            <TouchableOpacity
              style={[styles.dirButton, { backgroundColor: colors.primary }]}
              onPress={() => handleMove('down')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-down" size={28} color={colors.background} />
            </TouchableOpacity>
            <View style={styles.controlSpacer} />
          </View>
        </View>

        {/* Action buttons */}
        <View style={{ gap: spacing.sm, marginTop: spacing.lg, paddingHorizontal: spacing.md }}>
          <View style={styles.bottomButtons}>
            <Button
              title="元に戻す"
              onPress={handleUndo}
              variant="outline"
              style={{ flex: 1 }}
            />
            <View style={{ width: spacing.sm }} />
            <Button
              title="ヒント（広告）"
              onPress={handleHint}
              variant="outline"
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
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diffCard: {
    padding: 16,
  },
  diffCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diffCardRight: {
    alignItems: 'flex-end',
  },
  levelCard: {
    padding: 12,
  },
  levelCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelCardLeft: {
    flex: 1,
  },
  completedContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  hintBar: {
    alignItems: 'center',
  },
  gridContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    overflow: 'hidden',
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentMarker: {
    position: 'absolute',
  },
  controlsContainer: {
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dirButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  controlSpacer: {
    width: 56,
    height: 56,
    margin: 4,
  },
  controlCenter: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  bottomButtons: {
    flexDirection: 'row',
  },
});
