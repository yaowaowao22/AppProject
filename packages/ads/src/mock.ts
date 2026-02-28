// Mock module for web/Expo Go where native ads are unavailable
const noop = () => {};
const noopAsync = () => Promise.resolve();

export default noop;

export const BannerAd = () => null;
export const BannerAdSize = { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' };
export const TestIds = {
  BANNER: 'test-banner',
  INTERSTITIAL: 'test-interstitial',
  REWARDED: 'test-rewarded',
};
export const AdEventType = { LOADED: 'loaded', CLOSED: 'closed', ERROR: 'error' };
export const RewardedAdEventType = { LOADED: 'loaded', EARNED_REWARD: 'earned_reward' };

const createMockAd = () => ({
  load: noop,
  show: noop,
  addAdEventListener: () => noop,
});

export const InterstitialAd = { createForAdRequest: () => createMockAd() };
export const RewardedAd = { createForAdRequest: () => createMockAd() };
