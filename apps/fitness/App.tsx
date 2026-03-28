import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@massapp/ui';
import { theme } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { WorkoutProvider } from './src/WorkoutContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme} initialMode="dark">
        <WorkoutProvider>
          <NavigationContainer>
            <StatusBar style="light" backgroundColor="#111113" />
            <RootNavigator />
          </NavigationContainer>
        </WorkoutProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
