import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import { categories, getBrandsByCategory, brands } from '../data/brands';
import { GameResult } from '../types';

const questionCounts = [10, 15, 20];

const categoryIcons: Record<string, string> = {
  IT: '\u{1F4BB}',
  '\u81EA\u52D5\u8ECA': '\u{1F697}',
  '\u98F2\u98DF': '\u{1F354}',
  '\u30D5\u30A1\u30C3\u30B7\u30E7\u30F3': '\u{1F45C}',
  '\u30A8\u30F3\u30BF\u30E1': '\u{1F3AC}',
  '\u65E5\u7528\u54C1': '\u{1F9F4}',
  '\u5C0F\u58F2': '\u{1F6D2}',
  '\u4EA4\u901A': '\u{2708}\uFE0F',
  '\u91D1\u878D': '\u{1F3E6}',
  '\u5BB6\u96FB': '\u{1F4FA}',
  '\u88FD\u85AC': '\u{1F48A}',
  '\u901A\u4FE1': '\u{1F4F1}',
};

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [history] = useLocalStorage<GameResult[]>('brand-quiz-history', []);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCount, setSelectedCount] = useState(10);

  const totalGames = history.length;
  const totalScore = history.reduce((sum, r) => sum + r.totalScore, 0);
  const averageAccuracy =
    totalGames > 0
      ? Math.round(
          (history.reduce((sum, r) => sum + r.correct / r.total, 0) / totalGames) * 100
        )
      : 0;

  const handleStart = () => {
    setShowSettings(true);
  };

  const handlePlay = () => {
    navigation.navigate('Game', {
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      count: selectedCount,
      timestamp: Date.now(),
    });
  };

  const availableCount =
    selectedCategory === 'all'
      ? brands.length
      : getBrandsByCategory(selectedCategory).length;

  return (
    <ScreenWrapper>
      {!showSettings ? (
        <View style={[styles.container, { padding: spacing.xl }]}>
          <View style={styles.titleArea}>
            <Ionicons
              name="briefcase"
              size={64}
              color={colors.primary}
              style={{ marginBottom: spacing.md }}
            />
            <H1 align="center">ブランドクイズ</H1>
            <Body
              color={colors.textSecondary}
              style={{ textAlign: 'center', marginTop: spacing.sm }}
            >
              ヒントから企業を当てろ
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
                    {averageAccuracy}%
                  </H2>
                  <Caption style={{ textAlign: 'center' }}>平均正答率</Caption>
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
                    {totalScore}
                  </H2>
                  <Caption style={{ textAlign: 'center' }}>累計スコア</Caption>
                </View>
              </View>
            )}
          </View>

          <View style={styles.buttonArea}>
            <Button title="ゲームスタート" onPress={handleStart} size="lg" />
          </View>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.settingsContainer, { padding: spacing.xl }]}
        >
          <View style={{ flex: 1 }}>
            <H2 align="center" style={{ marginBottom: spacing.lg }}>
              カテゴリを選択
            </H2>

            <View style={[styles.categoryGrid, { gap: spacing.sm }]}>
              <TouchableOpacity
                onPress={() => setSelectedCategory('all')}
                activeOpacity={0.7}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor:
                      selectedCategory === 'all' ? colors.primary : colors.surface,
                    borderColor:
                      selectedCategory === 'all' ? colors.primary : colors.border,
                    borderWidth: 2,
                    borderRadius: 12,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                  },
                ]}
              >
                <Body style={{ fontSize: 18, textAlign: 'center' }}>
                  {'\u{1F30D}'}
                </Body>
                <Caption
                  color={selectedCategory === 'all' ? '#FFFFFF' : colors.text}
                  style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 12 }}
                >
                  すべて
                </Caption>
              </TouchableOpacity>

              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}
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
                  <Body style={{ fontSize: 18, textAlign: 'center' }}>
                    {categoryIcons[cat] || '\u{1F3E2}'}
                  </Body>
                  <Caption
                    color={selectedCategory === cat ? '#FFFFFF' : colors.text}
                    style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 12 }}
                  >
                    {cat}
                  </Caption>
                </TouchableOpacity>
              ))}
            </View>

            <Caption
              color={colors.textSecondary}
              style={{ textAlign: 'center', marginTop: spacing.sm }}
            >
              {selectedCategory === 'all'
                ? `全${brands.length}ブランド`
                : `${availableCount}ブランド`}
            </Caption>

            <H3 style={{ marginTop: spacing.xl, marginBottom: spacing.md }} align="center">
              問題数
            </H3>
            <View style={[styles.countRow, { gap: spacing.sm }]}>
              {questionCounts.map((count) => {
                const isDisabled = count > availableCount;
                return (
                  <TouchableOpacity
                    key={count}
                    onPress={() => {
                      if (!isDisabled) setSelectedCount(count);
                    }}
                    style={[
                      styles.countButton,
                      {
                        backgroundColor: isDisabled
                          ? colors.border
                          : selectedCount === count
                            ? colors.primary
                            : colors.surface,
                        borderColor: isDisabled
                          ? colors.border
                          : selectedCount === count
                            ? colors.primary
                            : colors.border,
                        borderWidth: 2,
                        borderRadius: 12,
                        paddingVertical: spacing.md,
                        paddingHorizontal: spacing.lg,
                        opacity: isDisabled ? 0.4 : 1,
                      },
                    ]}
                  >
                    <Body
                      color={
                        isDisabled
                          ? colors.textSecondary
                          : selectedCount === count
                            ? '#FFFFFF'
                            : colors.text
                      }
                      style={{ fontWeight: 'bold', textAlign: 'center' }}
                    >
                      {`${count}問`}
                    </Body>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.buttonArea, { gap: spacing.sm, marginTop: spacing.xl }]}>
            <Button
              title="スタート"
              onPress={handlePlay}
              size="lg"
              disabled={selectedCount > availableCount}
            />
            <Button
              title="もどる"
              onPress={() => setShowSettings(false)}
              variant="ghost"
            />
          </View>
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  settingsContainer: {
    flexGrow: 1,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  categoryButton: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  countButton: {
    flex: 1,
  },
});
