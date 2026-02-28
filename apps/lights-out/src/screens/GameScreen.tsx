import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { useTheme, H2, H3, Body, Button, Card, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import type { Difficulty, GameResult, LevelDef } from '../types';
import {
  DIFFICULTY_CONFIG,
  toggleCell,
  checkWin,
  countLightsOn,
  buildGridFromSequence,
  getHint,
} from '../utils/lightsOut';
import { getLevelsByDifficulty } from '../data/levels';

type GamePhase = 'select-difficulty' | 'select-level' | 'playing' | 'completed';

const SCREEN_WIDTH = Dimensions.get('window').width;

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();

  const [history, setHistory] = useLocalStorage<GameResult[]>('lightsout_history', []);
  const [phase, setPhase] = useState<GamePhase>('select-difficulty');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [currentLevel, setCurrentLevel] = useState<LevelDef | null>(null);
  const [grid, setGrid] = useState<boolean[][]>([]);
  const [moves, setMoves] = useState(0);
  const [hintCell, setHintCell] = useState<[number, number] | null>(null);

  // Animation refs for cell flash
  const flashAnims = useRef<Animated.Value[][]>([]);

  const initFlashAnims = useCallback((size: number) => {
    flashAnims.current = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => new Animated.Value(0))
    );
  }, []);

  const handleReward = useCallback(() => {
    if (phase !== 'playing' || grid.length === 0) return;
    const hint = getHint(grid);
    if (hint) {
      setHintCell(hint);
      Alert.alert(
        'ヒント',
        `セル (${hint[0] + 1}行, ${hint[1] + 1}列) を押してみましょう`
      );
    } else {
      Alert.alert('ヒント', '解が見つかりませんでした');
    }
  }, [phase, grid]);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(handleReward);

  const completedLevelIds = (history ?? []).map((r) => r.levelId);

  const flashCells = useCallback(
    (targets: [number, number][], size: number) => {
      if (flashAnims.current.length !== size) return;
      const animations = targets
        .filter(([r, c]) => r >= 0 && r < size && c >= 0 && c < size)
        .map(([r, c]) =>
          Animated.sequence([
            Animated.timing(flashAnims.current[r][c], {
              toValue: 1,
              duration: 100,
              useNativeDriver: false,
            }),
            Animated.timing(flashAnims.current[r][c], {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }),
          ])
        );
      Animated.parallel(animations).start();
    },
    []
  );

  const saveResult = useCallback(
    (level: LevelDef, moveCount: number) => {
      const result: GameResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        levelId: level.id,
        levelName: level.name,
        difficulty: level.difficulty,
        moves: moveCount,
        gridSize: level.size,
      };
      setHistory((prev) => [result, ...(prev ?? [])]);
      trackAction();
    },
    [setHistory, trackAction]
  );

  const handleSelectDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    setPhase('select-level');
  };

  const handleSelectLevel = (level: LevelDef) => {
    setCurrentLevel(level);
    const newGrid = buildGridFromSequence(level.size, level.toggleSequence);
    setGrid(newGrid);
    setMoves(0);
    setHintCell(null);
    initFlashAnims(level.size);
    setPhase('playing');
  };

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (phase !== 'playing') return;

      const size = grid.length;
      const newGrid = toggleCell(grid, row, col);
      setGrid(newGrid);
      setMoves((prev) => prev + 1);
      setHintCell(null);

      // Flash toggled cells
      const targets: [number, number][] = [
        [row, col],
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ];
      flashCells(targets, size);

      // Check win
      if (checkWin(newGrid)) {
        const finalMoves = moves + 1;
        setPhase('completed');
        saveResult(currentLevel!, finalMoves);
        setTimeout(() => {
          Alert.alert(
            'クリア！',
            `「${currentLevel!.name}」を${finalMoves}手でクリアしました！`,
            [
              {
                text: '次のレベル',
                onPress: () => handleNextLevel(),
              },
              {
                text: 'レベル選択',
                onPress: () => setPhase('select-level'),
              },
            ]
          );
        }, 300);
      }
    },
    [grid, phase, moves, currentLevel, flashCells, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    if (!currentLevel) return;
    const levels = getLevelsByDifficulty(currentLevel.difficulty);
    const currentIdx = levels.findIndex((l) => l.id === currentLevel.id);
    if (currentIdx < levels.length - 1) {
      handleSelectLevel(levels[currentIdx + 1]);
    } else {
      setPhase('select-level');
    }
  }, [currentLevel]);

  const handleRestart = useCallback(() => {
    if (!currentLevel) return;
    const newGrid = buildGridFromSequence(currentLevel.size, currentLevel.toggleSequence);
    setGrid(newGrid);
    setMoves(0);
    setHintCell(null);
    initFlashAnims(currentLevel.size);
    setPhase('playing');
  }, [currentLevel, initFlashAnims]);

  const handleHint = useCallback(() => {
    if (phase !== 'playing') return;
    if (rewardedLoaded) {
      showRewardedAd();
    } else {
      Alert.alert('ヒント', '広告の準備ができていません。少々お待ちください。');
    }
  }, [phase, rewardedLoaded, showRewardedAd]);

  const handleBackToLevels = () => {
    setPhase('select-level');
  };

  const handleBackToDifficulty = () => {
    setPhase('select-difficulty');
  };

  const gridSize = grid.length;
  const maxGridWidth = SCREEN_WIDTH - spacing.lg * 2 - 8;
  const cellSize = gridSize > 0 ? Math.floor(maxGridWidth / gridSize) : 40;
  const lightsOn = grid.length > 0 ? countLightsOn(grid) : 0;

  // --- Render: Difficulty Selection ---
  if (phase === 'select-difficulty') {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.lg }]}>
          <H2 align="center" style={{ marginBottom: spacing.xl }}>
            難易度を選択
          </H2>
          <View style={{ gap: spacing.md }}>
            {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => {
              const config = DIFFICULTY_CONFIG[d];
              const levels = getLevelsByDifficulty(d);
              const cleared = levels.filter((l) => completedLevelIds.includes(l.id)).length;
              return (
                <Card key={d} style={{ padding: spacing.lg }}>
                  <TouchableOpacity onPress={() => handleSelectDifficulty(d)}>
                    <View style={styles.difficultyCard}>
                      <View>
                        <H3>{config.label}</H3>
                        <Body color={colors.textSecondary}>
                          {cleared}/{levels.length} クリア
                        </Body>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={24}
                        color={colors.textSecondary}
                      />
                    </View>
                  </TouchableOpacity>
                </Card>
              );
            })}
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // --- Render: Level Selection ---
  if (phase === 'select-level') {
    const levels = getLevelsByDifficulty(difficulty);
    return (
      <ScreenWrapper>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
          <View style={[styles.levelHeader, { marginBottom: spacing.md }]}>
            <TouchableOpacity onPress={handleBackToDifficulty}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <H2>{DIFFICULTY_CONFIG[difficulty].label}</H2>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.levelGrid}>
            {levels.map((level, index) => {
              const cleared = completedLevelIds.includes(level.id);
              return (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.levelButton,
                    {
                      backgroundColor: cleared ? colors.primary : colors.surface,
                      borderColor: colors.border,
                      borderRadius: spacing.sm,
                      padding: spacing.md,
                      margin: spacing.xs,
                    },
                  ]}
                  onPress={() => handleSelectLevel(level)}
                >
                  <Body
                    color={cleared ? '#fff' : colors.text}
                    style={{ fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}
                  >
                    {index + 1}
                  </Body>
                  <Body
                    color={cleared ? '#fff' : colors.textSecondary}
                    style={{ fontSize: 11, textAlign: 'center' }}
                  >
                    {level.name}
                  </Body>
                  {cleared && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#fff"
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

  // --- Render: Playing / Completed ---
  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        {/* Top bar */}
        <View style={[styles.topBar, { marginBottom: spacing.sm }]}>
          <TouchableOpacity onPress={handleBackToLevels}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Body style={{ fontWeight: 'bold' }}>
              {currentLevel?.name ?? ''}
            </Body>
            <Body color={colors.textSecondary} style={{ fontSize: 12 }}>
              {DIFFICULTY_CONFIG[difficulty].label}
            </Body>
          </View>
          <TouchableOpacity onPress={handleRestart}>
            <Ionicons name="refresh" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Status bar */}
        <View
          style={[
            styles.statusBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: spacing.xs,
              padding: spacing.sm,
              marginBottom: spacing.sm,
            },
          ]}
        >
          <View style={styles.statusItem}>
            <Ionicons name="hand-left-outline" size={18} color={colors.textSecondary} />
            <H2 style={{ marginLeft: 4 }}>{moves}</H2>
            <Body color={colors.textSecondary} style={{ marginLeft: 4, fontSize: 12 }}>
              手
            </Body>
          </View>

          {phase === 'completed' && (
            <Badge label="クリア！" />
          )}

          <View style={styles.statusItem}>
            <Ionicons name="bulb-outline" size={18} color={colors.textSecondary} />
            <H2 style={{ marginLeft: 4 }}>{lightsOn}</H2>
            <Body color={colors.textSecondary} style={{ marginLeft: 4, fontSize: 12 }}>
              残
            </Body>
          </View>
        </View>

        {/* Grid */}
        <View style={styles.gridContainer}>
          <View
            style={[
              styles.grid,
              {
                borderColor: colors.border,
                borderWidth: 2,
                borderRadius: spacing.xs,
                overflow: 'hidden',
              },
            ]}
          >
            {grid.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((isOn, colIndex) => {
                  const isHint =
                    hintCell !== null &&
                    hintCell[0] === rowIndex &&
                    hintCell[1] === colIndex;

                  const flashAnim =
                    flashAnims.current[rowIndex]?.[colIndex];

                  const animatedBg = flashAnim
                    ? flashAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          isOn ? '#FFD700' : colors.surface,
                          '#FFFFFF',
                        ],
                      })
                    : undefined;

                  return (
                    <TouchableOpacity
                      key={`${rowIndex}-${colIndex}`}
                      onPress={() => handleCellPress(rowIndex, colIndex)}
                      activeOpacity={0.7}
                      disabled={phase === 'completed'}
                    >
                      <Animated.View
                        style={[
                          styles.cell,
                          {
                            width: cellSize,
                            height: cellSize,
                            backgroundColor: animatedBg ?? (isOn ? '#FFD700' : colors.surface),
                            borderColor: colors.border,
                          },
                          isHint && {
                            borderColor: colors.primary,
                            borderWidth: 3,
                          },
                        ]}
                      >
                        {isOn && (
                          <Ionicons
                            name="bulb"
                            size={Math.max(cellSize * 0.4, 12)}
                            color="#B8860B"
                          />
                        )}
                      </Animated.View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Bottom buttons */}
        <View style={[styles.bottomBar, { marginTop: spacing.sm, gap: spacing.sm }]}>
          <Button
            title="ヒント (広告)"
            onPress={handleHint}
            variant="outline"
            size="sm"
            disabled={phase !== 'playing'}
          />
          <Button
            title="やり直す"
            onPress={handleRestart}
            variant="ghost"
            size="sm"
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  bottomBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  difficultyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  levelButton: {
    width: 80,
    alignItems: 'center',
    borderWidth: 1,
  },
});
