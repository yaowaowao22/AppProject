import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
      headerShown: false,
      tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
    },
  },
];

export function RootNavigator() {
  const insets = useSafeAreaInsets();
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
