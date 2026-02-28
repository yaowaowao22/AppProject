import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTabNavigator } from '@massapp/navigation';
import type { TabScreen } from '@massapp/navigation';
import { TitleScreen } from '../screens/TitleScreen';
import { GameScreen } from '../screens/GameScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const screens: TabScreen[] = [
  {
    name: 'Title',
    component: TitleScreen,
    options: {
      title: 'スタート',
      headerShown: false,
      tabBarIcon: ({ color, size }) => <Ionicons name="game-controller" size={size} color={color} />,
    },
  },
  {
    name: 'Game',
    component: GameScreen,
    options: {
      title: 'ゲーム',
      headerShown: false,
      tabBarIcon: ({ color, size }) => <Ionicons name="play-circle" size={size} color={color} />,
    },
  },
  {
    name: 'History',
    component: HistoryScreen,
    options: {
      title: '記録',
      tabBarIcon: ({ color, size }) => <Ionicons name="trophy" size={size} color={color} />,
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
