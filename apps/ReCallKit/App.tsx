import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Updates from 'expo-updates';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from './src/hooks/useDatabase';
import { PointsProvider } from './src/context/PointsContext';
import { ThemeProvider } from './src/theme/ThemeContext';
import { TaskProvider } from './src/context/TaskContext';
import { RootNavigator } from './src/navigation/RootNavigator';

// ============================================================
// OTAGate — ネイティブコンポーネント（GestureHandler, reanimated,
// react-native-screens 等）がマウントされる *前* に OTA チェックを行う。
// reloadAsync() 時に JSI C++ ポインタのダングリングを回避する。
// ============================================================
function OTAGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(__DEV__);

  useEffect(() => {
    if (__DEV__) return;
    (async () => {
      try {
        console.log('[OTA] checking for update... channel:', Updates.channel, 'runtime:', Updates.runtimeVersion);
        const result = await Updates.checkForUpdateAsync();
        console.log('[OTA] isAvailable:', result.isAvailable);
        if (result.isAvailable) {
          console.log('[OTA] fetching update...');
          await Updates.fetchUpdateAsync();
          console.log('[OTA] reloading...');
          await Updates.reloadAsync();
          // reloadAsync() 成功時はここに到達しない
          return;
        }
      } catch (e) {
        console.log('[OTA] check error:', e);
      }
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={styles.otaContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.otaText}>アップデートを確認中...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null; jsStack: string; componentStack: string }
> {
  state = { error: null, jsStack: '', componentStack: '' };
  static getDerivedStateFromError(error: Error) {
    return { error, jsStack: error.stack ?? '' };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] error:', error);
    console.error('[ErrorBoundary] jsStack:', error.stack);
    console.error('[ErrorBoundary] componentStack:', info.componentStack);
    this.setState({ componentStack: info.componentStack ?? '' });
  }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={styles.errorScroll} contentContainerStyle={styles.errorContainer}>
          <Text style={styles.errorTitle}>エラーが発生しました</Text>
          <Text style={styles.errorMessage}>{String(this.state.error)}</Text>
          <Text style={styles.errorSectionLabel}>▼ JS Stack</Text>
          <Text style={styles.errorStack}>{this.state.jsStack}</Text>
          <Text style={styles.errorSectionLabel}>▼ Component Stack</Text>
          <Text style={styles.errorStack}>{this.state.componentStack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <OTAGate>
        <GestureHandlerRootView style={styles.root}>
          <SafeAreaProvider>
            <DatabaseProvider>
              <ThemeProvider>
                <PointsProvider>
                  <TaskProvider>
                    <RootNavigator />
                  </TaskProvider>
                </PointsProvider>
              </ThemeProvider>
            </DatabaseProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </OTAGate>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  otaContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000' },
  otaText: { color: '#AAAAAA', fontSize: 13, marginTop: 12 },
  errorScroll: { flex: 1, backgroundColor: '#ffffff' },
  errorContainer: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  errorTitle: { fontSize: 17, fontWeight: '600', marginBottom: 8, color: '#000000' },
  errorMessage: { fontSize: 13, color: '#c0392b', marginBottom: 12 },
  errorSectionLabel: { fontSize: 11, fontWeight: '600', color: '#555', marginTop: 12, marginBottom: 4 },
  errorStack: { fontSize: 10, color: '#444', fontFamily: 'monospace' },
});
