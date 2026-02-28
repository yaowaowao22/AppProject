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
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import {
  PipeGrid,
  PipeCell,
  Difficulty,
  GameResult,
  DIFFICULTY_CONFIG,
  buildGridFromLevel,
  scrambleGrid,
  rotatePipe,
  findConnectedCells,
  isLevelSolved,
  formatTime,
  getHint,
} from '../utils/pipePuzzle';
import { levels, getLevelsByDifficulty, getLevelById } from '../data/levels';

type GamePhase = 'select' | 'level-select' | 'playing' | 'completed';

const screenWidth = Dimensions.get('window').width;

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();

  const [results, setResults] = useLocalStorage<GameResult[]>(
    'pipe-puzzle-results',
    []
  );

  const [phase, setPhase] = useState<GamePhase>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [grid, setGrid] = useState<PipeGrid | null>(null);
  const [solvedGrid, setSolvedGrid] = useState<PipeGrid | null>(null);
  const [taps, setTaps] = useState(0);
  const [connectedCells, setConnectedCells] = useState<Set<string>>(new Set());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedTaps, setCompletedTaps] = useState(0);
  const [completedTime, setCompletedTime] = useState(0);
  const [pendingComplete, setPendingComplete] = useState<PipeGrid | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const tapsRef = useRef(0);

  const handleReward = useCallback(() => {
    if (!grid || !solvedGrid) return;
    const hint = getHint(grid, solvedGrid);
    if (hint) {
      const newCells = grid.cells.map((row) => row.map((cell) => ({ ...cell })));
      let cell = newCells[hint.row][hint.col];
      for (let i = 0; i < hint.rotations; i++) {
        cell = rotatePipe(cell);
      }
      newCells[hint.row][hint.col] = cell;
      const newGrid = { ...grid, cells: newCells };
      setGrid(newGrid);
      setTaps((prev) => {
        const next = prev + hint.rotations;
        tapsRef.current = next;
        return next;
      });
      const connected = findConnectedCells(newGrid);
      setConnectedCells(connected);
      if (isLevelSolved(newGrid)) {
        setPendingComplete(newGrid);
      }
    }
  }, [grid, solvedGrid]);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(
    handleReward
  );

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setElapsedSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const clearedLevelIds = new Set((results || []).map((r) => r.levelId));

  const handleLevelComplete = useCallback(
    (completedGrid: PipeGrid, currentTaps: number) => {
      stopTimer();
      const finalTime = Math.floor(
        (Date.now() - startTimeRef.current) / 1000
      );
      setCompletedTime(finalTime);
      setCompletedTaps(currentTaps);

      const connected = findConnectedCells(completedGrid);
      setConnectedCells(connected);

      const levelDef = getLevelById(currentLevelId);
      const result: GameResult = {
        id: Date.now().toString(),
        levelId: currentLevelId,
        difficulty: levelDef?.difficulty || difficulty,
        taps: currentTaps,
        timeSeconds: finalTime,
        date: new Date().toISOString(),
      };
      setResults([result, ...(results || [])]);
      trackAction();
      setPendingComplete(null);
      setPhase('completed');
    },
    [currentLevelId, difficulty, results, setResults, stopTimer, trackAction]
  );

  useEffect(() => {
    if (pendingComplete) {
      handleLevelComplete(pendingComplete, tapsRef.current);
    }
  }, [pendingComplete, handleLevelComplete]);

  const startLevel = (levelId: number) => {
    const levelDef = getLevelById(levelId);
    if (!levelDef) return;

    const solved = buildGridFromLevel(levelDef);
    setSolvedGrid(solved);

    const scrambled = scrambleGrid(
      buildGridFromLevel(levelDef),
      levelDef.scrambleCount
    );
    setGrid(scrambled);
    setCurrentLevelId(levelId);
    setTaps(0);
    tapsRef.current = 0;
    setPendingComplete(null);
    setConnectedCells(findConnectedCells(scrambled));
    setPhase('playing');
    startTimer();
  };

  const handleCellTap = (row: number, col: number) => {
    if (!grid || phase !== 'playing') return;
    const cell = grid.cells[row][col];
    if (cell.fixed || cell.type === 'empty' || cell.type === 'cross') return;

    const newCells = grid.cells.map((r) => r.map((c) => ({ ...c })));
    newCells[row][col] = rotatePipe(newCells[row][col]);
    const newGrid = { ...grid, cells: newCells };
    setGrid(newGrid);
    const newTaps = taps + 1;
    setTaps(newTaps);
    tapsRef.current = newTaps;

    const connected = findConnectedCells(newGrid);
    setConnectedCells(connected);

    if (isLevelSolved(newGrid)) {
      handleLevelComplete(newGrid, newTaps);
    }
  };

  const handleCheckConnection = () => {
    if (!grid) return;
    if (isLevelSolved(grid)) {
      handleLevelComplete(grid, taps);
    } else {
      Alert.alert('未接続', '水はまだドレインまで届いていません。パイプを回転させてつなげましょう！');
    }
  };

  const handleHint = () => {
    if (rewardedLoaded) {
      showRewardedAd();
    } else {
      handleReward();
    }
  };

  const handleBackToSelect = () => {
    stopTimer();
    setPhase('select');
    setGrid(null);
    setSolvedGrid(null);
  };

  const handleBackToLevelSelect = () => {
    stopTimer();
    setPhase('level-select');
    setGrid(null);
    setSolvedGrid(null);
  };

  // ========== Difficulty Select Phase ==========
  if (phase === 'select') {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    return (
      <ScreenWrapper>
        <ScrollView style={[styles.container, { padding: spacing.lg }]}>
          <H2 style={{ marginBottom: spacing.xl }}>難易度を選択</H2>
          {difficulties.map((diff) => {
            const config = DIFFICULTY_CONFIG[diff];
            const diffLevels = getLevelsByDifficulty(diff);
            const diffCleared = diffLevels.filter((l) =>
              clearedLevelIds.has(l.id)
            ).length;

            return (
              <TouchableOpacity
                key={diff}
                onPress={() => {
                  setDifficulty(diff);
                  setPhase('level-select');
                }}
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
                      <Caption
                        style={{ color: colors.textMuted, marginTop: 2 }}
                      >
                        {diffCleared > 0
                          ? `クリア ${diffCleared}/${diffLevels.length}`
                          : '未クリア'}
                      </Caption>
                    </View>
                    <Badge label={config.size} />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ScreenWrapper>
    );
  }

  // ========== Level Select Phase ==========
  if (phase === 'level-select') {
    const diffLevels = getLevelsByDifficulty(difficulty);
    const config = DIFFICULTY_CONFIG[difficulty];
    return (
      <ScreenWrapper>
        <ScrollView style={[styles.container, { padding: spacing.lg }]}>
          <View style={[styles.topBar, { marginBottom: spacing.md }]}>
            <TouchableOpacity onPress={() => setPhase('select')}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <H2>{config.label}</H2>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.levelGrid}>
            {diffLevels.map((level) => {
              const isCleared = clearedLevelIds.has(level.id);
              return (
                <TouchableOpacity
                  key={level.id}
                  onPress={() => startLevel(level.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.levelButton,
                    {
                      backgroundColor: isCleared
                        ? colors.primary + '20'
                        : colors.surface,
                      borderColor: isCleared
                        ? colors.primary
                        : colors.border,
                      borderWidth: 1,
                      borderRadius: 12,
                      margin: spacing.xs,
                    },
                  ]}
                >
                  <Body
                    style={{
                      fontWeight: 'bold',
                      color: isCleared ? colors.primary : colors.text,
                      fontSize: 18,
                    }}
                  >
                    {level.id}
                  </Body>
                  {isCleared && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.primary}
                      style={{ marginTop: 2 }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  // ========== Completed Phase ==========
  if (phase === 'completed') {
    const nextLevelId = currentLevelId < levels.length ? currentLevelId + 1 : null;

    return (
      <ScreenWrapper>
        <View
          style={[
            styles.container,
            { padding: spacing.lg, justifyContent: 'center' },
          ]}
        >
          <View style={styles.completedContent}>
            <Ionicons name="water" size={64} color={colors.primary} />
            <H2 style={{ marginTop: spacing.lg, textAlign: 'center' }}>
              クリア！
            </H2>
            <H3
              style={{
                marginTop: spacing.md,
                textAlign: 'center',
                color: colors.primary,
              }}
            >
              レベル {currentLevelId}
            </H3>
            <Body
              color={colors.textSecondary}
              style={{ marginTop: spacing.md, textAlign: 'center' }}
            >
              タイム: {formatTime(completedTime)}
            </Body>
            <Body
              color={colors.textSecondary}
              style={{ textAlign: 'center' }}
            >
              タップ数: {completedTaps}回
            </Body>
          </View>
          <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
            {nextLevelId && (
              <Button
                title="次のレベルへ"
                onPress={() => startLevel(nextLevelId)}
              />
            )}
            <Button
              title="レベル選択に戻る"
              onPress={handleBackToLevelSelect}
              variant="outline"
            />
            <Button
              title="難易度選択に戻る"
              onPress={handleBackToSelect}
              variant="ghost"
            />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // ========== Playing Phase ==========
  if (!grid) return null;

  const gridPadding = spacing.sm * 2;
  const maxGridWidth = screenWidth - gridPadding * 2 - spacing.sm * 2;
  const cellSize = Math.floor(maxGridWidth / grid.cols);
  const gridWidth = cellSize * grid.cols;

  const waterColor = '#4A90D9';
  const pipeGray = '#999999';

  const renderPipeCell = (cell: PipeCell, row: number, col: number) => {
    const key = `${row},${col}`;
    const isConnected = connectedCells.has(key);
    const isSource = cell.type === 'source';
    const isDrain = cell.type === 'drain';
    const isEmpty = cell.type === 'empty';

    const pipeColor = isConnected ? waterColor : pipeGray;
    const bgColor = isSource
      ? colors.primary + '15'
      : isDrain
        ? colors.error + '15'
        : colors.background;

    const lineThickness = Math.max(cellSize * 0.2, 3);
    const halfCell = cellSize / 2;

    return (
      <TouchableOpacity
        key={key}
        onPress={() => handleCellTap(row, col)}
        activeOpacity={cell.fixed || isEmpty ? 1 : 0.6}
        style={[
          styles.cell,
          {
            width: cellSize,
            height: cellSize,
            backgroundColor: bgColor,
            borderColor: colors.border,
            borderWidth: 0.5,
          },
        ]}
      >
        {isEmpty ? null : (
          <View style={styles.pipeContainer}>
            {/* Center dot */}
            {(cell.connections.top ||
              cell.connections.right ||
              cell.connections.bottom ||
              cell.connections.left) && (
              <View
                style={{
                  position: 'absolute',
                  width: lineThickness,
                  height: lineThickness,
                  borderRadius: lineThickness / 2,
                  backgroundColor: pipeColor,
                  top: halfCell - lineThickness / 2,
                  left: halfCell - lineThickness / 2,
                }}
              />
            )}
            {/* Top connection */}
            {cell.connections.top && (
              <View
                style={{
                  position: 'absolute',
                  width: lineThickness,
                  height: halfCell,
                  backgroundColor: pipeColor,
                  top: 0,
                  left: halfCell - lineThickness / 2,
                }}
              />
            )}
            {/* Bottom connection */}
            {cell.connections.bottom && (
              <View
                style={{
                  position: 'absolute',
                  width: lineThickness,
                  height: halfCell,
                  backgroundColor: pipeColor,
                  bottom: 0,
                  left: halfCell - lineThickness / 2,
                }}
              />
            )}
            {/* Left connection */}
            {cell.connections.left && (
              <View
                style={{
                  position: 'absolute',
                  height: lineThickness,
                  width: halfCell,
                  backgroundColor: pipeColor,
                  top: halfCell - lineThickness / 2,
                  left: 0,
                }}
              />
            )}
            {/* Right connection */}
            {cell.connections.right && (
              <View
                style={{
                  position: 'absolute',
                  height: lineThickness,
                  width: halfCell,
                  backgroundColor: pipeColor,
                  top: halfCell - lineThickness / 2,
                  right: 0,
                }}
              />
            )}
            {/* Source/Drain label */}
            {(isSource || isDrain) && (
              <Text
                style={[
                  styles.cellLabel,
                  {
                    color: isSource ? colors.primary : colors.error,
                    fontSize: Math.max(cellSize * 0.3, 10),
                  },
                ]}
              >
                {isSource ? 'S' : 'D'}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
          <TouchableOpacity onPress={handleBackToLevelSelect}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Body style={{ fontWeight: 'bold' }}>
            レベル {currentLevelId}
          </Body>
          <TouchableOpacity
            onPress={() =>
              Alert.alert('リセット', 'パズルをリセットしますか？', [
                { text: 'キャンセル', style: 'cancel' },
                {
                  text: 'リセット',
                  onPress: () => startLevel(currentLevelId),
                },
              ])
            }
          >
            <Ionicons
              name="refresh"
              size={24}
              color={colors.textSecondary}
            />
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
              {formatTime(elapsedSeconds)}
            </Body>
          </View>
          <View style={styles.statItem}>
            <Ionicons
              name="finger-print-outline"
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
              {taps}回
            </Body>
          </View>
        </View>

        {/* Pipe grid */}
        <View
          style={[
            styles.gridContainer,
            {
              width: gridWidth + 2,
              borderColor: colors.text,
              borderWidth: 1,
              backgroundColor: colors.background,
              borderRadius: 4,
            },
          ]}
        >
          {grid.cells.map((row, rowIdx) => (
            <View key={rowIdx} style={{ flexDirection: 'row' }}>
              {row.map((cell, colIdx) => renderPipeCell(cell, rowIdx, colIdx))}
            </View>
          ))}
        </View>

        {/* Action buttons */}
        <View
          style={{
            marginTop: spacing.md,
            paddingHorizontal: spacing.lg,
            width: '100%',
            gap: spacing.sm,
          }}
        >
          <Button
            title="接続チェック"
            onPress={handleCheckConnection}
          />
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
  gridContainer: {
    overflow: 'hidden',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pipeContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cellLabel: {
    position: 'absolute',
    fontWeight: 'bold',
    top: 2,
    left: 2,
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
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  levelButton: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
