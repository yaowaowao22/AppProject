import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAdContext } from '../AdContext';

// Safely try to import native ad components (skipped on web)
let InterstitialAd: any = null;
let AdEventType: any = null;
let TestIds: any = null;
if (Platform.OS !== 'web') {
  try {
    const ads = require('react-native-google-mobile-ads');
    InterstitialAd = ads.InterstitialAd;
    AdEventType = ads.AdEventType;
    TestIds = ads.TestIds;
  } catch {
    // Native module not available
  }
}

export interface UseInterstitialAdReturn {
  trackAction: () => void;
  showNow: () => void;
}

export function useInterstitialAd(): UseInterstitialAdReturn {
  const { config, initialized, isAdFree, incrementAction, shouldShowInterstitial } =
    useAdContext();
  const [loaded, setLoaded] = useState(false);
  const adRef = useRef<any>(null);

  useEffect(() => {
    if (!InterstitialAd || !initialized || isAdFree || config.interstitialFrequency <= 0) {
      return;
    }

    const unitId = __DEV__
      ? TestIds.INTERSTITIAL
      : Platform.select({
          android: config.unitIds.interstitial.android,
          ios: config.unitIds.interstitial.ios,
          default: config.unitIds.interstitial.android,
        });

    const interstitial = InterstitialAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    adRef.current = interstitial;

    const unsubscribeLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        setLoaded(true);
      },
    );

    const unsubscribeClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setLoaded(false);
        interstitial.load();
      },
    );

    const unsubscribeError = interstitial.addAdEventListener(
      AdEventType.ERROR,
      (error: unknown) => {
        setLoaded(false);
        if (__DEV__) {
          console.warn('[useInterstitialAd] Ad error:', error);
        }
      },
    );

    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
      adRef.current = null;
    };
  }, [initialized, isAdFree, config]);

  const trackAction = useCallback(() => {
    incrementAction();

    if (shouldShowInterstitial() && loaded && adRef.current) {
      adRef.current.show();
    } else if (__DEV__ && !InterstitialAd && shouldShowInterstitial()) {
      console.log('[useInterstitialAd] Would show interstitial (mock mode)');
    }
  }, [incrementAction, shouldShowInterstitial, loaded]);

  const showNow = useCallback(() => {
    if (loaded && adRef.current) {
      adRef.current.show();
    }
  }, [loaded]);

  return { trackAction, showNow };
}
