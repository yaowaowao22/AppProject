import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { AppPreviewScreen } from '../screens/AppPreviewScreen';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitle: '戻る',
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'アプリカタログ' }}
      />
      <Stack.Screen
        name="AppPreview"
        component={AppPreviewScreen}
        options={({ route }: any) => ({
          title: route.params?.displayName ?? 'プレビュー',
        })}
      />
    </Stack.Navigator>
  );
}
