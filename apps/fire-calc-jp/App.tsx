import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@massapp/ui';
import type { ThemeMode } from '@massapp/ui';
import { AdProvider } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from './src/theme';
import { adConfig } from './src/ads.config';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initPurchases, checkPremium } from './src/utils/purchases';

function AppInner() {
  const [, setIsPremium] = useLocalStorage('firecalc_is_premium', false);

  useEffect(() => {
    (async () => {
      await initPurchases();
      const hasPremium = await checkPremium();
      setIsPremium(hasPremium);
    })();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('firecalc_theme_mode').then((raw) => {
      const saved = raw ? JSON.parse(raw) : null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeMode(saved);
      }
      setReady(true);
    }).catch(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme} initialMode={themeMode}>
        <AdProvider config={adConfig}>
          <AppInner />
        </AdProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
