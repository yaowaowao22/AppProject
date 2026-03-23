import React, { useEffect, useCallback, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Alert } from 'react-native';
import { ThemeProvider } from '@massapp/ui';
import type { ThemeMode } from '@massapp/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalStorage } from '@massapp/hooks';
import { theme } from './src/theme';
import { STORE_KEYS } from './src/config';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SubscriptionProvider, useSubscriptions } from './src/SubscriptionContext';
import { AddSubscriptionModal } from './src/screens/AddSubscriptionModal';
import type { Subscription } from './src/types';
import { requestPermissions, scheduleSubscriptionReminders } from './src/utils/notificationUtils';

// ── AppInner: モーダル状態・サブスク操作を担当 ─────────────────────────────
function AppInner() {
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription } = useSubscriptions();
  const [notify3days] = useLocalStorage<boolean>(STORE_KEYS.notify3days, true);
  const [notify1day] = useLocalStorage<boolean>(STORE_KEYS.notify1day, true);

  // 通知権限リクエスト（初回起動時）
  useEffect(() => {
    requestPermissions().catch(() => {});
  }, []);

  // サブスク変更時にリマインダーを再スケジュール
  // NOTE: notify3days/notify1day は SettingsScreen の Switch 変更時に直接再スケジュール済みのため、
  // ここでは subscriptions 変更時のみ実行して二重スケジュールを防ぐ
  useEffect(() => {
    scheduleSubscriptionReminders(subscriptions, notify3days ?? true, notify1day ?? true).catch(
      () => {},
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | undefined>(
    undefined,
  );

  const handleAddPress = useCallback(() => {
    setEditingSubscription(undefined);
    setShowAddModal(true);
  }, []);

  const handleEditPress = useCallback((sub: Subscription) => {
    setEditingSubscription(sub);
    setShowAddModal(true);
  }, []);

  const handleClose = useCallback(() => {
    setShowAddModal(false);
    setEditingSubscription(undefined);
  }, []);

  const handleSave = useCallback(
    (sub: Subscription) => {
      if (editingSubscription) {
        updateSubscription(sub.id, sub);
      } else {
        const added = addSubscription(sub);
        if (!added) {
          Alert.alert(
            '無料版の上限',
            '無料版では3件まで登録できます。\nプレミアムにアップグレードすると無制限に追加できます。',
            [{ text: 'OK' }],
          );
          return;
        }
      }
      handleClose();
    },
    [editingSubscription, addSubscription, updateSubscription, handleClose],
  );

  const handleDelete = useCallback(() => {
    if (editingSubscription) {
      deleteSubscription(editingSubscription.id);
    }
    handleClose();
  }, [editingSubscription, deleteSubscription, handleClose]);

  return (
    <>
      <NavigationContainer>
        <StatusBar style="auto" />
        <RootNavigator onAddPress={handleAddPress} onEditPress={handleEditPress} />
      </NavigationContainer>

      {/* AddSubscriptionModal は NavigationContainer 外・プロバイダー内でレンダリング */}
      {showAddModal && (
        <AddSubscriptionModal
          subscription={editingSubscription}
          onClose={handleClose}
          onSave={handleSave}
          onDelete={editingSubscription ? handleDelete : undefined}
        />
      )}
    </>
  );
}

// ── App: プロバイダー + テーマ初期化 ─────────────────────────────────────
export default function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);

  // AsyncStorage からテーマモードを復元（push-notify と同パターン）
  useEffect(() => {
    AsyncStorage.getItem(STORE_KEYS.themeMode)
      .then((raw) => {
        const saved = raw ? JSON.parse(raw) : null;
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeMode(saved);
        }
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme} initialMode={themeMode}>
          <SubscriptionProvider>
            <AppInner />
          </SubscriptionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
