import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Text,
} from 'react-native';
import { useTheme, H2, H3, Body, Button, Card, Badge, Caption } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useTimer } from '@massapp/hooks';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import {
  Maze,
  Difficulty,
  MazeResult,
  DIFFICULTY_CONFIG,
  generateMaze,
  getMazeSize,
  canMove,
  getNextPosition,
  findShortestPath,
  formatTime,
} from '../utils/mazeGenerator';

type GamePhase = 'select' | 'playing' | 'completed';

const screenWidth = Dimensions.get('window').width;

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();
  const { seconds, start, stop, reset } = useTimer();

  const [results, setResults] = useLocalStorage<MazeResult[]>('maze-results', []);

  const [phase, setPhase] = useState<GamePhase>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [maze, setMaze] = useState<Maze | null>(null);
  const [playerPos, setPlayerPos] = useState<[number, number]>([0, 0]);
  const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set(['0,0']));
  const [moves, setMoves] = useState(0);
  const [completedTime, setCompletedTime] = useState(0);
  const [hintPath, setHintPath] = useState<Set<string> | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleReward = useCallback(() => {
    if (!maze) return;
    const path = findShortestPath(maze);
    const pathSet = new Set(path.map(([r, c]) => `${r},${c}`));
    setHintPath(pathSet);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => {
      setHintPath(null);
    }, 2000);
  }, [maze]);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(handleReward);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  const startGame = (diff: Difficulty) => {
    const size = getMazeSize(diff);
    const newMaze = generateMaze(size, size);
    setDifficulty(diff);
    setMaze(newMaze);
    setPlayerPos([0, 0]);
    setVisitedCells(new Set(['0,0']));
    setMoves(0);
    setHintPath(null);
    setPhase('playing');
    reset();
    start();
  };

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!maze || phase !== 'playing') return;
    const [row, col] = playerPos;

    if (canMove(maze, row, col, direction)) {
      const [nr, nc] = getNextPosition(row, col, direction);
      setPlayerPos([nr, nc]);
      setMoves((prev) => prev + 1);
      setVisitedCells((prev) => {
        const next = new Set(prev);
        next.add(`${nr},${nc}`);
        return next;
      });

      if (nr === maze.rows - 1 && nc === maze.cols - 1) {
        stop();
        setCompletedTime(seconds);
        const result: MazeResult = {
          id: Date.now().toString(),
          difficulty,
          timeSeconds: seconds,
          moves: moves + 1,
          date: new Date().toISOString(),
        };
        setResults((prev) => [result, ...(prev || [])]);
        trackAction();
        setPhase('completed');
      }
    }
  };

  const handleNewMaze = () => {
    Alert.alert('新しい迷路', '現在の迷路をリセットして新しい迷路を生成しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '生成する',
        onPress: () => startGame(difficulty),
      },
    ]);
  };

  const handleHint = () => {
    if (rewardedLoaded) {
      showRewardedAd();
    } else {
      handleReward();
    }
  };

  const handleBackToSelect = () => {
    stop();
    reset();
    setPhase('select');
    setMaze(null);
    setHintPath(null);
  };

  // Difficulty select phase
  if (phase === 'select') {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    return (
      <ScreenWrapper>
        <ScrollView style={[styles.container, { padding: spacing.lg }]}>
          <H2 style={{ marginBottom: spacing.xl }}>難易度を選択</H2>
          {difficulties.map((diff) => {
            const config = DIFFICULTY_CONFIG[diff];
            const bestResults = (results || []).filter(
              (r) => r.difficulty === diff
            );
            const bestTime =
              bestResults.length > 0
                ? Math.min(...bestResults.map((r) => r.timeSeconds))
                : null;
            const clearCount = bestResults.length;

            return (
              <TouchableOpacity
                key={diff}
                onPress={() => startGame(diff)}
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
                      <H3>{config.label}</H3>
                      <Caption style={{ color: colors.textMuted, marginTop: 2 }}>
                        {clearCount > 0
                          ? `クリア ${clearCount}回 | ベスト ${formatTime(bestTime!)}`
                          : '未クリア'}
                      </Caption>
                    </View>
                    <Badge label={`${config.size}x${config.size}`} />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ScreenWrapper>
    );
  }

  // Completed phase
  if (phase === 'completed') {
    const config = DIFFICULTY_CONFIG[difficulty];
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
              ゴール！
            </H2>
            <H3
              style={{
                marginTop: spacing.md,
                textAlign: 'center',
                color: colors.primary,
              }}
            >
              {config.label}
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
              移動回数: {moves}回
            </Body>
          </View>
          <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
            <Button
              title="同じ難易度でもう一度"
              onPress={() => startGame(difficulty)}
            />
            <Button
              title="難易度選択に戻る"
              onPress={handleBackToSelect}
              variant="outline"
            />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // Playing phase
  if (!maze) return null;

  const mazeSize = maze.rows;
  const mazePadding = spacing.sm * 2;
  const cellSize = Math.floor(
    (screenWidth - mazePadding * 2 - spacing.lg * 2) / mazeSize
  );
  const mazeWidth = cellSize * mazeSize;

  return (
    <ScreenWrapper>
      <ScrollView
        style={[styles.container, { padding: spacing.sm }]}
        contentContainerStyle={{ alignItems: 'center' }}
      >
        {/* Top bar */}
        <View
          style={[
            styles.topBar,
            { marginBottom: spacing.sm, paddingHorizontal: spacing.sm },
          ]}
        >
          <TouchableOpacity onPress={handleBackToSelect}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Body style={{ fontWeight: 'bold' }}>
            {DIFFICULTY_CONFIG[difficulty].label}
          </Body>
          <TouchableOpacity onPress={handleNewMaze}>
            <Ionicons name="refresh" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Stats bar */}
        <View
          style={[
            styles.statsBar,
            {
              marginBottom: spacing.md,
              backgroundColor: colors.surface,
              padding: spacing.sm,
              borderRadius: 8,
            },
          ]}
        >
          <View style={styles.statItem}>
            <Ionicons
              name="time-outline"
              size={16}
              color={colors.primary}
            />
            <Body
              style={{
                marginLeft: 4,
                fontWeight: 'bold',
                color: colors.text,
              }}
            >
              {formatTime(seconds)}
            </Body>
          </View>
          <View style={styles.statItem}>
            <Ionicons
              name="footsteps-outline"
              size={16}
              color={colors.primary}
            />
            <Body
              style={{
                marginLeft: 4,
                fontWeight: 'bold',
                color: colors.text,
              }}
            >
              {moves}歩
            </Body>
          </View>
        </View>

        {/* Maze grid */}
        <View
          style={[
            styles.mazeContainer,
            {
              width: mazeWidth + 2,
              borderColor: colors.text,
              borderWidth: 1,
              backgroundColor: colors.background,
            },
          ]}
        >
          {maze.cells.map((row, rowIdx) => (
            <View key={rowIdx} style={{ flexDirection: 'row' }}>
              {row.map((cell, colIdx) => {
                const isPlayer =
                  playerPos[0] === rowIdx && playerPos[1] === colIdx;
                const isStart = rowIdx === 0 && colIdx === 0;
                const isGoal =
                  rowIdx === maze.rows - 1 && colIdx === maze.cols - 1;
                const isVisited = visitedCells.has(`${rowIdx},${colIdx}`);
                const isHintPath =
                  hintPath !== null && hintPath.has(`${rowIdx},${colIdx}`);

                let bgColor = colors.background;
                if (isHintPath) {
                  bgColor = colors.warning + '40';
                } else if (isVisited && !isPlayer) {
                  bgColor = colors.primary + '20';
                }
                if (isStart && !isPlayer) {
                  bgColor = colors.success + '30';
                }
                if (isGoal && !isPlayer) {
                  bgColor = colors.error + '30';
                }

                return (
                  <View
                    key={colIdx}
                    style={[
                      {
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: bgColor,
                        borderTopWidth: cell.walls.top ? 1 : 0,
                        borderRightWidth: cell.walls.right ? 1 : 0,
                        borderBottomWidth: cell.walls.bottom ? 1 : 0,
                        borderLeftWidth: cell.walls.left ? 1 : 0,
                        borderTopColor: colors.text,
                        borderRightColor: colors.text,
                        borderBottomColor: colors.text,
                        borderLeftColor: colors.text,
                        justifyContent: 'center',
                        alignItems: 'center',
                      },
                    ]}
                  >
                    {isPlayer && (
                      <View
                        style={[
                          styles.playerMarker,
                          {
                            width: cellSize * 0.6,
                            height: cellSize * 0.6,
                            borderRadius: cellSize * 0.3,
                            backgroundColor: colors.primary,
                          },
                        ]}
                      />
                    )}
                    {isGoal && !isPlayer && (
                      <Ionicons
                        name="flag"
                        size={Math.max(cellSize * 0.5, 8)}
                        color={colors.error}
                      />
                    )}
                    {isStart && !isPlayer && (
                      <Text
                        style={{
                          fontSize: Math.max(cellSize * 0.4, 6),
                          color: colors.success,
                          fontWeight: 'bold',
                        }}
                      >
                        S
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Direction controls */}
        <View style={[styles.controlsContainer, { marginTop: spacing.lg }]}>
          <View style={styles.controlRow}>
            <View style={styles.controlSpacer} />
            <TouchableOpacity
              onPress={() => handleMove('up')}
              style={[
                styles.controlButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-up" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.controlSpacer} />
          </View>
          <View style={styles.controlRow}>
            <TouchableOpacity
              onPress={() => handleMove('left')}
              style={[
                styles.controlButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.controlSpacer} />
            <TouchableOpacity
              onPress={() => handleMove('right')}
              style={[
                styles.controlButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-forward" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.controlRow}>
            <View style={styles.controlSpacer} />
            <TouchableOpacity
              onPress={() => handleMove('down')}
              style={[
                styles.controlButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-down" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.controlSpacer} />
          </View>
        </View>

        {/* Hint button */}
        <View
          style={{
            marginTop: spacing.md,
            paddingHorizontal: spacing.lg,
            width: '100%',
          }}
        >
          <Button
            title="ヒント（広告を見る）"
            onPress={handleHint}
            variant="outline"
          />
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
    width: '100%',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mazeContainer: {
    overflow: 'hidden',
  },
  playerMarker: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  controlsContainer: {
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 2,
  },
  controlButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  controlSpacer: {
    width: 56,
    height: 56,
    marginHorizontal: 2,
  },
  completedContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  difficultyCard: {
    padding: 16,
  },
  difficultyCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
