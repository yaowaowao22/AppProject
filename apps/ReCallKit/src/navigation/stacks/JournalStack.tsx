import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { JournalScreen } from '../../screens/journal/JournalScreen';
import { makeNavigatorOptions, makeLargeTitleOptions } from '../sharedScreenOptions';
import type { JournalStackParamList } from '../types';

const Stack = createNativeStackNavigator<JournalStackParamList>();

export function JournalStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...makeNavigatorOptions(colors),
        contentStyle: { backgroundColor: colors.backgroundGrouped },
      }}
    >
      <Stack.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          title: 'ジャーナル',
          ...makeLargeTitleOptions(colors),
        }}
      />
    </Stack.Navigator>
  );
}
