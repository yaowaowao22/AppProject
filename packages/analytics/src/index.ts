import { Platform } from 'react-native';

// Safely try to import Firebase Analytics (skipped on web & Expo Go)
let analyticsFn: (() => any) | null = null;
if (Platform.OS !== 'web') {
  try {
    analyticsFn = require('@react-native-firebase/analytics').default;
  } catch {
    // Native module not available
  }
}

function getAnalytics() {
  if (!analyticsFn) {
    // Return no-op proxy in mock mode
    return {
      logEvent: async () => {},
      logScreenView: async () => {},
      setUserProperty: async () => {},
      setUserId: async () => {},
    };
  }
  return analyticsFn();
}

// --- Core wrapper functions ---

export async function logEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
): Promise<void> {
  await getAnalytics().logEvent(name, params);
  if (__DEV__ && !analyticsFn) {
    console.log(`[Analytics] logEvent: ${name}`, params);
  }
}

export async function logScreenView(
  screenName: string,
  screenClass?: string,
): Promise<void> {
  await getAnalytics().logScreenView({
    screen_name: screenName,
    screen_class: screenClass ?? screenName,
  });
}

export async function setUserProperty(
  name: string,
  value: string | null,
): Promise<void> {
  await getAnalytics().setUserProperty(name, value);
}

export async function setUserId(id: string | null): Promise<void> {
  await getAnalytics().setUserId(id);
}

// --- Pre-defined event helpers ---

export const Events = {
  adImpression(adType: 'banner' | 'interstitial' | 'rewarded'): Promise<void> {
    return logEvent('ad_impression', { ad_type: adType });
  },

  adClick(adType: 'banner' | 'interstitial' | 'rewarded'): Promise<void> {
    return logEvent('ad_click', { ad_type: adType });
  },

  featureUsed(feature: string): Promise<void> {
    return logEvent('feature_used', { feature_name: feature });
  },

  levelComplete(level: number): Promise<void> {
    return logEvent('level_complete', { level });
  },

  itemCreated(itemType: string): Promise<void> {
    return logEvent('item_created', { item_type: itemType });
  },

  appRated(): Promise<void> {
    return logEvent('app_rated');
  },
};
