import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, LoadingScreen } from '@massapp/ui';
import { AdProvider } from '@massapp/ads';
import { theme } from './src/theme';
import { adConfig } from './src/ads.config';
import { db } from './src/database';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    db.open().then(() => setDbReady(true));
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme}>
        <AdProvider config={adConfig}>
          {dbReady ? (
            <NavigationContainer>
              <StatusBar style="auto" />
              <RootNavigator />
            </NavigationContainer>
          ) : (
            <LoadingScreen message="データベースを準備中..." />
          )}
        </AdProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
