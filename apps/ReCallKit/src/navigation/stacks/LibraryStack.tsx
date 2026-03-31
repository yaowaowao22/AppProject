import React from 'react';
import { useColorScheme } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LightColors, DarkColors } from '../../theme/colors';
import { LibraryScreen } from '../../screens/library/LibraryScreen';
import { ItemDetailScreen } from '../../screens/library/ItemDetailScreen';
import { AddItemScreen } from '../../screens/add/AddItemScreen';
import { HeaderHamburger } from '../../components/HeaderHamburger';
import type { LibraryStackParamList } from '../types';

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export function LibraryStack() {
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
        name="Library"
        component={LibraryScreen}
        options={{
          title: 'ライブラリ',
          headerLargeTitle: true,
          headerLargeTitleStyle: {
            color: colors.label,
            fontSize: 34,
            fontWeight: '700',
          },
          headerLeft: () => <HeaderHamburger />,
        }}
      />
      <Stack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="AddItem"
        component={AddItemScreen}
        options={{
          title: '追加',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}
