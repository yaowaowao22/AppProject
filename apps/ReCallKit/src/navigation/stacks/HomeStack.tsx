import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { HomeScreen } from '../../screens/home/HomeScreen';
import { ItemDetailScreen } from '../../screens/library/ItemDetailScreen';
import { ReviewScreen } from '../../screens/review/ReviewScreen';
import { URLImportListScreen } from '../../screens/add/URLImportListScreen';
import { makeNavigatorOptions, makeLargeTitleOptions } from '../sharedScreenOptions';
import type { HomeStackParamList } from '../types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...makeNavigatorOptions(colors),
        contentStyle: { backgroundColor: colors.backgroundGrouped },
      }}
    >
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{
          title: '今日',
          ...makeLargeTitleOptions(colors),
        }}
      />
      <Stack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{ title: '' }}
      />
    </Stack.Navigator>
  );
}
