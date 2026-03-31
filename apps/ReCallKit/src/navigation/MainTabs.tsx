import React from 'react';
import { useColorScheme } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LightColors, DarkColors } from '../theme/colors';
import { HomeStack } from './stacks/HomeStack';
import { LibraryStack } from './stacks/LibraryStack';
import { ReviewStack } from './stacks/ReviewStack';
import { MapStack } from './stacks/MapStack';
import { SettingsStack } from './stacks/SettingsStack';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.separator,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: '今日',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="LibraryTab"
        component={LibraryStack}
        options={{
          tabBarLabel: 'ライブラリ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ReviewTab"
        component={ReviewStack}
        options={{
          tabBarLabel: '復習',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="repeat-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MapTab"
        component={MapStack}
        options={{
          tabBarLabel: 'マップ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStack}
        options={{
          tabBarLabel: '設定',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
