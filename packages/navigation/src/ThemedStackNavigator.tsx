import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useTheme } from '@massapp/ui';

export interface StackScreen {
  name: string;
  component: React.ComponentType<Record<string, unknown>>;
  options?: NativeStackNavigationOptions;
}

export interface ThemedStackNavigatorProps {
  screens: StackScreen[];
  screenOptions?: NativeStackNavigationOptions;
}

const Stack = createNativeStackNavigator();

export function ThemedStackNavigator({
  screens,
  screenOptions,
}: ThemedStackNavigatorProps) {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
        ...screenOptions,
      }}
    >
      {screens.map((screen) => (
        <Stack.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={screen.options}
        />
      ))}
    </Stack.Navigator>
  );
}
