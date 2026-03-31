import React from 'react';
import { Pressable, Text } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { ColorScheme } from '../theme/themes';
import { HeaderHamburger } from '../components/HeaderHamburger';

/**
 * Stack.Navigator の screenOptions に渡す共通設定。
 * contentStyle は Stack ごとに背景色が異なるため、各 Stack で別途指定すること。
 */
export function makeNavigatorOptions(colors: ColorScheme): NativeStackNavigationOptions {
  return {
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.accent,
    headerTitleStyle: { color: colors.label },
    headerShadowVisible: false,
  };
}

/**
 * モーダル画面（presentation: 'modal'）の title + キャンセルボタン共通 options。
 * LibraryStack など複数箇所のモーダル画面で共通利用する。
 */
export function makeModalCancelOptions(
  title: string,
  colors: ColorScheme,
  nav: { goBack: () => void },
): NativeStackNavigationOptions {
  return {
    title,
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
  };
}

/**
 * Drawer 各タブのルート画面に適用するインラインタイトル + ハンバーガー共通 options。
 * headerLargeTitle を使わずインライン表示にすることで、ハンバーガーとタイトルを同一行に配置する。
 */
export function makeLargeTitleOptions(colors: ColorScheme): NativeStackNavigationOptions {
  return {
    headerTitleStyle: {
      color: colors.label,
      fontSize: 20,
      fontWeight: '700',
    },
    headerLeft: () => <HeaderHamburger />,
  };
}
