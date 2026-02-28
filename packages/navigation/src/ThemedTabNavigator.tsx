import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { useTheme } from '@massapp/ui';

export interface TabScreen {
  name: string;
  component: React.ComponentType<Record<string, unknown>>;
  options?: BottomTabNavigationOptions;
}

export interface ThemedTabNavigatorProps {
  screens: TabScreen[];
  screenOptions?: BottomTabNavigationOptions;
}

const Tab = createBottomTabNavigator();

export function ThemedTabNavigator({
  screens,
  screenOptions,
}: ThemedTabNavigatorProps) {
  const { colors, theme } = useTheme();
  const tabBarOverrides = theme.overrides?.tabBar;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: tabBarOverrides?.borderTopWidth ?? 1,
          height: tabBarOverrides?.height,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: tabBarOverrides?.showLabel ?? true,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        ...screenOptions,
      }}
    >
      {screens.map((screen) => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={screen.options}
        />
      ))}
    </Tab.Navigator>
  );
}
