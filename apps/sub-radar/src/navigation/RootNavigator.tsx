import React, { useCallback } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTabNavigator } from '@massapp/navigation';
import type { TabScreen } from '@massapp/navigation';
import { DashboardScreen } from '../screens/DashboardScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

import type { Subscription } from '../types';

interface RootNavigatorProps {
  onAddPress: () => void;
  onEditPress: (s: Subscription) => void;
}

export function RootNavigator({ onAddPress, onEditPress }: RootNavigatorProps) {
  const insets = useSafeAreaInsets();

  // DashboardScreen に onAddPress / onEditPress を渡すためのラッパーコンポーネント
  const DashboardTab = useCallback(
    () => <DashboardScreen onAddPress={onAddPress} onEditPress={onEditPress} />,
    [onAddPress, onEditPress],
  );

  const screens: TabScreen[] = [
    {
      name: 'Dashboard',
      component: DashboardTab,
      options: {
        title: 'ホーム',
        headerShown: false,
        tabBarIcon: ({ color, size }: { color: string; size: number }) => (
          <Ionicons name="home" size={size} color={color} />
        ),
      },
    },
    {
      name: 'Settings',
      component: SettingsScreen,
      options: {
        title: '設定',
        headerShown: false,
        tabBarIcon: ({ color, size }: { color: string; size: number }) => (
          <Ionicons name="settings" size={size} color={color} />
        ),
      },
    },
  ];

  return (
    <ThemedTabNavigator
      screens={screens}
      screenOptions={{
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    />
  );
}
