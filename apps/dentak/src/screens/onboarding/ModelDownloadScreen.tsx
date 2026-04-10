// ══════════════════════════════════════════════
// 無音の演算 — ModelDownloadScreen
// 初回起動時に whisper-tiny モデル（~39MB）を自動ダウンロードし、
// 完了後に CalculatorScreen へ自動遷移する。
// ══════════════════════════════════════════════

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useModelManager } from '../../hooks/useModelManager';
import { useModelStore } from '../../store/modelStore';

// ── 型 ──────────────────────────────────────────────────────────────────────
type Props = NativeStackScreenProps<RootStackParamList, 'ModelDownload'>;

// ── 定数 ──────────────────────────────────────────────────────────────────────
const TINY_SIZE_MB  = 39;
const BAR_WIDTH     = Dimensions.get('window').width * 0.8;
const MONO_FONT     = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

// ── Component ─────────────────────────────────────────────────────────────────
export default function ModelDownloadScreen({ navigation }: Props) {
  const { downloadModel }  = useModelManager();
  const progress           = useModelStore((s) => s.downloadProgress['tiny']);
  const tinyReady          = useModelStore((s) => s.downloadedModels.includes('tiny'));

  const [error, setError]       = useState<string | null>(null);
  const [dlSpeed, setDlSpeed]   = useState<number | null>(null); // MB/s
  const [dlStarted, setDlStarted] = useState(false);

  // ── Reanimated: プログレスバー幅 ───────────────────────────────────────────
  const barProgress = useSharedValue(0);
  const barStyle    = useAnimatedStyle(() => ({
    width: barProgress.value * BAR_WIDTH,
  }));

  // ── 速度計算用 ref ──────────────────────────────────────────────────────────
  const lastProgressRef = useRef<{ ratio: number; time: number } | null>(null);

  // progress（0–1 or null）の変化をバーアニメーションに反映
  useEffect(() => {
    if (progress === null) return;

    // 速度計算
    const now = Date.now();
    if (lastProgressRef.current) {
      const dtSec  = (now - lastProgressRef.current.time) / 1000;
      const dRatio = progress - lastProgressRef.current.ratio;
      if (dtSec > 0 && dRatio > 0) {
        setDlSpeed((dRatio * TINY_SIZE_MB) / dtSec);
      }
    }
    lastProgressRef.current = { ratio: progress, time: now };

    barProgress.value = withTiming(progress, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
  }, [progress]); // eslint-disable-line react-hooks/exhaustive-deps

  // DL完了を検知して CalculatorScreen へ遷移
  useEffect(() => {
    if (!tinyReady) return;

    // バーを 1.0 まで埋めてから遷移
    barProgress.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
    const timer = setTimeout(() => {
      navigation.replace('Calculator');
    }, 500);
    return () => clearTimeout(timer);
  }, [tinyReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── ダウンロード実行 ────────────────────────────────────────────────────────
  const doDownload = useCallback(async () => {
    setError(null);
    setDlStarted(true);
    lastProgressRef.current = null;
    setDlSpeed(null);
    try {
      await downloadModel('tiny');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ダウンロードに失敗しました';
      setError(msg);
      barProgress.value = withTiming(0, { duration: 200 });
    }
  }, [downloadModel]); // eslint-disable-line react-hooks/exhaustive-deps

  // WiFiチェック → モバイル通信なら確認ダイアログ → DL開始
  const handleStart = useCallback(async () => {
    const netState = await NetInfo.fetch();
    if (netState.type !== 'wifi') {
      Alert.alert(
        'モバイル通信での使用',
        'モバイル通信で約39MBを使用します。続けますか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '続ける', onPress: doDownload },
        ],
      );
    } else {
      doDownload();
    }
  }, [doDownload]);

  // マウント時に自動開始（tinyReady なら即遷移）
  useEffect(() => {
    if (tinyReady) {
      navigation.replace('Calculator');
      return;
    }
    handleStart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — 意図的に初回のみ実行

  // ── 派生表示値 ──────────────────────────────────────────────────────────────
  const isDownloading  = progress !== null && progress < 1 && !error;
  const downloadedMB   = progress !== null
    ? Math.min(progress * TINY_SIZE_MB, TINY_SIZE_MB).toFixed(1)
    : '0.0';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* ロゴ・アプリ名エリア */}
        <View style={styles.logoArea}>
          <Text style={styles.appName}>無音の演算</Text>
        </View>

        {/* ステータスエリア */}
        <View style={styles.statusArea}>

          {/* サブテキスト */}
          <Text style={styles.subText}>
            {error
              ? 'ダウンロードに失敗しました'
              : tinyReady
                ? '準備完了'
                : '音声認識モデルを準備しています...'}
          </Text>

          {/* プログレスバー */}
          <View style={styles.barTrack}>
            <Animated.View style={[styles.barFill, barStyle]} />
          </View>

          {/* ファイルサイズ表示 */}
          {!error && dlStarted && (
            <Text style={styles.sizeText}>
              {`${TINY_SIZE_MB} MB 中 ${downloadedMB} MB`}
            </Text>
          )}

          {/* DL速度表示 */}
          {isDownloading && dlSpeed !== null && (
            <Text style={styles.speedText}>
              {`${dlSpeed.toFixed(1)} MB/s`}
            </Text>
          )}

          {/* エラー時リトライボタン */}
          {error && (
            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.retryButtonPressed,
              ]}
              onPress={handleStart}
            >
              <Text style={styles.retryText}>再試行</Text>
            </Pressable>
          )}

        </View>
      </View>
    </SafeAreaView>
  );
}

// ── スタイル ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex:            1,
    backgroundColor: '#000000',
  },
  container: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 24,
  },
  logoArea: {
    marginBottom: 64,
    alignItems:   'center',
  },
  appName: {
    fontSize:      24,
    color:         '#FFFFFF',
    fontWeight:    '300',
    letterSpacing: 4,
  },
  statusArea: {
    width:      '100%',
    alignItems: 'center',
    gap:        12,
  },
  subText: {
    fontSize:     14,
    color:        '#8E8E93',
    marginBottom: 4,
  },
  barTrack: {
    width:           BAR_WIDTH,
    height:          4,
    backgroundColor: '#3A3A3C',
    borderRadius:    2,
    overflow:        'hidden',
  },
  barFill: {
    height:          4,
    backgroundColor: '#FFFFFF',
    borderRadius:    2,
  },
  sizeText: {
    fontSize:   12,
    color:      '#8E8E93',
    fontFamily: MONO_FONT,
  },
  speedText: {
    fontSize:   10,
    color:      '#8E8E93',
    fontFamily: MONO_FONT,
  },
  retryButton: {
    marginTop:        8,
    paddingVertical:  10,
    paddingHorizontal: 28,
    borderWidth:      1,
    borderColor:      '#8E8E93',
    borderRadius:     8,
  },
  retryButtonPressed: {
    opacity: 0.5,
  },
  retryText: {
    fontSize:   14,
    color:      '#FFFFFF',
    fontWeight: '300',
  },
});
