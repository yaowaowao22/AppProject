// ============================================================
// ReviewCTACard - 今日の復習 CTA カード（Indigo Pro）
// empty / due / done 3状態
// イラスト帯削除・2px角丸・オフセット影・ボタン黒背景
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { SystemColors } from '../theme/colors';

interface ReviewCTACardProps {
  dueCount: number;
  overdueCount: number;
  todayCompleted: number;
  streakDays: number;
  totalItems: number;
  estimatedMinutes?: number;
  categories?: string[];
  onStart: () => void;
  onStartExtra: () => void;
  onStartURLAdd: () => void;
}

// オフセット影（iOS: shadow / Android: border代替）
const cardShadowStyle = Platform.select({
  ios: {
    shadowColor: '#E5E5E5',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  default: {
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderRightColor: '#E5E5E5',
    borderBottomColor: '#E5E5E5',
  },
});

export function ReviewCTACard({
  dueCount,
  overdueCount,
  todayCompleted,
  streakDays,
  totalItems,
  estimatedMinutes,
  categories,
  onStart,
  onStartExtra,
  onStartURLAdd,
}: ReviewCTACardProps) {
  const { colors, isDark } = useTheme();

  const heroState: 'empty' | 'due' | 'done' =
    totalItems === 0 ? 'empty' : dueCount > 0 ? 'due' : 'done';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.separator },
        !isDark && cardShadowStyle,
      ]}
    >
      {/* ── empty: アイテム未登録 ── */}
      {heroState === 'empty' && (
        <View style={styles.heroBody}>
          <View style={[styles.heroIconCircle, { backgroundColor: colors.accent + '1A' }]}>
            <Ionicons name="sparkles-outline" size={28} color={colors.accent} />
          </View>
          <View style={styles.heroTexts}>
            <Text style={[styles.heroTitle, { color: colors.label }]}>ようこそ！</Text>
            <Text style={[styles.heroSub, { color: colors.labelSecondary }]}>
              URLを追加して最初のフラッシュカードを作りましょう
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.heroCTA,
              { backgroundColor: pressed ? '#171717CC' : '#171717' },
            ]}
            onPress={onStartURLAdd}
            accessibilityRole="button"
            accessibilityLabel="URLから学習カードを追加"
          >
            <Ionicons name="link-outline" size={18} color="#FFFFFF" />
            <Text style={styles.heroCTAText}>URLから追加</Text>
          </Pressable>
        </View>
      )}

      {/* ── due: 復習あり（イラスト帯なし） ── */}
      {heroState === 'due' && (
        <View style={styles.reviewBody}>
          <Text style={[styles.countText, { color: colors.label }]}>
            今日の復習{' '}
            <Text style={styles.countTextStrong}>{dueCount}件</Text>
          </Text>
          {(estimatedMinutes !== undefined || (categories && categories.length > 0)) && (
            <Text style={[styles.metaText, { color: colors.labelSecondary }]}>
              {estimatedMinutes !== undefined ? `推定 ${estimatedMinutes}分` : ''}
              {estimatedMinutes !== undefined && categories && categories.length > 0 ? ' · ' : ''}
              {categories && categories.length > 0 ? categories.join(', ') : ''}
            </Text>
          )}
          {overdueCount > 0 && (
            <Text style={styles.overdueText}>期限切れ {overdueCount}件</Text>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              { backgroundColor: '#171717', opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={onStart}
            accessibilityRole="button"
            accessibilityLabel="復習を始める"
          >
            <Ionicons name="play-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.startButtonText}>復習を始める</Text>
          </Pressable>
        </View>
      )}

      {/* ── done: 本日分完了 ── */}
      {heroState === 'done' && (
        <View style={styles.heroBody}>
          <View style={styles.doneRow}>
            <View style={[styles.doneIconWrap, { backgroundColor: colors.success + '1F' }]}>
              <Ionicons name="checkmark-circle" size={32} color={colors.success} />
            </View>
            <View style={styles.doneTexts}>
              <Text style={[styles.doneTitle, { color: colors.label }]}>本日分完了！</Text>
              <Text style={[styles.doneSub, { color: colors.labelSecondary }]}>
                今日 {todayCompleted} 件復習・{streakDays}日連続
              </Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.extraBtn,
              { borderColor: colors.label, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={onStartExtra}
            accessibilityRole="button"
            accessibilityLabel="追加学習を始める"
          >
            <Text style={[styles.extraBtnText, { color: colors.label }]}>
              追加学習を始める
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xs,
    overflow: 'hidden',
    marginTop: Spacing.s,
    borderWidth: 1,
  },

  // ── empty 状態 ──
  heroBody: {
    padding: Spacing.l,
    gap: Spacing.m,
  },
  heroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  heroTexts: {
    gap: Spacing.xs,
  },
  heroTitle: {
    ...TypeScale.title3,
    fontWeight: '700' as const,
  },
  heroSub: {
    ...TypeScale.subheadline,
  },
  heroCTA: {
    borderRadius: Radius.xs,
    paddingVertical: 9,
    paddingHorizontal: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  heroCTAText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },

  // ── due: ボディ（イラスト帯なし） ──
  reviewBody: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 6,
  },
  countText: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  countTextStrong: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
  },
  overdueText: {
    fontSize: 13,
    lineHeight: 18,
    color: SystemColors.red,
    fontWeight: '500' as const,
  },
  startButton: {
    borderRadius: Radius.xs,
    paddingVertical: 9,
    paddingHorizontal: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: 16,
    alignSelf: 'center',
    width: '50%',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 20,
  },

  // ── done 状態 ──
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
  },
  doneIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTexts: {
    flex: 1,
    gap: 2,
  },
  doneTitle: {
    ...TypeScale.title3,
    fontWeight: '700' as const,
  },
  doneSub: {
    ...TypeScale.subheadline,
  },
  extraBtn: {
    borderRadius: Radius.xs,
    paddingVertical: 9,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  extraBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
});
