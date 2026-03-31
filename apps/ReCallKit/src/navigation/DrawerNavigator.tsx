import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SidebarColors } from '../theme/colors';
import { SidebarLayout } from '../theme/spacing';
import { MainTabs } from './MainTabs';
import { DrawerContent } from '../components/DrawerContent';
import { useTheme } from '../theme/ThemeContext';
import type { DrawerParamList } from './types';

const Drawer = createDrawerNavigator<DrawerParamList>();

export function DrawerNavigator() {
  const { isDark } = useTheme();
  const sc = isDark ? SidebarColors.dark : SidebarColors.light;

  // useSafeAreaInsets で動的取得: Dynamic Island (top 59px) / 通常機種 (44-47px) 両対応
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  // タブバー下端でドロワーを止める
  // SidebarLayout.bottomOffset (83px) はタブバー高さ（home indicator 込み）
  // bottomInset を差し引くことで機種差を吸収する
  const drawerHeight = screenHeight - (SidebarLayout.bottomOffset - insets.bottom);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        // iPhone: 左端スワイプは iOS 標準「戻る」ジェスチャーと競合するため無効
        // Android: エッジ幅 30px でスワイプ有効
        swipeEnabled: Platform.OS !== 'ios',
        swipeEdgeWidth: Platform.OS === 'android' ? 30 : 0,
        drawerPosition: 'left',
        drawerType: 'front',
        // アニメーション仕様 (sidebar.html §5 非対称spring):
        //   開: 280ms cubic-bezier(0.32, 0.72, 0, 1)  ← SidebarLayout.animationDuration
        //   閉: 240ms ease-in                          ← SidebarLayout.animationDurationClose
        //   @react-navigation/drawer はReanimated内部制御のためタイミング関数は
        //   DrawerContent 側の Reanimated worklet で対応する
        drawerStyle: {
          width: SidebarLayout.width,         // 280px
          height: drawerHeight,
          backgroundColor: sc.backgroundSolid, // '#EAEAEF' / '#161618'
          borderRightWidth: 0,                 // 骨格の不可視性: 境界線・影なし
        },
        overlayColor: sc.overlay,             // light: rgba(0,0,0,0.30) / dark: rgba(0,0,0,0.50)
        // sceneContainerStyle: メインコンテンツ背景はスタック側で管理（DrawerNavigationOptions非対応）
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
