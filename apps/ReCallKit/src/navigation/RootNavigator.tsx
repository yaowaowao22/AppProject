import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDatabase } from '../hooks/useDatabase';
import { useTheme } from '../theme/ThemeContext';
import { DrawerNavigator } from './DrawerNavigator';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { SidebarFilterProvider } from '../hooks/useSidebarFilter';
import { initShareReceiver } from '../services/shareReceiver';
import { useNotificationSetup } from '../hooks/useNotificationSetup';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isReady, error, db } = useDatabase();
  const { colors } = useTheme();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  // OTA チェックは App.tsx の OTAGate で実施済み（ネイティブコンポーネント未マウント状態でリロードするため）

  // DB初期化完了後にオンボーディング完了フラグを確認
  useEffect(() => {
    if (!isReady || !db) return;

    (async () => {
      try {
        const row = await db.getFirstAsync<{ value: string }>(
          `SELECT value FROM app_settings WHERE key = 'onboarding_completed'`
        );
        setOnboardingCompleted(row?.value === 'true');
      } catch {
        setOnboardingCompleted(false);
      }
    })();
  }, [isReady, db]);

  // DB初期化完了後に共有受信リスナーを登録
  useEffect(() => {
    if (!isReady || !db) return;
    return initShareReceiver(db);
  }, [isReady, db]);

  // DB初期化完了後に通知セットアップ（権限・チャンネル・スケジュール）
  useNotificationSetup(db, isReady);

  // DBエラー（最優先チェック）
  if (error) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.label, fontSize: 17, fontWeight: '600', marginBottom: 8 }}>
          ⚠️ データベースの初期化に失敗しました
        </Text>
        <Text style={{ color: colors.labelSecondary, fontSize: 13, textAlign: 'center', paddingHorizontal: 32 }}>
          {error.message}
        </Text>
      </View>
    );
  }

  // DB初期化待ち or オンボーディングフラグ確認待ち
  if (!isReady || onboardingCompleted === null) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SidebarFilterProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!onboardingCompleted && (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          )}
          <Stack.Screen name="Main" component={DrawerNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </SidebarFilterProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
