import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { ReviewScreen } from '../../screens/review/ReviewScreen';
import { QuizScreen } from '../../screens/review/QuizScreen';
import { makeNavigatorOptions, makeLargeTitleOptions } from '../sharedScreenOptions';
import type { ReviewStackParamList } from '../types';

const Stack = createNativeStackNavigator<ReviewStackParamList>();

export function ReviewStack() {
  const { colors } = useTheme();

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
