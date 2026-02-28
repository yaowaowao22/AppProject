import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { QuizMode, QuizResult } from '../types';
import { continents } from '../data/countries';

const modeLabels: Record<QuizMode, string> = {
  flagToName: '国旗→国名',
  nameToFlag: '国名→国旗',
  continent: '大陸別',
};

const modeDescriptions: Record<QuizMode, string> = {
  flagToName: '国旗を見て国名を当てよう',
  nameToFlag: '国名から国旗を当てよう',
  continent: '大陸を選んでチャレンジ',
};

const modeIcons: Record<QuizMode, string> = {
  flagToName: '\u{1F1EF}\u{1F1F5}',
  nameToFlag: '\u{1F30D}',
  continent: '\u{1F5FA}',
};

const questionCounts = [10, 20, 30];

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [history] = useLocalStorage<QuizResult[]>('flag-quiz-history', []);
  const [selectedMode, setSelectedMode] = useState<QuizMode>('flagToName');
  const [selectedCount, setSelectedCount] = useState(10);
  const [selectedContinent, setSelectedContinent] = useState<string | undefined>(undefined);
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
      continent: selectedMode === 'continent' ? selectedContinent : undefined,
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
                {'\u{1F1EF}\u{1F1F5}'}
              </Body>
              <H1 align="center">国旗クイズ</H1>
              <Body
                color={colors.textSecondary}
                style={{ textAlign: 'center', marginTop: spacing.sm }}
              >
                世界の国旗マスター
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
                    onPress={() => {
                      setSelectedMode(mode);
                      if (mode !== 'continent') {
                        setSelectedContinent(undefined);
                      }
                    }}
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

              {selectedMode === 'continent' && (
                <>
                  <H3 style={{ marginTop: spacing.xl, marginBottom: spacing.md }} align="center">
                    大陸を選択
                  </H3>
                  <View style={[styles.continentGrid, { gap: spacing.sm }]}>
                    {continents.map((cont) => (
                      <TouchableOpacity
                        key={cont}
                        onPress={() => setSelectedContinent(cont)}
                        style={[
                          styles.continentButton,
                          {
                            backgroundColor:
                              selectedContinent === cont ? colors.primary : colors.surface,
                            borderColor:
                              selectedContinent === cont ? colors.primary : colors.border,
                            borderWidth: 2,
                            borderRadius: 12,
                            paddingVertical: spacing.sm,
                            paddingHorizontal: spacing.md,
                          },
                        ]}
                      >
                        <Body
                          color={selectedContinent === cont ? '#FFFFFF' : colors.text}
                          style={{ fontWeight: 'bold', textAlign: 'center', fontSize: 13 }}
                        >
                          {cont}
                        </Body>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

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
              <Button
                title="スタート"
                onPress={handlePlay}
                size="lg"
                disabled={selectedMode === 'continent' && !selectedContinent}
              />
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
  continentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  continentButton: {
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
