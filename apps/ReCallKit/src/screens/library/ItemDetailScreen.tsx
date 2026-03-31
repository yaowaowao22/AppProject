import React, { useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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
  const navigation = useNavigation();

  const [item, setItem] = useState<Item | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  const loadItem = useCallback(async () => {
    setLoading(true);
    try {
      const row = await db.getFirstAsync<Item>(
        'SELECT * FROM items WHERE id = ?',
        [itemId]
      );
      setItem(row ?? null);

      const tagRows = await db.getAllAsync<Tag>(
        `SELECT t.id, t.name FROM tags t
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
      navigation.setOptions({ title: item.title });
    }
  }, [item, navigation]);

  if (loading || !item) {
    return (
      <View style={[styles.center, { backgroundColor: colors.backgroundGrouped }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const cardShadow = isDark ? {} : CardShadow;

  return (
    <ScrollView
      style={{ backgroundColor: colors.backgroundGrouped }}
      contentContainerStyle={styles.container}
    >
      {/* タイトル */}
      <Text style={[styles.title, { color: colors.label }]}>{item.title}</Text>

      {/* タグ */}
      {tags.length > 0 && (
        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <View key={tag.id} style={[styles.tag, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.tagText, { color: colors.labelSecondary }]}>{tag.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* コンテンツ */}
      <View style={[styles.card, { backgroundColor: colors.card }, cardShadow]}>
        <Text style={[styles.content, { color: colors.label }]}>{item.content}</Text>
      </View>

      {/* 復習情報 */}
      {review && (
        <View style={[styles.card, { backgroundColor: colors.card }, cardShadow]}>
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
      <View style={[styles.card, { backgroundColor: colors.card }, cardShadow]}>
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
});
