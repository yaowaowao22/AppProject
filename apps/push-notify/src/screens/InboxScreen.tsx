import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  PanResponder,
  Linking,
  TextInput,
  RefreshControl,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, H1, H2, Body, Caption, Card, Badge } from '@massapp/ui';
import { useLocalStorage } from '@massapp/hooks';
import type { PushNotification } from '../types';
import { FREE_LIMIT, PRIORITY_CONFIG, DEFAULT_CATEGORY } from '../types';
import { formatRelativeTime, getCurrentMonthKey } from '../utils/apiKey';
import { useUsage } from '../UsageContext';

const BUTTON_W = 72;
const { width: SCREEN_W } = Dimensions.get('window');

function SwipeableRow({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const offsetRef = useRef(0);
  const { colors } = useTheme();

  const snap = (to: number) => {
    offsetRef.current = to;
    Animated.timing(translateX, {
      toValue: to,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 4 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => {
        const next = offsetRef.current + g.dx;
        translateX.setValue(Math.max(Math.min(next, 0), -SCREEN_W));
      },
      onPanResponderRelease: (_, g) => {
        const next = offsetRef.current + g.dx;
        // Fast swipe detection
        if (g.vx < -0.5 || next < -BUTTON_W * 0.4) {
          snap(-BUTTON_W);
        } else {
          snap(0);
        }
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  return (
    <View style={{ overflow: 'hidden' }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          snap(0);
          onDelete();
        }}
        style={[styles.deleteAction, { backgroundColor: colors.error, width: BUTTON_W }]}
      >
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Caption color="#fff" style={{ fontSize: 10, marginTop: 2 }}>削除</Caption>
      </TouchableOpacity>
      <Animated.View
        style={{
          transform: [{ translateX }],
          backgroundColor: colors.background,
        }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

export function InboxScreen() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useLocalStorage<PushNotification[]>(
    'push_notifications',
    []
  );
  const { usage, isPremium } = useUsage();
  const [fontSize] = useLocalStorage<number>('push_font_size', 14);
  const [fontColor] = useLocalStorage<string | null>('push_font_color', null);
  const [inboxLayout] = useLocalStorage<'flat' | 'category'>('push_inbox_layout', 'flat');
  const [expandedId, setExpandedId] = useLocalStorage<string | null>('inbox_expanded_id', null);
  const [searchQuery, setSearchQuery] = useState('');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const raw = await AsyncStorage.getItem('push_notifications');
      if (raw) {
        setNotifications(JSON.parse(raw));
      }
    } catch {}
    setRefreshing(false);
  }, [setNotifications]);

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
    if (readFilter === 'unread') filtered = filtered.filter((n) => !n.read);
    else if (readFilter === 'read') filtered = filtered.filter((n) => n.read);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          (n.url && n.url.toLowerCase().includes(q)) ||
          (n.category && n.category.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [notifications, searchQuery, readFilter]);

  const categoryGroups = useMemo(() => {
    if (inboxLayout !== 'category') return [];
    const groups = new Map<string, { total: number; unread: number; latest: string }>();
    for (const n of filteredNotifications) {
      const cat = n.category || DEFAULT_CATEGORY;
      const existing = groups.get(cat);
      if (!existing) {
        groups.set(cat, { total: 1, unread: n.read ? 0 : 1, latest: n.timestamp });
      } else {
        existing.total += 1;
        if (!n.read) existing.unread += 1;
        if (n.timestamp > existing.latest) existing.latest = n.timestamp;
      }
    }
    return Array.from(groups.entries())
      .map(([name, info]) => ({ name, ...info }))
      .sort((a, b) => b.latest.localeCompare(a.latest));
  }, [filteredNotifications, inboxLayout]);

  const displayNotifications = useMemo(() => {
    if (inboxLayout !== 'category' || !selectedCategory) return filteredNotifications;
    return filteredNotifications.filter(
      (n) => (n.category || DEFAULT_CATEGORY) === selectedCategory
    );
  }, [filteredNotifications, selectedCategory, inboxLayout]);

  const removeCategory = useCallback(
    (categoryName: string) => {
      setNotifications(notifications.filter(
        (n) => (n.category || DEFAULT_CATEGORY) !== categoryName
      ));
    },
    [notifications, setNotifications]
  );

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    [notifications, setNotifications]
  );

  const removeNotification = useCallback(
    (id: string) => {
      setNotifications(notifications.filter((n) => n.id !== id));
      if (expandedId === id) setExpandedId(null);
    },
    [notifications, setNotifications, expandedId]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotification = ({ item }: { item: PushNotification }) => {
    const priorityConfig = PRIORITY_CONFIG[item.priority];
    const isExpanded = expandedId === item.id;

    return (
      <SwipeableRow onDelete={() => removeNotification(item.id)}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            markAsRead(item.id);
            setExpandedId(isExpanded ? null : item.id);
          }}
        >
          <Card
            style={[
              styles.notifCard,
              !item.read && { borderLeftWidth: 3, borderLeftColor: priorityConfig.color },
            ]}
          >
            <View style={styles.notifHeader}>
              <View style={styles.notifTitleRow}>
                {!item.read && (
                  <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                )}
                <Ionicons
                  name={priorityConfig.icon as any}
                  size={18}
                  color={priorityConfig.color}
                />
                <H2 style={[styles.notifTitle, { fontSize: fontSize + 1 }, !item.read && { fontWeight: 'bold' }]}>
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
              color={fontColor ?? (item.read ? colors.textSecondary : colors.text)}
              style={{ marginTop: spacing.xs, fontSize, lineHeight: fontSize * 1.5 }}
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
                {item.category && (
                  <View style={[styles.detailRow, { marginTop: spacing.xs }]}>
                    <Caption color={colors.textMuted}>カテゴリ</Caption>
                    <Caption color={colors.textSecondary}>{item.category}</Caption>
                  </View>
                )}
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
              </View>
            )}
          </Card>
        </TouchableOpacity>
      </SwipeableRow>
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
        <View style={[styles.header, { marginBottom: spacing.xs }]}>
          <View>
            <H1 style={{ fontSize: 24 }}>受信箱</H1>
            {unreadCount > 0 && (
              <Caption color={colors.primary}>{unreadCount}件の未読</Caption>
            )}
          </View>
          <Badge
            label={isPremium ? 'プレミアム' : `無料 ${usage.monthKey === getCurrentMonthKey() ? usage.count : 0}/${FREE_LIMIT}`}
            variant={isPremium ? 'success' : (usage.monthKey === getCurrentMonthKey() ? usage.count : 0) >= FREE_LIMIT ? 'error' : 'info'}
          />
        </View>

        {notifications.length > 0 && (
          <View style={[styles.searchRow, { marginBottom: spacing.sm }]}>
            <View style={[styles.searchBox, { backgroundColor: colors.surface, borderRadius: radius.sm, borderColor: colors.border, flex: 1 }]}>
              <Ionicons name="search" size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="検索..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.filterRow}>
              {(['all', 'unread', 'read'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setReadFilter(f)}
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: readFilter === f ? colors.primary : colors.surface,
                      borderColor: readFilter === f ? colors.primary : colors.border,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Caption
                    color={readFilter === f ? colors.textOnPrimary : colors.textSecondary}
                    style={{ fontSize: 11 }}
                  >
                    {f === 'all' ? '全て' : f === 'unread' ? '未読' : '既読'}
                  </Caption>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {inboxLayout === 'category' && selectedCategory && (
        <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}>
          <TouchableOpacity
            onPress={() => setSelectedCategory(null)}
            style={[styles.breadcrumb, { backgroundColor: colors.primary + '12', borderRadius: radius.sm }]}
          >
            <Ionicons name="chevron-back" size={16} color={colors.primary} />
            <Caption color={colors.primary}>カテゴリ一覧</Caption>
            <Ionicons name="chevron-forward" size={12} color={colors.textMuted} style={{ marginHorizontal: 2 }} />
            <Body color={colors.text} style={{ fontWeight: '600', fontSize: 14 }}>{selectedCategory}</Body>
          </TouchableOpacity>
        </View>
      )}

      {inboxLayout === 'category' && !selectedCategory ? (
        <FlatList
          data={categoryGroups}
          keyExtractor={(item) => item.name}
          contentContainerStyle={categoryGroups.length === 0 ? styles.emptyList : { paddingHorizontal: spacing.md, paddingBottom: 16 }}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <SwipeableRow onDelete={() => removeCategory(item.name)}>
              <TouchableOpacity onPress={() => setSelectedCategory(item.name)}>
                <Card style={styles.notifCard}>
                  <View style={styles.notifHeader}>
                    <View style={styles.notifTitleRow}>
                      <Ionicons name="folder-outline" size={18} color={colors.primary} />
                      <H2 style={[styles.notifTitle, item.unread > 0 && { fontWeight: 'bold' }]}>
                        {item.name}
                      </H2>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {item.unread > 0 && (
                        <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
                          <Caption color={colors.textOnPrimary} style={{ fontSize: 11 }}>{item.unread}</Caption>
                        </View>
                      )}
                      <Caption color={colors.textMuted}>{item.total}件</Caption>
                      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            </SwipeableRow>
          )}
        />
      ) : (
        <FlatList
          data={displayNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={displayNotifications.length === 0 ? styles.emptyList : { paddingHorizontal: spacing.md, paddingBottom: 16 }}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}
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
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 4,
  },
  filterButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  categoryBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
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
