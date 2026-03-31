import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { SidebarColors } from '../theme/colors';
import { SidebarLayout, Spacing, Radius } from '../theme/spacing';
import { useTheme } from '../theme/ThemeContext';
import { useDatabase } from '../hooks/useDatabase';

// ============================================================
// SidebarFilterContext
// TODO: DrawerNavigator.tsx の DrawerNavigator を
//       <SidebarFilterProvider> で囲むと画面側からも参照可能
// ============================================================

export type SidebarFilter =
  | { kind: 'smart'; id: 'today' | 'overdue' | 'recent' }
  | { kind: 'tag'; tagId: number; tagName: string }
  | { kind: 'collection'; collectionId: string; collectionName: string };

interface SidebarFilterContextValue {
  activeFilter: SidebarFilter;
  setActiveFilter: (f: SidebarFilter) => void;
}

export const SidebarFilterContext = createContext<SidebarFilterContextValue>({
  activeFilter: { kind: 'smart', id: 'today' },
  setActiveFilter: () => {},
});

export function useSidebarFilter() {
  return useContext(SidebarFilterContext);
}

// ============================================================
// データ型
// ============================================================

type SC = typeof SidebarColors.light | typeof SidebarColors.dark;

interface TagWithCount {
  id: number;
  name: string;
  count: number;
}

// Collections — TODO: DB に collections テーブルが追加された際に実データへ切り替え
const MOCK_COLLECTIONS = [
  { id: 'col-work',    label: '仕事で使う技術',      count: 15 },
  { id: 'col-liberal', label: '教養・リベラルアーツ', count: 8  },
  { id: 'col-books',   label: '読書メモ',             count: 6  },
] as const;

// ============================================================
// DrawerContent
// ============================================================

export function DrawerContent({ navigation }: DrawerContentComponentProps) {
  const { isDark } = useTheme();
  const sc = isDark ? SidebarColors.dark : SidebarColors.light;
  const insets = useSafeAreaInsets();
  const { db, isReady } = useDatabase();

  const [activeFilter, setActiveFilter] = useState<SidebarFilter>({ kind: 'smart', id: 'today' });
  const [todayCount,   setTodayCount]   = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [tags,         setTags]         = useState<TagWithCount[]>([]);
  const [totalCards,   setTotalCards]   = useState(0);
  const [masterRate,   setMasterRate]   = useState(0);

  const fetchData = useCallback(async () => {
    if (!db || !isReady) return;
    try {
      // 今日の復習件数（next_review_at が今日）
      const todayRes = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count
         FROM reviews r JOIN items i ON i.id = r.item_id
         WHERE i.archived = 0
           AND date(r.next_review_at, 'localtime') = date('now', 'localtime')`
      );
      setTodayCount(todayRes?.count ?? 0);

      // 期限切れ件数（next_review_at が今日より前）
      const overdueRes = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count
         FROM reviews r JOIN items i ON i.id = r.item_id
         WHERE i.archived = 0
           AND date(r.next_review_at, 'localtime') < date('now', 'localtime')`
      );
      setOverdueCount(overdueRes?.count ?? 0);

      // タグ一覧 + 非アーカイブ紐付けアイテム数
      const tagRows = await db.getAllAsync<TagWithCount>(
        `SELECT t.id, t.name, COUNT(it.item_id) as count
         FROM tags t
         LEFT JOIN item_tags it ON it.tag_id = t.id
         LEFT JOIN items i ON i.id = it.item_id AND i.archived = 0
         GROUP BY t.id
         ORDER BY count DESC, t.name ASC`
      );
      setTags(tagRows);

      // 総カード数
      const totalRes = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM items WHERE archived = 0`
      );
      const total = totalRes?.count ?? 0;
      setTotalCards(total);

      // マスター率（interval_days >= 7 = 安定した記憶）
      if (total > 0) {
        const masteredRes = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count
           FROM reviews r JOIN items i ON i.id = r.item_id
           WHERE i.archived = 0 AND r.interval_days >= 7`
        );
        setMasterRate(Math.round(((masteredRes?.count ?? 0) / total) * 100));
      }
    } catch {
      // DBエラー時は既存値を維持
    }
  }, [db, isReady]);

  // 初回ロード
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ドロワーが開くたびに再取得（useFocusEffect 相当）
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsubscribe = (navigation as any).addListener('drawerOpen', fetchData);
    return unsubscribe;
  }, [navigation, fetchData]);

  const activeId = (() => {
    if (activeFilter.kind === 'smart') return activeFilter.id;
    if (activeFilter.kind === 'tag')   return `tag-${activeFilter.tagId}`;
    return activeFilter.collectionId;
  })();

  function handleSmartFilter(id: 'today' | 'overdue' | 'recent') {
    setActiveFilter({ kind: 'smart', id });
    if (id === 'today' || id === 'overdue') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigation as any).navigate('MainTabs', {
        screen: 'ReviewTab',
        params: { screen: 'Review', params: {} },
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigation as any).navigate('MainTabs', {
        screen: 'LibraryTab',
        params: { screen: 'Library', params: {} },
      });
    }
    navigation.closeDrawer();
  }

  function handleTag(tag: TagWithCount) {
    setActiveFilter({ kind: 'tag', tagId: tag.id, tagName: tag.name });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate('MainTabs', {
      screen: 'LibraryTab',
      params: { screen: 'Library', params: { filterTag: tag.name } },
    });
    navigation.closeDrawer();
  }

  function handleCollection(col: typeof MOCK_COLLECTIONS[number]) {
    setActiveFilter({ kind: 'collection', collectionId: col.id, collectionName: col.label });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate('MainTabs', {
      screen: 'LibraryTab',
      params: { screen: 'Library', params: {} },
    });
    navigation.closeDrawer();
  }

  const headerContentHeight = 64;

  return (
    <SidebarFilterContext.Provider value={{ activeFilter, setActiveFilter }}>
      <View style={[styles.container, { backgroundColor: sc.backgroundSolid }]}>

        {/* ---- Header ---- */}
        <View style={[
          styles.header,
          {
            paddingTop: insets.top + 12, // safeArea + 上余白
            paddingBottom: SidebarLayout.headerPaddingBottom,
            height: insets.top + headerContentHeight,
          },
        ]}>
          <Text
            style={[styles.title, { color: sc.textPrimary }]}
            accessibilityRole="header"
          >
            ReCallKit
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.closeBtn,
              pressed && { backgroundColor: sc.pressedBackground },
            ]}
            onPress={() => navigation.closeDrawer()}
            accessibilityLabel="サイドバーを閉じる"
          >
            <Ionicons
              name="close"
              size={SidebarLayout.closeBtnIconSize}
              color={sc.inactiveTint}
            />
          </Pressable>
        </View>

        {/* ---- Scrollable content ---- */}
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          bounces
        >

          {/* Smart Filters セクション（最初: paddingTop 0） */}
          <View style={styles.section}>
            <SectionHeading label="Smart Filters" color={sc.sectionHeader} />

            <NavItem
              isActive={activeId === 'today'}
              onPress={() => handleSmartFilter('today')}
              sc={sc}
            >
              <View style={styles.iconSlot}>
                <Ionicons
                  name="calendar-outline"
                  size={SidebarLayout.iconSize}
                  color={activeId === 'today' ? sc.activeTint : sc.inactiveTint}
                />
              </View>
              <ItemLabel label="今日の復習" isActive={activeId === 'today'} sc={sc} />
              {todayCount > 0 && (
                <CountBadge count={todayCount} isActive={activeId === 'today'} sc={sc} />
              )}
            </NavItem>

            <NavItem
              isActive={activeId === 'overdue'}
              onPress={() => handleSmartFilter('overdue')}
              sc={sc}
            >
              <View style={styles.iconSlot}>
                <Ionicons
                  name="time-outline"
                  size={SidebarLayout.iconSize}
                  color={activeId === 'overdue' ? sc.activeTint : sc.inactiveTint}
                />
              </View>
              <ItemLabel label="期限切れ" isActive={activeId === 'overdue'} sc={sc} />
              {overdueCount > 0 && (
                <CountBadge count={overdueCount} isActive={activeId === 'overdue'} sc={sc} />
              )}
            </NavItem>

            <NavItem
              isActive={activeId === 'recent'}
              onPress={() => handleSmartFilter('recent')}
              sc={sc}
            >
              <View style={styles.iconSlot}>
                <Ionicons
                  name="add-circle-outline"
                  size={SidebarLayout.iconSize}
                  color={activeId === 'recent' ? sc.activeTint : sc.inactiveTint}
                />
              </View>
              <ItemLabel label="最近追加" isActive={activeId === 'recent'} sc={sc} />
              {/* 最近追加: 件数表示なし */}
            </NavItem>
          </View>

          {/* Tags セクション（paddingTop: 24px） */}
          <View style={[styles.section, styles.sectionGap]}>
            <SectionHeading label="Tags" color={sc.sectionHeader} />
            {tags.map((tag) => {
              const tagId = `tag-${tag.id}`;
              return (
                <NavItem
                  key={tagId}
                  isActive={activeId === tagId}
                  onPress={() => handleTag(tag)}
                  sc={sc}
                >
                  <View style={styles.iconSlot}>
                    <TagDot isActive={activeId === tagId} sc={sc} />
                  </View>
                  <ItemLabel label={tag.name} isActive={activeId === tagId} sc={sc} />
                  <CountBadge count={tag.count} isActive={activeId === tagId} sc={sc} />
                </NavItem>
              );
            })}
          </View>

          {/* Collections セクション（paddingTop: 24px） */}
          {/* TODO: collectionsテーブル追加後に実データへ切り替え */}
          <View style={[styles.section, styles.sectionGap]}>
            <SectionHeading label="Collections" color={sc.sectionHeader} />
            {MOCK_COLLECTIONS.map((col) => (
              <NavItem
                key={col.id}
                isActive={activeId === col.id}
                onPress={() => handleCollection(col)}
                sc={sc}
              >
                <View style={styles.iconSlot}>
                  <Ionicons
                    name="folder-outline"
                    size={SidebarLayout.iconSize}
                    color={activeId === col.id ? sc.activeTint : sc.inactiveTint}
                  />
                </View>
                <ItemLabel label={col.label} isActive={activeId === col.id} sc={sc} />
                <CountBadge count={col.count} isActive={activeId === col.id} sc={sc} />
              </NavItem>
            ))}
          </View>

          {/* スクロール下部の余白 */}
          <View style={styles.scrollBottom} />
        </ScrollView>

        {/* ---- Footer: 知識の蓄積の控えめな可視化 ---- */}
        <View style={[styles.footer, { borderTopColor: sc.separator }]}>
          <Text style={[styles.footerText, { color: sc.textTertiary }]}>
            {totalCards} cards · {masterRate}% mastered
          </Text>
        </View>

      </View>
    </SidebarFilterContext.Provider>
  );
}

// ============================================================
// Sub-components
// ============================================================

function SectionHeading({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.sectionHeading} accessibilityRole="summary">
      <Text style={[styles.sectionHeadingText, { color }]}>{label}</Text>
    </View>
  );
}

function NavItem({
  isActive,
  onPress,
  sc,
  children,
}: {
  isActive: boolean;
  onPress: () => void;
  sc: SC;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.navItem,
        isActive
          ? [styles.navItemActive, { backgroundColor: sc.activeBackground }]
          : pressed
          ? [styles.navItemPressed, { backgroundColor: sc.pressedBackground }]
          : null,
      ]}
      onPress={onPress}
      accessibilityRole="menuitem"
      accessibilityState={{ selected: isActive }}
    >
      {children}
    </Pressable>
  );
}

function ItemLabel({ label, isActive, sc }: { label: string; isActive: boolean; sc: SC }) {
  return (
    <Text
      style={[
        styles.navItemLabel,
        { color: isActive ? sc.activeTint : sc.inactiveTint },
        isActive && styles.navItemLabelActive,
      ]}
      numberOfLines={1}
    >
      {label}
    </Text>
  );
}

function CountBadge({ count, isActive, sc }: { count: number; isActive: boolean; sc: SC }) {
  return (
    <Text
      style={[
        styles.countBadge,
        { color: isActive ? sc.activeTint : sc.textTertiary },
        isActive && { opacity: 0.7 },
      ]}
    >
      {count}
    </Text>
  );
}

function TagDot({ isActive, sc }: { isActive: boolean; sc: SC }) {
  return (
    <View
      style={[
        styles.tagDot,
        isActive
          ? { backgroundColor: sc.activeTint, borderColor: sc.activeTint }
          : { backgroundColor: 'transparent', borderColor: sc.textTertiary },
      ]}
    />
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // --- Header ---
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: SidebarLayout.itemPaddingLeft,
    paddingRight: Spacing.m,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: SidebarLayout.closeBtnSize,
    height: SidebarLayout.closeBtnSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.s,
  },

  // --- Scroll ---
  scroll: {
    flex: 1,
  },
  scrollBottom: {
    height: Spacing.l,
  },

  // --- Section ---
  section: {
    paddingTop: 0,
  },
  sectionGap: {
    paddingTop: Spacing.l,
  },
  sectionHeading: {
    height: SidebarLayout.sectionHeaderHeight,
    justifyContent: 'center',
    paddingHorizontal: SidebarLayout.sectionHeaderPaddingH,
  },
  sectionHeadingText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // --- Nav item ---
  navItem: {
    height: SidebarLayout.itemHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SidebarLayout.itemPaddingLeft,
    paddingRight: SidebarLayout.itemPaddingH,
    gap: SidebarLayout.itemGap,
    borderRadius: 0,
  },
  navItemActive: {
    marginHorizontal: Spacing.s,
    paddingLeft: SidebarLayout.itemPaddingH,
    paddingRight: Spacing.s,
    borderRadius: Radius.s,
  },
  navItemPressed: {
    marginHorizontal: Spacing.s,
    paddingLeft: SidebarLayout.itemPaddingH,
    paddingRight: Spacing.s,
    borderRadius: Radius.s,
  },

  // --- Icon slot ---
  iconSlot: {
    width: SidebarLayout.iconSize,
    height: SidebarLayout.iconSize,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // --- Label ---
  navItemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
  },
  navItemLabelActive: {
    fontWeight: '600',
  },

  // --- Count badge ---
  countBadge: {
    fontSize: 13,
    fontWeight: '400',
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
    minWidth: SidebarLayout.countMinWidth,
    textAlign: 'right',
  },

  // --- Tag dot ---
  tagDot: {
    width: SidebarLayout.tagDotSize,
    height: SidebarLayout.tagDotSize,
    borderRadius: SidebarLayout.tagDotSize / 2,
    borderWidth: SidebarLayout.tagDotBorderWidth,
  },

  // --- Footer ---
  footer: {
    height: SidebarLayout.footerHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SidebarLayout.footerPaddingH,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '400',
  },
});
