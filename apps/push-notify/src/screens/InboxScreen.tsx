import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, H1, H2, Body, Caption, Card, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { PushNotification } from '../types';
import { FREE_LIMIT, PRIORITY_CONFIG } from '../types';
import { formatRelativeTime } from '../utils/apiKey';

export function InboxScreen() {
  const { colors, spacing, radius } = useTheme();
  const [notifications, setNotifications] = useLocalStorage<PushNotification[]>(
    'push_notifications',
    []
  );
  const [isPremium] = useLocalStorage('push_is_premium', false);

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
          onPress: () => setNotifications(notifications.filter((n) => n.id !== id)),
        },
      ]);
    },
    [notifications, setNotifications]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotification = ({ item }: { item: PushNotification }) => {
    const priorityConfig = PRIORITY_CONFIG[item.priority];
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          markAsRead(item.id);
          if (item.url) Linking.openURL(item.url).catch(() => {});
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
            <Caption color={colors.textMuted}>{formatRelativeTime(item.timestamp)}</Caption>
          </View>
          <Body
            color={item.read ? colors.textMuted : colors.text}
            style={{ marginTop: spacing.xs }}
            numberOfLines={3}
          >
            {item.message}
          </Body>
          {item.url && (
            <View style={[styles.urlRow, { marginTop: spacing.xs }]}>
              <Ionicons name="link-outline" size={12} color={colors.primary} />
              <Caption color={colors.primary} numberOfLines={1} style={{ marginLeft: 4, flex: 1 }}>
                {item.url}
              </Caption>
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
    <ScreenWrapper edges={['top']}>
      <View style={[styles.container, { padding: spacing.md }]}>
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

        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        />
      </View>
    </ScreenWrapper>
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
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
