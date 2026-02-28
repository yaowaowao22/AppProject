import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAdContext } from '../AdContext';
import type { AdReward } from '../types';

// Safely try to import native ad components (skipped on web)
let RewardedAd: any = null;
let RewardedAdEventType: any = null;
let AdEventType: any = null;
let TestIds: any = null;
if (Platform.OS !== 'web') {
  try {
    const ads = require('react-native-google-mobile-ads');
    RewardedAd = ads.RewardedAd;
    RewardedAdEventType = ads.RewardedAdEventType;
    AdEventType = ads.AdEventType;
    TestIds = ads.TestIds;
  } catch {
    // Native module not available
  }
}

export interface UseRewardedAdOptions {
  onReward?: (reward: AdReward) => void;
}

export interface UseRewardedAdReturn {
  show: () => void;
  loaded: boolean;
  loading: boolean;
}

export function useRewardedAd(options?: UseRewardedAdOptions): UseRewardedAdReturn {
  const { config, initialized } = useAdContext();
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const adRef = useRef<any>(null);
  const onRewardRef = useRef(options?.onReward);

  useEffect(() => {
    onRewardRef.current = options?.onReward;
  }, [options?.onReward]);

  useEffect(() => {
    if (!RewardedAd || !initialized) {
      return;
    }

    const unitId = __DEV__
      ? TestIds.REWARDED
      : Platform.select({
          android: config.unitIds.rewarded.android,
          ios: config.unitIds.rewarded.ios,
          default: config.unitIds.rewarded.android,
        });

    const rewarded = RewardedAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    adRef.current = rewarded;
    setLoading(true);

    const unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setLoaded(true);
        setLoading(false);
      },
    );

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward: any) => {
        if (onRewardRef.current) {
          onRewardRef.current({
            type: reward.type,
            amount: reward.amount,
          });
        }
      },
    );

    const unsubscribeClosed = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setLoaded(false);
        setLoading(true);
        rewarded.load();
      },
    );

    const unsubscribeError = rewarded.addAdEventListener(
      AdEventType.ERROR,
      (error: unknown) => {
        setLoaded(false);
        setLoading(false);
        if (__DEV__) {
          console.warn('[useRewardedAd] Ad error:', error);
        }
      },
    );

    rewarded.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
      adRef.current = null;
    };
  }, [initialized, config]);

  const show = useCallback(() => {
    if (loaded && adRef.current) {
      adRef.current.show();
    } else if (__DEV__ && !RewardedAd) {
      console.log('[useRewardedAd] Would show rewarded ad (mock mode)');
      // Simulate reward in mock mode
      onRewardRef.current?.({ type: 'mock_reward', amount: 1 });
    }
  }, [loaded]);

  return { show, loaded, loading };
}
