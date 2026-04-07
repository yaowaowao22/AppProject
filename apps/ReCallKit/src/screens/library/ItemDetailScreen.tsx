import React, { useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDB } from '../../hooks/useDatabase';
import { useTheme } from '../../theme/ThemeContext';
import { GoogleCalendarColors } from '../../theme/colors';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import type { LibraryStackParamList } from '../../navigation/types';
import type { Item, Tag, Review, DeepDive } from '../../types';
import { getDeepDivesForItem } from '../../db/deepDiveRepository';
import { DeepDiveButton } from '../../components/DeepDiveButton';
import { DeepDiveResultModal } from '../../components/DeepDiveResultModal';
import { subscribeDeepDive } from '../../services/deepDiveService';

type Props = NativeStackScreenProps<LibraryStackParamList, 'ItemDetail'>;

// ---- カテゴリカラーマップ ----
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Programming: { bg: GoogleCalendarColors.pillBlueBg, text: GoogleCalendarColors.blue },
  Design: { bg: GoogleCalendarColors.pillAmberBg, text: '#B06000' },
  Infrastructure: { bg: GoogleCalendarColors.pillGreenBg, text: GoogleCalendarColors.green },
};

function getCategoryPill(category: string): { bg: string; text: string } {
  return CATEGORY_COLORS[category] ?? { bg: GoogleCalendarColors.pillBlueBg, text: GoogleCalendarColors.blue };
}

// ---- 次の復習までの日数テキスト ----
function getNextReviewText(review: Review): string {
  const now = new Date();
  const next = new Date(review.next_review_at);
  const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return '今日';
  if (diffDays === 1) return '明日';
  return `${diffDays}日`;
}

export function ItemDetailScreen({ route }: Props) {
  const { itemId } = route.params;
  const db = useDB();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [item, setItem] = useState<Item | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [deepDives, setDeepDives] = useState<DeepDive[]>([]);
  const [deepDiveModalVisible, setDeepDiveModalVisible] = useState(false);

  // ---- 編集モード状態 ----
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState<Tag[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const loadItem = useCallback(async () => {
    setLoading(true);
    try {
      const row = await db.getFirstAsync<Item>(
        'SELECT * FROM items WHERE id = ?',
        [itemId]
      );
      setItem(row ?? null);

      const tagRows = await db.getAllAsync<Tag>(
        `SELECT t.id, t.name, t.description FROM tags t
         JOIN item_tags it ON it.tag_id = t.id
         WHERE it.item_id = ?`,
        [itemId]
      );
      setTags(tagRows);

      const reviewRow = await db.getFirstAsync<Review>(
        'SELECT * FROM reviews WHERE item_id = ?',
        [itemId]
      );
      setReview(reviewRow ?? null);

      const dives = await getDeepDivesForItem(db, itemId);
      setDeepDives(dives);
    } finally {
      setLoading(false);
    }
  }, [db, itemId]);

  useFocusEffect(
    useCallback(() => {
      loadItem();
    }, [loadItem])
  );

  // 深掘り状態変更を購読してリロード
  useEffect(() => {
    const unsub = subscribeDeepDive(() => {
      if (db) {
        getDeepDivesForItem(db, itemId).then(setDeepDives);
      }
    });
    return unsub;
  }, [db, itemId]);

  useEffect(() => {
    if (item?.title) {
      navigation.setOptions({
        title: editMode ? '編集' : '',
        headerRight: () =>
          editMode ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={cancelEdit} hitSlop={8}>
                <Text style={{ color: colors.labelSecondary, fontSize: 17 }}>キャンセル</Text>
              </Pressable>
              <Pressable onPress={saveEdit} hitSlop={8} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <Text style={{ color: colors.accent, fontSize: 17, fontWeight: '600' }}>保存</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={enterEdit} hitSlop={8} style={s.editIconBtn}>
              <Ionicons name="create-outline" size={20} color={colors.labelSecondary} />
            </Pressable>
          ),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, editMode, saving, colors]);

  // ---- 編集モード ----
  const enterEdit = useCallback(() => {
    if (!item) return;
    setEditTitle(item.title);
    setEditContent(item.content);
    setEditCategory(item.category ?? '');
    setEditTags([...tags]);
    setNewTagInput('');
    setEditMode(true);
  }, [item, tags]);

  const cancelEdit = useCallback(() => {
    setEditMode(false);
    setNewTagInput('');
  }, []);

  const addEditTag = useCallback(() => {
    const name = newTagInput.trim();
    if (!name) return;
    if (editTags.some((t) => t.name === name)) {
      setNewTagInput('');
      return;
    }
    setEditTags((prev) => [...prev, { id: -Date.now(), name, description: null }]);
    setNewTagInput('');
  }, [newTagInput, editTags]);

  const removeEditTag = useCallback((tagId: number) => {
    setEditTags((prev) => prev.filter((t) => t.id !== tagId));
  }, []);

  const saveEdit = useCallback(async () => {
    const title = editTitle.trim();
    const content = editContent.trim();
    if (!title) {
      Alert.alert('エラー', 'タイトルを入力してください');
      return;
    }
    if (!content) {
      Alert.alert('エラー', '内容を入力してください');
      return;
    }

    setSaving(true);
    try {
      const category = editCategory.trim() || null;

      await db.runAsync(
        `UPDATE items
         SET title = ?, content = ?, category = ?, updated_at = datetime('now','localtime')
         WHERE id = ?`,
        [title, content, category, itemId]
      );

      await db.runAsync('DELETE FROM item_tags WHERE item_id = ?', [itemId]);

      for (const tag of editTags) {
        let tagId: number;
        const existing = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM tags WHERE name = ?',
          [tag.name]
        );
        if (existing) {
          tagId = existing.id;
        } else {
          const result = await db.runAsync(
            'INSERT INTO tags (name) VALUES (?)',
            [tag.name]
          );
          tagId = result.lastInsertRowId;
        }
        await db.runAsync(
          'INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)',
          [itemId, tagId]
        );
      }

      await loadItem();
      setEditMode(false);
    } catch (err) {
      console.error('[ItemDetailScreen] save error:', err);
      Alert.alert('エラー', '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }, [db, itemId, editTitle, editContent, editCategory, editTags, loadItem]);

  if (loading || !item) {
    return (
      <View style={[s.center, { backgroundColor: colors.backgroundGrouped }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  // ---- 編集モードUI ----
  if (editMode) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.backgroundGrouped }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[s.editContainer, { paddingBottom: insets.bottom + Spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[s.editLabel, { color: colors.labelSecondary }]}>タイトル</Text>
          <TextInput
            style={[s.editInput, { color: colors.label, backgroundColor: colors.card, borderColor: colors.separator }]}
            value={editTitle}
            onChangeText={setEditTitle}
            placeholder="タイトル"
            placeholderTextColor={colors.labelTertiary}
            autoCapitalize="none"
          />

          <Text style={[s.editLabel, { color: colors.labelSecondary }]}>内容</Text>
          <TextInput
            style={[s.editTextarea, { color: colors.label, backgroundColor: colors.card, borderColor: colors.separator }]}
            value={editContent}
            onChangeText={setEditContent}
            placeholder="内容"
            placeholderTextColor={colors.labelTertiary}
            multiline
            autoCapitalize="none"
          />

          <Text style={[s.editLabel, { color: colors.labelSecondary }]}>カテゴリ</Text>
          <TextInput
            style={[s.editInput, { color: colors.label, backgroundColor: colors.card, borderColor: colors.separator }]}
            value={editCategory}
            onChangeText={setEditCategory}
            placeholder="カテゴリ（省略可）"
            placeholderTextColor={colors.labelTertiary}
            autoCapitalize="none"
          />

          <Text style={[s.editLabel, { color: colors.labelSecondary }]}>タグ</Text>
          <View style={[s.editTagCard, { backgroundColor: colors.card, borderColor: colors.separator }]}>
            <View style={s.editTagRow}>
              {editTags.map((tag) => (
                <View
                  key={tag.id}
                  style={[s.editTagChip, { backgroundColor: colors.backgroundSecondary }]}
                >
                  <Text style={[s.editTagText, { color: colors.label }]}>{tag.name}</Text>
                  <Pressable onPress={() => removeEditTag(tag.id)} hitSlop={6}>
                    <Ionicons name="close" size={14} color={colors.labelSecondary} />
                  </Pressable>
                </View>
              ))}
            </View>
            <View style={[s.tagInputRow, { borderTopColor: colors.separator }]}>
              <TextInput
                style={[s.tagInput, { color: colors.label }]}
                value={newTagInput}
                onChangeText={setNewTagInput}
                placeholder="タグを追加..."
                placeholderTextColor={colors.labelTertiary}
                returnKeyType="done"
                onSubmitEditing={addEditTag}
                autoCapitalize="none"
              />
              <Pressable
                onPress={addEditTag}
                disabled={!newTagInput.trim()}
                style={{ opacity: newTagInput.trim() ? 1 : 0.4 }}
                hitSlop={8}
              >
                <Ionicons name="add-circle" size={24} color={colors.accent} />
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ---- 表示モードUI（モックアップ準拠） ----
  const catPill = item.category ? getCategoryPill(item.category) : null;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
    >
      {/* ── Hero: タグピル → タイトル ── */}
      <View style={s.hero}>
        <View style={s.pillRow}>
          {/* カテゴリピル */}
          {catPill && (
            <View style={[s.pill, { backgroundColor: catPill.bg }]}>
              <Text style={[s.pillText, { color: catPill.text }]}>{item.category}</Text>
            </View>
          )}
          {/* タグピル */}
          {tags.map((tag) => (
            <View key={tag.id} style={[s.pill, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[s.pillText, { color: colors.labelSecondary }]}>{tag.name}</Text>
            </View>
          ))}
        </View>
        <Text style={[s.detailTitle, { color: colors.label }]}>{item.title}</Text>
      </View>

      {/* ── セパレーター ── */}
      <View style={[s.sep, { backgroundColor: colors.separator }]} />

      {/* ── Answer セクション ── */}
      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: colors.labelTertiary }]}>ANSWER</Text>
        <Text style={[s.detailContent, { color: colors.label }]}>{item.content}</Text>
      </View>

      {/* ── セパレーター ── */}
      <View style={[s.sep, { backgroundColor: colors.separator }]} />

      {/* ── Review Info（3ボックス） ── */}
      {review && (
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.labelTertiary }]}>REVIEW INFO</Text>
          <View style={s.reviewBoxRow}>
            <View style={[s.reviewBox, { borderColor: colors.separator }]}>
              <Text style={[s.reviewBoxValue, { color: colors.label }]}>{review.repetitions}</Text>
              <Text style={[s.reviewBoxLabel, { color: colors.labelTertiary }]}>繰り返し</Text>
            </View>
            <View style={[s.reviewBox, { borderColor: colors.separator }]}>
              <Text style={[s.reviewBoxValue, { color: colors.label }]}>{getNextReviewText(review)}</Text>
              <Text style={[s.reviewBoxLabel, { color: colors.labelTertiary }]}>次の復習</Text>
            </View>
            <View style={[s.reviewBox, { borderColor: colors.separator }]}>
              <Text style={[s.reviewBoxValue, { color: colors.label }]}>{review.easiness_factor.toFixed(1)}</Text>
              <Text style={[s.reviewBoxLabel, { color: colors.labelTertiary }]}>EF</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── 深掘りセクション ── */}
      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: colors.labelTertiary }]}>AI DEEP DIVE</Text>
        <DeepDiveButton
          itemId={itemId}
          question={item.title}
          answer={item.content}
        />
        {deepDives.length > 0 && (
          <View style={{ marginTop: Spacing.s, gap: Spacing.s }}>
            {deepDives.slice(0, 2).map((dive) => (
              <Pressable
                key={dive.id}
                style={[s.deepDiveCard, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => setDeepDiveModalVisible(true)}
              >
                <Text style={[s.deepDiveText, { color: colors.label }]} numberOfLines={4}>
                  {dive.result}
                </Text>
                <Text style={[s.deepDiveMore, { color: colors.accent }]}>
                  タップして全文を見る
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={[s.sep, { backgroundColor: colors.separator }]} />

      {/* ── メタ情報（背景色つき） ── */}
      <View style={[s.metaSection, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={s.metaRow}>
          <Text style={[s.metaLabel, { color: colors.labelTertiary }]}>タイプ</Text>
          <Text style={[s.metaValue, { color: colors.label }]}>{item.type === 'url' ? 'URL' : item.type === 'text' ? 'テキスト' : item.type}</Text>
        </View>
        <View style={[s.metaRowBorder, { borderTopColor: colors.separator }]}>
          <Text style={[s.metaLabel, { color: colors.labelTertiary }]}>作成日</Text>
          <Text style={[s.metaValue, { color: colors.label }]}>{item.created_at.split(' ')[0]}</Text>
        </View>
        {item.source_url && (
          <View style={[s.metaRowBorder, { borderTopColor: colors.separator }]}>
            <Text style={[s.metaLabel, { color: colors.labelTertiary }]}>ソース</Text>
            <Text style={[s.metaValue, { color: colors.accent }]} numberOfLines={1}>
              {item.source_url.replace(/^https?:\/\//, '').substring(0, 30)}...
            </Text>
          </View>
        )}
      </View>
      <DeepDiveResultModal
        visible={deepDiveModalVisible}
        dives={deepDives}
        onClose={() => setDeepDiveModalVisible(false)}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---- Hero ----
  hero: {
    paddingHorizontal: Spacing.m,
    paddingTop: 24,
    paddingBottom: Spacing.m,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.m,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '500' as const,
    lineHeight: 31,
  },

  // ---- セパレーター ----
  sep: {
    height: 1,
    marginHorizontal: Spacing.m,
  },

  // ---- セクション ----
  section: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '500' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  detailContent: {
    fontSize: 15,
    lineHeight: 26,
  },

  // ---- Review Info 3ボックス ----
  reviewBoxRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewBox: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
  },
  reviewBoxValue: {
    fontSize: 18,
    fontWeight: '500' as const,
  },
  reviewBoxLabel: {
    fontSize: 11,
    marginTop: 2,
  },

  // ---- メタセクション ----
  metaSection: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  metaRowBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  metaLabel: {
    fontSize: 13,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '500' as const,
  },

  // ---- 編集モード ----
  editContainer: {
    padding: Spacing.m,
    gap: Spacing.m,
  },
  editLabel: {
    ...TypeScale.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: -Spacing.xs,
  },
  editInput: {
    borderRadius: Radius.m,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    ...TypeScale.body,
  },
  editTextarea: {
    borderRadius: Radius.m,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    ...TypeScale.bodyJA,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  editTagCard: {
    borderRadius: Radius.m,
    padding: Spacing.m,
    gap: Spacing.s,
    borderWidth: StyleSheet.hairlineWidth,
  },
  editTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    minHeight: 24,
  },
  editTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.s,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 4,
  },
  editTagText: {
    ...TypeScale.caption1,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.s,
    gap: Spacing.xs,
  },
  tagInput: {
    flex: 1,
    ...TypeScale.body,
    paddingVertical: 0,
  },
  editIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },

  // ---- 深掘りカード ----
  deepDiveCard: {
    borderRadius: Radius.m,
    padding: Spacing.m,
    gap: Spacing.xs,
  },
  deepDiveText: {
    fontSize: 14,
    lineHeight: 22,
  },
  deepDiveMore: {
    fontSize: 12,
    fontWeight: '500' as const,
    textAlign: 'right',
  },
});
