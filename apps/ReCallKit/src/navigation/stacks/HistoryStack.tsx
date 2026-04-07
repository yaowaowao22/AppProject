import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { HistoryScreen } from '../../screens/history/HistoryScreen';
import { makeNavigatorOptions, makeLargeTitleOptions } from '../sharedScreenOptions';
import type { HistoryStackParamList } from '../types';

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export function HistoryStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...makeNavigatorOptions(colors),
        contentStyle: { backgroundColor: colors.backgroundGrouped },
      }}
    >
      <Stack.Screen
        name="HistoryMain"
        component={HistoryScreen}
        options={{
          title: '学習履歴',
          ...makeLargeTitleOptions(colors),
        }}
      />
    </Stack.Navigator>
  );
}
