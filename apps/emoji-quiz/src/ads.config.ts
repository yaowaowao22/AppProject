import type { AdConfig } from '@massapp/ads';
import { AD_CONFIG_GAME } from '@massapp/ads';

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
  adsDisabled: false,
  ...AD_CONFIG_GAME,
  interstitialFrequency: AD_CONFIG_GAME.interstitialFrequency!,
  interstitialInitialDelay: AD_CONFIG_GAME.interstitialInitialDelay!,
  showBanner: AD_CONFIG_GAME.showBanner!,
};
