import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { useTheme, H2, H3, Body, Button, Card, Caption, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useTimer, useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import {
  createInitialState,
  getOptimalMoves,
  isValidMove,
  moveDisk,
  isComplete,
  getNextOptimalMove,
  formatTime,
  DISK_COLORS,
  DISK_COUNTS,
  type GameState,
  type DiskCount,
} from '../utils/hanoi';

export interface GameResult {
  id: string;
  date: string;
  diskCount: number;
  moves: number;
  optimalMoves: number;
  timeSeconds: number;
}

type Phase = 'setup' | 'playing' | 'completed';

const SCREEN_WIDTH = Dimensions.get('window').width;

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();
  const { seconds, start, stop, reset } = useTimer();

  const [history, setHistory] = useLocalStorage<GameResult[]>('hanoi_history', []);

  const [phase, setPhase] = useState<Phase>('setup');
  const [diskCount, setDiskCount] = useState<DiskCount>(3);
  const [gameState, setGameState] = useState<GameState>(() => createInitialState(3));
  const [moveCount, setMoveCount] = useState(0);
  const [selectedPeg, setSelectedPeg] = useState<number | null>(null);
  const [completedTime, setCompletedTime] = useState(0);

  const shakeAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const handleReward = useCallback(() => {
    if (phase !== 'playing') return;
    setGameState((prev) => {
      const hint = getNextOptimalMove(prev, diskCount);
      if (hint) {
        Alert.alert(
          'ヒント',
          `${hint.from + 1}番目の柱から${hint.to + 1}番目の柱へ移動してください`
        );
      } else {
        Alert.alert('ヒント', '既に完成しています！');
      }
      return prev;
    });
  }, [phase, diskCount]);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(handleReward);

  const handleStartGame = (count: DiskCount) => {
    setDiskCount(count);
    setGameState(createInitialState(count));
    setMoveCount(0);
    setSelectedPeg(null);
    reset();
    start();
    setPhase('playing');
  };

  const shakeAnimation = (pegIndex: number) => {
    Animated.sequence([
      Animated.timing(shakeAnims[pegIndex], {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnims[pegIndex], {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnims[pegIndex], {
        toValue: 6,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnims[pegIndex], {
        toValue: -6,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnims[pegIndex], {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePegPress = (pegIndex: number) => {
    if (phase !== 'playing') return;

    if (selectedPeg === null) {
      if (gameState[pegIndex].length === 0) return;
      setSelectedPeg(pegIndex);
    } else {
      if (selectedPeg === pegIndex) {
        setSelectedPeg(null);
        return;
      }

      if (isValidMove(gameState, selectedPeg, pegIndex)) {
        const newState = moveDisk(gameState, selectedPeg, pegIndex);
        setGameState(newState);
        setMoveCount((prev) => prev + 1);
        setSelectedPeg(null);

        if (isComplete(newState, diskCount)) {
          stop();
          setCompletedTime(seconds);
          const result: GameResult = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            diskCount,
            moves: moveCount + 1,
            optimalMoves: getOptimalMoves(diskCount),
            timeSeconds: seconds,
          };
          setHistory((prev) => [result, ...(prev ?? [])]);
          trackAction();
          setPhase('completed');
        }
      } else {
        shakeAnimation(pegIndex);
        setSelectedPeg(null);
      }
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
    Alert.alert('リセット', '最初からやり直しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'リセット',
        style: 'destructive',
        onPress: () => {
          setGameState(createInitialState(diskCount));
          setMoveCount(0);
          setSelectedPeg(null);
          reset();
          start();
        },
      },
    ]);
  };

  const handleBackToSetup = () => {
    stop();
    reset();
    setPhase('setup');
    setSelectedPeg(null);
  };

  const optimalMoves = getOptimalMoves(diskCount);

  // Setup phase
  if (phase === 'setup') {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.lg }]}>
          <H2 style={{ marginBottom: spacing.xl, textAlign: 'center' }}>
            円盤の数を選択
          </H2>
          <View style={styles.diskSelectContainer}>
            {DISK_COUNTS.map((count) => (
              <TouchableOpacity
                key={count}
                onPress={() => handleStartGame(count)}
                activeOpacity={0.7}
              >
                <Card
                  style={[
                    styles.diskSelectCard,
                    {
                      marginBottom: spacing.md,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.diskSelectCardContent}>
                    <View>
                      <H3>{count}枚</H3>
                      <Caption style={{ color: colors.textSecondary }}>
                        最少手数: {getOptimalMoves(count)}手
                      </Caption>
                    </View>
                    <Ionicons name="play-circle" size={28} color={colors.primary} />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // Completed phase
  if (phase === 'completed') {
    const completed = moveCount;
    const optimal = optimalMoves;
    const isOptimal = completed === optimal;

    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.lg, justifyContent: 'center' }]}>
          <View style={styles.completedContent}>
            <Ionicons
              name="trophy"
              size={64}
              color={isOptimal ? colors.warning : colors.primary}
            />
            <H2 style={{ marginTop: spacing.lg, textAlign: 'center' }}>
              クリア！
            </H2>
            {isOptimal && (
              <Badge
                label="最適解達成！"
                style={{ marginTop: spacing.sm }}
              />
            )}
            <View
              style={[
                styles.resultCard,
                {
                  backgroundColor: colors.surface,
                  marginTop: spacing.lg,
                  padding: spacing.lg,
                  borderRadius: 12,
                },
              ]}
            >
              <View style={[styles.resultRow, { marginBottom: spacing.sm }]}>
                <Body color={colors.textSecondary}>円盤数</Body>
                <Body style={{ fontWeight: 'bold' }}>{diskCount}枚</Body>
              </View>
              <View style={[styles.resultRow, { marginBottom: spacing.sm }]}>
                <Body color={colors.textSecondary}>手数</Body>
                <Body style={{ fontWeight: 'bold' }}>
                  {completed}手 / 最少{optimal}手
                </Body>
              </View>
              <View style={styles.resultRow}>
                <Body color={colors.textSecondary}>タイム</Body>
                <Body style={{ fontWeight: 'bold' }}>{formatTime(completedTime)}</Body>
              </View>
            </View>
          </View>
          <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
            <Button
              title="もう一度プレイ"
              onPress={() => handleStartGame(diskCount)}
            />
            <Button
              title="難易度を変更"
              onPress={handleBackToSetup}
              variant="outline"
            />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // Playing phase
  const pegAreaWidth = SCREEN_WIDTH - spacing.lg * 2;
  const pegSpacing = pegAreaWidth / 3;
  const maxDiskWidth = pegSpacing - 12;
  const minDiskWidth = 20;
  const pegHeight = 140;
  const diskHeight = Math.min(Math.floor((pegHeight - 10) / diskCount), 22);
  const baseHeight = 8;

  const renderPeg = (pegIndex: number) => {
    const peg = gameState[pegIndex];
    const isSelected = selectedPeg === pegIndex;
    const hasDisks = peg.length > 0;
    const topDisk = hasDisks ? peg[peg.length - 1] : null;
    const pegColor = isSelected ? colors.primary : colors.textMuted;

    return (
      <Animated.View
        key={pegIndex}
        style={[
          styles.pegContainer,
          {
            width: pegSpacing,
            transform: [{ translateX: shakeAnims[pegIndex] }],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.pegTouchable, { height: pegHeight + baseHeight + 10 }]}
          onPress={() => handlePegPress(pegIndex)}
          activeOpacity={0.7}
        >
          {/* Peg label */}
          <Caption
            style={{
              textAlign: 'center',
              marginBottom: 4,
              color: isSelected ? colors.primary : colors.textSecondary,
              fontWeight: isSelected ? 'bold' : 'normal',
            }}
          >
            {pegIndex + 1}
          </Caption>

          {/* Peg and disks area */}
          <View style={[styles.pegArea, { height: pegHeight }]}>
            {/* Vertical peg rod */}
            <View
              style={[
                styles.pegRod,
                {
                  backgroundColor: pegColor,
                  height: pegHeight,
                },
              ]}
            />

            {/* Disks stacked from bottom */}
            {peg.map((diskSize, index) => {
              const isTopDisk =
                index === peg.length - 1 && isSelected;
              const widthRatio =
                (diskSize - 1) / (diskCount - 1 || 1);
              const diskWidth =
                minDiskWidth + widthRatio * (maxDiskWidth - minDiskWidth);
              const bottomOffset = index * diskHeight;

              return (
                <View
                  key={`${pegIndex}-${index}`}
                  style={[
                    styles.disk,
                    {
                      width: diskWidth,
                      height: diskHeight - 2,
                      backgroundColor: DISK_COLORS[diskSize - 1],
                      bottom: bottomOffset,
                      left: (pegSpacing - diskWidth) / 2,
                      opacity: isTopDisk ? 0.7 : 1,
                      transform: isTopDisk
                        ? [{ translateY: -10 }]
                        : [],
                      borderColor: isTopDisk
                        ? colors.primary
                        : 'rgba(0,0,0,0.2)',
                      borderWidth: isTopDisk ? 2 : 1,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Base */}
          <View
            style={[
              styles.pegBase,
              {
                backgroundColor: pegColor,
                width: maxDiskWidth + 8,
                height: baseHeight,
              },
            ]}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        {/* Top bar */}
        <View style={[styles.topBar, { marginBottom: spacing.md }]}>
          <TouchableOpacity onPress={handleBackToSetup}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Body style={{ fontWeight: 'bold' }}>{diskCount}枚モード</Body>
          <View style={styles.topBarRight}>
            <TouchableOpacity onPress={handleHint} style={{ marginRight: spacing.md }}>
              <Ionicons name="bulb" size={24} color={colors.warning} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReset}>
              <Ionicons name="refresh" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status bar */}
        <Card
          style={[
            styles.statusCard,
            { marginBottom: spacing.md, padding: spacing.sm },
          ]}
        >
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Caption style={{ color: colors.textSecondary }}>手数</Caption>
              <Body style={{ fontWeight: 'bold', color: colors.text }}>
                {moveCount}
              </Body>
            </View>
            <View style={styles.statusItem}>
              <Caption style={{ color: colors.textSecondary }}>最少</Caption>
              <Body style={{ fontWeight: 'bold', color: colors.primary }}>
                {optimalMoves}
              </Body>
            </View>
            <View style={styles.statusItem}>
              <Caption style={{ color: colors.textSecondary }}>タイム</Caption>
              <Body style={{ fontWeight: 'bold', color: colors.text }}>
                {formatTime(seconds)}
              </Body>
            </View>
          </View>
        </Card>

        {/* Instruction */}
        <Body
          color={colors.textSecondary}
          style={{ textAlign: 'center', marginBottom: spacing.sm, fontSize: 13 }}
        >
          {selectedPeg !== null
            ? `${selectedPeg + 1}番の柱を選択中 - 移動先の柱をタップ`
            : '円盤を取る柱をタップしてください'}
        </Body>

        {/* Pegs area */}
        <View style={styles.pegsContainer}>
          {[0, 1, 2].map((i) => renderPeg(i))}
        </View>

        {/* Bottom buttons */}
        <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          <Button
            title="ヒント（広告）"
            onPress={handleHint}
            variant="outline"
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
  statusCard: {},
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statusItem: {
    alignItems: 'center',
  },
  diskSelectContainer: {},
  diskSelectCard: {
    padding: 16,
  },
  diskSelectCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pegsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: 20,
  },
  pegContainer: {
    alignItems: 'center',
  },
  pegTouchable: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  pegArea: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
  },
  pegRod: {
    width: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 0,
  },
  disk: {
    position: 'absolute',
    borderRadius: 6,
  },
  pegBase: {
    borderRadius: 4,
  },
  completedContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  resultCard: {
    width: '100%',
    maxWidth: 280,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
