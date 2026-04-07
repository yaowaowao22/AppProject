// ============================================================
// ReviewCTACard - 今日の復習 CTA カード
// empty / due / done 3状態（モックアップ準拠）
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { GoogleCalendarColors } from '../theme/colors';

interface ReviewCTACardProps {
  /** 今日の復習対象件数 */
  dueCount: number;
  /** うち期限切れ件数 */
  overdueCount: number;
  /** 今日すでに復習した件数 */
  todayCompleted: number;
  /** 連続学習日数 */
  streakDays: number;
  /** 総アイテム数（0 のとき「アイテム未登録」状態） */
  totalItems: number;
  /** 推定復習時間（分）*/
  estimatedMinutes?: number;
  /** 復習対象カテゴリ一覧 */
  categories?: string[];
  /** 「復習を始める」押下 */
  onStart: () => void;
  /** 「追加学習を始める」押下（全完了時） */
  onStartExtra: () => void;
  /** 「URLから追加」押下（empty時） */
  onStartURLAdd: () => void;
}

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
  const { colors } = useTheme();

  const heroState: 'empty' | 'due' | 'done' =
    totalItems === 0 ? 'empty' : dueCount > 0 ? 'due' : 'done';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.separator },
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
              { backgroundColor: pressed ? colors.accent + 'CC' : colors.accent },
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

      {/* ── due: 復習あり ── */}
      {heroState === 'due' && (
        <>
          {/* イラスト帯 */}
          <View style={styles.reviewIllust}>
            <View style={[styles.illustCard, styles.illustCardBack2]} />
            <View style={[styles.illustCard, styles.illustCardBack1]} />
            <View style={[styles.illustCard, styles.illustCardFront]} />
          </View>

          {/* ボディ */}
          <View style={styles.reviewBody}>
            <Text style={[styles.countText, { color: colors.label }]}>
              今日の復習{' '}
              <Text style={styles.countTextStrong}>{dueCount}件</Text>
            </Text>
            {(estimatedMinutes !== undefined || (categories && categories.length > 0)) && (
              <Text style={styles.metaText}>
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
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={onStart}
              accessibilityRole="button"
              accessibilityLabel="復習を始める"
            >
              <Ionicons name="play-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.startButtonText}>復習を始める</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* ── done: 本日分完了 ── */}
      {heroState === 'done' && (
        <View style={styles.heroBody}>
          <View style={styles.doneRow}>
            <View style={[styles.doneIconWrap, { backgroundColor: colors.success + '1F' }]}>
              <Ionicons name="checkmark-circle" size={32} color={colors.success} />
            </View>
            <View style={styles.doneTexts}>
              <Text style={[styles.doneTitle, { color: colors.success }]}>本日分完了！</Text>
              <Text style={[styles.doneSub, { color: colors.labelSecondary }]}>
                今日 {todayCompleted} 件復習・{streakDays}日連続
              </Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.extraBtn,
              { borderColor: colors.accent, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={onStartExtra}
            accessibilityRole="button"
            accessibilityLabel="追加学習を始める"
          >
            <Text style={[styles.extraBtnText, { color: colors.accent }]}>
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
    borderRadius: 12,
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
    borderRadius: Radius.m,
    paddingVertical: Spacing.m,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  heroCTAText: {
    ...TypeScale.headline,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },

  // ── due: イラスト帯 ──
  reviewIllust: {
    height: 140,
    backgroundColor: '#FFECB3',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  illustCard: {
    position: 'absolute',
    width: 90,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 3,
  },
  illustCardBack2: {
    transform: [{ rotate: '-12deg' }, { translateX: -50 }, { translateY: 8 }],
    backgroundColor: '#FFE082',
  },
  illustCardBack1: {
    transform: [{ rotate: '6deg' }, { translateX: 40 }, { translateY: -4 }],
    backgroundColor: '#FFECB3',
  },
  illustCardFront: {
    transform: [{ rotate: '-2deg' }],
  },

  // ── due: ボディ ──
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
    color: GoogleCalendarColors.textSecondary,
  },
  overdueText: {
    fontSize: 13,
    lineHeight: 18,
    color: GoogleCalendarColors.red,
    fontWeight: '500' as const,
  },
  startButton: {
    backgroundColor: GoogleCalendarColors.blue,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: 16,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500' as const,
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
    borderRadius: Radius.m,
    paddingVertical: Spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  extraBtnText: {
    ...TypeScale.headline,
    fontWeight: '600' as const,
  },
});
