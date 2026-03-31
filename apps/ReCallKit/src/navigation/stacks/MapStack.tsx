import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { KnowledgeMapScreen } from '../../screens/map/KnowledgeMapScreen';
import { ItemDetailScreen } from '../../screens/library/ItemDetailScreen';
import { makeNavigatorOptions, makeLargeTitleOptions } from '../sharedScreenOptions';
import type { MapStackParamList } from '../types';

const Stack = createNativeStackNavigator<MapStackParamList>();

export function MapStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...makeNavigatorOptions(colors),
        // マップ画面は全面キャンバスのため backgroundGrouped でなく background を使用
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="KnowledgeMap"
        component={KnowledgeMapScreen}
        options={{
          title: 'マップ',
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
