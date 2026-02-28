import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTabNavigator } from '@massapp/navigation';
import type { TabScreen } from '@massapp/navigation';
import { useTheme } from '@massapp/ui';
import { HomeScreen } from '../screens/HomeScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const screens: TabScreen[] = [
  {
    name: 'Home',
    component: HomeScreen,
    options: {
      title: 'ホーム',
      tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
    },
  },
  {
    name: 'Result',
    component: ResultScreen,
    options: {
      title: '結果',
      tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-circle" size={size} color={color} />,
    },
  },
  {
    name: 'Settings',
    component: SettingsScreen,
    options: {
      title: '設定',
      tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
    },
  },
];

export function RootNavigator() {
  return <ThemedTabNavigator screens={screens} />;
}
