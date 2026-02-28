import type { AdConfig } from './types';

export type {
  AdUnitIds,
  AdConfig,
  AdPosition,
  AdReward,
} from './types';

export { AdProvider, useAdContext } from './AdContext';
export type { AdProviderProps } from './AdContext';

export { AdBanner } from './components/AdBanner';
export type { AdBannerProps } from './components/AdBanner';

export { useInterstitialAd } from './hooks/useInterstitialAd';
export type { UseInterstitialAdReturn } from './hooks/useInterstitialAd';

export { useRewardedAd } from './hooks/useRewardedAd';
export type { UseRewardedAdOptions, UseRewardedAdReturn } from './hooks/useRewardedAd';

export const AD_CONFIG_UTILITY: Partial<AdConfig> = {
  interstitialFrequency: 5,
  interstitialInitialDelay: 30000,
  showBanner: true,
};

export const AD_CONFIG_LIFESTYLE: Partial<AdConfig> = {
  interstitialFrequency: 0,
  interstitialInitialDelay: 0,
  showBanner: true,
};

export const AD_CONFIG_GAME: Partial<AdConfig> = {
  interstitialFrequency: 3,
  interstitialInitialDelay: 60000,
  showBanner: true,
};
