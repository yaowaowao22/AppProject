// ============================================================
// LibraryScreen - ライブラリ一覧
// タグチップフィルター + 日付グループ + カードレイアウト
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import {
  useItems,
  useMemoFilter,
  type LibraryFilterType,
  type ReviewStatusFilter,
  type DateRangeFilter,
} from '../../hooks/useLibrary';
import { useSidebarFilter } from '../../hooks/useSidebarFilter';
import type { LibraryStackParamList } from '../../navigation/types';
import type { ItemWithMeta } from '../../types';

type Props = NativeStackScreenProps<LibraryStackParamList, 'Library'>;

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

// ---- フィルターチップ ----------------------------------------
function FilterChip({
  label,
  active,
  onPress,
  activeColor,
  bgColor,
  textActiveColor,
  textInactiveColor,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  activeColor: string;
  bgColor: string;
  textActiveColor: string;
  textInactiveColor: string;
}) {
  return (
    <Pressable
      style={[
        styles.chip,
        active ? { backgroundColor: activeColor } : { backgroundColor: bgColor },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? textActiveColor : textInactiveColor },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ---- メインコンポーネント ------------------------------------
export function LibraryScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<LibraryFilterType>('all');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
  const [reviewStatus, setReviewStatus] = useState<ReviewStatusFilter>('all');

  const filter = useMemoFilter(search, typeFilter, [], reviewStatus, dateRange);
  const { items, isLoading } = useItems(filter);

  const sections = useMemo(() => groupByDate(items), [items]);
  const cardShadow = isDark ? {} : CardShadow;

  // ---- チップ用カラー ----
  const chipActiveColor = colors.accent;
  const chipBgColor = colors.backgroundSecondary;
  const chipTextActive = '#FFFFFF';
  const chipTextInactive = colors.labelSecondary;

  // ---- カードレンダラー ----
  const renderItem = ({ item }: { item: ItemWithMeta }) => {
    const rs = getReviewStatus(item);
    const iconName = TYPE_ICONS[item.type] ?? 'document-outline';
    const typeLabel = TYPE_LABELS[item.type] ?? item.type;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.card },
          cardShadow,
          pressed && { opacity: 0.85 },
        ]}
        onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
      >
        {/* メタ行: タイプアイコン + ラベル + 復習バッジ */}
        <View style={styles.cardMeta}>
          <Ionicons name={iconName} size={13} color={colors.labelTertiary} />
          <Text style={[styles.cardMetaType, { color: colors.labelTertiary }]}>
            {typeLabel}
          </Text>
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

        {/* エクサープト */}
        {item.excerpt ? (
          <Text
            style={[styles.cardExcerpt, { color: colors.labelSecondary }]}
            numberOfLines={2}
          >
            {item.excerpt}
          </Text>
        ) : null}

        {/* フッター: タグチップ + 日付 */}
        <View style={styles.cardFooter}>
          <View style={styles.tagRow}>
            {item.tags.slice(0, 3).map((tag) => (
              <View
                key={tag.id}
                style={[styles.tag, { backgroundColor: colors.backgroundSecondary }]}
              >
                <Text style={[styles.tagText, { color: colors.labelSecondary }]}>
                  {tag.name}
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

      {/* フィルターチップ行 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipScrollContent}
      >
        {/* タイプフィルター */}
        <FilterChip label="全て" active={typeFilter === 'all'} onPress={() => setTypeFilter('all')}
          activeColor={chipActiveColor} bgColor={chipBgColor} textActiveColor={chipTextActive} textInactiveColor={chipTextInactive} />
        <FilterChip label="URL" active={typeFilter === 'url'} onPress={() => setTypeFilter('url')}
          activeColor={chipActiveColor} bgColor={chipBgColor} textActiveColor={chipTextActive} textInactiveColor={chipTextInactive} />
        <FilterChip label="テキスト" active={typeFilter === 'text'} onPress={() => setTypeFilter('text')}
          activeColor={chipActiveColor} bgColor={chipBgColor} textActiveColor={chipTextActive} textInactiveColor={chipTextInactive} />
        <FilterChip label="画像" active={typeFilter === 'screenshot'} onPress={() => setTypeFilter('screenshot')}
          activeColor={chipActiveColor} bgColor={chipBgColor} textActiveColor={chipTextActive} textInactiveColor={chipTextInactive} />

        <View style={[styles.chipDivider, { backgroundColor: colors.separator }]} />

        {/* 日付フィルター */}
        <FilterChip label="全期間" active={dateRange === 'all'} onPress={() => setDateRange('all')}
          activeColor={chipActiveColor} bgColor={chipBgColor} textActiveColor={chipTextActive} textInactiveColor={chipTextInactive} />
        <FilterChip label="7日以内" active={dateRange === '7d'} onPress={() => setDateRange('7d')}
          activeColor={chipActiveColor} bgColor={chipBgColor} textActiveColor={chipTextActive} textInactiveColor={chipTextInactive} />
        <FilterChip label="30日以内" active={dateRange === '30d'} onPress={() => setDateRange('30d')}
          activeColor={chipActiveColor} bgColor={chipBgColor} textActiveColor={chipTextActive} textInactiveColor={chipTextInactive} />

        <View style={[styles.chipDivider, { backgroundColor: colors.separator }]} />

        {/* 復習ステータスフィルター */}
        <FilterChip label="全て" active={reviewStatus === 'all'} onPress={() => setReviewStatus('all')}
          activeColor={chipActiveColor} bgColor={chipBgColor} textActiveColor={chipTextActive} textInactiveColor={chipTextInactive} />
        <FilterChip label="復習待ち" active={reviewStatus === 'pending'} onPress={() => setReviewStatus('pending')}
          activeColor={chipActiveColor} bgColor={chipBgColor} textActiveColor={chipTextActive} textInactiveColor={chipTextInactive} />
        <FilterChip label="復習済" active={reviewStatus === 'done'} onPress={() => setReviewStatus('done')}
          activeColor={chipActiveColor} bgColor={chipBgColor} textActiveColor={chipTextActive} textInactiveColor={chipTextInactive} />
      </ScrollView>

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
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* FAB: アイテム追加 */}
      <Pressable
        style={[styles.fab, { backgroundColor: colors.accent }]}
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
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.m,
    marginTop: Spacing.s,
    marginBottom: Spacing.xs,
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

  // ---- フィルターチップ ----
  chipScroll: {
    flexGrow: 0,
    marginBottom: Spacing.xs,
  },
  chipScrollContent: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    height: 30,
    justifyContent: 'center',
  },
  chipText: {
    ...TypeScale.caption1,
    fontWeight: '500' as const,
  },
  chipDivider: {
    width: StyleSheet.hairlineWidth,
    height: 18,
    marginHorizontal: Spacing.xs,
  },

  // ---- リスト ----
  list: {
    paddingHorizontal: Spacing.m,
    paddingBottom: 100,
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

  // メタ行（タイプ + 復習バッジ）
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardMetaType: {
    ...TypeScale.caption2,
    flex: 1,
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
