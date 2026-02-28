import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, H2, H3, Body, Caption, Button, Card, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { puzzles, getPuzzlesByDifficulty } from '../data/puzzles';
import type { Puzzle } from '../data/puzzles';

type Difficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'select' | 'playing' | 'cleared';

interface HistoryRecord {
  puzzleId: string;
  puzzleName: string;
  difficulty: Difficulty;
  time: number;
  date: string;
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '初級',
  medium: '中級',
  hard: '上級',
};

const BOARD_PADDING = 28;
const NODE_RADIUS = 16;

export function GameScreen() {
  const { colors, spacing, radius } = useTheme();
  const { trackAction } = useInterstitialAd();
  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(() => {
    revealHint();
  });

  const [history, setHistory] = useLocalStorage<HistoryRecord[]>('connect-dots-history', []);
  const [completedIds, setCompletedIds] = useLocalStorage<string[]>('connect-dots-completed', []);

  const [phase, setPhase] = useState<GamePhase>('select');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);

  // Game state
  const [visitedPath, setVisitedPath] = useState<number[]>([]);
  const [usedEdges, setUsedEdges] = useState<Set<string>>(new Set());
  const [hintNode, setHintNode] = useState<number | null>(null);

  // Timer
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const screenWidth = Dimensions.get('window').width;
  const boardSize = screenWidth - BOARD_PADDING * 2;

  const difficultyPuzzles = useMemo(
    () => getPuzzlesByDifficulty(selectedDifficulty),
    [selectedDifficulty],
  );

  const edgeKey = useCallback((a: number, b: number): string => {
    return a < b ? `${a}-${b}` : `${b}-${a}`;
  }, []);

  const totalEdges = currentPuzzle ? currentPuzzle.edges.length : 0;

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = useCallback((ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }, []);

  const startPuzzle = useCallback(
    (puzzle: Puzzle) => {
      setCurrentPuzzle(puzzle);
      setVisitedPath([]);
      setUsedEdges(new Set());
      setHintNode(null);
      setElapsedMs(0);
      setPhase('playing');
      startTimer();
    },
    [startTimer],
  );

  const findEulerianStartNodes = useCallback(
    (puzzle: Puzzle): number[] => {
      const degree: Record<number, number> = {};
      for (let i = 0; i < puzzle.nodes.length; i++) {
        degree[i] = 0;
      }
      for (const [a, b] of puzzle.edges) {
        degree[a]++;
        degree[b]++;
      }
      const oddNodes = Object.entries(degree)
        .filter(([_, d]) => d % 2 !== 0)
        .map(([n]) => parseInt(n, 10));
      if (oddNodes.length === 0) {
        return puzzle.nodes.map((_, i) => i);
      }
      return oddNodes;
    },
    [],
  );

  const revealHint = useCallback(() => {
    if (!currentPuzzle) return;
    const startNodes = findEulerianStartNodes(currentPuzzle);
    if (startNodes.length > 0) {
      setHintNode(startNodes[0]);
    }
  }, [currentPuzzle, findEulerianStartNodes]);

  const handleHint = useCallback(() => {
    if (rewardedLoaded) {
      showRewardedAd();
    } else {
      revealHint();
    }
  }, [rewardedLoaded, showRewardedAd, revealHint]);

  const getAdjacentEdge = useCallback(
    (from: number, to: number): boolean => {
      if (!currentPuzzle) return false;
      const key = edgeKey(from, to);
      if (usedEdges.has(key)) return false;
      return currentPuzzle.edges.some(
        ([a, b]) => edgeKey(a, b) === key,
      );
    },
    [currentPuzzle, usedEdges, edgeKey],
  );

  const handleNodePress = useCallback(
    (nodeIndex: number) => {
      if (phase !== 'playing' || !currentPuzzle) return;

      if (visitedPath.length === 0) {
        setVisitedPath([nodeIndex]);
        return;
      }

      const lastNode = visitedPath[visitedPath.length - 1];
      if (lastNode === nodeIndex) return;

      if (!getAdjacentEdge(lastNode, nodeIndex)) {
        return;
      }

      const key = edgeKey(lastNode, nodeIndex);
      const newUsed = new Set(usedEdges);
      newUsed.add(key);
      setUsedEdges(newUsed);
      const newPath = [...visitedPath, nodeIndex];
      setVisitedPath(newPath);

      if (newUsed.size === totalEdges) {
        stopTimer();
        const finalTime = Date.now() - startTimeRef.current;
        setElapsedMs(finalTime);
        setPhase('cleared');
        trackAction();

        const newRecord: HistoryRecord = {
          puzzleId: currentPuzzle.id,
          puzzleName: currentPuzzle.name,
          difficulty: currentPuzzle.difficulty,
          time: finalTime,
          date: new Date().toISOString(),
        };
        setHistory([newRecord, ...history]);

        if (!completedIds.includes(currentPuzzle.id)) {
          setCompletedIds([...completedIds, currentPuzzle.id]);
        }
      }
    },
    [
      phase,
      currentPuzzle,
      visitedPath,
      usedEdges,
      totalEdges,
      edgeKey,
      getAdjacentEdge,
      stopTimer,
      trackAction,
      history,
      setHistory,
      completedIds,
      setCompletedIds,
    ],
  );

  const handleUndo = useCallback(() => {
    if (visitedPath.length <= 1) {
      setVisitedPath([]);
      setUsedEdges(new Set());
      return;
    }
    const newPath = visitedPath.slice(0, -1);
    const removedFrom = visitedPath[visitedPath.length - 2];
    const removedTo = visitedPath[visitedPath.length - 1];
    const key = edgeKey(removedFrom, removedTo);
    const newUsed = new Set(usedEdges);
    newUsed.delete(key);
    setUsedEdges(newUsed);
    setVisitedPath(newPath);
  }, [visitedPath, usedEdges, edgeKey]);

  const handleReset = useCallback(() => {
    setVisitedPath([]);
    setUsedEdges(new Set());
    setHintNode(null);
    setElapsedMs(0);
    startTimeRef.current = Date.now();
  }, []);

  const handleBack = useCallback(() => {
    stopTimer();
    setPhase('select');
    setCurrentPuzzle(null);
    setVisitedPath([]);
    setUsedEdges(new Set());
    setHintNode(null);
  }, [stopTimer]);

  const getNodeScreenPos = useCallback(
    (node: { x: number; y: number }) => ({
      x: node.x * boardSize + BOARD_PADDING,
      y: node.y * boardSize,
    }),
    [boardSize],
  );

  // Determine which nodes are reachable from current position
  const reachableNodes = useMemo(() => {
    if (!currentPuzzle || visitedPath.length === 0) return new Set<number>();
    const lastNode = visitedPath[visitedPath.length - 1];
    const reachable = new Set<number>();
    for (const [a, b] of currentPuzzle.edges) {
      const key = edgeKey(a, b);
      if (usedEdges.has(key)) continue;
      if (a === lastNode) reachable.add(b);
      if (b === lastNode) reachable.add(a);
    }
    return reachable;
  }, [currentPuzzle, visitedPath, usedEdges, edgeKey]);

  // ==================== RENDER: Puzzle Selector ====================
  if (phase === 'select') {
    const completedCount = completedIds.length;
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.lg }]}>
          <H2 style={{ marginBottom: spacing.sm }}>パズルを選択</H2>
          <Caption color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
            クリア済み: {completedCount} / {puzzles.length}
          </Caption>

          <View style={[styles.difficultyRow, { gap: spacing.sm, marginBottom: spacing.lg }]}>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
              <TouchableOpacity
                key={diff}
                onPress={() => setSelectedDifficulty(diff)}
                style={[
                  styles.difficultyTab,
                  {
                    backgroundColor:
                      selectedDifficulty === diff ? colors.primary : colors.surface,
                    borderRadius: radius.md,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                  },
                ]}
              >
                <Body
                  color={selectedDifficulty === diff ? colors.onPrimary : colors.text}
                  style={{ fontWeight: '600' }}
                >
                  {DIFFICULTY_LABELS[diff]}
                </Body>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {difficultyPuzzles.map((puzzle) => {
              const isCompleted = completedIds.includes(puzzle.id);
              return (
                <TouchableOpacity
                  key={puzzle.id}
                  onPress={() => startPuzzle(puzzle)}
                  style={[
                    styles.puzzleItem,
                    {
                      backgroundColor: colors.surface,
                      borderRadius: radius.md,
                      padding: spacing.md,
                      marginBottom: spacing.sm,
                    },
                  ]}
                >
                  <View style={styles.puzzleItemRow}>
                    <View style={{ flex: 1 }}>
                      <Body style={{ fontWeight: '600' }}>{puzzle.name}</Body>
                      <Caption color={colors.textSecondary}>
                        {puzzle.nodes.length}点 / {puzzle.edges.length}辺
                      </Caption>
                    </View>
                    {isCompleted && (
                      <Badge label="クリア" variant="success" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </ScreenWrapper>
    );
  }

  // ==================== RENDER: Cleared ====================
  if (phase === 'cleared' && currentPuzzle) {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.lg }]}>
          <View style={styles.clearedContent}>
            <Ionicons name="checkmark-circle" size={72} color={colors.primary} />
            <H2 style={{ marginTop: spacing.md }}>クリア!</H2>
            <H3 color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
              {currentPuzzle.name}
            </H3>
            <Card style={[styles.resultCard, { marginTop: spacing.lg, padding: spacing.lg }]}>
              <View style={styles.resultRow}>
                <Body color={colors.textSecondary}>難易度</Body>
                <Body style={{ fontWeight: '600' }}>
                  {DIFFICULTY_LABELS[currentPuzzle.difficulty]}
                </Body>
              </View>
              <View style={[styles.resultRow, { marginTop: spacing.sm }]}>
                <Body color={colors.textSecondary}>タイム</Body>
                <Body style={{ fontWeight: '600' }}>{formatTime(elapsedMs)}</Body>
              </View>
              <View style={[styles.resultRow, { marginTop: spacing.sm }]}>
                <Body color={colors.textSecondary}>辺の数</Body>
                <Body style={{ fontWeight: '600' }}>{currentPuzzle.edges.length}</Body>
              </View>
            </Card>
          </View>
          <View style={{ gap: spacing.sm, paddingBottom: spacing.lg }}>
            <Button title="もう一度" onPress={() => startPuzzle(currentPuzzle)} />
            <Button title="パズル選択に戻る" onPress={handleBack} variant="outline" />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // ==================== RENDER: Playing ====================
  if (!currentPuzzle) return null;

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.md }]}>
        {/* Header */}
        <View style={[styles.header, { marginBottom: spacing.sm }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Body style={{ fontWeight: '600' }}>{currentPuzzle.name}</Body>
            <Caption color={colors.textSecondary}>
              {usedEdges.size} / {totalEdges} 辺
            </Caption>
          </View>
          <Body style={{ fontWeight: '700', minWidth: 56, textAlign: 'right' }}>
            {formatTime(elapsedMs)}
          </Body>
        </View>

        {/* Board */}
        <View
          style={[
            styles.board,
            {
              width: boardSize + BOARD_PADDING * 2,
              height: boardSize,
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
            },
          ]}
        >
          {/* Edges */}
          {currentPuzzle.edges.map(([a, b], idx) => {
            const posA = getNodeScreenPos(currentPuzzle.nodes[a]);
            const posB = getNodeScreenPos(currentPuzzle.nodes[b]);
            const key = edgeKey(a, b);
            const isUsed = usedEdges.has(key);

            const dx = posB.x - posA.x;
            const dy = posB.y - posA.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            return (
              <View
                key={`edge-${idx}`}
                style={[
                  styles.edge,
                  {
                    width: length,
                    left: posA.x,
                    top: posA.y,
                    backgroundColor: isUsed ? colors.primary : colors.border,
                    height: isUsed ? 4 : 2,
                    transform: [{ rotate: `${angle}deg` }],
                    opacity: isUsed ? 1 : 0.5,
                  },
                ]}
              />
            );
          })}

          {/* Path lines (drawn over edges) */}
          {visitedPath.length > 1 &&
            visitedPath.slice(0, -1).map((nodeIdx, i) => {
              const nextIdx = visitedPath[i + 1];
              const posA = getNodeScreenPos(currentPuzzle.nodes[nodeIdx]);
              const posB = getNodeScreenPos(currentPuzzle.nodes[nextIdx]);

              const dx = posB.x - posA.x;
              const dy = posB.y - posA.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);

              return (
                <View
                  key={`path-${i}`}
                  style={[
                    styles.edge,
                    {
                      width: length,
                      left: posA.x,
                      top: posA.y,
                      backgroundColor: colors.primary,
                      height: 4,
                      transform: [{ rotate: `${angle}deg` }],
                      zIndex: 2,
                    },
                  ]}
                />
              );
            })}

          {/* Nodes */}
          {currentPuzzle.nodes.map((node, idx) => {
            const pos = getNodeScreenPos(node);
            const isVisited = visitedPath.includes(idx);
            const isCurrent = visitedPath.length > 0 && visitedPath[visitedPath.length - 1] === idx;
            const isReachable = reachableNodes.has(idx);
            const isHint = hintNode === idx;
            const isStart = visitedPath.length === 0;

            let bgColor = colors.surface;
            let borderColor = colors.border;
            let nodeSize = NODE_RADIUS * 2;

            if (isCurrent) {
              bgColor = colors.primary;
              borderColor = colors.primary;
              nodeSize = NODE_RADIUS * 2.4;
            } else if (isVisited) {
              bgColor = colors.primary;
              borderColor = colors.primary;
            } else if (isReachable) {
              bgColor = colors.surface;
              borderColor = colors.primary;
            } else if (isHint && isStart) {
              bgColor = colors.warning ?? '#FFA500';
              borderColor = colors.warning ?? '#FFA500';
            }

            return (
              <TouchableOpacity
                key={`node-${idx}`}
                onPress={() => handleNodePress(idx)}
                activeOpacity={0.7}
                style={[
                  styles.node,
                  {
                    width: nodeSize,
                    height: nodeSize,
                    borderRadius: nodeSize / 2,
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                    borderWidth: 3,
                    left: pos.x - nodeSize / 2,
                    top: pos.y - nodeSize / 2,
                  },
                ]}
              >
                {isCurrent && (
                  <View
                    style={[
                      styles.currentIndicator,
                      {
                        width: nodeSize * 1.5,
                        height: nodeSize * 1.5,
                        borderRadius: nodeSize * 0.75,
                        borderColor: colors.primary,
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Controls */}
        <View style={[styles.controls, { gap: spacing.sm, marginTop: spacing.md }]}>
          <View style={[styles.controlRow, { gap: spacing.sm }]}>
            <Button
              title="戻す"
              onPress={handleUndo}
              variant="outline"
              size="sm"
              disabled={visitedPath.length === 0}
            />
            <Button title="リセット" onPress={handleReset} variant="outline" size="sm" />
            <Button
              title="ヒント"
              onPress={handleHint}
              variant="ghost"
              size="sm"
              disabled={visitedPath.length > 0}
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
  },
  board: {
    alignSelf: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  edge: {
    position: 'absolute',
    transformOrigin: 'left center',
    zIndex: 1,
  },
  node: {
    position: 'absolute',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  currentIndicator: {
    position: 'absolute',
    borderWidth: 2,
    opacity: 0.3,
  },
  controls: {
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  difficultyRow: {
    flexDirection: 'row',
  },
  difficultyTab: {
    flex: 1,
    alignItems: 'center',
  },
  puzzleItem: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  puzzleItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: {
    width: '100%',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
