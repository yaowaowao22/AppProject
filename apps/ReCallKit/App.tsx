import React, { useEffect, useState } from 'react';
import { DeviceEventEmitter, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Updates from 'expo-updates';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from './src/hooks/useDatabase';
import { PointsProvider } from './src/context/PointsContext';
import { ThemeProvider } from './src/theme/ThemeContext';
import { TaskProvider } from './src/context/TaskContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { releaseModel } from './src/services/localAnalysisService';
import { OTA_RELOAD_EVENT } from './src/utils/otaReload';

// ============================================================
// OTA reload 安全実行の仕組み
//
// reloadAsync() をネイティブコンポーネント(GestureHandlerRootView,
// reanimated, react-native-screens 等)がマウント中に呼ぶと
// JSI C++ ポインタがダングリングしてクラッシュする。
//
// 解決策:
//   1. requestOtaReload() を呼ぶ（OTAWatcher / SettingsScreen どちらからでも）
//   2. DeviceEventEmitter 経由で App に伝わる
//   3. App が unmounting=true にして GestureHandlerRootView をアンマウント
//   4. アンマウント完了後(useEffect)に releaseModel() → reloadAsync()
// ============================================================

// OTAWatcher: isUpdatePending を検知したら requestOtaReload() を発火するだけ
function OTAWatcher() {
  const { isUpdatePending } = Updates.useUpdates();
  useEffect(() => {
    if (__DEV__ || !isUpdatePending) return;
    console.log('[OTA] update pending — requesting safe reload');
    requestOtaReload();
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
  // unmounting=true になると GestureHandlerRootView ごとアンマウントし、
  // 全 JSI C++ オブジェクトが解放された後に reloadAsync() を呼ぶ
  const [unmounting, setUnmounting] = useState(false);

  // OTA_RELOAD_EVENT を受け取ったらアンマウント開始（requestOtaReload() から発火）
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(OTA_RELOAD_EVENT, () => {
      console.log('[OTA] unmounting native tree before reload');
      setUnmounting(true);
    });
    return () => sub.remove();
  }, []);

  // アンマウント後に llama 解放 → reloadAsync
  useEffect(() => {
    if (!unmounting) return;
    (async () => {
      console.log('[OTA] releasing llama context...');
      await releaseModel();
      console.log('[OTA] calling reloadAsync...');
      await Updates.reloadAsync();
    })().catch(console.error);
  }, [unmounting]);

  if (unmounting) {
    // 全ネイティブコンポーネントをアンマウント済みの状態で reloadAsync を待つ
    return <View style={styles.root} />;
  }

  return (
    <ErrorBoundary>
      <OTAWatcher />
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
