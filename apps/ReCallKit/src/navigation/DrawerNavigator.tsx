import React from 'react';
import { Dimensions, Platform, useColorScheme } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { SidebarColors } from '../theme/colors';
import { SidebarLayout } from '../theme/spacing';
import { MainTabs } from './MainTabs';
import { DrawerContent } from '../components/DrawerContent';
import type { DrawerParamList } from './types';

const Drawer = createDrawerNavigator<DrawerParamList>();

// タブバー高さ分だけドロワー下端を止める
const SCREEN_HEIGHT = Dimensions.get('window').height;
const DRAWER_HEIGHT = SCREEN_HEIGHT - SidebarLayout.bottomOffset;

export function DrawerNavigator() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const sc = isDark ? SidebarColors.dark : SidebarColors.light;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        // iPhone: 左端スワイプは iOS 標準「戻る」ジェスチャーと競合するため無効
        // iPad: 将来 Phase 2 でサイドバー対応時に有効化
        swipeEnabled: Platform.OS !== 'ios',
        drawerPosition: 'left',
        drawerType: 'front',
        drawerStyle: {
          width: SidebarLayout.width,
          height: DRAWER_HEIGHT,
          backgroundColor: sc.backgroundSolid,
        },
        overlayColor: sc.overlay,
      }}
    >
      {/* メインコンテンツ: BottomTabs */}
      <Drawer.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
}
