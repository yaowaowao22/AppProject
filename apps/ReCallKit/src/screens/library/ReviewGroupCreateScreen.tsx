// ============================================================
// ReviewGroupCreateScreen
// カテゴリ/タグで絞り込み → アイテム選択 → グループ作成
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  SectionList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import {
  useItems,
  useTags,
  useCategories,
  useMemoFilter,
} from '../../hooks/useLibrary';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LibraryStackParamList } from '../../navigation/types';
import type { ItemWithMeta } from '../../types';
import { useDB } from '../../hooks/useDatabase';
import { createReviewGroup } from '../../db/reviewGroupRepository';

type Props = NativeStackScreenProps<LibraryStackParamList, 'ReviewGroupCreate'>;

// ---- 日付グループ化 ----------------------------------------
type DateSection = { title: string; data: ItemWithMeta[] };

function groupByDate(items: ItemWithMeta[]): DateSection[] {
  const now = new Date();
  const groups = new Map<string, ItemWithMeta[]>();
  for (const item of items) {
    const diffDays = Math.floor(
      (now.getTime() - new Date(item.created_at).getTime()) / 86400000
    );
    const key =
      diffDays === 0 ? '今日' :
      diffDays === 1 ? '昨日' :
      diffDays <= 7  ? '今週' :
      diffDays <= 30 ? '今月' : 'それ以前';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  const ORDER = ['今日', '昨日', '今週', '今月', 'それ以前'];
  return ORDER.filter((k) => groups.has(k)).map((title) => ({
    title,
    data: groups.get(title)!,
  }));
}

// ---- フィルターチップ ----------------------------------------
function Chip({
  label,
  active,
  onPress,
  activeColor,
  bgColor,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  activeColor: string;
  bgColor: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={[
        styles.chip,
        { backgroundColor: active ? activeColor : bgColor },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? '#FFFFFF' : colors.labelSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}


// ---- メインコンポーネント ------------------------------------
export function ReviewGroupCreateScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const db = useDB();

  // ---- フィルター状態 ----
  const [search, setSearch] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // ---- 選択状態 ----
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // ---- グループ名 ----
  const [groupName, setGroupName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filter = useMemoFilter(search, 'all', selectedTagIds, 'all', 'all', selectedCategory);
  const { items, isLoading } = useItems(filter);
  const { tags } = useTags();
  const { categories } = useCategories();

  const sections = useMemo(() => groupByDate(items), [items]);
  const cardShadow = isDark ? {} : CardShadow;

  const chipActive = colors.accent;
  const chipBg = colors.backgroundSecondary;

  // ---- タグ選択トグル ----
  const toggleTag = useCallback((tagId: number) => {
    if (Platform.OS !== 'web') {
      try { Haptics.selectionAsync(); } catch {}
    }
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }, []);

  // ---- カテゴリ選択トグル ----
  const toggleCategory = useCallback((cat: string) => {
    if (Platform.OS !== 'web') {
      try { Haptics.selectionAsync(); } catch {}
    }
    setSelectedCategory((prev) => (prev === cat ? null : cat));
  }, []);

  // ---- アイテム選択トグル ----
  const toggleItem = useCallback((itemId: number) => {
    if (Platform.OS !== 'web') {
      try { Haptics.selectionAsync(); } catch {}
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  // ---- 全選択 / 全解除 ----
  const toggleAll = useCallback(() => {
    if (Platform.OS !== 'web') {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }, [items, selectedIds.size]);

  // ---- グループ保存 ----
  const handleSave = useCallback(async () => {
    const name = groupName.trim();
    if (!name) {
      Alert.alert('グループ名を入力してください');
      return;
    }
    if (selectedIds.size === 0) {
      Alert.alert('アイテムを1件以上選択してください');
      return;
    }

    setIsSaving(true);
    try {
      await createReviewGroup(db, name, null, Array.from(selectedIds));
      if (Platform.OS !== 'web') {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      }
      navigation.goBack();
    } catch (err) {
      console.error('[ReviewGroupCreate] save error:', err);
      Alert.alert('エラー', 'グループの保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }, [db, groupName, selectedIds, navigation]);

  // ---- カードレンダラー ----
  const renderItem = ({ item }: { item: ItemWithMeta }) => {
    const isSelected = selectedIds.has(item.id);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.card },
          cardShadow,
          pressed && { opacity: 0.85 },
          isSelected && { borderWidth: 2, borderColor: colors.accent },
        ]}
        onPress={() => toggleItem(item.id)}
      >
        {/* チェックサークル */}
        <View
          style={[
            styles.checkCircle,
            {
              borderColor: isSelected ? colors.accent : colors.separator,
              backgroundColor: isSelected ? colors.accent : 'transparent',
            },
          ]}
        >
          {isSelected && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
        </View>

        {/* カテゴリバッジ */}
        <View style={styles.cardMeta}>
          {item.category ? (
            <View style={[styles.catBadge, { backgroundColor: colors.accent + '22' }]}>
              <Text style={[styles.catBadgeText, { color: colors.accent }]}>
                {item.category}
              </Text>
            </View>
          ) : null}
          {item.tags.slice(0, 2).map((tag) => (
            <View key={tag.id} style={[styles.tagBadge, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.tagBadgeText, { color: colors.labelSecondary }]}>
                {tag.name}
              </Text>
            </View>
          ))}
          {item.tags.length > 2 && (
            <Text style={[styles.tagBadgeText, { color: colors.labelTertiary }]}>
              +{item.tags.length - 2}
            </Text>
          )}
        </View>

        {/* タイトル */}
        <Text style={[styles.cardTitle, { color: colors.label }]} numberOfLines={2}>
          {item.title}
        </Text>
      </Pressable>
    );
  };

  // ---- セクションヘッダー ----
  const renderSectionHeader = ({ section }: { section: DateSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionHeaderText, { color: colors.labelSecondary }]}>
        {section.title}
      </Text>
    </View>
  );

  const allSelected = items.length > 0 && selectedIds.size === items.length;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.backgroundGrouped }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 44}
    >
      {/* グループ名入力エリア */}
      <View style={[styles.nameSection, { backgroundColor: colors.card, borderBottomColor: colors.separator }]}>
        <Ionicons name="folder-outline" size={18} color={colors.accent} />
        <TextInput
          style={[styles.nameInput, { color: colors.label }]}
          placeholder="グループ名を入力..."
          placeholderTextColor={colors.labelTertiary}
          value={groupName}
          onChangeText={setGroupName}
          returnKeyType="done"
          autoCorrect={false}
        />
      </View>

      {/* 検索バー */}
      <View style={[styles.searchBar, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name="search" size={16} color={colors.labelTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.label }]}
          placeholder="アイテムを検索..."
          placeholderTextColor={colors.labelTertiary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.labelTertiary} />
          </Pressable>
        )}
      </View>

      {/* フィルターエリア（タグ or カテゴリが存在する場合のみ） */}
      {(categories.length > 0 || tags.length > 0) && (
        <View style={styles.filterArea}>
          {/* フィルターヘッダー */}
          <View style={styles.filterHeader}>
            <Text style={[styles.filterHeaderLabel, { color: colors.labelTertiary }]}>
              フィルター
              {(selectedTagIds.length > 0 || selectedCategory) && (
                <Text style={{ color: colors.accent }}>
                  {' '}({selectedTagIds.length + (selectedCategory ? 1 : 0)})
                </Text>
              )}
            </Text>
            {(selectedTagIds.length > 0 || selectedCategory) && (
              <Pressable
                onPress={() => { setSelectedTagIds([]); setSelectedCategory(null); }}
                hitSlop={8}
                style={styles.clearBtn}
              >
                <Ionicons name="close-circle" size={13} color={colors.accent} />
                <Text style={[styles.clearBtnText, { color: colors.accent }]}>クリア</Text>
              </Pressable>
            )}
          </View>

          {/* カテゴリチップ行 */}
          {categories.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipContent}
            >
              <Chip label="全て" active={selectedCategory === null} onPress={() => setSelectedCategory(null)} activeColor={chipActive} bgColor={chipBg} />
              {categories.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  active={selectedCategory === cat}
                  onPress={() => toggleCategory(cat)}
                  activeColor={chipActive}
                  bgColor={chipBg}
                />
              ))}
            </ScrollView>
          )}

          {/* タグチップ行 */}
          {tags.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipContent}
            >
              {tags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={`#${tag.name}  ${tag.count}`}
                  active={selectedTagIds.includes(tag.id)}
                  onPress={() => toggleTag(tag.id)}
                  activeColor={chipActive}
                  bgColor={chipBg}
                />
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* 全選択バー */}
      {items.length > 0 && (
        <View style={[styles.selectAllBar, { borderBottomColor: colors.separator }]}>
          <Text style={[styles.selectAllCount, { color: colors.labelSecondary }]}>
            {selectedIds.size}件選択
          </Text>
          <Pressable onPress={toggleAll} hitSlop={8}>
            <Text style={[styles.selectAllBtn, { color: colors.accent }]}>
              {allSelected ? '全解除' : '全選択'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* アイテムリスト */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={40} color={colors.labelTertiary} />
          <Text style={[styles.emptyText, { color: colors.labelSecondary }]}>
            {search ? '見つかりませんでした' : 'アイテムがありません'}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 80 + Spacing.l },
          ]}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* ボトムバー：保存ボタン */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.separator,
            paddingBottom: insets.bottom + Spacing.s,
          },
        ]}
      >
        <Pressable
          style={[
            styles.saveBtn,
            {
              backgroundColor:
                selectedIds.size > 0 && groupName.trim()
                  ? colors.accent
                  : colors.backgroundSecondary,
            },
          ]}
          onPress={handleSave}
          disabled={isSaving || selectedIds.size === 0 || !groupName.trim()}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons
                name="layers-outline"
                size={18}
                color={
                  selectedIds.size > 0 && groupName.trim()
                    ? '#FFFFFF'
                    : colors.labelTertiary
                }
              />
              <Text
                style={[
                  styles.saveBtnText,
                  {
                    color:
                      selectedIds.size > 0 && groupName.trim()
                        ? '#FFFFFF'
                        : colors.labelTertiary,
                  },
                ]}
              >
                {selectedIds.size > 0
                  ? `${selectedIds.size}件でグループ作成`
                  : 'アイテムを選択してください'}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================================
// スタイル
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.m,
  },

  // ---- グループ名入力 ----
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.s,
  },
  nameInput: {
    flex: 1,
    ...TypeScale.body,
    fontWeight: '600' as const,
    padding: 0,
  },

  // ---- 検索バー ----
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.m,
    marginTop: Spacing.s,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.s,
    borderRadius: Radius.s,
    height: 34,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...TypeScale.footnote,
    padding: 0,
  },

  // ---- フィルターエリア ----
  filterArea: {
    marginBottom: Spacing.xs,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.xs,
    paddingBottom: 2,
  },
  filterHeaderLabel: {
    ...TypeScale.caption1,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  clearBtnText: {
    ...TypeScale.caption1,
    fontWeight: '600' as const,
  },

  // ---- フィルターチップ ----
  chipScroll: {
    flexGrow: 0,
    marginBottom: 2,
  },
  chipContent: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  chipRowIcon: {
    marginRight: 2,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    height: 28,
    justifyContent: 'center',
  },
  chipText: {
    ...TypeScale.caption1,
    fontWeight: '500' as const,
  },

  // ---- 全選択バー ----
  selectAllBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  selectAllCount: {
    ...TypeScale.caption1,
  },
  selectAllBtn: {
    ...TypeScale.caption1,
    fontWeight: '600' as const,
  },

  // ---- リスト ----
  list: {
    paddingHorizontal: Spacing.m,
  },
  sectionHeader: {
    paddingTop: Spacing.m,
    paddingBottom: Spacing.xs,
  },
  sectionHeaderText: {
    ...TypeScale.caption1,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ---- カード ----
  card: {
    borderRadius: Radius.m,
    padding: Spacing.m,
    marginBottom: Spacing.s,
    gap: Spacing.xs,
  },
  checkCircle: {
    position: 'absolute',
    top: Spacing.s,
    right: Spacing.s,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    paddingRight: 28,
  },
  catBadge: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  catBadgeText: {
    ...TypeScale.caption2,
    fontWeight: '500' as const,
  },
  tagBadge: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  tagBadgeText: {
    ...TypeScale.caption2,
  },
  cardTitle: {
    ...TypeScale.subheadline,
    paddingRight: 28,
  },

  // ---- 空状態 ----
  emptyText: {
    ...TypeScale.body,
  },

  // ---- ボトムバー ----
  bottomBar: {
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.s,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.m,
    height: 50,
    gap: Spacing.s,
  },
  saveBtnText: {
    ...TypeScale.body,
    fontWeight: '600' as const,
  },
});
