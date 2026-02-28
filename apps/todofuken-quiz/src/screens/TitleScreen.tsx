import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { QuizMode, QuizResult } from '../types';

const modeLabels: Record<QuizMode, string> = {
  capital: '県庁所在地',
  famous: '名産品',
  region: '地方クイズ',
  mixed: '総合クイズ',
};

const modeDescriptions: Record<QuizMode, string> = {
  capital: '県名から県庁所在地を当てよう',
  famous: '名産品・名所から県を当てよう',
  region: '都道府県の地方を当てよう',
  mixed: 'いろんな問題にチャレンジ',
};

const modeIcons: Record<QuizMode, string> = {
  capital: '🏛️',
  famous: '🎌',
  region: '🗾',
  mixed: '🎯',
};

const questionCounts = [10, 20, 47];

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [history] = useLocalStorage<QuizResult[]>('quiz-history', []);
  const [selectedMode, setSelectedMode] = useState<QuizMode>('capital');
  const [selectedCount, setSelectedCount] = useState(10);
  const [showModeSelect, setShowModeSelect] = useState(false);

  const totalQuizzes = history.length;
  const averageAccuracy =
    totalQuizzes > 0
      ? Math.round(
          (history.reduce((sum, r) => sum + r.correct / r.total, 0) / totalQuizzes) * 100
        )
      : 0;

  const handleStart = () => {
    setShowModeSelect(true);
  };

  const handlePlay = () => {
    navigation.navigate('Game', {
      mode: selectedMode,
      count: selectedCount,
      timestamp: Date.now(),
    });
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        {!showModeSelect ? (
          <>
            <View style={styles.titleArea}>
              <Body
                color={colors.primary}
                style={{ textAlign: 'center', fontSize: 48, marginBottom: spacing.sm }}
              >
                🗾
              </Body>
              <H1 align="center">都道府県クイズ</H1>
              <Body
                color={colors.textSecondary}
                style={{ textAlign: 'center', marginTop: spacing.sm }}
              >
                47都道府県マスター
              </Body>

              {totalQuizzes > 0 && (
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
                      {totalQuizzes}
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
                      {averageAccuracy}%
                    </H2>
                    <Caption style={{ textAlign: 'center' }}>平均正答率</Caption>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.buttonArea}>
              <Button title="クイズをはじめる" onPress={handleStart} size="lg" />
            </View>
          </>
        ) : (
          <>
            <View style={{ flex: 1 }}>
              <H2 align="center" style={{ marginBottom: spacing.lg }}>
                モードを選択
              </H2>

              <View style={{ gap: spacing.sm }}>
                {(Object.keys(modeLabels) as QuizMode[]).map((mode) => (
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
                問題数
              </H3>
              <View style={[styles.countRow, { gap: spacing.sm }]}>
                {questionCounts.map((count) => (
                  <TouchableOpacity
                    key={count}
                    onPress={() => setSelectedCount(count)}
                    style={[
                      styles.countButton,
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
                      {count === 47 ? '47全問' : `${count}問`}
                    </Body>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.buttonArea, { gap: spacing.sm }]}>
              <Button title="スタート" onPress={handlePlay} size="lg" />
              <Button
                title="もどる"
                onPress={() => setShowModeSelect(false)}
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
  countRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  countButton: {
    flex: 1,
  },
});
