import React from 'react';
import { useColorScheme } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LightColors, DarkColors } from '../../theme/colors';
import { ReviewScreen } from '../../screens/review/ReviewScreen';
import { QuizScreen } from '../../screens/review/QuizScreen';
import { makeNavigatorOptions, makeLargeTitleOptions } from '../sharedScreenOptions';
import type { ReviewStackParamList } from '../types';

const Stack = createNativeStackNavigator<ReviewStackParamList>();

export function ReviewStack() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  return (
    <Stack.Navigator
      screenOptions={{
        ...makeNavigatorOptions(colors),
        contentStyle: { backgroundColor: colors.backgroundGrouped },
      }}
    >
      <Stack.Screen
        name="Review"
        component={ReviewScreen}
        options={{
          ...makeLargeTitleOptions(colors),
          title: '復習',
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="Quiz"
        component={QuizScreen}
        options={{
          ...makeLargeTitleOptions(colors),
          title: 'クイズ',
          presentation: 'fullScreenModal',
        }}
      />
    </Stack.Navigator>
  );
}
