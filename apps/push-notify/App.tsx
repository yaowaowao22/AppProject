import React, { useEffect, useCallback, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, Modal, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme, H1, H2, Body, Caption, Card } from '@massapp/ui';
import type { ThemeMode } from '@massapp/ui';
import { Ionicons } from '@expo/vector-icons';
import { AdProvider } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { theme } from './src/theme';
import { adConfig } from './src/ads.config';
import { RootNavigator } from './src/navigation/RootNavigator';
import {
  registerForPushNotifications,
  registerDevice,
  setupNotificationHandlers,
  getPendingNotifications,
  dismissAllNotifications,
  getLastNotificationResponse,
} from './src/utils/pushService';
import { initPurchases, checkPremium } from './src/utils/purchases';
import { generateApiKey, getCurrentMonthKey } from './src/utils/apiKey';
import { getSecureApiKey, setSecureApiKey } from './src/utils/secureStore';
import { API_BASE } from './src/config';
import type { PushNotification, UsageInfo } from './src/types';
import { UsageProvider } from './src/UsageContext';
import { Linking, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

function extractNotification(notification: any): PushNotification | null {
  const content = notification.request?.content ?? notification?.notification?.request?.content;
  if (!content) return null;
  const data = content.data;
  return {
    id: data?.id ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: data?.title ?? content.title ?? '通知',
    message: data?.message ?? content.body ?? '',
    priority: data?.priority ?? 'normal',
    timestamp: data?.sentAt ?? new Date().toISOString(),
    read: false,
    url: data?.url,
    category: data?.category,
  };
}

const WHATS_NEW_VERSION = '1.2.1';
const WHATS_NEW_ITEMS = [
  { icon: 'moon-outline', title: 'ダークモード', desc: '設定タブからライト/ダーク/自動を切り替えられます', type: 'new' as const },
  { icon: 'text-outline', title: 'フォントカスタマイズ', desc: 'フォントサイズとカラーを自由に調整できます', type: 'new' as const },
  { icon: 'folder-outline', title: 'カテゴリ機能', desc: '通知にカテゴリを設定してグループ分けできます。受信箱レイアウトをカテゴリビューに切り替え可能', type: 'new' as const },
  { icon: 'funnel-outline', title: '未読/既読フィルター', desc: '受信箱で未読・既読の絞り込みができます', type: 'new' as const },
  { icon: 'ellipse', title: '未読マーク', desc: '未読通知にドットマークが表示されます', type: 'new' as const },
  { icon: 'time-outline', title: '受信時刻の修正', desc: '受信時刻がアプリを開いた時間になる問題を修正しました', type: 'fix' as const },
  { icon: 'color-palette-outline', title: '既読文字色の改善', desc: '既読通知の文字色が薄すぎた問題を改善しました', type: 'fix' as const },
  { icon: 'notifications-outline', title: 'タブバー・受信箱の修正', desc: 'タブバーが切れる問題、受信箱が更新されない問題を修正しました', type: 'fix' as const },
];

function WhatsNewModal() {
  const { colors, spacing, radius } = useTheme();
  const [visible, setVisible] = useState(false);
  const [, setSeenVersion] = useLocalStorage<string | null>('push_whats_new_seen', null);

  useEffect(() => {
    AsyncStorage.getItem('push_whats_new_seen').then((raw) => {
      const seen = raw ? JSON.parse(raw) : null;
      if (seen !== WHATS_NEW_VERSION) {
        setVisible(true);
      }
    }).catch(() => {});
  }, []);

  const handleClose = () => {
    setVisible(false);
    setSeenVersion(WHATS_NEW_VERSION);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={whatsNewStyles.overlay}>
        <View style={[whatsNewStyles.container, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.md }}>
            <H1 style={{ fontSize: 22, textAlign: 'center', marginBottom: 4 }}>新機能のお知らせ</H1>
            <Caption color={colors.textMuted} style={{ textAlign: 'center', marginBottom: spacing.md }}>
              v{WHATS_NEW_VERSION}
            </Caption>

            {WHATS_NEW_ITEMS.filter(i => i.type === 'new').length > 0 && (
              <Caption color={colors.textMuted} style={{ fontWeight: '600', marginBottom: spacing.xs }}>新機能</Caption>
            )}
            {WHATS_NEW_ITEMS.filter(i => i.type === 'new').map((item, i) => (
              <View key={`new-${i}`} style={[whatsNewStyles.item, { marginBottom: spacing.sm }]}>
                <View style={[whatsNewStyles.iconWrap, { backgroundColor: colors.primary + '15', borderRadius: radius.sm }]}>
                  <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <H2 style={{ fontSize: 14 }}>{item.title}</H2>
                  <Caption color={colors.textSecondary} style={{ lineHeight: 18 }}>{item.desc}</Caption>
                </View>
              </View>
            ))}

            {WHATS_NEW_ITEMS.filter(i => i.type === 'fix').length > 0 && (
              <Caption color={colors.textMuted} style={{ fontWeight: '600', marginTop: spacing.xs, marginBottom: spacing.xs }}>不具合修正</Caption>
            )}
            {WHATS_NEW_ITEMS.filter(i => i.type === 'fix').map((item, i) => (
              <View key={`fix-${i}`} style={[whatsNewStyles.item, { marginBottom: spacing.sm }]}>
                <View style={[whatsNewStyles.iconWrap, { backgroundColor: colors.success + '15', borderRadius: radius.sm }]}>
                  <Ionicons name={item.icon as any} size={20} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <H2 style={{ fontSize: 14 }}>{item.title}</H2>
                  <Caption color={colors.textSecondary} style={{ lineHeight: 18 }}>{item.desc}</Caption>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={{ padding: spacing.md, paddingTop: 0 }}>
            <TouchableOpacity
              onPress={handleClose}
              style={[whatsNewStyles.button, { backgroundColor: colors.primary, borderRadius: radius.sm }]}
            >
              <Body style={{ color: colors.textOnPrimary, fontWeight: '600', textAlign: 'center' }}>OK</Body>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const whatsNewStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxHeight: '80%',
  },
  item: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    paddingVertical: 14,
  },
});

function AppInner() {
  const [apiKey, setApiKey, apiKeyLoading] = useLocalStorage<string | null>('push_api_key', null);
  const [pushToken, setPushToken] = useLocalStorage<string | null>('push_token', null);
  const [notifications, setNotifications, notificationsLoading] = useLocalStorage<PushNotification[]>(
    'push_notifications',
    []
  );
  const [usage, setUsage] = useLocalStorage<UsageInfo>('push_usage', {
    monthKey: getCurrentMonthKey(),
    count: 0,
  });
  const [isPremium, setIsPremium] = useLocalStorage('push_is_premium', false);
  const [registered, setRegistered] = useLocalStorage('push_device_registered', false);
  const processedResponseIdRef = useRef<string | null>(null);

  // APIキー初期化
  useEffect(() => {
    if (apiKeyLoading) return;
    (async () => {
      if (apiKey) {
        await setSecureApiKey(apiKey);
        return;
      }
      const secureKey = await getSecureApiKey();
      if (secureKey) {
        setApiKey(secureKey);
        return;
      }
      const newKey = generateApiKey();
      setApiKey(newKey);
      await setSecureApiKey(newKey);
    })();
  }, [apiKey, apiKeyLoading, setApiKey]);

  // RevenueCat初期化 + premium状態同期
  useEffect(() => {
    if (apiKeyLoading || !apiKey) return;
    (async () => {
      await initPurchases();
      const hasPremium = await checkPremium();
      setIsPremium(hasPremium);
      if (hasPremium) {
        fetch(`${API_BASE}/api/premium`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: apiKey }),
        }).catch(() => {});
      }
    })();
  }, [apiKey, apiKeyLoading]);

  // プッシュ通知登録
  useEffect(() => {
    if (apiKeyLoading || !apiKey || registered) return;
    (async () => {
      const token = await registerForPushNotifications();
      if (token) {
        setPushToken(token);
        const success = await registerDevice(apiKey, token);
        if (success) setRegistered(true);
      }
    })();
  }, [apiKey, apiKeyLoading, registered, setPushToken, setRegistered]);

  // フォアグラウンド通知受信ハンドラ
  const handleNotificationReceived = useCallback(
    (notification: any) => {
      const notif = extractNotification(notification);
      if (notif) {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });
      }
    },
    [setNotifications]
  );

  // フォアグラウンド受信リスナーのみ（タップリスナーは登録しない）
  useEffect(() => {
    const sub = setupNotificationHandlers(handleNotificationReceived);
    return () => sub.remove();
  }, [handleNotificationReceived]);

  // 通知同期：通知センター + タップした通知を取り込み
  // タップリスナーを一切使わず getLastNotificationResponseAsync で直接取得
  const syncPendingNotifications = useCallback(async () => {
    const newNotifs: PushNotification[] = [];

    // 1. タップで起動した通知を取得（リスナー未登録なので確実に取れる）
    try {
      const lastResponse = await getLastNotificationResponse();
      if (lastResponse) {
        const responseId = lastResponse.notification?.request?.identifier;
        if (responseId && responseId !== processedResponseIdRef.current) {
          processedResponseIdRef.current = responseId;
          const notif = extractNotification(lastResponse);
          if (notif) {
            newNotifs.push({ ...notif, read: true });
            // URLがあれば開く
            const url = lastResponse.notification?.request?.content?.data?.url;
            if (url) Linking.openURL(url).catch(() => {});
          }
        }
      }
    } catch {}

    // 2. 通知センターに残っている通知を取得
    const pending = await getPendingNotifications();
    for (const notification of pending) {
      const notif = extractNotification(notification);
      if (notif && !newNotifs.some((n) => n.id === notif.id)) {
        newNotifs.push(notif);
      }
    }

    // 3. 受信箱に追加
    if (newNotifs.length > 0) {
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const filtered = newNotifs.filter((n) => !existingIds.has(n.id));
        return filtered.length > 0 ? [...filtered, ...prev] : prev;
      });
    }

    // 4. 通知センターをクリア（次回起動時の重複防止）
    dismissAllNotifications();
  }, [setNotifications]);

  useEffect(() => {
    if (apiKeyLoading || notificationsLoading) return;
    syncPendingNotifications();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncPendingNotifications();
    });
    return () => sub.remove();
  }, [apiKeyLoading, notificationsLoading, syncPendingNotifications]);

  // サーバーから使用状況を同期
  useEffect(() => {
    if (apiKeyLoading || !apiKey) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/status?token=${apiKey}`);
        const data = await res.json();
        if (data.usage) {
          setUsage({ monthKey: data.usage.month, count: data.usage.count });
        }
      } catch {}
    })();
  }, [apiKey, apiKeyLoading, setUsage]);

  return (
    <UsageProvider value={{ usage, isPremium }}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <RootNavigator />
        <WhatsNewModal />
      </NavigationContainer>
    </UsageProvider>
  );
}

export default function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('push_theme_mode').then((raw) => {
      const saved = raw ? JSON.parse(raw) : null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeMode(saved);
      }
      setReady(true);
    }).catch(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme} initialMode={themeMode}>
        <AdProvider config={adConfig}>
          <AppInner />
        </AdProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
