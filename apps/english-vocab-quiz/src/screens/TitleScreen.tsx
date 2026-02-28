import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import type { QuizResult, QuizLevel, QuizCount, QuizMode } from '../types';

const LEVEL_OPTIONS: { label: string; value: QuizLevel }[] = [
  { label: '5級/4級', value: '5-4級' },
  { label: '3級/準2級', value: '3-準2級' },
  { label: '2級/準1級', value: '2-準1級' },
  { label: '全レベル', value: 'ALL' },
];

const COUNT_OPTIONS: { label: string; value: QuizCount }[] = [
  { label: '10問', value: 10 },
  { label: '20問', value: 20 },
  { label: '30問', value: 30 },
];

const MODE_OPTIONS: { label: string; value: QuizMode; icon: string }[] = [
  { label: '英語 → 日本語', value: 'en-to-jp', icon: 'language' },
  { label: '日本語 → 英語', value: 'jp-to-en', icon: 'swap-horizontal' },
];

export function TitleScreen() {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<any>();

  const [selectedLevel, setSelectedLevel] = useState<QuizLevel>('5-4級');
  const [selectedCount, setSelectedCount] = useState<QuizCount>(10);
  const [selectedMode, setSelectedMode] = useState<QuizMode>('en-to-jp');

  const [history] = useLocalStorage<QuizResult[]>(
    'english-vocab-quiz-history',
    []
  );

  const handleStart = () => {
    navigation.navigate('Game', {
      level: selectedLevel,
      count: selectedCount,
      mode: selectedMode,
    });
  };

  const totalQuizzes = history?.length ?? 0;
  const averageAccuracy =
    totalQuizzes > 0
      ? Math.round(
          (history!.reduce(
            (sum, r) => sum + (r.total > 0 ? (r.correct / r.total) * 100 : 0),
            0
          ) /
            totalQuizzes)
        )
      : 0;
  const totalCorrect = history?.reduce((sum, r) => sum + r.correct, 0) ?? 0;
  const totalQuestions = history?.reduce((sum, r) => sum + r.total, 0) ?? 0;

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { padding: spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={[styles.titleArea, { marginBottom: spacing.xl }]}>
          <Ionicons
            name="school"
            size={56}
            color={colors.primary}
            style={{ marginBottom: spacing.md }}
          />
          <H1
            align="center"
            style={{ fontSize: 36, marginBottom: spacing.xs }}
          >
            英単語クイズ
          </H1>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center', fontSize: 16 }}
          >
            英検レベル別
          </Body>
        </View>

        {/* Stats */}
        {totalQuizzes > 0 && (
          <Card style={[styles.statsCard, { marginBottom: spacing.xl }]}>
            <Body
              color={colors.textSecondary}
              style={{
                textAlign: 'center',
                marginBottom: spacing.md,
                fontWeight: '600',
              }}
            >
              あなたの記録
            </Body>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <H2 align="center" style={{ color: colors.primary }}>
                  {totalQuizzes}
                </H2>
                <Caption
                  color={colors.textMuted}
                  style={{ textAlign: 'center' }}
                >
                  回プレイ
                </Caption>
              </View>
              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <View style={styles.statItem}>
                <H2 align="center" style={{ color: colors.primary }}>
                  {averageAccuracy}%
                </H2>
                <Caption
                  color={colors.textMuted}
                  style={{ textAlign: 'center' }}
                >
                  平均正答率
                </Caption>
              </View>
              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <View style={styles.statItem}>
                <H2 align="center" style={{ color: colors.primary }}>
                  {totalCorrect}/{totalQuestions}
                </H2>
                <Caption
                  color={colors.textMuted}
                  style={{ textAlign: 'center' }}
                >
                  累計正解
                </Caption>
              </View>
            </View>
          </Card>
        )}

        {/* Level select */}
        <Body style={{ marginBottom: spacing.sm, fontWeight: '600' }}>
          レベル選択
        </Body>
        <View style={[styles.optionRow, { marginBottom: spacing.lg }]}>
          {LEVEL_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setSelectedLevel(opt.value)}
              style={[
                styles.optionButton,
                {
                  backgroundColor:
                    selectedLevel === opt.value
                      ? colors.primary
                      : colors.surface,
                  borderColor:
                    selectedLevel === opt.value
                      ? colors.primary
                      : colors.border,
                  borderRadius: radius.md,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                },
              ]}
            >
              <Body
                color={
                  selectedLevel === opt.value ? '#FFFFFF' : colors.text
                }
                style={{ fontWeight: '600', textAlign: 'center' }}
              >
                {opt.label}
              </Body>
            </Pressable>
          ))}
        </View>

        {/* Count select */}
        <Body style={{ marginBottom: spacing.sm, fontWeight: '600' }}>
          出題数
        </Body>
        <View style={[styles.optionRow, { marginBottom: spacing.lg }]}>
          {COUNT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setSelectedCount(opt.value)}
              style={[
                styles.optionButton,
                {
                  backgroundColor:
                    selectedCount === opt.value
                      ? colors.primary
                      : colors.surface,
                  borderColor:
                    selectedCount === opt.value
                      ? colors.primary
                      : colors.border,
                  borderRadius: radius.md,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                },
              ]}
            >
              <Body
                color={
                  selectedCount === opt.value ? '#FFFFFF' : colors.text
                }
                style={{ fontWeight: '600', textAlign: 'center' }}
              >
                {opt.label}
              </Body>
            </Pressable>
          ))}
        </View>

        {/* Mode select */}
        <Body style={{ marginBottom: spacing.sm, fontWeight: '600' }}>
          出題モード
        </Body>
        <View style={[styles.optionRow, { marginBottom: spacing.xxl }]}>
          {MODE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setSelectedMode(opt.value)}
              style={[
                styles.modeButton,
                {
                  backgroundColor:
                    selectedMode === opt.value
                      ? colors.primary
                      : colors.surface,
                  borderColor:
                    selectedMode === opt.value
                      ? colors.primary
                      : colors.border,
                  borderRadius: radius.md,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                },
              ]}
            >
              <Ionicons
                name={opt.icon as any}
                size={18}
                color={selectedMode === opt.value ? '#FFFFFF' : colors.text}
                style={{ marginRight: spacing.xs }}
              />
              <Body
                color={
                  selectedMode === opt.value ? '#FFFFFF' : colors.text
                }
                style={{ fontWeight: '600', textAlign: 'center' }}
              >
                {opt.label}
              </Body>
            </Pressable>
          ))}
        </View>

        {/* Start button */}
        <Button title="ゲームスタート" onPress={handleStart} size="lg" />
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  titleArea: {
    alignItems: 'center',
    paddingTop: 20,
  },
  statsCard: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    borderWidth: 2,
    minWidth: 70,
  },
  modeButton: {
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
