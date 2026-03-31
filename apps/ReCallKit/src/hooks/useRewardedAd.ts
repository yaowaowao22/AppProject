/**
 * useRewardedAd — リワード広告シングルトンフック
 *
 * AImensetu mobile/src/hooks/useRewardedAd.ts から移植。
 * 主な変更点:
 *   - バックエンド API 呼び出し（/tokens/earn）を削除
 *   - 報酬獲得時は onEarned コールバックを呼ぶだけ（ローカル管理に委譲）
 *   - AD_REWARD_AMOUNT 定数を削除（ポイント概念なし）
 *   - 本番 Ad Unit ID を ReCallKit 用プレースホルダに変更
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// テスト広告 ID（Google 公式固定値）
const TEST_IOS_REWARDED = 'ca-app-pub-3940256099942544/1712485313';
const TEST_ANDROID_REWARDED = 'ca-app-pub-3940256099942544/5224354917';

// 本番 Ad Unit ID（AdMob Console で ReCallKit 用に作成後に置き換える）
const PROD_IOS_AD_UNIT = 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX';
const PROD_ANDROID_AD_UNIT = 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX';

const adUnitId = __DEV__
  ? Platform.select({ ios: TEST_IOS_REWARDED, android: TEST_ANDROID_REWARDED }) ?? TEST_ANDROID_REWARDED
  : Platform.select({ ios: PROD_IOS_AD_UNIT, android: PROD_ANDROID_AD_UNIT }) ?? PROD_ANDROID_AD_UNIT;

// ─── モジュールレベルシングルトン: 広告を1回だけ読み込んでキャッシュ ───
let _adInstance: any = null;
let _adLoaded = false;
let _adLoading = false;
let _adInitialized = false;
let _resolveRef: ((v: { earned: boolean; error?: string }) => void) | null = null;
let _retryTimer: ReturnType<typeof setTimeout> | null = null;
const _listeners: Set<() => void> = new Set();

function _notify() {
  _listeners.forEach(fn => fn());
}

function _loadAd() {
  if (_adLoading || _adLoaded) return;

  let mod: any;
  try {
    mod = require('react-native-google-mobile-ads');
  } catch {
    return;
  }

  const { RewardedAd, RewardedAdEventType, AdEventType } = mod;

  _adLoading = true;
  _adLoaded = false;
  _notify();

  const rewarded = RewardedAd.createForAdRequest(adUnitId);
  _adInstance = rewarded;

  rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
    _adLoaded = true;
    _adLoading = false;
    _notify();
  });

  rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
    _resolveRef?.({ earned: true });
    _resolveRef = null;
  });

  rewarded.addAdEventListener(AdEventType.CLOSED, () => {
    if (_resolveRef) {
      // EARNED_REWARD が来ずに閉じられた（スキップ）
      _resolveRef({ earned: false, error: '広告が閉じられました' });
      _resolveRef = null;
    }
    // 次の広告をプリロード
    _adLoaded = false;
    _adLoading = false;
    _adInstance = null;
    _loadAd();
  });

  rewarded.addAdEventListener(AdEventType.ERROR, (e: any) => {
    _adLoading = false;
    _adLoaded = false;
    _notify();
    if (_resolveRef) {
      _resolveRef({ earned: false, error: e?.message || '広告の読み込みに失敗しました' });
      _resolveRef = null;
    }
    // 10秒後にリトライ
    if (_retryTimer) clearTimeout(_retryTimer);
    _retryTimer = setTimeout(() => {
      _adInstance = null;
      _loadAd();
    }, 10_000);
  });

  rewarded.load();
}

async function _initAndLoad() {
  if (_adInitialized) return;
  _adInitialized = true;
  try {
    if (Platform.OS === 'ios') {
      // expo-tracking-transparency: インストール後に有効化される
      try {
        const { requestTrackingPermissionsAsync } = require('expo-tracking-transparency');
        await requestTrackingPermissionsAsync();
      } catch {}
    }
    const mod = require('react-native-google-mobile-ads');
    await mod.mobileAds().initialize();
  } catch {}
  _loadAd();
}

// ─── Hook ───

type UseRewardedAdResult = {
  loaded: boolean;
  loading: boolean;
  showAd: () => Promise<{ earned: boolean; error?: string }>;
  reload: () => void;
};

export function useRewardedAd(): UseRewardedAdResult {
  const [, forceUpdate] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fn = () => {
      if (mountedRef.current) forceUpdate(n => n + 1);
    };
    _listeners.add(fn);
    _initAndLoad();
    return () => {
      mountedRef.current = false;
      _listeners.delete(fn);
    };
  }, []);

  const showAd = useCallback((): Promise<{ earned: boolean; error?: string }> => {
    return new Promise(resolve => {
      if (!_adInstance || !_adLoaded) {
        resolve({ earned: false, error: '広告がまだ読み込まれていません。しばらくお待ちください。' });
        return;
      }
      _resolveRef = resolve;
      _adInstance.show();
    });
  }, []);

  const reload = useCallback(() => {
    _adLoaded = false;
    _adLoading = false;
    _adInstance = null;
    _loadAd();
  }, []);

  return {
    loaded: _adLoaded,
    loading: _adLoading,
    showAd,
    reload,
  };
}
