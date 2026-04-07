import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { HomeScreen } from '../../screens/home/HomeScreen';
import { ItemDetailScreen } from '../../screens/library/ItemDetailScreen';
import { ReviewScreen } from '../../screens/review/ReviewScreen';
import { URLImportListScreen } from '../../screens/add/URLImportListScreen';
import { QAPreviewScreen } from '../../screens/add/QAPreviewScreen';
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
      <Stack.Screen
        name="ReviewSession"
        component={ReviewScreen}
        options={{ title: '復習' }}
      />
      <Stack.Screen
        name="URLImportList"
        component={URLImportListScreen as React.ComponentType<any>}
        options={{ title: 'タスク' }}
      />
      <Stack.Screen
        name="QAPreview"
        component={QAPreviewScreen as React.ComponentType<any>}
        options={{ title: 'Q&Aプレビュー', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
