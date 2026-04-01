import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SidebarLayout, Spacing, Radius } from '../theme/spacing';
import { useTheme } from '../theme/ThemeContext';
import type { SidebarColorSet } from '../theme/themes';
import { useDatabase } from '../hooks/useDatabase';
import { useSidebarFilter } from '../hooks/useSidebarFilter';
import { useTask } from '../context/TaskContext';

// ============================================================
// 型定義
// ============================================================

interface TagWithCount {
  id: number;
  name: string;
  count: number;
}

interface CollectionWithCount {
  id: number;
  name: string;
  count: number;
}

async function triggerSelectionHaptic() {
  if (Platform.OS === 'web') return;
  try { await Haptics.selectionAsync(); } catch {}
}

// ---- Screen Navigation 定義 ----
// タブバーを置き換えるプライマリナビゲーション（仕様 §2.3）
const SCREEN_ITEMS = [
  {
    name: 'Home'    as const,
    label: '今日',
    iconOutline: 'calendar-outline'    as const,
    iconFilled:  'calendar'            as const,
    showBadge: true,  // todayCount を表示
  },
  {
    name: 'Library' as const,
    label: 'ライブラリ',
    iconOutline: 'library-outline'     as const,
    iconFilled:  'library'             as const,
    showBadge: false,
  },
  {
    name: 'Review'  as const,
    label: '復習',
    iconOutline: 'repeat-outline'      as const,
    iconFilled:  'repeat'              as const,
    showBadge: false,
  },
  {
    name: 'Map'     as const,
    label: 'マップ',
    iconOutline: 'map-outline'         as const,
    iconFilled:  'map'                 as const,
    showBadge: false,
  },
  {
    name: 'Journal' as const,
    label: 'ジャーナル',
    iconOutline: 'book-outline'        as const,
    iconFilled:  'book'                as const,
    showBadge: false,
  },
  {
    name: 'Tasks'   as const,
    label: 'タスク',
    iconOutline: 'clipboard-outline'   as const,
    iconFilled:  'clipboard'           as const,
    showBadge: true,  // runningCount を表示
  },
] as const;

// ============================================================
// DrawerContent — "余白の沈黙" (DDP: Marginal Silence) 準拠
// ============================================================

export function DrawerContent({ navigation }: DrawerContentComponentProps) {
  const { sidebarColors: sc } = useTheme();
  const insets = useSafeAreaInsets();
  const { db, isReady } = useDatabase();

  // グローバルフィルター Context
  const { sidebarFilter, setSidebarFilter, clearFilter } = useSidebarFilter();

  // タスクの実行中件数（バッジ表示用）
  const { runningCount } = useTask();

  const [todayCount,   setTodayCount]   = useState(0);
  const [tags,         setTags]         = useState<TagWithCount[]>([]);
  const [collections,  setCollections]  = useState<CollectionWithCount[]>([]);
  const [totalCards,   setTotalCards]   = useState(0);
  const [masterRate,   setMasterRate]   = useState(0);

  const fetchData = useCallback(async () => {
    if (!db || !isReady) return;
    try {
      const todayRes = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count
         FROM reviews r JOIN items i ON i.id = r.item_id
         WHERE i.archived = 0
           AND date(r.next_review_at, 'localtime') = date('now', 'localtime')`
      );
      setTodayCount(todayRes?.count ?? 0);

      const tagRows = await db.getAllAsync<TagWithCount>(
        `SELECT t.id, t.name, COUNT(it.item_id) as count
         FROM tags t
         LEFT JOIN item_tags it ON it.tag_id = t.id
         LEFT JOIN items i ON i.id = it.item_id AND i.archived = 0
         GROUP BY t.id
         ORDER BY count DESC, t.name ASC`
      );
      setTags(tagRows);

      const colRows = await db.getAllAsync<CollectionWithCount>(
        `SELECT c.id, c.name, COUNT(ic.item_id) as count
         FROM collections c
         LEFT JOIN item_collections ic ON ic.collection_id = c.id
         LEFT JOIN items i ON i.id = ic.item_id AND i.archived = 0
         GROUP BY c.id
         ORDER BY c.name ASC`
      );
      setCollections(colRows);

      const totalRes = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM items WHERE archived = 0`
      );
      const total = totalRes?.count ?? 0;
      setTotalCards(total);

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ドロワーが開くたびに最新データを取得
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsubscribe = (navigation as any).addListener('drawerOpen', fetchData);
    return unsubscribe;
  }, [navigation, fetchData]);

  // ---- アクティブ画面名（ドロワー state から導出）----
  const drawerState = navigation.getState();
  const activeScreenName = drawerState?.routes[drawerState.index]?.name ?? 'Home';

  // ---- フィルターアクティブ ID ----
  const activeFilterId = (() => {
    if (!sidebarFilter) return null;
    if (sidebarFilter.kind === 'tag')        return `tag-${sidebarFilter.tagId}`;
    return sidebarFilter.collectionId;
  })();

  // ---- Screen Navigation ハンドラ ----
  function handleScreenNav(screenName: typeof SCREEN_ITEMS[number]['name']) {
    triggerSelectionHaptic();
    navigation.navigate(screenName as never);
    navigation.closeDrawer();
  }

  // ---- Tag ハンドラ ----
  function handleTag(tag: TagWithCount) {
    triggerSelectionHaptic();
    const tagItemId = `tag-${tag.id}`;
    if (activeFilterId === tagItemId) {
      clearFilter();
    } else {
      setSidebarFilter({ kind: 'tag', tagId: tag.id, tagName: tag.name });
      navigation.navigate('Library' as never);
    }
    navigation.closeDrawer();
  }

  // ---- Collection ハンドラ ----
  function handleCollection(col: CollectionWithCount) {
    triggerSelectionHaptic();
    const colId = String(col.id);
    if (activeFilterId === colId) {
      clearFilter();
    } else {
      setSidebarFilter({ kind: 'collection', collectionId: colId, collectionName: col.name });
      navigation.navigate('Library' as never);
    }
    navigation.closeDrawer();
  }

  // ---- Settings ハンドラ ----
  function handleSettings() {
    triggerSelectionHaptic();
    navigation.navigate('Settings' as never);
    navigation.closeDrawer();
  }

  return (
    <View style={[styles.container, { backgroundColor: sc.backgroundSolid }]}>

      {/* ================================================================
          HEADER — アプリ名 + 閉じるボタン
          ================================================================ */}
      <View style={[
        styles.header,
        {
          paddingTop: insets.top + 12,
          paddingBottom: SidebarLayout.headerPaddingBottom,
          height: insets.top + 64,
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
          <Ionicons name="close" size={SidebarLayout.closeBtnIconSize} color={sc.inactiveTint} />
        </Pressable>
      </View>

      {/* ================================================================
          SCROLLABLE CONTENT
          ================================================================ */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        bounces
      >

        {/* ---- Screen Navigation（ヘッダーなし：最上位、自明） ---- */}
        {/* 仕様 §2.3: Screen Navigation セクションにはヘッダーを付けない */}
        <View style={styles.section}>
          {SCREEN_ITEMS.map((item) => {
            const isActive = activeScreenName === item.name;
            const badgeCount = item.showBadge
              ? item.name === 'Tasks'
                ? runningCount
                : todayCount
              : 0;
            return (
              <NavItem
                key={item.name}
                isActive={isActive}
                onPress={() => handleScreenNav(item.name)}
                sc={sc}
              >
                <View style={styles.iconSlot}>
                  <Ionicons
                    name={isActive ? item.iconFilled : item.iconOutline}
                    size={SidebarLayout.iconSize}
                    color={isActive ? sc.activeTint : sc.inactiveTint}
                  />
                </View>
                <ItemLabel label={item.label} isActive={isActive} sc={sc} />
                {item.showBadge && badgeCount > 0 && (
                  <CountBadge count={badgeCount} isActive={isActive} sc={sc} />
                )}
              </NavItem>
            );
          })}
        </View>

        {/* ---- Tags（24pt gap） ---- */}
        <View style={[styles.section, styles.sectionGap]}>
          <SectionHeading label="Tags" color={sc.sectionHeader} />
          {tags.map((tag) => {
            const tagId = `tag-${tag.id}`;
            return (
              <NavItem
                key={tagId}
                isActive={activeFilterId === tagId}
                onPress={() => handleTag(tag)}
                sc={sc}
              >
                <View style={styles.iconSlot}>
                  <TagDot isActive={activeFilterId === tagId} sc={sc} />
                </View>
                <ItemLabel label={tag.name} isActive={activeFilterId === tagId} sc={sc} />
                <CountBadge count={tag.count} isActive={activeFilterId === tagId} sc={sc} />
              </NavItem>
            );
          })}
        </View>

        {/* ---- Collections（24pt gap、0件の場合は非表示） ---- */}
        {collections.length > 0 && (
          <View style={[styles.section, styles.sectionGap]}>
            <SectionHeading label="Collections" color={sc.sectionHeader} />
            {collections.map((col) => {
              const colId = String(col.id);
              return (
                <NavItem
                  key={col.id}
                  isActive={activeFilterId === colId}
                  onPress={() => handleCollection(col)}
                  sc={sc}
                >
                  <View style={styles.iconSlot}>
                    <Ionicons
                      name="folder-outline"
                      size={SidebarLayout.iconSize}
                      color={activeFilterId === colId ? sc.activeTint : sc.inactiveTint}
                    />
                  </View>
                  <ItemLabel label={col.name} isActive={activeFilterId === colId} sc={sc} />
                  <CountBadge count={col.count} isActive={activeFilterId === colId} sc={sc} />
                </NavItem>
              );
            })}
          </View>
        )}

        {/* スクロール底部余白 */}
        <View style={styles.scrollBottom} />
      </ScrollView>

      {/* ================================================================
          FOOTER — 統計情報 + Settings リンク（仕様 §2.5）
          ================================================================ */}
      <View style={[styles.footer, { borderTopColor: sc.separator, paddingBottom: insets.bottom }]}>
        {/* 統計行 */}
        <View style={styles.footerStats}>
          <Text style={[styles.footerStatsText, { color: sc.textTertiary }]}>
            {totalCards} cards · {masterRate}% mastered
          </Text>
        </View>

        {/* hairline separator */}
        <View style={[styles.footerDivider, { backgroundColor: sc.separator }]} />

        {/* Settings リンク */}
        <Pressable
          style={({ pressed }) => [
            styles.footerSettings,
            pressed && { backgroundColor: sc.pressedBackground },
          ]}
          onPress={handleSettings}
          accessibilityRole="menuitem"
          accessibilityLabel="設定を開く"
        >
          <Ionicons
            name="settings-outline"
            size={SidebarLayout.iconSize}
            color={sc.inactiveTint}
          />
          <Text style={[styles.footerSettingsLabel, { color: sc.inactiveTint }]}>
            設定
          </Text>
        </Pressable>
      </View>

    </View>
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
  sc: SidebarColorSet;
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

function ItemLabel({ label, isActive, sc }: { label: string; isActive: boolean; sc: SidebarColorSet }) {
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

function CountBadge({ count, isActive, sc }: { count: number; isActive: boolean; sc: SidebarColorSet }) {
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

function TagDot({ isActive, sc }: { isActive: boolean; sc: SidebarColorSet }) {
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
// Styles — 8pt グリッド厳守 / 骨格の不可視性
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
    paddingTop: Spacing.l, // 24pt — 呼吸の切れ目
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

  // --- Footer（統計 + Settings）---
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerStats: {
    height: SidebarLayout.footerHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SidebarLayout.footerPaddingH,
  },
  footerStatsText: {
    fontSize: 12,
    fontWeight: '400',
  },
  footerDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.m,
  },
  footerSettings: {
    height: SidebarLayout.footerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SidebarLayout.itemPaddingLeft,
    paddingRight: SidebarLayout.itemPaddingH,
    gap: SidebarLayout.itemGap,
  },
  footerSettingsLabel: {
    fontSize: 15,
    fontWeight: '400',
  },
});
