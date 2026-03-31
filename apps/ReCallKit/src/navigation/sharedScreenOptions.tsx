import React from 'react';
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
