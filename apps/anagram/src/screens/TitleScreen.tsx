import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { GameResult, GameMode, Difficulty } from '../types';

const modeLabels: Record<GameMode, string> = {
  normal: '通常モード',
  timeAttack: 'タイムアタック',
};

const modeDescriptions: Record<GameMode, string> = {
  normal: '決められた問題数をじっくり解こう',
  timeAttack: '60秒でできるだけ多く解こう',
};

const modeIcons: Record<GameMode, string> = {
  normal: '📝',
  timeAttack: '⏱️',
};

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'かんたん',
  medium: 'ふつう',
  hard: 'むずかしい',
};

const difficultyDescriptions: Record<Difficulty, string> = {
  easy: '3〜4文字',
  medium: '5〜6文字',
  hard: '7文字以上',
};

const normalQuestionCounts = [10, 20, 30];

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [history] = useLocalStorage<GameResult[]>('anagram-history', []);
  const [showSetup, setShowSetup] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode>('normal');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [selectedCount, setSelectedCount] = useState(10);

  const totalGames = history.length;
  const bestScore =
    totalGames > 0 ? Math.max(...history.map((r) => r.score)) : 0;
  const totalSolved = history.reduce((sum, r) => sum + r.solved, 0);

  const handleStart = () => {
    setShowSetup(true);
  };

  const handlePlay = () => {
    navigation.navigate('Game', {
      mode: selectedMode,
      difficulty: selectedDifficulty,
      count: selectedCount,
      timestamp: Date.now(),
    });
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        {!showSetup ? (
          <>
            <View style={styles.titleArea}>
              <Body
                color={colors.primary}
                style={{ textAlign: 'center', fontSize: 48, marginBottom: spacing.sm }}
              >
                🔤
              </Body>
              <H1 align="center">アナグラム</H1>
              <Body
                color={colors.textSecondary}
                style={{ textAlign: 'center', marginTop: spacing.sm }}
              >
                文字並べ替えゲーム
              </Body>

              {totalGames > 0 && (
                <View
                  style={[
                    styles.statsRow,
                    {
                      marginTop: spacing.xl,
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      padding: spacing.lg,
                      gap: spacing.lg,
                    },
                  ]}
                >
                  <View style={styles.statItem}>
                    <H2 align="center" color={colors.primary}>
                      {totalGames}
                    </H2>
                    <Caption style={{ textAlign: 'center' }}>プレイ回数</Caption>
                  </View>
                  <View
                    style={{
                      width: 1,
                      backgroundColor: colors.border,
                      alignSelf: 'stretch',
                    }}
                  />
                  <View style={styles.statItem}>
                    <H2 align="center" color={colors.primary}>
                      {bestScore}
                    </H2>
                    <Caption style={{ textAlign: 'center' }}>最高スコア</Caption>
                  </View>
                  <View
                    style={{
                      width: 1,
                      backgroundColor: colors.border,
                      alignSelf: 'stretch',
                    }}
                  />
                  <View style={styles.statItem}>
                    <H2 align="center" color={colors.primary}>
                      {totalSolved}
                    </H2>
                    <Caption style={{ textAlign: 'center' }}>合計正解数</Caption>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.buttonArea}>
              <Button title="ゲームをはじめる" onPress={handleStart} size="lg" />
            </View>
          </>
        ) : (
          <>
            <View style={{ flex: 1 }}>
              <H2 align="center" style={{ marginBottom: spacing.lg }}>
                モードを選択
              </H2>

              <View style={{ gap: spacing.sm }}>
                {(Object.keys(modeLabels) as GameMode[]).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setSelectedMode(mode)}
                    activeOpacity={0.7}
                  >
                    <Card
                      style={[
                        styles.modeCard,
                        {
                          padding: spacing.lg,
                          borderWidth: 2,
                          borderColor:
                            selectedMode === mode ? colors.primary : colors.border,
                          backgroundColor:
                            selectedMode === mode ? colors.primaryLight : colors.surface,
                        },
                      ]}
                    >
                      <View style={styles.modeCardContent}>
                        <Body style={{ fontSize: 24 }}>{modeIcons[mode]}</Body>
                        <View style={{ flex: 1, marginLeft: spacing.md }}>
                          <H3>{modeLabels[mode]}</H3>
                          <Caption>{modeDescriptions[mode]}</Caption>
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>

              <H3 style={{ marginTop: spacing.xl, marginBottom: spacing.md }} align="center">
                難易度
              </H3>
              <View style={[styles.optionRow, { gap: spacing.sm }]}>
                {(Object.keys(difficultyLabels) as Difficulty[]).map((diff) => (
                  <TouchableOpacity
                    key={diff}
                    onPress={() => setSelectedDifficulty(diff)}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor:
                          selectedDifficulty === diff ? colors.primary : colors.surface,
                        borderColor:
                          selectedDifficulty === diff ? colors.primary : colors.border,
                        borderWidth: 2,
                        borderRadius: 12,
                        paddingVertical: spacing.md,
                        paddingHorizontal: spacing.sm,
                      },
                    ]}
                  >
                    <Body
                      color={selectedDifficulty === diff ? '#FFFFFF' : colors.text}
                      style={{ fontWeight: 'bold', textAlign: 'center', fontSize: 13 }}
                    >
                      {difficultyLabels[diff]}
                    </Body>
                    <Caption
                      color={selectedDifficulty === diff ? '#FFFFFF' : colors.textSecondary}
                      style={{ textAlign: 'center', fontSize: 10 }}
                    >
                      {difficultyDescriptions[diff]}
                    </Caption>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedMode === 'normal' && (
                <>
                  <H3 style={{ marginTop: spacing.xl, marginBottom: spacing.md }} align="center">
                    問題数
                  </H3>
                  <View style={[styles.optionRow, { gap: spacing.sm }]}>
                    {normalQuestionCounts.map((count) => (
                      <TouchableOpacity
                        key={count}
                        onPress={() => setSelectedCount(count)}
                        style={[
                          styles.optionButton,
                          {
                            backgroundColor:
                              selectedCount === count ? colors.primary : colors.surface,
                            borderColor:
                              selectedCount === count ? colors.primary : colors.border,
                            borderWidth: 2,
                            borderRadius: 12,
                            paddingVertical: spacing.md,
                            paddingHorizontal: spacing.lg,
                          },
                        ]}
                      >
                        <Body
                          color={selectedCount === count ? '#FFFFFF' : colors.text}
                          style={{ fontWeight: 'bold', textAlign: 'center' }}
                        >
                          {count}問
                        </Body>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>

            <View style={[styles.buttonArea, { gap: spacing.sm }]}>
              <Button title="スタート" onPress={handlePlay} size="lg" />
              <Button
                title="もどる"
                onPress={() => setShowSetup(false)}
                variant="ghost"
              />
            </View>
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  titleArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonArea: {
    paddingBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  modeCard: {
    borderRadius: 12,
  },
  modeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  optionButton: {
    flex: 1,
  },
});
