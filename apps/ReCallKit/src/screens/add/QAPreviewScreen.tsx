// ============================================================
// QAPreviewScreen
// Bedrock解析結果のQ&Aペアをプレビューし、保存 or キャンセルを選択する画面
// 機能:
//   - 25件上限（超過時バナー表示）
//   - チェックボックスで選択保存
//   - インライン編集（質問・答え）
//   - 自動カテゴリタグをDBに保存
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { SQLiteDatabase } from 'expo-sqlite';
import { useDB } from '../../hooks/useDatabase';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import { SystemColors } from '../../theme/colors';
import type { LibraryStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<LibraryStackParamList, 'QAPreview'>;

// ---- 定数 ----
const MAX_ITEMS = 25;

// ---- カテゴリ設定 ----
const CATEGORY_CONFIG: Record<
  string,
  { icon: string; color: string; label: string }
> = {
  '技術':     { icon: '💻', color: SystemColors.blue,   label: '技術' },
  'ビジネス': { icon: '📈', color: SystemColors.green,  label: 'ビジネス' },
  '科学':     { icon: '🔬', color: SystemColors.teal,   label: '科学' },
  '語学':     { icon: '🗣', color: SystemColors.indigo, label: '語学' },
  '一般教養': { icon: '📜', color: SystemColors.orange, label: '一般教養' },
  'その他':   { icon: '📚', color: SystemColors.blue,   label: 'その他' },
  technology:   { icon: '💻', color: SystemColors.blue,   label: 'テクノロジー' },
  science:      { icon: '🔬', color: SystemColors.teal,   label: 'サイエンス' },
  business:     { icon: '📈', color: SystemColors.green,  label: 'ビジネス' },
  language:     { icon: '🗣', color: SystemColors.indigo, label: '語学' },
};

const DEFAULT_CATEGORY = { icon: '📚', color: SystemColors.blue, label: 'その他' };

function getCategoryConfig(raw: string) {
  return CATEGORY_CONFIG[raw.trim()] ?? CATEGORY_CONFIG[raw.toLowerCase().trim()] ?? { ...DEFAULT_CATEGORY, label: raw || 'その他' };
}

// カテゴリをタグとしてDBに登録し、tag_id を返す
async function upsertCategoryTag(
  db: SQLiteDatabase,
  categoryLabel: string,
): Promise<number> {
  await db.runAsync(
    'INSERT OR IGNORE INTO tags (name) VALUES (?)',
    [categoryLabel],
  );
  const row = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM tags WHERE name = ?',
    [categoryLabel],
  );
  return row!.id;
}

// ============================================================

export function QAPreviewScreen({ route, navigation }: Props) {
  const { url, title, summary, qa_pairs: rawPairs, category } = route.params;
  const { colors } = useTheme();
  const db = useDB();
  const insets = useSafeAreaInsets();

  // 25件上限
  const wasTruncated = rawPairs.length > MAX_ITEMS;
  const clippedPairs = useMemo(
    () => rawPairs.slice(0, MAX_ITEMS),
    [rawPairs],
  );

  // ---- ローカル編集コピー ----
  const [editedQAs, setEditedQAs] = useState<{ question: string; answer: string }[]>(
    () => clippedPairs.map((p) => ({ ...p })),
  );

  // ---- 選択状態（初期は全選択） ----
  const [selected, setSelected] = useState<boolean[]>(
    () => clippedPairs.map(() => true),
  );

  // ---- 展開インデックス ----
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // ---- 編集中インデックス ----
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // ---- 保存中フラグ ----
  const [saving, setSaving] = useState(false);

  const catConfig = getCategoryConfig(category);
  const selectedCount = selected.filter(Boolean).length;
  const allSelected = selected.every(Boolean);

  // ---- 選択トグル ----
  const toggleSelect = useCallback((index: number) => {
    setSelected((prev) => prev.map((v, i) => (i === index ? !v : v)));
  }, []);

  // ---- 全選択 / 全解除 ----
  const toggleSelectAll = useCallback(() => {
    setSelected((prev) => prev.map(() => !allSelected));
  }, [allSelected]);

  // ---- 展開トグル（編集中は展開固定） ----
  const toggleExpand = useCallback((index: number) => {
    if (editingIndex === index) return;
    setExpandedIndex((prev) => (prev === index ? null : index));
  }, [editingIndex]);

  // ---- 編集開始 ----
  const startEdit = useCallback((index: number) => {
    setExpandedIndex(index);
    setEditingIndex(index);
  }, []);

  // ---- 編集確定 ----
  const commitEdit = useCallback((index: number) => {
    setEditingIndex(null);
  }, []);

  // ---- 編集テキスト更新 ----
  const updateQuestion = useCallback((index: number, text: string) => {
    setEditedQAs((prev) =>
      prev.map((q, i) => (i === index ? { ...q, question: text } : q)),
    );
  }, []);

  const updateAnswer = useCallback((index: number, text: string) => {
    setEditedQAs((prev) =>
      prev.map((q, i) => (i === index ? { ...q, answer: text } : q)),
    );
  }, []);

  // ---- 選択した件を保存 ----
  const handleSaveSelected = useCallback(async () => {
    const targets = editedQAs.filter((_, i) => selected[i]);
    if (targets.length === 0) {
      Alert.alert('未選択', '保存するQ&Aを1件以上選択してください');
      return;
    }

    setSaving(true);
    try {
      // カテゴリをタグとして登録
      const tagId = await upsertCategoryTag(db, catConfig.label);

      for (const qa of targets) {
        // items に保存（category列含む）
        const result = await db.runAsync(
          `INSERT INTO items (type, title, content, excerpt, source_url, category, created_at, updated_at, archived)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now','localtime'), datetime('now','localtime'), 0)`,
          ['text', qa.question, qa.answer, summary, url, catConfig.label],
        );

        const itemId = result.lastInsertRowId;

        // タグを紐付け
        await db.runAsync(
          'INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)',
          [itemId, tagId],
        );

        // 即座に復習対象にする
        await db.runAsync(
          `INSERT INTO reviews (item_id, repetitions, easiness_factor, interval_days, next_review_at, quality_history)
           VALUES (?, 0, 2.5, 0, datetime('now','localtime'), '[]')`,
          [itemId],
        );
      }

      Alert.alert(
        '保存完了',
        `${targets.length}件のQ&Aをライブラリに追加しました`,
        [{ text: 'OK', onPress: () => navigation.popToTop() }],
      );
    } catch (err) {
      Alert.alert('エラー', '保存に失敗しました');
      console.error('[QAPreviewScreen] save error:', err);
    } finally {
      setSaving(false);
    }
  }, [db, url, summary, editedQAs, selected, catConfig, navigation]);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={[styles.root, { backgroundColor: colors.backgroundGrouped }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xxl + 72 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── ソース情報カード ─── */}
        <View style={[styles.sourceCard, { backgroundColor: colors.card }, CardShadow]}>
          <View style={styles.categoryRow}>
            <View style={[styles.categoryChip, { backgroundColor: catConfig.color + '1A' }]}>
              <Text style={styles.categoryIcon}>{catConfig.icon}</Text>
              <Text style={[styles.categoryLabel, { color: catConfig.color }]}>
                {catConfig.label}
              </Text>
            </View>
            <View style={[styles.autoBadge, { backgroundColor: colors.accent + '1A' }]}>
              <Text style={[styles.autoBadgeText, { color: colors.accent }]}>AI自動判定</Text>
            </View>
          </View>

          <Text style={[styles.sourceTitle, { color: colors.label }]} numberOfLines={3}>
            {title}
          </Text>

          {summary.length > 0 && (
            <Text style={[styles.sourceSummary, { color: colors.labelSecondary }]} numberOfLines={4}>
              {summary}
            </Text>
          )}

          <Text style={[styles.sourceUrl, { color: colors.labelTertiary }]} numberOfLines={1}>
            {url}
          </Text>
        </View>

        {/* ─── 25件超過バナー ─── */}
        {wasTruncated && (
          <View style={[styles.truncateBanner, { backgroundColor: SystemColors.orange + '1A', borderColor: SystemColors.orange + '40' }]}>
            <Ionicons name="information-circle-outline" size={16} color={SystemColors.orange} />
            <Text style={[styles.truncateBannerText, { color: SystemColors.orange }]}>
              AI生成 {rawPairs.length}件 → 先頭{MAX_ITEMS}件を表示（上限）
            </Text>
          </View>
        )}

        {/* ─── セクションヘッダー ─── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>Q&Aペア</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.accent + '1A' }]}>
            <Text style={[styles.countText, { color: colors.accent }]}>
              {selectedCount}/{editedQAs.length}件選択
            </Text>
          </View>
          {/* 全選択 / 全解除ボタン */}
          <Pressable
            onPress={toggleSelectAll}
            hitSlop={8}
            style={[styles.selectAllButton, { borderColor: colors.separator }]}
            accessibilityRole="button"
            accessibilityLabel={allSelected ? '全解除' : '全選択'}
          >
            <Text style={[styles.selectAllText, { color: colors.accent }]}>
              {allSelected ? '全解除' : '全選択'}
            </Text>
          </Pressable>
        </View>

        {/* ─── Q&Aカード一覧 ─── */}
        {editedQAs.map((qa, index) => {
          const isExpanded = expandedIndex === index;
          const isEditing = editingIndex === index;
          const isSelected = selected[index];

          return (
            <View
              key={index}
              style={[
                styles.qaCard,
                { backgroundColor: colors.card },
                !isSelected && styles.qaCardDeselected,
                CardShadow,
              ]}
            >
              {/* ─ カードヘッダー（チェック・インデックス・編集・展開） ─ */}
              <Pressable
                style={styles.qaHeader}
                onPress={() => toggleExpand(index)}
                accessibilityRole="button"
                accessibilityLabel={`Q&A ${index + 1}: ${qa.question}`}
                accessibilityState={{ expanded: isExpanded, checked: isSelected }}
              >
                {/* チェックボックス */}
                <Pressable
                  onPress={() => toggleSelect(index)}
                  hitSlop={8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`Q${index + 1}を${isSelected ? '選択解除' : '選択'}`}
                >
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={isSelected ? colors.accent : colors.labelTertiary}
                  />
                </Pressable>

                {/* インデックスバッジ */}
                <View style={[styles.qaIndexBadge, { backgroundColor: colors.accent + '1A' }]}>
                  <Text style={[styles.qaIndexText, { color: colors.accent }]}>
                    Q{index + 1}
                  </Text>
                </View>

                <View style={{ flex: 1 }} />

                {/* 編集ボタン */}
                <Pressable
                  onPress={() => isEditing ? commitEdit(index) : startEdit(index)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={isEditing ? '編集を確定' : '編集'}
                  style={[styles.editButton, { borderColor: isEditing ? colors.accent : colors.separator }]}
                >
                  <Ionicons
                    name={isEditing ? 'checkmark-outline' : 'pencil-outline'}
                    size={14}
                    color={isEditing ? colors.accent : colors.labelSecondary}
                  />
                  <Text style={[styles.editButtonText, { color: isEditing ? colors.accent : colors.labelSecondary }]}>
                    {isEditing ? '確定' : '編集'}
                  </Text>
                </Pressable>

                {/* 展開シェブロン */}
                {!isEditing && (
                  <Text
                    style={[
                      styles.chevron,
                      { color: colors.labelTertiary },
                      isExpanded && styles.chevronExpanded,
                    ]}
                  >
                    ›
                  </Text>
                )}
              </Pressable>

              {/* ─ 質問テキスト or 編集 ─ */}
              {isEditing ? (
                <TextInput
                  style={[
                    styles.editInput,
                    { color: colors.label, borderColor: colors.accent + '60', backgroundColor: colors.backgroundGrouped },
                  ]}
                  value={qa.question}
                  onChangeText={(text) => updateQuestion(index, text)}
                  multiline
                  placeholder="質問"
                  placeholderTextColor={colors.labelTertiary}
                  accessibilityLabel="質問を編集"
                />
              ) : (
                <Text
                  style={[styles.question, { color: isSelected ? colors.label : colors.labelTertiary }]}
                  numberOfLines={isExpanded ? undefined : 2}
                >
                  {qa.question}
                </Text>
              )}

              {/* ─ 答えエリア（展開時 or 編集時） ─ */}
              {(isExpanded || isEditing) && (
                <View style={[styles.answerContainer, { borderTopColor: colors.separator }]}>
                  <Text style={[styles.answerLabel, { color: colors.labelTertiary }]}>答え</Text>
                  {isEditing ? (
                    <TextInput
                      style={[
                        styles.editInput,
                        { color: colors.labelSecondary, borderColor: colors.separator, backgroundColor: colors.backgroundGrouped },
                      ]}
                      value={qa.answer}
                      onChangeText={(text) => updateAnswer(index, text)}
                      multiline
                      placeholder="答え"
                      placeholderTextColor={colors.labelTertiary}
                      accessibilityLabel="答えを編集"
                    />
                  ) : (
                    <Text style={[styles.answer, { color: colors.labelSecondary }]}>
                      {qa.answer}
                    </Text>
                  )}
                </View>
              )}
            </View>
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
              backgroundColor: pressed ? colors.backgroundSecondary : colors.backgroundGrouped,
              borderColor: colors.separator,
            },
          ]}
          onPress={handleCancel}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="キャンセル"
        >
          <Text style={[styles.cancelButtonText, { color: colors.label }]}>キャンセル</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            {
              backgroundColor:
                selectedCount === 0
                  ? colors.backgroundSecondary
                  : pressed
                  ? colors.accent + 'CC'
                  : colors.accent,
            },
            (saving || selectedCount === 0) && styles.buttonDisabled,
          ]}
          onPress={handleSaveSelected}
          disabled={saving || selectedCount === 0}
          accessibilityRole="button"
          accessibilityLabel={`選択した${selectedCount}件を保存`}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={[styles.saveButtonText, { color: selectedCount === 0 ? colors.labelTertiary : '#FFFFFF' }]}>
              {selectedCount}件を保存
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

  // 25件超過バナー
  truncateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: Radius.m,
    borderWidth: 1,
  },
  truncateBannerText: {
    ...TypeScale.footnote,
    flex: 1,
    lineHeight: 18,
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
  selectAllButton: {
    marginLeft: 'auto',
    paddingHorizontal: Spacing.s,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  selectAllText: {
    ...TypeScale.caption1,
    fontWeight: '600',
  },

  // Q&Aカード
  qaCard: {
    borderRadius: Radius.m,
    padding: Spacing.m,
    gap: Spacing.s,
  },
  qaCardDeselected: {
    opacity: 0.5,
  },
  qaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.s,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  editButtonText: {
    ...TypeScale.caption2,
    fontWeight: '600',
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
  editInput: {
    ...TypeScale.body,
    borderWidth: 1,
    borderRadius: Radius.s,
    padding: Spacing.s,
    minHeight: 60,
    lineHeight: 22,
  },
  answerContainer: {
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
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
