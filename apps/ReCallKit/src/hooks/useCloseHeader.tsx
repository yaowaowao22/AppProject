// 復習系モーダル画面で共通のヘッダー（タイトル + 閉じるボタン）を設定するフック

import React, { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';

export function useCloseHeader(
  navigation: NativeStackNavigationProp<any, any>,
  title: string,
) {
  const { colors } = useTheme();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: title,
      headerRight: () => (
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="閉じる"
          hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
        >
          <Text style={[TypeScale.body, { color: colors.accent }]}>閉じる</Text>
        </Pressable>
      ),
    });
  }, [navigation, colors, title]);
}
