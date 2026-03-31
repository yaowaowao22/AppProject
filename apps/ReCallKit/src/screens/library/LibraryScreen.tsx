import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import { useItems, useMemoFilter } from '../../hooks/useLibrary';
import type { LibraryStackParamList } from '../../navigation/types';
import type { ItemWithMeta } from '../../types';

type Props = NativeStackScreenProps<LibraryStackParamList, 'Library'>;

const TYPE_ICONS: Record<string, string> = {
  url: 'link-outline',
  text: 'document-text-outline',
  screenshot: 'image-outline',
};

export function LibraryScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const [search, setSearch] = useState('');

  const filter = useMemoFilter(search, 'all', [], 'all', 'all');
  const { items, isLoading } = useItems(filter);

  const cardShadow = isDark ? {} : CardShadow;

  const renderItem = ({ item }: { item: ItemWithMeta }) => (
    <Pressable
      style={[styles.card, { backgroundColor: colors.card }, cardShadow]}
      onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Ionicons
          name={(TYPE_ICONS[item.type] ?? 'document-outline') as any}
          size={18}
          color={colors.accent}
        />
        <Text style={[styles.cardTitle, { color: colors.label }]} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
      {item.excerpt && (
        <Text style={[styles.cardExcerpt, { color: colors.labelSecondary }]} numberOfLines={2}>
          {item.excerpt}
        </Text>
      )}
      <View style={styles.tagRow}>
        {item.tags.slice(0, 3).map((tag) => (
          <View key={tag.id} style={[styles.tag, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.tagText, { color: colors.labelSecondary }]}>{tag.name}</Text>
          </View>
        ))}
      </View>
    </Pressable>
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

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="library-outline" size={48} color={colors.labelTertiary} />
          <Text style={[styles.emptyText, { color: colors.labelSecondary }]}>
            {search ? '見つかりませんでした' : 'アイテムがありません'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB: アイテム追加 */}
      <Pressable
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => navigation.navigate('AddItem', {})}
        accessibilityRole="button"
        accessibilityLabel="アイテムを追加"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.m,
    marginVertical: Spacing.s,
    paddingHorizontal: Spacing.s,
    borderRadius: Radius.s,
    height: 36,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...TypeScale.body,
    padding: 0,
  },
  list: {
    padding: Spacing.m,
    paddingBottom: 100,
    gap: Spacing.s,
  },
  card: {
    borderRadius: Radius.m,
    padding: Spacing.m,
    gap: Spacing.s,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  cardTitle: {
    ...TypeScale.headline,
    flex: 1,
  },
  cardExcerpt: {
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
    ...TypeScale.caption2,
  },
  emptyText: {
    ...TypeScale.body,
  },
  fab: {
    position: 'absolute',
    right: Spacing.m,
    bottom: Spacing.l,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
