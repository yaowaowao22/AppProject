import React from 'react';
import { useColorScheme } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LightColors, DarkColors } from '../../theme/colors';
import { SettingsScreen } from '../../screens/settings/SettingsScreen';
import { HeaderHamburger } from '../../components/HeaderHamburger';
import type { SettingsStackParamList } from '../types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.label },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.backgroundGrouped },
      }}
    >
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: '設定',
          headerLargeTitle: true,
          headerLargeTitleStyle: {
            color: colors.label,
            fontSize: 34,
            fontWeight: '700',
          },
          headerLeft: () => <HeaderHamburger />,
        }}
      />
    </Stack.Navigator>
  );
}
