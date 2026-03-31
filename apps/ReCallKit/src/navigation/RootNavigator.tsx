import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDatabase } from '../hooks/useDatabase';
import { DrawerNavigator } from './DrawerNavigator';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isReady, error, db } = useDatabase();
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

  // DB初期化待ち or オンボーディングフラグ確認待ち
  if (!isReady || onboardingCompleted === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // DBエラー
  if (error) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="red" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboardingCompleted && (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )}
        <Stack.Screen name="Main" component={DrawerNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
