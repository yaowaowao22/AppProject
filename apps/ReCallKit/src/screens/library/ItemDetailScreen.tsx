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
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import type { LibraryStackParamList } from '../../navigation/types';
import type { Item, Tag, Review } from '../../types';

type Props = NativeStackScreenProps<LibraryStackParamList, 'ItemDetail'>;

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
    } finally {
      setLoading(false);
    }
  }, [db, itemId]);

  useFocusEffect(
    useCallback(() => {
      loadItem();
    }, [loadItem])
  );

  useEffect(() => {
    if (item?.title) {
      navigation.setOptions({
        title: editMode ? '編集' : item.title,
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
            <Pressable onPress={enterEdit} hitSlop={8}>
              <Text style={{ color: colors.accent, fontSize: 17 }}>編集</Text>
            </Pressable>
          ),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, editMode, saving, colors]);

  // ---- 編集モード開始 ----
  const enterEdit = useCallback(() => {
    if (!item) return;
    setEditTitle(item.title);
    setEditContent(item.content);
    setEditCategory(item.category ?? '');
    setEditTags([...tags]);
    setNewTagInput('');
    setEditMode(true);
  }, [item, tags]);

  // ---- 編集キャンセル ----
  const cancelEdit = useCallback(() => {
    setEditMode(false);
    setNewTagInput('');
  }, []);

  // ---- タグ追加（編集中） ----
  const addEditTag = useCallback(() => {
    const name = newTagInput.trim();
    if (!name) return;
    if (editTags.some((t) => t.name === name)) {
      setNewTagInput('');
      return;
    }
    // 仮IDとして負の値を使用（保存時にDB側で正式IDが付与される）
    setEditTags((prev) => [...prev, { id: -Date.now(), name, description: null }]);
    setNewTagInput('');
  }, [newTagInput, editTags]);

  // ---- タグ削除（編集中） ----
  const removeEditTag = useCallback((tagId: number) => {
    setEditTags((prev) => prev.filter((t) => t.id !== tagId));
  }, []);

  // ---- 保存処理 ----
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

      // アイテム更新
      await db.runAsync(
        `UPDATE items
         SET title = ?, content = ?, category = ?, updated_at = datetime('now','localtime')
         WHERE id = ?`,
        [title, content, category, itemId]
      );

      // タグ再設定: 既存の item_tags を削除して再挿入
      await db.runAsync('DELETE FROM item_tags WHERE item_id = ?', [itemId]);

      for (const tag of editTags) {
        // タグが既存かどうか確認（名前で検索）
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
      <View style={[styles.center, { backgroundColor: colors.backgroundGrouped }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const cardShadow = isDark ? {} : CardShadow;

  // ---- 編集モードUI ----
  if (editMode) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.backgroundGrouped }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + Spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* タイトル編集 */}
          <Text style={[styles.editLabel, { color: colors.labelSecondary }]}>タイトル</Text>
          <TextInput
            style={[styles.editInput, { color: colors.label, backgroundColor: colors.card, borderColor: colors.separator }, cardShadow]}
            value={editTitle}
            onChangeText={setEditTitle}
            placeholder="タイトル"
            placeholderTextColor={colors.labelTertiary}
            autoCapitalize="none"
          />

          {/* 内容編集 */}
          <Text style={[styles.editLabel, { color: colors.labelSecondary }]}>内容</Text>
          <TextInput
            style={[styles.editTextarea, { color: colors.label, backgroundColor: colors.card, borderColor: colors.separator }, cardShadow]}
            value={editContent}
            onChangeText={setEditContent}
            placeholder="内容"
            placeholderTextColor={colors.labelTertiary}
            multiline
            autoCapitalize="none"
          />

          {/* カテゴリ編集 */}
          <Text style={[styles.editLabel, { color: colors.labelSecondary }]}>カテゴリ</Text>
          <TextInput
            style={[styles.editInput, { color: colors.label, backgroundColor: colors.card, borderColor: colors.separator }, cardShadow]}
            value={editCategory}
            onChangeText={setEditCategory}
            placeholder="カテゴリ（省略可）"
            placeholderTextColor={colors.labelTertiary}
            autoCapitalize="none"
          />

          {/* タグ編集 */}
          <Text style={[styles.editLabel, { color: colors.labelSecondary }]}>タグ</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator }, cardShadow]}>
            {/* 現在のタグ一覧 */}
            <View style={styles.editTagRow}>
              {editTags.map((tag) => (
                <View
                  key={tag.id}
                  style={[styles.editTagChip, { backgroundColor: colors.backgroundSecondary }]}
                >
                  <Text style={[styles.editTagText, { color: colors.label }]}>{tag.name}</Text>
                  <Pressable onPress={() => removeEditTag(tag.id)} hitSlop={6}>
                    <Ionicons name="close" size={14} color={colors.labelSecondary} />
                  </Pressable>
                </View>
              ))}
            </View>
            {/* タグ追加入力 */}
            <View style={[styles.tagInputRow, { borderTopColor: colors.separator }]}>
              <TextInput
                style={[styles.tagInput, { color: colors.label }]}
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

  // ---- 表示モードUI ----
  return (
    <ScrollView
      style={{ backgroundColor: colors.backgroundGrouped }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + Spacing.xxl }]}
    >
      {/* タイトル */}
      <Text style={[styles.title, { color: colors.label }]}>{item.title}</Text>

      {/* カテゴリ */}
      {item.category ? (
        <View style={styles.categoryRow}>
          <Ionicons name="folder-outline" size={14} color={colors.labelTertiary} />
          <Text style={[styles.categoryText, { color: colors.labelSecondary }]}>{item.category}</Text>
        </View>
      ) : null}

      {/* タグ */}
      {tags.length > 0 && (
        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <View key={tag.id} style={[styles.tag, { backgroundColor: colors.backgroundSecondary, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator }]}>
              <Text style={[styles.tagText, { color: colors.labelSecondary }]}>{tag.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* コンテンツ */}
      <View style={[styles.card, { backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator }, cardShadow]}>
        <Text style={[styles.content, { color: colors.label }]}>{item.content}</Text>
      </View>

      {/* 復習情報 */}
      {review && (
        <View style={[styles.card, { backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator }, cardShadow]}>
          <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>復習状態</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.labelSecondary }]}>繰り返し回数</Text>
            <Text style={[styles.infoValue, { color: colors.label }]}>{review.repetitions}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.labelSecondary }]}>次の復習</Text>
            <Text style={[styles.infoValue, { color: colors.label }]}>{review.next_review_at}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.labelSecondary }]}>間隔</Text>
            <Text style={[styles.infoValue, { color: colors.label }]}>{review.interval_days}日</Text>
          </View>
        </View>
      )}

      {/* メタ情報 */}
      <View style={[styles.card, { backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator }, cardShadow]}>
        <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>情報</Text>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.labelSecondary }]}>タイプ</Text>
          <Text style={[styles.infoValue, { color: colors.label }]}>{item.type}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.labelSecondary }]}>作成日</Text>
          <Text style={[styles.infoValue, { color: colors.label }]}>{item.created_at}</Text>
        </View>
        {item.source_url && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.labelSecondary }]}>ソース</Text>
            <Text style={[styles.infoValue, { color: colors.info }]} numberOfLines={1}>
              {item.source_url}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: Spacing.m,
    paddingBottom: Spacing.xxl,
    gap: Spacing.m,
  },
  title: {
    ...TypeScale.title2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryText: {
    ...TypeScale.footnote,
  },
  tagRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  tagText: {
    ...TypeScale.caption1,
  },
  card: {
    borderRadius: Radius.m,
    padding: Spacing.m,
    gap: Spacing.s,
  },
  content: {
    ...TypeScale.bodyJA,
  },
  sectionTitle: {
    ...TypeScale.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    ...TypeScale.subheadline,
  },
  infoValue: {
    ...TypeScale.subheadline,
    fontWeight: '500',
  },

  // ---- 編集モード ----
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
});
