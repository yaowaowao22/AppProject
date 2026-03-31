import React, { useEffect, useMemo } from 'react';
import { View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@massapp/ui';
import { TanrenThemeProvider, useTheme } from './src/ThemeContext';
import { createThemeConfig } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { WorkoutProvider } from './src/WorkoutContext';
import { SubscriptionProvider } from './src/SubscriptionContext';
import { useVersionCheck } from './src/hooks/useVersionCheck';
import { ForceUpdateModal } from './src/components/ForceUpdateModal';
import { initCrashlytics, recordError } from './src/utils/crashlytics';

// ── Crashlytics 初期化（アプリ起動時に一度だけ実行） ─────────────────────────
initCrashlytics();

// ── ErrorBoundary ─────────────────────────────────────────────────────────────

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    recordError(error, `ErrorBoundary: ${info.componentStack ?? ''}`);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#111113', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#FF6200', fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
            App Error
          </Text>
          <Text style={{ color: '#F5F5F7', fontSize: 12 }}>
            {String((this.state.error as Error).message)}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// ── AppContent ────────────────────────────────────────────────────────────────
// ThemeContext から動的テーマを @massapp/ui ThemeProvider に橋渡しするコンポーネント

function AppContent() {
  const { currentThemeId, colors } = useTheme();
  const dynamicTheme = useMemo(
    () => createThemeConfig(currentThemeId, colors),
    [currentThemeId, colors],
  );
  const { needsUpdate, storeUrl } = useVersionCheck();

  return (
    <ThemeProvider theme={dynamicTheme} initialMode="dark">
      <SubscriptionProvider>
        <WorkoutProvider>
          <NavigationContainer>
            <StatusBar style="light" backgroundColor={colors.background} />
            <RootNavigator />
          </NavigationContainer>
        </WorkoutProvider>
      </SubscriptionProvider>
      {/* NavigationContainer の外側に配置して全画面ブロック */}
      <ForceUpdateModal visible={needsUpdate} storeUrl={storeUrl} />
    </ThemeProvider>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <TanrenThemeProvider>
            <AppContent />
          </TanrenThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
