import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTabNavigator } from '@massapp/navigation';
import type { TabScreen } from '@massapp/navigation';
import { SimulatorScreen } from '../screens/SimulatorScreen';
import { CalculatorsScreen } from '../screens/CalculatorsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const screens: TabScreen[] = [
  {
    name: 'Simulator',
    component: SimulatorScreen,
    options: {
      title: 'シミュレーター',
      headerShown: false,
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="trending-up-outline" size={size} color={color} />
      ),
    },
  },
  {
    name: 'Calculators',
    component: CalculatorsScreen,
    options: {
      title: '計算機',
      headerShown: false,
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="calculator-outline" size={size} color={color} />
      ),
    },
  },
  {
    name: 'Settings',
    component: SettingsScreen,
    options: {
      title: '設定',
      headerShown: false,
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="settings-outline" size={size} color={color} />
      ),
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
