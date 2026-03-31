import React from 'react';
import { Platform, useColorScheme } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { LightColors, DarkColors } from '../theme/colors';
import { MainTabs } from './MainTabs';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { DrawerContent } from '../components/DrawerContent';
import type { DrawerParamList } from './types';

const Drawer = createDrawerNavigator<DrawerParamList>();

export function DrawerNavigator() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        // iPhone: 左端スワイプはiOS標準「戻る」ジェスチャーと競合するため無効
        // iPad: 将来Phase 2でサイドバー対応時に有効化
        swipeEnabled: Platform.OS !== 'ios',
        drawerPosition: 'left',
        drawerType: 'front',
        drawerStyle: {
          width: 280,
          backgroundColor: colors.background,
        },
        overlayColor: 'rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* メインコンテンツ: BottomTabs（ドロワーアイテムとしては非表示） */}
      <Drawer.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      {/* 設定画面: ドロワーから直接アクセス */}
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
}
