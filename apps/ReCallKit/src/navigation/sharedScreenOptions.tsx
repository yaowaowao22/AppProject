import React from 'react';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { ColorScheme } from '../theme/colors';
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
 * Drawer 各タブのルート画面に適用する Large Title + ハンバーガー共通 options。
 * iOS NativeStack の headerLargeTitle 動作（展開時タイトル下行・折りたたみ時同行）を維持する。
 */
export function makeLargeTitleOptions(colors: ColorScheme): NativeStackNavigationOptions {
  return {
    headerLargeTitle: true,
    headerLargeTitleStyle: {
      color: colors.label,
      fontSize: 34,
      fontWeight: '700',
    },
    headerLeft: () => <HeaderHamburger />,
  };
}
