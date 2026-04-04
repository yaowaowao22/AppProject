import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { ReviewSelectScreen } from '../../screens/review/ReviewSelectScreen';
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
      {/* 復習内容選択（ドロワータブのルート画面） */}
      <Stack.Screen
        name="ReviewSelect"
        component={ReviewSelectScreen}
        options={{
          ...makeLargeTitleOptions(colors),
          title: '復習',
        }}
      />
      {/* 復習実行（モーダル: ハンバーガー非表示） */}
      <Stack.Screen
        name="ReviewSession"
        component={ReviewScreen}
        options={{
          title: '復習',
          presentation: 'fullScreenModal',
          headerLeft: () => null,
        }}
      />
      {/* クイズ実行（モーダル: ハンバーガー非表示） */}
      <Stack.Screen
        name="Quiz"
        component={QuizScreen}
        options={{
          title: 'クイズ',
          presentation: 'fullScreenModal',
          headerLeft: () => null,
        }}
      />
    </Stack.Navigator>
  );
}
