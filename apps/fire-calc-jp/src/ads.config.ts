import type { AdConfig } from '@massapp/ads';
import { AD_CONFIG_UTILITY } from '@massapp/ads';

export const adConfig: AdConfig = {
  unitIds: {
    banner: {
      android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
      ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    },
    interstitial: {
      android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
      ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    },
    rewarded: {
      android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
      ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    },
  },
  adsDisabled: true,
  ...AD_CONFIG_UTILITY,
  interstitialFrequency: AD_CONFIG_UTILITY.interstitialFrequency!,
  interstitialInitialDelay: AD_CONFIG_UTILITY.interstitialInitialDelay!,
  showBanner: AD_CONFIG_UTILITY.showBanner!,
};
