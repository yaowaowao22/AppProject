import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { SettingsScreen } from '../../screens/settings/SettingsScreen';
import { AIModelScreen } from '../../screens/settings/AIModelScreen';
import { makeNavigatorOptions, makeLargeTitleOptions } from '../sharedScreenOptions';
import type { SettingsStackParamList } from '../types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...makeNavigatorOptions(colors),
        contentStyle: { backgroundColor: colors.backgroundGrouped },
      }}
    >
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ title: '設定', ...makeLargeTitleOptions(colors) }}
      />
      <Stack.Screen
        name="AIModel"
        component={AIModelScreen}
        options={{ title: 'AIモデル' }}
      />
    </Stack.Navigator>
  );
}
