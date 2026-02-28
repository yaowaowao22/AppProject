import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { QuizMode, QuizResult } from '../types';

const modeLabels: Record<QuizMode, string> = {
  ingredientToFood: '\u{1F373} \u98DF\u6750\u2192\u6599\u7406',
  emojiToName: '\u{1F60B} \u7D75\u6587\u5B57\u2192\u540D\u524D',
  originCountry: '\u{1F30D} \u539F\u7523\u56FD',
  calorieCompare: '\u{1F525} \u30AB\u30ED\u30EA\u30FC\u30AF\u30A4\u30BA',
  triviaOX: '\u{1F9D0} \u8C46\u77E5\u8B58\u25CB\u00D7',
};

const modeDescriptions: Record<QuizMode, string> = {
  ingredientToFood: '\u98DF\u6750\u304B\u3089\u6599\u7406\u540D\u3092\u5F53\u3066\u3088\u3046',
  emojiToName: '\u7D75\u6587\u5B57\u3092\u898B\u3066\u98DF\u3079\u7269\u3092\u5F53\u3066\u3088\u3046',
  originCountry: '\u6599\u7406\u306E\u539F\u7523\u56FD\u3092\u5F53\u3066\u3088\u3046',
  calorieCompare: '\u30AB\u30ED\u30EA\u30FC\u304C\u9AD8\u3044\u306E\u306F\u3069\u3063\u3061\uFF1F',
  triviaOX: '\u98DF\u3079\u7269\u306E\u8C46\u77E5\u8B58\u3067\u25CB\u00D7',
};

const modeEmojis: Record<QuizMode, string> = {
  ingredientToFood: '\u{1F373}',
  emojiToName: '\u{1F363}',
  originCountry: '\u{1F30D}',
  calorieCompare: '\u{1F525}',
  triviaOX: '\u{1F9D0}',
};

const questionCounts = [10, 20, 30];

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [history] = useLocalStorage<QuizResult[]>('food-quiz-history', []);
  const [selectedMode, setSelectedMode] = useState<QuizMode>('emojiToName');
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
              <Body style={{ fontSize: 64, textAlign: 'center', marginBottom: spacing.sm }}>
                {'\u{1F363}\u{1F355}\u{1F370}'}
              </Body>
              <H1 align="center">{'\u98DF\u3079\u7269\u30AF\u30A4\u30BA'}</H1>
              <Body
                color={colors.textSecondary}
                style={{ textAlign: 'center', marginTop: spacing.sm }}
              >
                {'\u30B0\u30EB\u30E1\u535A\u58EB\u306B\u306A\u308D\u3046\uFF01'}
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
                    <Caption style={{ textAlign: 'center' }}>
                      {'\u30D7\u30EC\u30A4\u56DE\u6570'}
                    </Caption>
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
                    <Caption style={{ textAlign: 'center' }}>
                      {'\u5E73\u5747\u6B63\u7B54\u7387'}
                    </Caption>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.buttonArea}>
              <Button
                title={'\u30AF\u30A4\u30BA\u3092\u306F\u3058\u3081\u308B'}
                onPress={handleStart}
                size="lg"
              />
            </View>
          </>
        ) : (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <H2 align="center" style={{ marginBottom: spacing.lg }}>
              {'\u30E2\u30FC\u30C9\u3092\u9078\u629E'}
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
                      <Body style={{ fontSize: 28 }}>{modeEmojis[mode]}</Body>
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

            <View style={[styles.bottomButtons, { gap: spacing.sm, marginTop: spacing.xl }]}>
              <Button
                title={'\u30B9\u30BF\u30FC\u30C8'}
                onPress={handlePlay}
                size="lg"
              />
              <Button
                title={'\u3082\u3069\u308B'}
                onPress={() => setShowModeSelect(false)}
                variant="ghost"
              />
            </View>
          </ScrollView>
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
  bottomButtons: {
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
