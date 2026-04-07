import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from './src/hooks/useDatabase';
import { PointsProvider } from './src/context/PointsContext';
import { ThemeProvider } from './src/theme/ThemeContext';
import { TaskProvider } from './src/context/TaskContext';
import { ToastProvider } from './src/components/ToastProvider';
import { RootNavigator } from './src/navigation/RootNavigator';

// ============================================================
// OTA 更新の適用方針
//
// 【自動適用】expo-updates のネイティブ ON_LOAD に完全委任。
//   バックグラウンドでDL完了後、次のコールドスタートで
//   JSコードを一切介さずにネイティブが新バンドルに切り替える。
//   → クラッシュしない。
//
// 【即時手動適用】Settings 画面の「アップデートを確認」ボタン。
//   releaseModel() → setTimeout 500ms → reloadAsync() の順で
//   JSI C++ オブジェクトを全て解放してから reload する。
//   → src/utils/otaReload.ts の requestOtaReload() を使用。
//
// 【やらないこと】JS から自動で reloadAsync() を呼ぶ。
//   isUpdatePending 検知 → 即 reloadAsync() は起動直後の Race Condition で
//   GestureHandlerRootView / reanimated の JSI C++ がまだ生きていてクラッシュ。
// ============================================================

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
          <DatabaseProvider>
            <ThemeProvider>
              <PointsProvider>
                <TaskProvider>
                  <ToastProvider>
                    <RootNavigator />
                  </ToastProvider>
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
