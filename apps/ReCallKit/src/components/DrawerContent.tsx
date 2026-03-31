import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useColorScheme,
} from 'react-native';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { SidebarColors } from '../theme/colors';
import { SidebarLayout, Spacing, Radius } from '../theme/spacing';

// ============================================================
// データ定義
// ============================================================

type SmartFilterId = 'today' | 'overdue' | 'recent';
type TagId = 'tag-frontend' | 'tag-db' | 'tag-psych' | 'tag-prog' | 'tag-design' | 'tag-backend' | 'tag-arch' | 'tag-aws';
type CollectionId = 'col-work' | 'col-liberal' | 'col-books';
type ItemId = SmartFilterId | TagId | CollectionId;

const SMART_FILTERS: { id: SmartFilterId; label: string; count: number | null; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'today',   label: '今日の復習', count: 2,    icon: 'calendar-outline' },
  { id: 'overdue', label: '期限切れ',   count: 5,    icon: 'time-outline' },
  { id: 'recent',  label: '最近追加',   count: null, icon: 'add-circle-outline' },
];

const TAGS: { id: TagId; label: string; count: number }[] = [
  { id: 'tag-frontend', label: 'フロントエンド', count: 12 },
  { id: 'tag-db',       label: 'データベース',   count: 8 },
  { id: 'tag-psych',    label: '心理学',         count: 6 },
  { id: 'tag-prog',     label: 'プログラミング', count: 5 },
  { id: 'tag-design',   label: 'デザイン',       count: 4 },
  { id: 'tag-backend',  label: 'バックエンド',   count: 3 },
  { id: 'tag-arch',     label: '設計',           count: 2 },
  { id: 'tag-aws',      label: 'AWS',            count: 1 },
];

const COLLECTIONS: { id: CollectionId; label: string; count: number }[] = [
  { id: 'col-work',    label: '仕事で使う技術',   count: 15 },
  { id: 'col-liberal', label: '教養・リベラルアーツ', count: 8 },
  { id: 'col-books',   label: '読書メモ',         count: 6 },
];

// ============================================================
// DrawerContent
// ============================================================

export function DrawerContent({ navigation }: DrawerContentComponentProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const sc = isDark ? SidebarColors.dark : SidebarColors.light;

  const [activeId, setActiveId] = useState<ItemId>('today');

  function handleSelect(id: ItemId) {
    setActiveId(id);
    navigation.closeDrawer();
  }

  return (
    <View style={[styles.container, { backgroundColor: sc.backgroundSolid }]}>

      {/* ---- Header ---- */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          ReCallKit
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.closeBtn,
            pressed && { backgroundColor: isDark ? 'rgba(235,235,245,0.12)' : 'rgba(142,142,147,0.12)' },
          ]}
          onPress={() => navigation.closeDrawer()}
          accessibilityLabel="サイドバーを閉じる"
          hitSlop={8}
        >
          <Ionicons name="close" size={22} color={sc.inactiveTint} />
        </Pressable>
      </View>

      {/* ---- Scrollable content ---- */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        bounces={true}
      >

        {/* Smart Filters セクション */}
        <View style={styles.section}>
          <SectionHeading label="Smart Filters" color={sc.sectionHeader} />
          {SMART_FILTERS.map((item) => (
            <NavItem
              key={item.id}
              isActive={activeId === item.id}
              onPress={() => handleSelect(item.id)}
              sc={sc}
            >
              <View style={styles.iconSlot}>
                <Ionicons
                  name={item.icon}
                  size={SidebarLayout.iconSize}
                  color={activeId === item.id ? sc.activeTint : sc.inactiveTint}
                />
              </View>
              <ItemLabel
                label={item.label}
                isActive={activeId === item.id}
                sc={sc}
              />
              {item.count !== null && (
                <CountBadge
                  count={item.count}
                  isActive={activeId === item.id}
                  sc={sc}
                />
              )}
            </NavItem>
          ))}
        </View>

        {/* Tags セクション */}
        <View style={[styles.section, styles.sectionGap]}>
          <SectionHeading label="Tags" color={sc.sectionHeader} />
          {TAGS.map((item) => (
            <NavItem
              key={item.id}
              isActive={activeId === item.id}
              onPress={() => handleSelect(item.id)}
              sc={sc}
            >
              {/* タグはドットのみ（アイコン不要） */}
              <View style={styles.iconSlot}>
                <TagDot isActive={activeId === item.id} sc={sc} />
              </View>
              <ItemLabel
                label={item.label}
                isActive={activeId === item.id}
                sc={sc}
              />
              <CountBadge
                count={item.count}
                isActive={activeId === item.id}
                sc={sc}
              />
            </NavItem>
          ))}
        </View>

        {/* Collections セクション */}
        <View style={[styles.section, styles.sectionGap]}>
          <SectionHeading label="Collections" color={sc.sectionHeader} />
          {COLLECTIONS.map((item) => (
            <NavItem
              key={item.id}
              isActive={activeId === item.id}
              onPress={() => handleSelect(item.id)}
              sc={sc}
            >
              <View style={styles.iconSlot}>
                <Ionicons
                  name="folder-outline"
                  size={SidebarLayout.iconSize}
                  color={activeId === item.id ? sc.activeTint : sc.inactiveTint}
                />
              </View>
              <ItemLabel
                label={item.label}
                isActive={activeId === item.id}
                sc={sc}
              />
              <CountBadge
                count={item.count}
                isActive={activeId === item.id}
                sc={sc}
              />
            </NavItem>
          ))}
        </View>

        {/* スクロール下部の余白 */}
        <View style={styles.scrollBottom} />
      </ScrollView>

      {/* ---- Footer: 知識の蓄積の控えめな可視化 ---- */}
      <View style={[styles.footer, { borderTopColor: sc.separator }]}>
        <Text style={[styles.footerText, { color: isDark ? 'rgba(235,235,245,0.30)' : 'rgba(60,60,67,0.30)' }]}>
          41 cards · 78% mastered
        </Text>
      </View>

    </View>
  );
}

// ============================================================
// Sub-components
// ============================================================

type SC = typeof SidebarColors.light | typeof SidebarColors.dark;

function SectionHeading({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.sectionHeading}>
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
          ? [styles.navItemPressed, { backgroundColor: isDarkSC(sc) ? 'rgba(235,235,245,0.06)' : 'rgba(142,142,147,0.12)' }]
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
        { color: isActive ? sc.activeTint : sc.sectionHeader },
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
          : { backgroundColor: 'transparent', borderColor: isDarkSC(sc) ? 'rgba(235,235,245,0.30)' : 'rgba(60,60,67,0.30)' },
      ]}
    />
  );
}

// SidebarColors.dark かどうか判定（overlay 色の差で区別）
function isDarkSC(sc: SC): boolean {
  return sc.overlay === SidebarColors.dark.overlay;
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
    height: 64 + 54, // header content + status bar safe area
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingLeft: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 36,
    height: 36,
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
    paddingHorizontal: 24,
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
    paddingLeft: 24,
    paddingRight: SidebarLayout.itemPaddingH,
    gap: 12,
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
    width: 20,
    height: 20,
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
    flexShrink: 0,
    minWidth: 16,
    textAlign: 'right',
  },

  // --- Tag dot ---
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
  },

  // --- Footer ---
  footer: {
    height: SidebarLayout.footerHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '400',
  },
});
