import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import * as Updates from 'expo-updates';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from './src/hooks/useDatabase';
import { PointsProvider } from './src/context/PointsContext';
import { ThemeProvider } from './src/theme/ThemeContext';
import { TaskProvider } from './src/context/TaskContext';
import { RootNavigator } from './src/navigation/RootNavigator';

// OTA 更新の適用戦略（2層）:
// Layer 1: app.json の fallbackToCacheTimeout: 3000 → 起動時に最大3秒待ち即適用（要ネイティブリビルド）
// Layer 2: OTAWatcher → バックグラウンドDL完了を検知して即時 reloadAsync()（JS配信可能）
function OTAWatcher() {
  const { isUpdatePending } = Updates.useUpdates();
  useEffect(() => {
    if (__DEV__ || !isUpdatePending) return;
    console.log('[OTA] update pending — reloading to apply');
    Updates.reloadAsync().catch(console.error);
  }, [isUpdatePending]);
  return null;
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
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <OTAWatcher />
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
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  errorScroll: { flex: 1, backgroundColor: '#ffffff' },
  errorContainer: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  errorTitle: { fontSize: 17, fontWeight: '600', marginBottom: 8, color: '#000000' },
  errorMessage: { fontSize: 13, color: '#c0392b', marginBottom: 12 },
  errorSectionLabel: { fontSize: 11, fontWeight: '600', color: '#555', marginTop: 12, marginBottom: 4 },
  errorStack: { fontSize: 10, color: '#444', fontFamily: 'monospace' },
});
