import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@massapp/ui';
import { AdProvider } from '@massapp/ads';
import { theme } from './src/theme';
import { adConfig } from './src/ads.config';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme}>
        <AdProvider config={adConfig}>
          <NavigationContainer>
            <StatusBar style="auto" />
            <RootNavigator />
          </NavigationContainer>
        </AdProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
