import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDatabase } from '../hooks/useDatabase';
import { useTheme } from '../theme/ThemeContext';
import { DrawerNavigator } from './DrawerNavigator';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { SidebarFilterProvider } from '../hooks/useSidebarFilter';
import { initShareReceiver } from '../services/shareReceiver';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isReady, error, db } = useDatabase();
  const { colors } = useTheme();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  // DB初期化完了後にオンボーディング完了フラグを確認
  useEffect(() => {
    if (!isReady || !db) return;

    (async () => {
      const row = await db.getFirstAsync<{ value: string }>(
        `SELECT value FROM app_settings WHERE key = 'onboarding_completed'`
      );
      setOnboardingCompleted(row?.value === 'true');
    })();
  }, [isReady, db]);

  // DB初期化完了後に共有受信リスナーを登録
  useEffect(() => {
    if (!isReady || !db) return;
    return initShareReceiver(db);
  }, [isReady, db]);

  // DBエラー（最優先チェック）
  if (error) {
    const isOpfsError = Platform.OS === 'web' &&
      (error.message.includes('14') || error.message.includes('createSyncAccessHandle'));
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.label, fontSize: 17, fontWeight: '600', marginBottom: 8 }}>
          ⚠️ データベースの初期化に失敗しました
        </Text>
        <Text style={{ color: colors.labelSecondary, fontSize: 13, textAlign: 'center', paddingHorizontal: 32 }}>
          {error.message}
        </Text>
        {isOpfsError && (
          <Text style={{ color: colors.labelSecondary, fontSize: 12, textAlign: 'center', paddingHorizontal: 32, marginTop: 16 }}>
            ブラウザのサイトデータをクリアしてリロードしてください。{'\n'}
            Chrome: DevTools → Application → Storage → Clear site data
          </Text>
        )}
      </View>
    );
  }

  // DB初期化待ち or オンボーディングフラグ確認待ち
  if (!isReady || onboardingCompleted === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
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
