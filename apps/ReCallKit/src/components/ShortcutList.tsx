// ============================================================
// ShortcutList
// ホームスクリーン用クイックアクション 2×2 グリッド
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

export type ShortcutAction = 'review' | 'url_add' | 'library' | 'map';

interface ShortcutItem {
  action: ShortcutAction;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
}

const SHORTCUTS: ShortcutItem[] = [
  { action: 'review',  icon: 'play-circle-outline', label: '復習を始める' },
  { action: 'url_add', icon: 'link-outline',         label: 'URLから追加' },
  { action: 'library', icon: 'library-outline',      label: 'ライブラリ' },
  { action: 'map',     icon: 'map-outline',          label: 'ナレッジマップ' },
];

interface Props {
  onPress: (action: ShortcutAction) => void;
  /** 復習件数 > 0 の場合に「復習を始める」セルにバッジ表示 */
  reviewDueCount?: number;
}

export function ShortcutList({ onPress, reviewDueCount = 0 }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.grid}>
      {SHORTCUTS.map((item) => (
        <Pressable
          key={item.action}
          style={({ pressed }) => [
            styles.cell,
            { backgroundColor: colors.card, opacity: pressed ? 0.72 : 1 },
          ]}
          onPress={() => onPress(item.action)}
          accessibilityRole="button"
          accessibilityLabel={item.label}
        >
          {/* アイコン + バッジ */}
          <View style={[styles.iconWrap, { backgroundColor: colors.accent + '1A' }]}>
            <Ionicons name={item.icon} size={22} color={colors.accent} />
            {item.action === 'review' && reviewDueCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                <Text style={styles.badgeText}>
                  {reviewDueCount > 99 ? '99+' : String(reviewDueCount)}
                </Text>
              </View>
            )}
          </View>

          {/* ラベル */}
          <Text
            style={[styles.label, { color: colors.label }]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // 2列ラップレイアウト（gap: Spacing.s = 8pt）
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s,
  },
  cell: {
    // flex: 1 + minWidth: '45%' で 2列を維持しつつ伸縮
    flex: 1,
    minWidth: '45%',
    borderRadius: Radius.l,
    padding: Spacing.m,
    alignItems: 'flex-start',
    gap: Spacing.s,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    lineHeight: 12,
  },
  label: {
    ...TypeScale.footnote,
    fontWeight: '500' as const,
  },
});
