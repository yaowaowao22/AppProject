import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useModelStore } from '../store/modelStore';
import ModelDownloadScreen from '../screens/onboarding/ModelDownloadScreen';
import CalculatorScreen from '../screens/calculator/CalculatorScreen';

// ── 型定義 ──────────────────────────────────────────────────────────────────
export type RootStackParamList = {
  ModelDownload: undefined;
  Calculator:    undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ── Navigator ────────────────────────────────────────────────────────────────
export default function RootNavigator() {
  // whisper-tiny がダウンロード済みかどうかで初期画面を切り替える
  const tinyReady = useModelStore((s) => s.downloadedModels.includes('tiny'));
  const initialRouteName: keyof RootStackParamList = tinyReady
    ? 'Calculator'
    : 'ModelDownload';

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        animation:   'fade',
      }}
    >
      <Stack.Screen name="ModelDownload" component={ModelDownloadScreen} />
      <Stack.Screen name="Calculator"    component={CalculatorScreen} />
    </Stack.Navigator>
  );
}
