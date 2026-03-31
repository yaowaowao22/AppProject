// ============================================================
// QAPreviewScreen
// Bedrock解析結果のQ&Aペアをプレビューし、保存 or キャンセルを選択する画面
// ios-uiux準拠・カテゴリ自動判定バッジ付き
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useDB } from '../../hooks/useDatabase';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import { SystemColors } from '../../theme/colors';
import type { LibraryStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<LibraryStackParamList, 'QAPreview'>;

// ---- カテゴリ設定 ----
// Bedrock が返すカテゴリ文字列と表示用アイコン・カラーのマッピング
const CATEGORY_CONFIG: Record<
  string,
  { icon: string; color: string; label: string }
> = {
  technology:   { icon: '💻', color: SystemColors.blue,   label: 'テクノロジー' },
  science:      { icon: '🔬', color: SystemColors.teal,   label: 'サイエンス' },
  business:     { icon: '📈', color: SystemColors.green,  label: 'ビジネス' },
  health:       { icon: '🏃', color: SystemColors.green,  label: 'ヘルス' },
  history:      { icon: '📜', color: SystemColors.orange, label: '歴史' },
  culture:      { icon: '🎨', color: SystemColors.purple, label: 'カルチャー' },
  language:     { icon: '🗣', color: SystemColors.indigo, label: '語学' },
  mathematics:  { icon: '📐', color: SystemColors.indigo, label: '数学' },
  philosophy:   { icon: '🤔', color: SystemColors.purple, label: '哲学' },
  news:         { icon: '📰', color: SystemColors.orange, label: 'ニュース' },
};

const DEFAULT_CATEGORY = { icon: '📚', color: SystemColors.blue, label: 'その他' };

function getCategoryConfig(raw: string) {
  const key = raw.toLowerCase().trim();
  return CATEGORY_CONFIG[key] ?? { ...DEFAULT_CATEGORY, label: raw || 'その他' };
}

// ============================================================

export function QAPreviewScreen({ route, navigation }: Props) {
  const { url, title, summary, qa_pairs, category } = route.params;
  const { colors } = useTheme();
  const db = useDB();
  const insets = useSafeAreaInsets();

  const [saving, setSaving] = useState(false);
  // どのQ&Aカードが展開されているか（インデックス）
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const catConfig = getCategoryConfig(category);

  const handleSaveAll = useCallback(async () => {
    if (qa_pairs.length === 0) {
      Alert.alert('エラー', '保存するQ&Aがありません');
      return;
    }

    setSaving(true);
    try {
      // 各Q&Aペアをアイテムとして保存
      for (const qa of qa_pairs) {
        const result = await db.runAsync(
          `INSERT INTO items (type, title, content, excerpt, source_url, created_at, updated_at, archived)
           VALUES (?, ?, ?, ?, ?, datetime('now','localtime'), datetime('now','localtime'), 0)`,
          [
            'text',
            qa.question,
            qa.answer,
            summary,
            url,
          ],
        );

        // 即座に復習対象にする
        await db.runAsync(
          `INSERT INTO reviews (item_id, repetitions, easiness_factor, interval_days, next_review_at, quality_history)
           VALUES (?, 0, 2.5, 0, datetime('now','localtime'), '[]')`,
          [result.lastInsertRowId],
        );
      }

      Alert.alert(
        '保存完了',
        `${qa_pairs.length}件のQ&Aをライブラリに追加しました`,
        [{ text: 'OK', onPress: () => navigation.popToTop() }],
      );
    } catch (err) {
      Alert.alert('エラー', '保存に失敗しました');
      console.error('[QAPreviewScreen] save error:', err);
    } finally {
      setSaving(false);
    }
  }, [db, url, summary, qa_pairs, navigation]);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const toggleExpand = useCallback((index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.backgroundGrouped }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xxl + 72 }, // ボタンエリア分の余白
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── ソース情報カード ─── */}
        <View
          style={[
            styles.sourceCard,
            { backgroundColor: colors.card },
            CardShadow,
          ]}
        >
          {/* カテゴリチップ（自動判定バッジ付き） */}
          <View style={styles.categoryRow}>
            <View
              style={[
                styles.categoryChip,
                { backgroundColor: catConfig.color + '1A' },
              ]}
            >
              <Text style={styles.categoryIcon}>{catConfig.icon}</Text>
              <Text
                style={[styles.categoryLabel, { color: catConfig.color }]}
              >
                {catConfig.label}
              </Text>
            </View>
            <View
              style={[
                styles.autoBadge,
                { backgroundColor: colors.accent + '1A' },
              ]}
            >
              <Text style={[styles.autoBadgeText, { color: colors.accent }]}>
                AI自動判定
              </Text>
            </View>
          </View>

          {/* タイトル */}
          <Text
            style={[styles.sourceTitle, { color: colors.label }]}
            numberOfLines={3}
          >
            {title}
          </Text>

          {/* サマリー */}
          {summary.length > 0 && (
            <Text
              style={[styles.sourceSummary, { color: colors.labelSecondary }]}
              numberOfLines={4}
            >
              {summary}
            </Text>
          )}

          {/* URL */}
          <Text
            style={[styles.sourceUrl, { color: colors.labelTertiary }]}
            numberOfLines={1}
          >
            {url}
          </Text>
        </View>

        {/* ─── Q&A数ヘッダー ─── */}
        <View style={styles.sectionHeader}>
          <Text
            style={[styles.sectionTitle, { color: colors.labelSecondary }]}
          >
            Q&Aペア
          </Text>
          <View
            style={[
              styles.countBadge,
              { backgroundColor: colors.accent + '1A' },
            ]}
          >
            <Text style={[styles.countText, { color: colors.accent }]}>
              {qa_pairs.length}件
            </Text>
          </View>
        </View>

        {/* ─── Q&Aカード一覧 ─── */}
        {qa_pairs.map((qa, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.qaCard,
                {
                  backgroundColor: pressed
                    ? colors.backgroundSecondary
                    : colors.card,
                },
                CardShadow,
              ]}
              onPress={() => toggleExpand(index)}
              accessibilityRole="button"
              accessibilityLabel={`Q&A ${index + 1}: ${qa.question}`}
              accessibilityState={{ expanded: isExpanded }}
            >
              {/* Q&Aインデックス + 展開インジケーター */}
              <View style={styles.qaHeader}>
                <View
                  style={[
                    styles.qaIndexBadge,
                    { backgroundColor: colors.accent + '1A' },
                  ]}
                >
                  <Text style={[styles.qaIndexText, { color: colors.accent }]}>
                    Q{index + 1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.chevron,
                    { color: colors.labelTertiary },
                    isExpanded && styles.chevronExpanded,
                  ]}
                >
                  ›
                </Text>
              </View>

              {/* 質問文 */}
              <Text
                style={[styles.question, { color: colors.label }]}
                numberOfLines={isExpanded ? undefined : 2}
              >
                {qa.question}
              </Text>

              {/* 回答（展開時のみ表示） */}
              {isExpanded && (
                <View
                  style={[
                    styles.answerContainer,
                    { borderTopColor: colors.separator },
                  ]}
                >
                  <Text
                    style={[styles.answerLabel, { color: colors.labelTertiary }]}
                  >
                    答え
                  </Text>
                  <Text style={[styles.answer, { color: colors.labelSecondary }]}>
                    {qa.answer}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ─── 固定ボタンエリア ─── */}
      <View
        style={[
          styles.buttonArea,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.separator,
            paddingBottom: Math.max(insets.bottom, Spacing.m),
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.cancelButton,
            {
              backgroundColor: pressed
                ? colors.backgroundSecondary
                : colors.backgroundGrouped,
              borderColor: colors.separator,
            },
          ]}
          onPress={handleCancel}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="キャンセル"
        >
          <Text style={[styles.cancelButtonText, { color: colors.label }]}>
            キャンセル
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            {
              backgroundColor: pressed
                ? colors.accent + 'CC'
                : colors.accent,
            },
            saving && styles.buttonDisabled,
          ]}
          onPress={handleSaveAll}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={`${qa_pairs.length}件を保存`}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>
              {qa_pairs.length}件を保存
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ============================================================
// スタイル
// ============================================================

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.m,
    gap: Spacing.s,
  },

  // ソースカード
  sourceCard: {
    borderRadius: Radius.m,
    padding: Spacing.m,
    gap: Spacing.s,
    marginBottom: Spacing.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    flexWrap: 'wrap',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.s,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryLabel: {
    ...TypeScale.footnote,
    fontWeight: '600',
  },
  autoBadge: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  autoBadgeText: {
    ...TypeScale.caption2,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  sourceTitle: {
    ...TypeScale.headline,
  },
  sourceSummary: {
    ...TypeScale.subheadline,
    lineHeight: 20,
  },
  sourceUrl: {
    ...TypeScale.caption1,
    marginTop: Spacing.xs,
  },

  // セクションヘッダー
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    marginTop: Spacing.s,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    ...TypeScale.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  countBadge: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  countText: {
    ...TypeScale.caption2,
    fontWeight: '700',
  },

  // Q&Aカード
  qaCard: {
    borderRadius: Radius.m,
    padding: Spacing.m,
  },
  qaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.s,
  },
  qaIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaIndexText: {
    ...TypeScale.caption1,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '300',
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  question: {
    ...TypeScale.body,
    lineHeight: 24,
  },
  answerContainer: {
    marginTop: Spacing.m,
    paddingTop: Spacing.m,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
  },
  answerLabel: {
    ...TypeScale.caption1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  answer: {
    ...TypeScale.subheadline,
    lineHeight: 22,
  },

  // 固定ボタンエリア
  buttonArea: {
    flexDirection: 'row',
    gap: Spacing.s,
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.m,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: Radius.m,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  cancelButtonText: {
    ...TypeScale.headline,
  },
  saveButton: {
    flex: 2,
    height: 50,
    borderRadius: Radius.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    ...TypeScale.headline,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
