import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
  ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDB } from '../../hooks/useDatabase';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import type { RootStackParamList } from '../../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================
// オンボーディングデータ
// ============================================================
interface OnboardingStep {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

const STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    emoji: '🧠',
    title: 'ReCallKitへようこそ',
    description:
      '気になった記事・メモ・アイデアを\n保存して、科学的な復習で\n記憶に定着させましょう。',
  },
  {
    id: 'save',
    emoji: '📌',
    title: 'アイテムを保存',
    description:
      'URLやテキストをすばやく追加。\nタグで整理して、\nあとから簡単に見つけられます。',
  },
  {
    id: 'recall',
    emoji: '📅',
    title: 'SM-2で記憶定着',
    description:
      '忘却曲線に基づいたSM-2アルゴリズムが\n最適なタイミングで復習を提案。\n毎日少しずつで確実に覚えます。',
  },
  {
    id: 'start',
    emoji: '🚀',
    title: 'さっそく始めましょう',
    description:
      'まず気になるものを1つ保存してみてください。\n知識の積み重ねが\nここから始まります。',
  },
];

// ============================================================
// OnboardingScreen
// ============================================================
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const db = useDB();
  const flatListRef = useRef<FlatList<OnboardingStep>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // オンボーディング完了 → DB更新 → Main遷移
  const handleComplete = useCallback(async () => {
    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value) VALUES ('onboarding_completed', 'true')`
    );
    navigation.replace('Main');
  }, [db, navigation]);

  // 「次へ」ボタン
  const handleNext = useCallback(() => {
    if (currentIndex < STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleComplete();
    }
  }, [currentIndex, handleComplete]);

  // スキップ
  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  // スクロール位置からインデックス更新
  const onMomentumScrollEnd = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(newIndex);
  }, []);

  const isLastStep = currentIndex === STEPS.length - 1;

  const renderItem = ({ item }: ListRenderItemInfo<OnboardingStep>) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <Text style={styles.emoji}>{item.emoji}</Text>
      <Text style={[styles.title, { color: colors.label }]}>{item.title}</Text>
      <Text style={[styles.description, { color: colors.labelSecondary }]}>
        {item.description}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.label === '#000000' ? 'dark-content' : 'light-content'}
      />

      {/* スキップボタン（最終ステップでは非表示） */}
      <View style={[styles.skipRow, { marginTop: insets.top + Spacing.s }]}>
        {!isLastStep && (
          <TouchableOpacity
            onPress={handleSkip}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="スキップ"
            accessibilityRole="button"
          >
            <Text style={[styles.skipText, { color: colors.labelSecondary }]}>
              スキップ
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* スライドコンテンツ */}
      <FlatList
        ref={flatListRef}
        data={STEPS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        style={styles.flatList}
        accessibilityRole="adjustable"
        accessibilityLabel={`ステップ ${currentIndex + 1} / ${STEPS.length}`}
      />

      {/* ページインジケーター */}
      <View style={styles.dotsRow}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIndex
                ? { backgroundColor: colors.accent, width: 20 }
                : { backgroundColor: colors.separator },
            ]}
          />
        ))}
      </View>

      {/* 次へ / 始めるボタン */}
      <TouchableOpacity
        onPress={handleNext}
        style={[styles.nextButton, { backgroundColor: colors.accent }]}
        activeOpacity={0.85}
        accessibilityLabel={isLastStep ? '始める' : '次へ'}
        accessibilityRole="button"
      >
        <Text style={styles.nextButtonText}>
          {isLastStep ? '始める' : '次へ'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: insets.bottom + Spacing.m }} />
    </View>
  );
}

// ============================================================
// Styles
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  skipRow: {
    width: '100%',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.m,
    height: 44,
    justifyContent: 'center',
  },
  skipText: {
    ...TypeScale.subheadline,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emoji: {
    fontSize: 80,
    marginBottom: Spacing.xl,
    lineHeight: 96,
    textAlign: 'center',
  },
  title: {
    ...TypeScale.title1,
    textAlign: 'center',
    marginBottom: Spacing.m,
  },
  description: {
    ...TypeScale.bodyJA,
    textAlign: 'center',
    lineHeight: 28,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.l,
  },
  dot: {
    height: 8,
    borderRadius: Radius.full,
    // width はインラインで active / inactive を切り替え
  },
  nextButton: {
    width: SCREEN_WIDTH - Spacing.m * 2,
    height: 54,
    borderRadius: Radius.l,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.m,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  nextButtonText: {
    ...TypeScale.headline,
    color: '#FFFFFF',
  },
});
