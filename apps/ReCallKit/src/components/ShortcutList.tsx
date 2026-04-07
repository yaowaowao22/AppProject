// ============================================================
// ShortcutList
// ホームスクリーン用クイックアクション 縦リスト形式
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export type ShortcutAction = 'review' | 'url_add' | 'library' | 'map' | 'manual_add';

interface ShortcutItem {
  action: ShortcutAction;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  subLabel?: string;
}

const SHORTCUTS: ShortcutItem[] = [
  {
    action: 'url_add',
    icon: 'link-outline',
    label: 'URLから学習カードを作成',
    subLabel: 'AIがQ&Aを自動生成します',
  },
  {
    action: 'manual_add',
    icon: 'add-circle-outline',
    label: '手動でカードを作成',
  },
];

interface Props {
  onPress: (action: ShortcutAction) => void;
  /** 後方互換性のために保持（内部では未使用） */
  reviewDueCount?: number;
}

export function ShortcutList({ onPress }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.list}>
      {SHORTCUTS.map((item, index) => {
        const isLast = index === SHORTCUTS.length - 1;
        return (
          <Pressable
            key={item.action}
            style={({ pressed }) => [
              styles.row,
              !isLast && { borderBottomWidth: 1, borderBottomColor: '#F8F9FA' },
              { opacity: pressed ? 0.72 : 1 },
            ]}
            onPress={() => onPress(item.action)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            {/* 左: アイコン */}
            <Ionicons name={item.icon} size={20} color="#5F6368" />

            {/* 中央: テキスト */}
            <View style={styles.textWrap}>
              <Text style={[styles.label, { color: colors.label }]} numberOfLines={1}>
                {item.label}
              </Text>
              {item.subLabel && (
                <Text style={styles.subLabel} numberOfLines={1}>
                  {item.subLabel}
                </Text>
              )}
            </View>

            {/* 右: シェブロン */}
            <Ionicons name="chevron-forward" size={16} color="#9AA0A6" />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 16,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  subLabel: {
    fontSize: 12,
    color: '#9AA0A6',
    lineHeight: 16,
  },
});
