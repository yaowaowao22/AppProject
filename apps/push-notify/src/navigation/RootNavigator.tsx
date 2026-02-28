import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTabNavigator } from '@massapp/navigation';
import type { TabScreen } from '@massapp/navigation';
import { InboxScreen } from '../screens/InboxScreen';
import { SetupScreen } from '../screens/SetupScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const screens: TabScreen[] = [
  {
    name: 'Inbox',
    component: InboxScreen,
    options: {
      title: '受信箱',
      headerShown: false,
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="notifications" size={size} color={color} />
      ),
    },
  },
  {
    name: 'Setup',
    component: SetupScreen,
    options: {
      title: 'API設定',
      headerShown: false,
      tabBarIcon: ({ color, size }) => <Ionicons name="key" size={size} color={color} />,
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
