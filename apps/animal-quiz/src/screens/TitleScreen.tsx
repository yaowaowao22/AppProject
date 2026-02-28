import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { QuizMode, QuizResult } from '../types';
import { categories } from '../data/animals';

const modeLabels: Record<QuizMode, string> = {
  featureToAnimal: '特徴→動物',
  emojiToName: '絵文字→名前',
  habitat: '生息地クイズ',
  trueFalse: '豆知識○×',
};

const modeDescriptions: Record<QuizMode, string> = {
  featureToAnimal: '特徴から動物を当てよう',
  emojiToName: '絵文字を見て名前を当てよう',
  habitat: '動物の生息地を当てよう',
  trueFalse: '動物の豆知識が正しいか判定しよう',
};

const modeIcons: Record<QuizMode, string> = {
  featureToAnimal: '🔍',
  emojiToName: '🎯',
  habitat: '🌍',
  trueFalse: '⭕',
};

const questionCounts = [10, 20, 30];

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [history] = useLocalStorage<QuizResult[]>('animal-quiz-history', []);
  const [selectedMode, setSelectedMode] = useState<QuizMode>('featureToAnimal');
  const [selectedCount, setSelectedCount] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
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
      category: selectedCategory,
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
                style={{ textAlign: 'center', fontSize: 64, marginBottom: spacing.sm }}
              >
                🐾
              </Body>
              <H1 align="center">動物クイズ</H1>
              <Body
                color={colors.textSecondary}
                style={{ textAlign: 'center', marginTop: spacing.sm }}
              >
                動物博士になろう
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
                カテゴリ（任意）
              </H3>
              <View style={[styles.categoryGrid, { gap: spacing.sm }]}>
                <TouchableOpacity
                  onPress={() => setSelectedCategory(undefined)}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor:
                        selectedCategory === undefined ? colors.primary : colors.surface,
                      borderColor:
                        selectedCategory === undefined ? colors.primary : colors.border,
                      borderWidth: 2,
                      borderRadius: 12,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                    },
                  ]}
                >
                  <Body
                    color={selectedCategory === undefined ? '#FFFFFF' : colors.text}
                    style={{ fontWeight: 'bold', textAlign: 'center', fontSize: 13 }}
                  >
                    すべて
                  </Body>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor:
                          selectedCategory === cat ? colors.primary : colors.surface,
                        borderColor:
                          selectedCategory === cat ? colors.primary : colors.border,
                        borderWidth: 2,
                        borderRadius: 12,
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.md,
                      },
                    ]}
                  >
                    <Body
                      color={selectedCategory === cat ? '#FFFFFF' : colors.text}
                      style={{ fontWeight: 'bold', textAlign: 'center', fontSize: 13 }}
                    >
                      {cat}
                    </Body>
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
                      {`${count}問`}
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  categoryButton: {
    width: '30%',
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  countButton: {
    flex: 1,
  },
});
