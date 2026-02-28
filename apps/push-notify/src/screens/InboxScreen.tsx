import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, H1, H2, Body, Caption, Card, Badge } from '@massapp/ui';
import { useLocalStorage } from '@massapp/hooks';
import type { PushNotification } from '../types';
import { FREE_LIMIT, PRIORITY_CONFIG } from '../types';
import { formatRelativeTime } from '../utils/apiKey';

export function InboxScreen() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useLocalStorage<PushNotification[]>(
    'push_notifications',
    []
  );
  const [isPremium] = useLocalStorage('push_is_premium', false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    [notifications, setNotifications]
  );

  const deleteNotification = useCallback(
    (id: string) => {
      Alert.alert('削除', 'この通知を削除しますか？', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            setNotifications(notifications.filter((n) => n.id !== id));
            if (expandedId === id) setExpandedId(null);
          },
        },
      ]);
    },
    [notifications, setNotifications, expandedId]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotification = ({ item }: { item: PushNotification }) => {
    const priorityConfig = PRIORITY_CONFIG[item.priority];
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          markAsRead(item.id);
          setExpandedId(isExpanded ? null : item.id);
        }}
        onLongPress={() => deleteNotification(item.id)}
      >
        <Card
          style={[
            styles.notifCard,
            !item.read && { borderLeftWidth: 3, borderLeftColor: priorityConfig.color },
          ]}
        >
          <View style={styles.notifHeader}>
            <View style={styles.notifTitleRow}>
              <Ionicons
                name={priorityConfig.icon as any}
                size={18}
                color={priorityConfig.color}
              />
              <H2 style={[styles.notifTitle, !item.read && { fontWeight: 'bold' }]}>
                {item.title}
              </H2>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Caption color={colors.textMuted}>{formatRelativeTime(item.timestamp)}</Caption>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textMuted}
              />
            </View>
          </View>
          <Body
            color={item.read ? colors.textMuted : colors.text}
            style={{ marginTop: spacing.xs }}
            numberOfLines={isExpanded ? undefined : 2}
          >
            {item.message}
          </Body>

          {isExpanded && (
            <View style={{ marginTop: spacing.sm }}>
              <View style={[styles.detailRow, { paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <Caption color={colors.textMuted}>優先度</Caption>
                <Badge label={priorityConfig.label} variant={item.priority === 'urgent' ? 'error' : item.priority === 'high' ? 'warning' : 'info'} />
              </View>
              <View style={[styles.detailRow, { marginTop: spacing.xs }]}>
                <Caption color={colors.textMuted}>受信時刻</Caption>
                <Caption color={colors.textSecondary}>
                  {new Date(item.timestamp).toLocaleString('ja-JP')}
                </Caption>
              </View>
              {item.url && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(item.url!).catch(() => {})}
                  style={[styles.urlButton, { backgroundColor: colors.primary + '15', borderRadius: radius.sm, marginTop: spacing.sm }]}
                >
                  <Ionicons name="open-outline" size={14} color={colors.primary} />
                  <Caption color={colors.primary} numberOfLines={1} style={{ marginLeft: 6, flex: 1 }}>
                    {item.url}
                  </Caption>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => deleteNotification(item.id)}
                style={{ marginTop: spacing.sm, alignSelf: 'flex-end' }}
              >
                <Caption color={colors.error}>削除</Caption>
              </TouchableOpacity>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
      <H2 style={{ marginTop: spacing.md }} color={colors.textSecondary}>
        通知はまだありません
      </H2>
      <Body
        color={colors.textMuted}
        style={{ marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.xl }}
      >
        API設定タブからAPIキーを取得して{'\n'}外部サービスと連携しましょう
      </Body>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={{ padding: spacing.md, paddingBottom: 0 }}>
        <View style={[styles.header, { marginBottom: spacing.md }]}>
          <View>
            <H1 style={{ fontSize: 24 }}>受信箱</H1>
            {unreadCount > 0 && (
              <Caption color={colors.primary}>{unreadCount}件の未読</Caption>
            )}
          </View>
          <Badge
            label={isPremium ? 'プレミアム' : `無料 ${notifications.length}/${FREE_LIMIT}`}
            variant={isPremium ? 'success' : notifications.length >= FREE_LIMIT ? 'error' : 'info'}
          />
        </View>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : { paddingHorizontal: spacing.md, paddingBottom: 16 }}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifCard: {
    padding: 12,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  urlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyList: {
    flex: 1,
  },
});
