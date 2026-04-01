import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { TaskScreen } from '../../screens/tasks/TaskScreen';
import { QAPreviewScreen } from '../../screens/add/QAPreviewScreen';
import { makeNavigatorOptions, makeLargeTitleOptions } from '../sharedScreenOptions';
import type { TaskStackParamList } from '../types';

const Stack = createNativeStackNavigator<TaskStackParamList>();

export function TaskStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...makeNavigatorOptions(colors),
        contentStyle: { backgroundColor: colors.backgroundGrouped },
      }}
    >
      <Stack.Screen
        name="TaskList"
        component={TaskScreen}
        options={{
          title: 'タスク',
          ...makeLargeTitleOptions(colors),
        }}
      />
      <Stack.Screen
        name="QAPreview"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={QAPreviewScreen as React.ComponentType<any>}
        options={{ title: 'Q&Aプレビュー', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
