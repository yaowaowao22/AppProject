// ============================================================
// JournalScreen - 学びジャーナル（日付別グループ表示）
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../hooks/useDatabase';
import {
  getJournalsGroupedByDate,
  deleteJournalEntry,
  type JournalSection,
  type JournalEntry,
} from '../../db/journalRepository';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Journal'>;

export function JournalScreen({ navigation: _navigation }: Props) {
  const { db, isReady } = useDatabase();
  const { colors, isDark } = useTheme();

  const [sections, setSections] = useState<JournalSection[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!db || !isReady) return;
    setLoading(true);
    try {
      const data = await getJournalsGroupedByDate(db);
      setSections(data);
    } finally {
      setLoading(false);
    }
  }, [db, isReady]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDelete = useCallback(
    (entry: JournalEntry) => {
      Alert.alert(
        'メモを削除',
        `「${entry.itemTitle}」のメモを削除しますか？`,
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '削除',
            style: 'destructive',
            onPress: async () => {
              if (!db) return;
              await deleteJournalEntry(db, entry.id);
              loadData();
            },
          },
        ]
      );
    },
    [db, loadData]
  );

  if (!isReady || loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.backgroundGrouped }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.backgroundGrouped }]}>
        <Ionicons name="journal-outline" size={48} color={colors.labelTertiary} />
        <Text style={[styles.emptyTitle, { color: colors.label }]}>
          まだメモがありません
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.labelSecondary }]}>
          アイテムの詳細画面からメモを追加できます
        </Text>
      </View>
    );
  }

  const cardShadow = isDark ? {} : CardShadow;

  return (
    <SectionList
      style={{ backgroundColor: colors.backgroundGrouped }}
      contentContainerStyle={styles.listContent}
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      stickySectionHeadersEnabled
      showsVerticalScrollIndicator={false}
      renderSectionHeader={({ section }) => (
        <View style={[styles.sectionHeader, { backgroundColor: colors.backgroundGrouped }]}>
          <Text style={[styles.sectionHeaderText, { color: colors.labelSecondary }]}>
            {section.dateLabel}
          </Text>
        </View>
      )}
      renderItem={({ item, index, section }) => {
        const isLast = index === section.data.length - 1;
        return (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card },
              cardShadow,
              !isLast && styles.cardGap,
            ]}
          >
            {/* カードヘッダー: アイテムタイトル + 時刻 */}
            <View style={styles.cardHeader}>
              <Text
                style={[styles.itemTitle, { color: colors.accent }]}
                numberOfLines={1}
              >
                {item.itemTitle}
              </Text>
              <View style={styles.cardHeaderRight}>
                <Text style={[styles.timeLabel, { color: colors.labelTertiary }]}>
                  {item.timeLabel}
                </Text>
                <Pressable
                  onPress={() => handleDelete(item)}
                  hitSlop={8}
                  accessibilityLabel="メモを削除"
                >
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={colors.labelTertiary}
                  />
                </Pressable>
              </View>
            </View>

            {/* ノート本文 */}
            <Text style={[styles.noteText, { color: colors.label }]}>
              {item.note}
            </Text>
          </View>
        );
      }}
      renderSectionFooter={() => <View style={styles.sectionFooter} />}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.m,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...TypeScale.headline,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...TypeScale.subheadline,
    textAlign: 'center',
  },

  // リスト
  listContent: {
    paddingBottom: Spacing.xxl,
  },

  // セクションヘッダー
  sectionHeader: {
    paddingTop: Spacing.m,
    paddingBottom: Spacing.s,
    paddingHorizontal: Spacing.m,
  },
  sectionHeaderText: {
    ...TypeScale.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // カード
  card: {
    marginHorizontal: Spacing.m,
    borderRadius: Radius.m,
    padding: Spacing.m,
    gap: Spacing.s,
  },
  cardGap: {
    marginBottom: Spacing.s,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  itemTitle: {
    ...TypeScale.footnote,
    fontWeight: '600',
    flex: 1,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    flexShrink: 0,
  },
  timeLabel: {
    ...TypeScale.caption1,
  },

  noteText: {
    ...TypeScale.bodyJA,
  },

  sectionFooter: {
    height: Spacing.xs,
  },
});
