import React from 'react';
import { useColorScheme } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LightColors, DarkColors } from '../../theme/colors';
import { HomeScreen } from '../../screens/home/HomeScreen';
import { ReviewScreen } from '../../screens/review/ReviewScreen';
import { QuizScreen } from '../../screens/review/QuizScreen';
import type { HomeStackParamList } from '../types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
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
        name="Home"
        component={HomeScreen}
        options={{
          title: '今日',
          headerLargeTitle: true,
          headerLargeTitleStyle: { color: colors.label },
        }}
      />
      <Stack.Screen
        name="Review"
        component={ReviewScreen}
        options={{
          title: '復習',
          presentation: 'fullScreenModal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Quiz"
        component={QuizScreen}
        options={{
          title: 'クイズ',
          presentation: 'fullScreenModal',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
