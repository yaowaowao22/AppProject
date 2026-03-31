import React from 'react';
import { Pressable, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { LibraryScreen } from '../../screens/library/LibraryScreen';
import { ItemDetailScreen } from '../../screens/library/ItemDetailScreen';
import { ReviewGroupCreateScreen } from '../../screens/library/ReviewGroupCreateScreen';
import { AddItemScreen } from '../../screens/add/AddItemScreen';
import { QAPreviewScreen } from '../../screens/add/QAPreviewScreen';
import { URLAnalysisScreen } from '../../screens/add/URLAnalysisScreen';
import { makeNavigatorOptions, makeLargeTitleOptions } from '../sharedScreenOptions';
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
        name="Library"
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
        options={({ navigation: nav }) => ({
          title: 'グループ作成',
          presentation: 'modal',
          headerLeft: () => (
            <Pressable
              onPress={() => nav.goBack()}
              accessibilityLabel="キャンセル"
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={{ color: colors.accent, fontSize: 17 }}>キャンセル</Text>
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="AddItem"
        component={AddItemScreen}
        options={({ navigation: nav }) => ({
          title: '追加',
          presentation: 'modal',
          headerLeft: () => (
            <Pressable
              onPress={() => nav.goBack()}
              accessibilityLabel="キャンセル"
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={{ color: colors.accent, fontSize: 17 }}>キャンセル</Text>
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="URLAnalysis"
        component={URLAnalysisScreen}
        options={({ navigation: nav }) => ({
          title: 'URL解析',
          presentation: 'modal',
          headerLeft: () => (
            <Pressable
              onPress={() => nav.goBack()}
              accessibilityLabel="キャンセル"
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={{ color: colors.accent, fontSize: 17 }}>キャンセル</Text>
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="QAPreview"
        component={QAPreviewScreen}
        options={{ title: 'Q&Aプレビュー', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
