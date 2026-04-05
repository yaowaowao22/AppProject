// ============================================================
// LibraryScreen - ライブラリ一覧
// タグ/カテゴリチップフィルター + 日付グループ + 複数選択削除
// ============================================================

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  SectionList,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import { FilterChip } from '../../components/FilterChip';
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
import { HeaderHamburger } from '../../components/HeaderHamburger';

type Props = NativeStackScreenProps<LibraryStackParamList, 'LibraryMain'>;

// ---- アイコン/ラベルマッピング ----------------------------
const TYPE_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  url: 'link-outline',
  text: 'document-text-outline',
  screenshot: 'image-outline',
};

const TYPE_LABELS: Record<string, string> = {
  url: 'URL',
  text: 'テキスト',
  screenshot: '画像',
};

// ---- 日付グループ化 ----------------------------------------
type DateSection = { title: string; data: ItemWithMeta[] };

function groupByDate(items: ItemWithMeta[]): DateSection[] {
  const now = new Date();
  const groups = new Map<string, ItemWithMeta[]>();

  for (const item of items) {
    const created = new Date(item.created_at);
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let key: string;
    if (diffDays === 0) key = '今日';
    else if (diffDays === 1) key = '昨日';
    else if (diffDays <= 7) key = '今週';
    else if (diffDays <= 30) key = '今月';
    else key = 'それ以前';

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  const ORDER = ['今日', '昨日', '今週', '今月', 'それ以前'];
  return ORDER
    .filter((k) => groups.has(k))
    .map((title) => ({ title, data: groups.get(title)! }));
}

// ---- 日付フォーマット ----------------------------------------
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今日';
  if (diffDays === 1) return '昨日';
  if (diffDays < 7) return `${diffDays}日前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`;
  return `${Math.floor(diffDays / 365)}年前`;
}

// ---- 復習ステータス ----------------------------------------
function getReviewStatus(item: ItemWithMeta): { text: string; isOverdue: boolean } | null {
  if (!item.review) return null;
  const now = new Date();
  const next = new Date(item.review.next_review_at);
  const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return { text: '復習待ち', isOverdue: true };
  if (diffDays === 1) return { text: '明日', isOverdue: false };
  return { text: `${diffDays}日後`, isOverdue: false };
}

// ---- メインコンポーネント ------------------------------------
export function LibraryScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const db = useDB();

  // ---- フィルター状態 ----
  const [search, setSearch] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // ---- 選択削除モード状態 ----
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const filter = useMemoFilter(search, 'all', selectedTagIds, 'all', 'all', selectedCategory);
  const { items, isLoading, refresh } = useItems(filter);
  const { tags } = useTags();
  const { categories } = useCategories();

  const sections = useMemo(() => groupByDate(items), [items]);
  const cardShadow = isDark ? {} : CardShadow;

  // ---- チップ用カラー ----
  const chipActiveColor = colors.accent;
  const chipBgColor = colors.backgroundSecondary;
  const chipTextActive = '#FFFFFF';
  const chipTextInactive = colors.labelSecondary;

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

  // ---- 選択モード開始（ロングプレス） ----
  const enterSelectionMode = useCallback((itemId: number) => {
    if (Platform.OS !== 'web') {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    }
    setSelectionMode(true);
    setSelectedIds(new Set([itemId]));
  }, []);

  // ---- 選択モード終了 ----
  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  // ---- アイテム選択トグル ----
  const toggleItemSelection = useCallback((itemId: number) => {
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

  // ---- 選択アイテム削除（アーカイブ） ----
  const deleteSelected = useCallback(async () => {
    const count = selectedIds.size;
    Alert.alert(
      '削除確認',
      `選択した${count}件を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const ids = Array.from(selectedIds);
              const placeholders = ids.map(() => '?').join(',');
              await db.runAsync(
                `UPDATE items SET archived = 1, updated_at = datetime('now','localtime') WHERE id IN (${placeholders})`,
                ids
              );
              exitSelectionMode();
              refresh();
            } catch (err) {
              console.error('[LibraryScreen] delete error:', err);
              Alert.alert('エラー', '削除に失敗しました');
            }
          },
        },
      ]
    );
  }, [selectedIds, db, exitSelectionMode, refresh]);

  // ---- ヘッダーボタン動的設定 ----
  useEffect(() => {
    if (selectionMode) {
      navigation.setOptions({
        headerLeft: () => (
          <Text style={{ ...TypeScale.subheadline, fontWeight: '600' as const, color: colors.label }}>
            {selectedIds.size}件選択中
          </Text>
        ),
        headerRight: () => (
          <Pressable onPress={exitSelectionMode} hitSlop={8}>
            <Text style={{ ...TypeScale.body, color: colors.accent }}>キャンセル</Text>
          </Pressable>
        ),
      });
    } else {
      navigation.setOptions({
        headerLeft: () => <HeaderHamburger />,
        headerRight: () => (
          <Pressable onPress={() => setSelectionMode(true)} hitSlop={8}>
            <Text style={{ ...TypeScale.body, color: colors.accent }}>選択</Text>
          </Pressable>
        ),
      });
    }
  }, [selectionMode, selectedIds.size, colors, navigation, exitSelectionMode]);

  // ---- カードレンダラー ----
  const renderItem = ({ item }: { item: ItemWithMeta }) => {
    const rs = getReviewStatus(item);
    const iconName = TYPE_ICONS[item.type] ?? 'document-outline';
    const typeLabel = TYPE_LABELS[item.type] ?? item.type;
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
        onPress={() => {
          if (selectionMode) {
            toggleItemSelection(item.id);
          } else {
            navigation.navigate('ItemDetail', { itemId: item.id });
          }
        }}
        onLongPress={() => {
          if (!selectionMode) {
            enterSelectionMode(item.id);
          }
        }}
        delayLongPress={400}
      >
        {/* 選択チェックマーク */}
        {selectionMode && (
          <View style={[
            styles.checkCircle,
            { borderColor: isSelected ? colors.accent : colors.separator },
            isSelected && { backgroundColor: colors.accent },
          ]}>
            {isSelected && (
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            )}
          </View>
        )}

        {/* メタ行: タイプアイコン + ラベル + 復習バッジ */}
        <View style={styles.cardMeta}>
          <Ionicons name={iconName} size={13} color={colors.labelTertiary} />
          <Text style={[styles.cardMetaType, { color: colors.labelTertiary }]}>
            {typeLabel}
          </Text>
          {item.category ? (
            <View style={[styles.categoryBadge, { backgroundColor: colors.accent + '22' }]}>
              <Text style={[styles.categoryBadgeText, { color: colors.accent }]}>
                {item.category}
              </Text>
            </View>
          ) : null}
          {rs && (
            <View
              style={[
                styles.reviewBadge,
                {
                  backgroundColor: rs.isOverdue
                    ? colors.warning + '22'
                    : colors.success + '22',
                },
              ]}
            >
              <Text
                style={[
                  styles.reviewBadgeText,
                  { color: rs.isOverdue ? colors.warning : colors.success },
                ]}
              >
                {rs.text}
              </Text>
            </View>
          )}
        </View>

        {/* タイトル */}
        <Text style={[styles.cardTitle, { color: colors.label }]} numberOfLines={2}>
          {item.title}
        </Text>

        {/* 答え / エクサープト */}
        {(item.content || item.excerpt) ? (
          <Text
            style={[styles.cardExcerpt, { color: colors.labelSecondary }]}
            numberOfLines={2}
          >
            {item.content || item.excerpt}
          </Text>
        ) : null}

        {/* フッター: タグチップ + 日付 */}
        <View style={styles.cardFooter}>
          <View style={styles.tagRow}>
            {item.tags.slice(0, 3).map((tag) => (
              <View
                key={tag.id}
                style={[styles.tag, { backgroundColor: colors.backgroundSecondary, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator }]}
              >
                <Text style={[styles.tagText, { color: colors.labelSecondary }]}>
                  #{tag.name}
                </Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={[styles.tagMore, { color: colors.labelTertiary }]}>
                +{item.tags.length - 3}
              </Text>
            )}
          </View>
          <Text style={[styles.cardDate, { color: colors.labelTertiary }]}>
            {formatDate(item.created_at)}
          </Text>
        </View>
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

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundGrouped }]}>

      {/* 検索バー */}
      <View style={[styles.searchBar, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name="search" size={18} color={colors.labelTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.label }]}
          placeholder="検索..."
          placeholderTextColor={colors.labelTertiary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.labelTertiary} />
          </Pressable>
        )}
      </View>

      {/* フィルターエリア（タグ or カテゴリが存在する場合のみ） */}
      {(tags.length > 0 || categories.length > 0) && (
        <View style={styles.filterArea}>
          {/* フィルターヘッダー：ラベル + クリアボタン */}
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

          {/* タグチップ行 */}
          {tags.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipScrollContent}
            >
              {tags.map((tag) => (
                <FilterChip
                  key={tag.id}
                  label={`#${tag.name}  ${tag.count}`}
                  active={selectedTagIds.includes(tag.id)}
                  onPress={() => toggleTag(tag.id)}
                  icon="pricetag-outline"
                  activeColor={chipActiveColor}
                  bgColor={chipBgColor}
                  textActiveColor={chipTextActive}
                  textInactiveColor={chipTextInactive}
                />
              ))}
            </ScrollView>
          )}

          {/* カテゴリチップ行 */}
          {categories.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipScrollContent}
            >
              {categories.map((cat) => (
                <FilterChip
                  key={cat}
                  label={cat}
                  active={selectedCategory === cat}
                  onPress={() => toggleCategory(cat)}
                  icon="folder-outline"
                  activeColor={chipActiveColor}
                  bgColor={chipBgColor}
                  textActiveColor={chipTextActive}
                  textInactiveColor={chipTextInactive}
                />
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="library-outline" size={48} color={colors.labelTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.label }]}>
            {search ? '見つかりませんでした' : 'アイテムがありません'}
          </Text>
          {!search && (
            <Text style={[styles.emptySubtitle, { color: colors.labelSecondary }]}>
              ＋ボタンからアイテムを追加してください
            </Text>
          )}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 56 + Spacing.l + (selectionMode ? 64 : 0) },
          ]}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* FAB群（選択モード中は非表示） */}
      {!selectionMode && (
        <>
          {/* URL取り込み一覧ボタン */}
          <Pressable
            style={[
              styles.fab,
              styles.fabSecondary,
              { backgroundColor: colors.backgroundSecondary, bottom: insets.bottom + Spacing.l + 128, borderColor: colors.separator, shadowColor: colors.cardShadowColor },
            ]}
            onPress={() => navigation.navigate('URLImportList')}
            accessibilityRole="button"
            accessibilityLabel="URL取り込み一覧"
          >
            <Ionicons name="cloud-download-outline" size={22} color={colors.accent} />
          </Pressable>

          {/* グループ作成ボタン */}
          <Pressable
            style={[
              styles.fab,
              styles.fabSecondary,
              { backgroundColor: colors.backgroundSecondary, bottom: insets.bottom + Spacing.l + 64, borderColor: colors.separator, shadowColor: colors.cardShadowColor },
            ]}
            onPress={() => navigation.navigate('ReviewGroupCreate')}
            accessibilityRole="button"
            accessibilityLabel="グループを作成"
          >
            <Ionicons name="layers-outline" size={22} color={colors.accent} />
          </Pressable>

          {/* アイテム追加 FAB */}
          <Pressable
            style={[styles.fab, { backgroundColor: colors.accent, bottom: insets.bottom + Spacing.l, shadowColor: colors.cardShadowColor }]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
              }
              navigation.navigate('AddItem', {});
            }}
            accessibilityRole="button"
            accessibilityLabel="アイテムを追加"
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </Pressable>
        </>
      )}

      {/* 選択モード時のボトムバー */}
      {selectionMode && (
        <View
          style={[
            styles.selectionBar,
            {
              backgroundColor: colors.card,
              bottom: insets.bottom,
              borderTopColor: colors.separator,
            },
          ]}
        >
          <Pressable
            style={styles.selectionBarBtn}
            onPress={() => setSelectedIds(new Set(items.map((item) => item.id)))}
            hitSlop={8}
          >
            <Text style={[styles.selectionBarCancel, { color: colors.accent }]}>全選択</Text>
          </Pressable>
          <Pressable
            style={[styles.selectionBarBtn, { opacity: selectedIds.size === 0 ? 0.4 : 1 }]}
            onPress={deleteSelected}
            disabled={selectedIds.size === 0}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={22} color={colors.error} />
          </Pressable>
        </View>
      )}
    </View>
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

  // ---- 検索バー ----
  searchBar: {
    flex: 0,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.m,
    marginTop: Spacing.s,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.m,
    borderRadius: Radius.s,
    height: 44,
    minHeight: 44,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...TypeScale.body,
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
    flexShrink: 0,
    marginBottom: 2,
  },
  chipScrollContent: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  chipRowIcon: {
    marginRight: 2,
  },
  // ---- リスト ----
  list: {
    paddingHorizontal: Spacing.m,
  },

  // ---- セクションヘッダー ----
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
    gap: Spacing.s,
  },

  // 選択チェックサークル
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

  // メタ行（タイプ + カテゴリ + 復習バッジ）
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardMetaType: {
    ...TypeScale.caption2,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  categoryBadgeText: {
    ...TypeScale.caption2,
    fontWeight: '500' as const,
  },
  reviewBadge: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  reviewBadgeText: {
    ...TypeScale.caption2,
    fontWeight: '500' as const,
  },

  // タイトル
  cardTitle: {
    ...TypeScale.headline,
  },

  // エクサープト
  cardExcerpt: {
    ...TypeScale.footnote,
  },

  // フッター行（タグ + 日付）
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tagRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  tag: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  tagText: {
    ...TypeScale.caption2,
  },
  tagMore: {
    ...TypeScale.caption2,
  },
  cardDate: {
    ...TypeScale.caption2,
    flexShrink: 0,
  },

  // ---- 空状態 ----
  emptyTitle: {
    ...TypeScale.body,
    fontWeight: '600',
  },
  emptySubtitle: {
    ...TypeScale.caption1,
    textAlign: 'center',
  },

  // ---- FAB ----
  fab: {
    position: 'absolute',
    right: Spacing.m,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    right: Spacing.m + 4,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.12,
    elevation: 2,
  },

  // ---- 選択モードボトムバー ----
  selectionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.l,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  selectionBarBtn: {
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionBarCancel: {
    ...TypeScale.body,
  },
  selectionBarCount: {
    ...TypeScale.subheadline,
    fontWeight: '600',
  },
});
