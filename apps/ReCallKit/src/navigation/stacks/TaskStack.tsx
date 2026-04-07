import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { URLImportListScreen } from '../../screens/add/URLImportListScreen';
import { URLAnalysisScreen } from '../../screens/add/URLAnalysisScreen';
import { ItemDetailScreen } from '../../screens/library/ItemDetailScreen';
import { QAPreviewScreen } from '../../screens/add/QAPreviewScreen';
import { makeNavigatorOptions, makeLargeTitleOptions, makeModalCancelOptions } from '../sharedScreenOptions';
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
        name="URLImportList"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={URLImportListScreen as React.ComponentType<any>}
        options={{
          title: '取り込み一覧',
          ...makeLargeTitleOptions(colors),
        }}
      />
      <Stack.Screen
        name="URLAnalysis"
        component={URLAnalysisScreen}
        options={({ navigation: nav }) => makeModalCancelOptions('URL解析', colors, nav)}
      />
      <Stack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{ title: '' }}
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
