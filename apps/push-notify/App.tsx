import React, { useEffect, useRef, useCallback } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@massapp/ui';
import { AdProvider } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { theme } from './src/theme';
import { adConfig } from './src/ads.config';
import { RootNavigator } from './src/navigation/RootNavigator';
import {
  registerForPushNotifications,
  registerDevice,
  setupNotificationHandlers,
} from './src/utils/pushService';
import { generateApiKey, getCurrentMonthKey } from './src/utils/apiKey';
import type { PushNotification, UsageInfo } from './src/types';
import { Linking } from 'react-native';

function AppInner() {
  const [apiKey, setApiKey, apiKeyLoading] = useLocalStorage<string | null>('push_api_key', null);
  const [pushToken, setPushToken] = useLocalStorage<string | null>('push_token', null);
  const [notifications, setNotifications] = useLocalStorage<PushNotification[]>(
    'push_notifications',
    []
  );
  const [usage, setUsage] = useLocalStorage<UsageInfo>('push_usage', {
    monthKey: getCurrentMonthKey(),
    count: 0,
  });
  const [registered, setRegistered] = useLocalStorage('push_device_registered', false);
  const notificationsRef = useRef(notifications);
  notificationsRef.current = notifications;

  // APIキー初期化（AsyncStorage読み込み完了後のみ）
  useEffect(() => {
    if (!apiKeyLoading && apiKey === null) {
      setApiKey(generateApiKey());
    }
  }, [apiKey, apiKeyLoading, setApiKey]);

  // プッシュ通知登録
  useEffect(() => {
    if (apiKeyLoading || !apiKey || registered) return;

    (async () => {
      const token = await registerForPushNotifications();
      if (token) {
        setPushToken(token);
        const success = await registerDevice(apiKey, token);
        if (success) {
          setRegistered(true);
          console.log('[Push] デバイス登録完了');
        }
      }
    })();
  }, [apiKey, registered, setPushToken, setRegistered]);

  // 通知受信ハンドラ
  const handleNotificationReceived = useCallback(
    (notification: any) => {
      const data = notification.request?.content?.data;
      if (!data) return;

      const newNotif: PushNotification = {
        id: data.id ?? Date.now().toString(36),
        title: data.title ?? notification.request?.content?.title ?? '通知',
        message: data.message ?? notification.request?.content?.body ?? '',
        priority: data.priority ?? 'normal',
        timestamp: new Date().toISOString(),
        read: false,
        url: data.url,
      };

      setNotifications([newNotif, ...notificationsRef.current]);

      // 使用カウント更新
      const monthKey = getCurrentMonthKey();
      setUsage((prev: UsageInfo) => ({
        monthKey,
        count: prev.monthKey === monthKey ? prev.count + 1 : 1,
      }));
    },
    [setNotifications, setUsage]
  );

  const handleNotificationTapped = useCallback((response: any) => {
    const data = response.notification?.request?.content?.data;
    if (data?.url) {
      Linking.openURL(data.url).catch(() => {});
    }
  }, []);

  // 通知リスナー設定
  useEffect(() => {
    const sub = setupNotificationHandlers(handleNotificationReceived, handleNotificationTapped);
    return () => sub.remove();
  }, [handleNotificationReceived, handleNotificationTapped]);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme}>
        <AdProvider config={adConfig}>
          <AppInner />
        </AdProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
