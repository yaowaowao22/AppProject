import React from 'react';
import { useColorScheme } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LightColors, DarkColors } from '../../theme/colors';
import { JournalScreen } from '../../screens/journal/JournalScreen';
import type { JournalStackParamList } from '../types';

const Stack = createNativeStackNavigator<JournalStackParamList>();

export function JournalStack() {
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
        name="Journal"
        component={JournalScreen}
        options={{
          title: 'ジャーナル',
          headerLargeTitle: true,
          headerLargeTitleStyle: { color: colors.label },
        }}
      />
    </Stack.Navigator>
  );
}
