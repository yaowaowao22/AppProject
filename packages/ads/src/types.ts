export interface AdUnitIds {
  banner: { android: string; ios: string };
  interstitial: { android: string; ios: string };
  rewarded: { android: string; ios: string };
}

export interface AdConfig {
  unitIds: AdUnitIds;
  interstitialFrequency: number; // show every N actions (0 = disabled)
  adsDisabled: boolean;
  interstitialInitialDelay: number; // ms before first interstitial
  showBanner: boolean;
}

export type AdPosition = 'top' | 'bottom';

export interface AdReward {
  type: string;
  amount: number;
}
