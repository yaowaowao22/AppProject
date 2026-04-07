// ============================================================
// TrashScreen — ゴミ箱
// archived = 1 のアイテムを表示。復元または完全削除できる。
// ============================================================

import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useDB } from '../../hooks/useDatabase';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import type { LibraryStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<LibraryStackParamList, 'Trash'>;

interface TrashedItem {
  id: number;
  type: string;
  title: string;
  content: string;
  excerpt: string | null;
  category: string | null;
  updated_at: string;
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

// ---- タイプアイコン ------------------------------------------
const TYPE_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  url: 'link-outline',
  text: 'document-text-outline',
  screenshot: 'image-outline',
};

// ============================================================
// メインコンポーネント
// ============================================================
export function TrashScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const db = useDB();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<TrashedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cardShadow = isDark ? {} : CardShadow;

  // ---- データ取得 ----
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await db.getAllAsync<TrashedItem>(
        `SELECT id, type, title, content, excerpt, category, updated_at
         FROM items
         WHERE archived = 1
         ORDER BY updated_at DESC`
      );
      setItems(rows);
    } catch (err) {
      console.error('[TrashScreen] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useFocusEffect(useCallback(() => {
    fetchItems();
  }, [fetchItems]));

  // ---- ヘッダー: 全削除ボタン ----
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        items.length > 0 ? (
          <Pressable onPress={handleEmptyTrash} hitSlop={8}>
            <Text style={[TypeScale.body, { color: colors.error }]}>全て削除</Text>
          </Pressable>
        ) : null,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, colors.error]);

  // ---- 復元 ----
  const handleRestore = useCallback(async (id: number) => {
    try {
      await db.runAsync(
        `UPDATE items SET archived = 0, updated_at = datetime('now','localtime') WHERE id = ?`,
        [id]
      );
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('[TrashScreen] restore error:', err);
      Alert.alert('エラー', '復元に失敗しました');
    }
  }, [db]);

  // ---- 完全削除（1件）----
  const handleDeletePermanently = useCallback((id: number, title: string) => {
    Alert.alert(
      '完全削除',
      `「${title}」を完全に削除しますか？\nこの操作は元に戻せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync(`DELETE FROM items WHERE id = ?`, [id]);
              setItems((prev) => prev.filter((item) => item.id !== id));
            } catch (err) {
              console.error('[TrashScreen] delete error:', err);
              Alert.alert('エラー', '削除に失敗しました');
            }
          },
        },
      ]
    );
  }, [db]);

  // ---- ゴミ箱を空にする ----
  const handleEmptyTrash = useCallback(() => {
    Alert.alert(
      'ゴミ箱を空にする',
      'ゴミ箱内の全アイテムを完全に削除しますか？\nこの操作は元に戻せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '全て削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync(`DELETE FROM items WHERE archived = 1`);
              setItems([]);
            } catch (err) {
              console.error('[TrashScreen] empty trash error:', err);
              Alert.alert('エラー', '削除に失敗しました');
            }
          },
        },
      ]
    );
  }, [db]);

  // ---- カードレンダラー ----
  const renderItem = ({ item }: { item: TrashedItem }) => {
    const iconName = TYPE_ICONS[item.type] ?? 'document-outline';

    return (
      <View
        style={[styles.card, { backgroundColor: colors.card }, cardShadow]}
      >
        {/* メタ行 */}
        <View style={styles.cardMeta}>
          <Ionicons name={iconName} size={13} color={colors.labelTertiary} />
          {item.category ? (
            <View style={[styles.categoryBadge, { backgroundColor: colors.accent + '22' }]}>
              <Text style={[styles.categoryBadgeText, { color: colors.accent }]}>
                {item.category}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.cardDate, { color: colors.labelTertiary }]}>
            {formatDate(item.updated_at)}削除
          </Text>
        </View>

        {/* タイトル */}
        <Text style={[styles.cardTitle, { color: colors.label }]} numberOfLines={2}>
          {item.title}
        </Text>

        {/* エクサープト */}
        {(item.content || item.excerpt) ? (
          <Text
            style={[styles.cardExcerpt, { color: colors.labelSecondary }]}
            numberOfLines={2}
          >
            {item.excerpt ?? item.content}
          </Text>
        ) : null}

        {/* アクションボタン */}
        <View style={[styles.cardActions, { borderTopColor: colors.separator }]}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: pressed ? colors.backgroundSecondary : 'transparent' },
            ]}
            onPress={() => handleRestore(item.id)}
            hitSlop={4}
          >
            <Ionicons name="arrow-undo-outline" size={16} color={colors.accent} />
            <Text style={[styles.actionBtnText, { color: colors.accent }]}>復元</Text>
          </Pressable>

          <View style={[styles.actionDivider, { backgroundColor: colors.separator }]} />

          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: pressed ? colors.backgroundSecondary : 'transparent' },
            ]}
            onPress={() => handleDeletePermanently(item.id, item.title)}
            hitSlop={4}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={[styles.actionBtnText, { color: colors.error }]}>完全削除</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundGrouped }]}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="trash-outline" size={48} color={colors.labelTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.label }]}>ゴミ箱は空です</Text>
          <Text style={[styles.emptySubtitle, { color: colors.labelSecondary }]}>
            削除したアイテムはここに移動されます
          </Text>
        </View>
      ) : (
        <>
          <Text style={[styles.infoText, { color: colors.labelSecondary }]}>
            {items.length}件のアイテム — 復元または完全削除できます
          </Text>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: insets.bottom + Spacing.l },
            ]}
            showsVerticalScrollIndicator={false}
          />
        </>
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
  infoText: {
    ...TypeScale.footnote,
    marginHorizontal: Spacing.m,
    marginTop: Spacing.s,
    marginBottom: Spacing.xs,
  },
  list: {
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.xs,
  },

  // ---- カード ----
  card: {
    borderRadius: Radius.m,
    padding: Spacing.m,
    marginBottom: Spacing.s,
    gap: Spacing.s,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
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
  cardDate: {
    ...TypeScale.caption2,
    marginLeft: 'auto',
  },
  cardTitle: {
    ...TypeScale.headline,
  },
  cardExcerpt: {
    ...TypeScale.footnote,
  },

  // ---- アクションボタン行 ----
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.xs,
    paddingTop: Spacing.s,
    gap: Spacing.s,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.s,
  },
  actionBtnText: {
    ...TypeScale.subheadline,
    fontWeight: '500' as const,
  },
  actionDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
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
});
