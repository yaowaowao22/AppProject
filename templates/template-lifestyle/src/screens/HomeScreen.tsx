import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, H2, Body, Card, EmptyState } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { itemRepository, Item } from '../repository';

export function HomeScreen() {
  const { colors, spacing } = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  const loadItems = async () => {
    try {
      const data = await itemRepository.getAll('created_at DESC');
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    await itemRepository.delete(id);
    loadItems();
  };

  const renderItem = ({ item }: { item: Item }) => (
    <Card style={{ marginBottom: spacing.sm }} onPress={() => {}}>
      <H2 style={{ fontSize: 16 }}>{item.title}</H2>
      {item.description && (
        <Body color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
          {item.description}
        </Body>
      )}
      <Body color={colors.textMuted} style={{ marginTop: spacing.xs, fontSize: 12 }}>
        {item.created_at}
      </Body>
    </Card>
  );

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.md }]}>
        {items.length === 0 && !loading ? (
          <EmptyState
            icon="📝"
            title="まだデータがありません"
            subtitle="追加タブから新しいアイテムを作成しましょう"
          />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
