import React from 'react';
import { useColorScheme } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LightColors, DarkColors } from '../../theme/colors';
import { KnowledgeMapScreen } from '../../screens/map/KnowledgeMapScreen';
import { ItemDetailScreen } from '../../screens/library/ItemDetailScreen';
import type { MapStackParamList } from '../types';

const Stack = createNativeStackNavigator<MapStackParamList>();

export function MapStack() {
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
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="KnowledgeMap"
        component={KnowledgeMapScreen}
        options={{
          title: 'マップ',
          headerLargeTitle: true,
          headerLargeTitleStyle: { color: colors.label },
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
