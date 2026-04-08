// ============================================================
// LibraryScreen - ライブラリ一覧
// モックアップ準拠: フラットリスト + カテゴリフィルターチップ
// ============================================================

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  UIManager,
} from 'react-native';

// Android で LayoutAnimation を有効化
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import * as Clipboard from 'expo-clipboard';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { GoogleCalendarColors } from '../../theme/colors';
import {
  useItems,
  useCategories,
  useMemoFilter,
} from '../../hooks/useLibrary';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LibraryStackParamList } from '../../navigation/types';
import type { ItemWithMeta } from '../../types';
import { useDB } from '../../hooks/useDatabase';
import { HeaderHamburger } from '../../components/HeaderHamburger';
import { WavySeparator } from '../../components/WavySeparator';

type Props = NativeStackScreenProps<LibraryStackParamList, 'LibraryMain'>;

// ---- カテゴリカラーマップ --------------------------------
const CATEGORY_COLORS: Record<string, string> = {
  Programming: GoogleCalendarColors.blue,
  Design: GoogleCalendarColors.amber,
  Infrastructure: GoogleCalendarColors.green,
};

function getCategoryColor(category: string | null): string {
  if (!category) return GoogleCalendarColors.textTertiary;
  return CATEGORY_COLORS[category] ?? GoogleCalendarColors.blue;
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

// ---- フィルタータイプ ----------------------------------------
type FilterType = 'all' | 'new' | 'overdue' | string; // string = category name

// ---- スワイプアクション定数 ----------------------------------
const SWIPE_ACTION_WIDTH = 88;

// ---- スワイプ削除アクション --------------------
function SwipeTrashAction({
  drag,
  onPress,
}: {
  drag: SharedValue<number>;
  onPress: () => void;
}) {
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + SWIPE_ACTION_WIDTH }],
  }));

  return (
    <Animated.View style={[styles.swipeActionWrapper, animStyle]}>
      <Pressable style={styles.swipeActionBtn} onPress={onPress} hitSlop={4}>
        <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
        <Text style={styles.swipeActionText}>削除</Text>
      </Pressable>
    </Animated.View>
  );
}

// ---- メインコンポーネント ------------------------------------
export function LibraryScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const db = useDB();

  // ---- フィルター状態 ----
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // ---- 選択削除モード状態 ----
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // ---- Swipeable refs ----
  const swipeableRefs = useRef<Map<number, import('react-native-gesture-handler/ReanimatedSwipeable').SwipeableMethods>>(new Map());

  // カテゴリフィルター: activeFilterがカテゴリ名の場合のみ適用
  const selectedCategory = (activeFilter !== 'all' && activeFilter !== 'new' && activeFilter !== 'overdue')
    ? activeFilter
    : null;

  const filter = useMemoFilter(search, 'all', [], 'all', 'all', selectedCategory);
  const { items: rawItems, isLoading, refresh } = useItems(filter);
  const { categories } = useCategories();

  // 特殊フィルター適用
  const items = useMemo(() => {
    if (activeFilter === 'new') {
      const now = new Date();
      return rawItems.filter((item) => {
        const created = new Date(item.created_at);
        const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      });
    }
    if (activeFilter === 'overdue') {
      const now = new Date();
      return rawItems.filter((item) => {
        if (!item.review) return false;
        const next = new Date(item.review.next_review_at);
        return next.getTime() <= now.getTime();
      });
    }
    return rawItems;
  }, [rawItems, activeFilter]);

  // ---- フィルターチップタップ ----
  const handleFilterPress = useCallback((filter: FilterType) => {
    if (Platform.OS !== 'web') {
      try { Haptics.selectionAsync(); } catch {}
    }
    setActiveFilter((prev) => (prev === filter ? 'all' : filter));
  }, []);

  // ---- 選択モード ----
  const enterSelectionMode = useCallback((itemId: number) => {
    if (Platform.OS !== 'web') {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    }
    setSelectionMode(true);
    setSelectedIds(new Set([itemId]));
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const toggleItemSelection = useCallback((itemId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const deleteSelected = useCallback(async () => {
    const count = selectedIds.size;
    Alert.alert(
      'ゴミ箱へ移動',
      `選択した${count}件をゴミ箱へ移動しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ゴミ箱へ移動',
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

  // ---- スワイプでゴミ箱 ----
  const handleArchiveItem = useCallback(async (id: number) => {
    if (Platform.OS !== 'web') {
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
    }
    try {
      await db.runAsync(
        `UPDATE items SET archived = 1, updated_at = datetime('now','localtime') WHERE id = ?`,
        [id]
      );
      refresh();
    } catch (err) {
      console.error('[LibraryScreen] archive error:', err);
      Alert.alert('エラー', 'ゴミ箱への移動に失敗しました');
    }
  }, [db, refresh]);

  // ---- ヘッダーボタン ----
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
          <Pressable
            onPress={() => navigation.navigate('URLAnalysis', {})}
            hitSlop={8}
            style={styles.headerAddBtn}
          >
            <Ionicons name="add" size={24} color={colors.labelSecondary} />
          </Pressable>
        ),
      });
    }
  }, [selectionMode, selectedIds.size, colors, navigation, exitSelectionMode]);

  // ---- カードレンダラー ----
  const renderItem = useCallback(({ item }: { item: ItemWithMeta }) => {
    const isSelected = selectedIds.has(item.id);
    const dotColor = getCategoryColor(item.category);

    const card = (
      <Pressable
        style={({ pressed }) => [
          styles.libCard,
          { borderBottomColor: isDark ? colors.separator : colors.backgroundSecondary },
          pressed && { backgroundColor: colors.backgroundSecondary },
          isSelected && { backgroundColor: colors.accent + '11' },
        ]}
        onPress={() => {
          if (selectionMode) {
            toggleItemSelection(item.id);
          } else {
            navigation.navigate('ItemDetail', { itemId: item.id });
          }
        }}
        onLongPress={() => {
          if (!selectionMode) enterSelectionMode(item.id);
        }}
        delayLongPress={400}
      >
        {/* 選択チェック */}
        {selectionMode && (
          <View style={[
            styles.checkCircle,
            { borderColor: isSelected ? colors.accent : colors.separator },
            isSelected && { backgroundColor: colors.accent },
          ]}>
            {isSelected && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
          </View>
        )}

        {/* タイトル */}
        <Text style={[styles.libCardTitle, { color: colors.label }]} numberOfLines={2}>
          {item.title}
        </Text>

        {/* メタ行: ドット + カテゴリ + · + 時間 */}
        <View style={styles.libCardMeta}>
          <View style={[styles.catDot, { backgroundColor: dotColor }]} />
          <Text style={[styles.libCardMetaText, { color: colors.labelTertiary }]}>
            {item.category ?? '未分類'}
          </Text>
          <Text style={[styles.libCardMetaSep, { color: colors.separator }]}>·</Text>
          <Text style={[styles.libCardMetaText, { color: colors.labelTertiary }]}>
            {formatDate(item.created_at)}
          </Text>
        </View>
      </Pressable>
    );

    return (
      <ReanimatedSwipeable
        ref={((ref: any) => {
          if (ref) swipeableRefs.current.set(item.id, ref);
          else swipeableRefs.current.delete(item.id);
        }) as any}
        friction={2}
        rightThreshold={SWIPE_ACTION_WIDTH * 0.4}
        renderRightActions={(_, drag) => (
          <SwipeTrashAction
            drag={drag}
            onPress={() => {
              swipeableRefs.current.get(item.id)?.close();
              handleArchiveItem(item.id);
            }}
          />
        )}
        enabled={!selectionMode}
      >
        {card}
      </ReanimatedSwipeable>
    );
  }, [colors, isDark, selectionMode, selectedIds, navigation, enterSelectionMode, toggleItemSelection, handleArchiveItem]);

  // ---- フィルターチップ構築 ----
  const filterChips: { key: FilterType; label: string }[] = useMemo(() => {
    const chips: { key: FilterType; label: string }[] = [
      { key: 'all', label: 'すべて' },
    ];
    for (const cat of categories) {
      chips.push({ key: cat, label: cat });
    }
    chips.push({ key: 'new', label: '新規' });
    chips.push({ key: 'overdue', label: '期限切れ' });
    return chips;
  }, [categories]);

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundGrouped }]}>

      {/* 検索バー（アウトライン） */}
      <View style={[styles.searchBar, { borderColor: colors.separator, backgroundColor: colors.background }]}>
        <Ionicons name="search" size={20} color={colors.labelTertiary} />
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

      {/* フィルターチップ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterScrollContent}
      >
        {filterChips.map((chip) => {
          const isActive = activeFilter === chip.key;
          return (
            <Pressable
              key={chip.key}
              style={[
                styles.filterChip,
                { borderColor: colors.separator },
                isActive && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
              onPress={() => handleFilterPress(chip.key)}
            >
              <Text style={[
                styles.filterChipText,
                { color: colors.labelSecondary },
                isActive && { color: colors.onAccent },
              ]}>
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <WavySeparator />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="library-outline" size={48} color={colors.labelTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.labelSecondary }]}>
            {search || activeFilter !== 'all' ? '見つかりませんでした' : 'アイテムがありません'}
          </Text>
          {!search && activeFilter === 'all' && (
            <Text style={[styles.emptySub, { color: colors.labelTertiary }]}>
              URLから知識を取り込んで{'\n'}学習を始めましょう
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 56 + Spacing.l + (selectionMode ? 64 : 0),
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB群 */}
      {!selectionMode && (
        <>
          <Pressable
            style={[
              styles.fab,
              styles.fabSecondary,
              {
                backgroundColor: colors.backgroundSecondary,
                bottom: insets.bottom + Spacing.l + 64,
                borderColor: colors.separator,
                shadowColor: '#000',
              },
            ]}
            onPress={() => navigation.navigate('Trash')}
            accessibilityLabel="ゴミ箱"
          >
            <Ionicons name="trash-outline" size={22} color={colors.labelSecondary} />
          </Pressable>

          <Pressable
            style={[styles.fab, { backgroundColor: colors.accent, bottom: insets.bottom + Spacing.l, shadowColor: '#000' }]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
              }
              navigation.navigate('AddItem', {});
            }}
            accessibilityLabel="アイテムを追加"
          >
            <Ionicons name="add" size={28} color={colors.onAccent} />
          </Pressable>
        </>
      )}

      {/* 選択モードボトムバー */}
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
            <Text style={[styles.selectionBarText, { color: colors.accent }]}>全選択</Text>
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
    paddingHorizontal: 40,
  },

  // ---- ヘッダー追加ボタン ----
  headerAddBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },

  // ---- 検索バー（アウトライン） ----
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.m,
    marginTop: Spacing.s,
    marginBottom: Spacing.s,
    paddingHorizontal: Spacing.m,
    borderRadius: Radius.m,
    height: 44,
    gap: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400' as const,
    padding: 0,
  },

  // ---- フィルターチップ ----
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterScrollContent: {
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.s,
    gap: Spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },

  // ---- リストアイテム（lib-card） ----
  libCard: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
  },
  libCardTitle: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 21,
  },
  libCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  libCardMetaText: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  libCardMetaSep: {
    fontSize: 12,
  },

  // 選択チェック
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

  // ---- 空状態 ----
  emptyTitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ---- スワイプ ----
  swipeActionWrapper: {
    width: SWIPE_ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeActionBtn: {
    width: SWIPE_ACTION_WIDTH,
    flex: 1,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  swipeActionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },

  // ---- FAB ----
  fab: {
    position: 'absolute',
    right: Spacing.m,
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 14,
    right: Spacing.m + 4,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.08,
    elevation: 2,
  },

  // ---- 選択モードバー ----
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
  selectionBarText: {
    ...TypeScale.body,
  },
});
