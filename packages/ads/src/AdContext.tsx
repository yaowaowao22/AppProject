import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { Platform } from 'react-native';
import type { AdConfig } from './types';

// Safely try to import mobile ads (skipped on web & graceful in Expo Go)
let mobileAds: (() => { initialize: () => Promise<void> }) | null = null;
if (Platform.OS !== 'web') {
  try {
    mobileAds = require('react-native-google-mobile-ads').default;
  } catch {
    // Native module not available (e.g. Expo Go)
  }
}

interface AdContextValue {
  config: AdConfig;
  initialized: boolean;
  isAdFree: boolean;
  setAdFree: (adFree: boolean) => void;
  actionCount: number;
  incrementAction: () => void;
  shouldShowInterstitial: () => boolean;
}

const AdContext = createContext<AdContextValue | null>(null);

export interface AdProviderProps {
  config: AdConfig;
  children: React.ReactNode;
}

export function AdProvider({ config, children }: AdProviderProps) {
  const [initialized, setInitialized] = useState(false);
  const [isAdFree, setAdFree] = useState(config.adsDisabled);
  const [actionCount, setActionCount] = useState(0);
  const actionCountRef = useRef(0);
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!mobileAds) {
      if (__DEV__) {
        console.log('[AdProvider] Native ads module not available, running in mock mode');
      }
      setInitialized(true);
      return;
    }

    let mounted = true;

    mobileAds()
      .initialize()
      .then(() => {
        if (mounted) {
          setInitialized(true);
        }
      })
      .catch((error: unknown) => {
        if (__DEV__) {
          console.warn('[AdProvider] Failed to initialize mobile ads:', error);
        }
        if (mounted) setInitialized(true); // Still allow app to work
      });

    return () => {
      mounted = false;
    };
  }, []);

  const incrementAction = useCallback(() => {
    actionCountRef.current += 1;
    setActionCount(actionCountRef.current);
  }, []);

  const shouldShowInterstitial = useCallback(() => {
    if (isAdFree) {
      return false;
    }

    if (config.interstitialFrequency <= 0) {
      return false;
    }

    const elapsed = Date.now() - mountTimeRef.current;
    if (elapsed < config.interstitialInitialDelay) {
      return false;
    }

    return actionCountRef.current > 0 &&
      actionCountRef.current % config.interstitialFrequency === 0;
  }, [isAdFree, config.interstitialFrequency, config.interstitialInitialDelay]);

  const value = useMemo<AdContextValue>(
    () => ({
      config,
      initialized,
      isAdFree,
      setAdFree,
      actionCount,
      incrementAction,
      shouldShowInterstitial,
    }),
    [config, initialized, isAdFree, actionCount, incrementAction, shouldShowInterstitial],
  );

  return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
}

export function useAdContext(): AdContextValue {
  const context = useContext(AdContext);
  if (context === null) {
    throw new Error('useAdContext must be used within an AdProvider');
  }
  return context;
}
