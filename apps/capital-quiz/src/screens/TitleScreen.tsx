import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { QuizMode, QuizResult } from '../types';
import { continents } from '../data/countries';

const modeLabels: Record<QuizMode, string> = {
  countryToCapital: '\u{1F30D} \u2192 \u{1F3DB}',
  capitalToCountry: '\u{1F3DB} \u2192 \u{1F30D}',
  continent: '\u{1F5FA} \u5927\u9678\u5225',
  worldShuffle: '\u{1F30E} \u5168\u4E16\u754C',
};

const modeDescriptions: Record<QuizMode, string> = {
  countryToCapital: '\u56FD\u540D\u3068\u56FD\u65D7\u304B\u3089\u9996\u90FD\u3092\u5F53\u3066\u3088\u3046',
  capitalToCountry: '\u9996\u90FD\u540D\u304B\u3089\u56FD\u3092\u5F53\u3066\u3088\u3046',
  continent: '\u5927\u9678\u3092\u9078\u3093\u3067\u30C1\u30E3\u30EC\u30F3\u30B8',
  worldShuffle: '\u4E16\u754C\u4E2D\u304B\u3089\u30E9\u30F3\u30C0\u30E0\u51FA\u984C',
};

const modeIcons: Record<QuizMode, string> = {
  countryToCapital: '\u{1F3DB}',
  capitalToCountry: '\u{1F30D}',
  continent: '\u{1F5FA}',
  worldShuffle: '\u{1F30E}',
};

const questionCounts = [10, 20, 30];

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [history] = useLocalStorage<QuizResult[]>('capital-quiz-history', []);
  const [selectedMode, setSelectedMode] = useState<QuizMode>('countryToCapital');
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
                {'\u{1F3DB}'}
              </Body>
              <H1 align="center">{'\u9996\u90FD\u30AF\u30A4\u30BA'}</H1>
              <Body
                color={colors.textSecondary}
                style={{ textAlign: 'center', marginTop: spacing.sm }}
              >
                {'\u4E16\u754C\u306E\u9996\u90FD\u30DE\u30B9\u30BF\u30FC'}
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
                    <Caption style={{ textAlign: 'center' }}>{'\u30D7\u30EC\u30A4\u56DE\u6570'}</Caption>
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
                    <Caption style={{ textAlign: 'center' }}>{'\u5E73\u5747\u6B63\u7B54\u7387'}</Caption>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.buttonArea}>
              <Button title={'\u30AF\u30A4\u30BA\u3092\u306F\u3058\u3081\u308B'} onPress={handleStart} size="lg" />
            </View>
          </>
        ) : (
          <>
            <View style={{ flex: 1 }}>
              <H2 align="center" style={{ marginBottom: spacing.lg }}>
                {'\u30E2\u30FC\u30C9\u3092\u9078\u629E'}
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
                    {'\u5927\u9678\u3092\u9078\u629E'}
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
                {'\u554F\u984C\u6570'}
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
                      {`${count}\u554F`}
                    </Body>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.buttonArea, { gap: spacing.sm }]}>
              <Button
                title={'\u30B9\u30BF\u30FC\u30C8'}
                onPress={handlePlay}
                size="lg"
                disabled={selectedMode === 'continent' && !selectedContinent}
              />
              <Button
                title={'\u3082\u3069\u308B'}
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
