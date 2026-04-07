import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { LibraryScreen } from '../../screens/library/LibraryScreen';
import { ItemDetailScreen } from '../../screens/library/ItemDetailScreen';
import { ReviewGroupCreateScreen } from '../../screens/library/ReviewGroupCreateScreen';
import { AddItemScreen } from '../../screens/add/AddItemScreen';
import { QAPreviewScreen } from '../../screens/add/QAPreviewScreen';
import { URLAnalysisScreen } from '../../screens/add/URLAnalysisScreen';
import { TrashScreen } from '../../screens/library/TrashScreen';
import { makeNavigatorOptions, makeLargeTitleOptions, makeModalCancelOptions } from '../sharedScreenOptions';
import type { LibraryStackParamList } from '../types';

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export function LibraryStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...makeNavigatorOptions(colors),
        contentStyle: { backgroundColor: colors.backgroundGrouped },
      }}
    >
      <Stack.Screen
        name="LibraryMain"
        component={LibraryScreen}
        options={{
          title: 'ライブラリ',
          ...makeLargeTitleOptions(colors),
        }}
      />
      <Stack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="ReviewGroupCreate"
        component={ReviewGroupCreateScreen}
        options={({ navigation: nav }) => makeModalCancelOptions('グループ作成', colors, nav)}
      />
      <Stack.Screen
        name="AddItem"
        component={AddItemScreen}
        options={({ navigation: nav }) => makeModalCancelOptions('追加', colors, nav)}
      />
      <Stack.Screen
        name="URLAnalysis"
        component={URLAnalysisScreen}
        options={({ navigation: nav }) => makeModalCancelOptions('URL解析', colors, nav)}
      />
      <Stack.Screen
        name="Trash"
        component={TrashScreen}
        options={{ title: 'ゴミ箱' }}
      />
      <Stack.Screen
        name="QAPreview"
        component={QAPreviewScreen}
        options={{ title: 'Q&Aプレビュー', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
