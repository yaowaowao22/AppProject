import React from 'react';
import { Platform } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { SidebarLayout } from '../theme/spacing';
import { HomeStack } from './stacks/HomeStack';
import { LibraryStack } from './stacks/LibraryStack';
import { ReviewStack } from './stacks/ReviewStack';
import { MapStack } from './stacks/MapStack';
import { JournalStack } from './stacks/JournalStack';
import { SettingsStack } from './stacks/SettingsStack';
import { TaskStack } from './stacks/TaskStack';
import { DrawerContent } from '../components/DrawerContent';
import { useTheme } from '../theme/ThemeContext';
import type { DrawerParamList } from './types';

const Drawer = createDrawerNavigator<DrawerParamList>();

export function DrawerNavigator() {
  const { sidebarColors: sc } = useTheme();

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
        // タブバー廃止によりサイドバーはフルスクリーン高さ
        drawerStyle: {
          width: SidebarLayout.width,          // 280px
          backgroundColor: sc.backgroundSolid, // '#EAEAEF' / '#161618'
          borderRightWidth: 0,                  // 骨格の不可視性: 境界線・影なし
        },
        overlayColor: sc.overlay,              // light: rgba(0,0,0,0.30) / dark: rgba(0,0,0,0.50)
      }}
    >
      <Drawer.Screen name="Home"     component={HomeStack}    options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="Library"  component={LibraryStack} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="Review"   component={ReviewStack}  options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="Map"      component={MapStack}     options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="Journal"  component={JournalStack} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="Settings" component={SettingsStack} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="Tasks"    component={TaskStack}    options={{ drawerItemStyle: { display: 'none' } }} />
    </Drawer.Navigator>
  );
}
