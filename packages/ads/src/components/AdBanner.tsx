import React from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { useAdContext } from '../AdContext';
import type { AdPosition } from '../types';

// Safely try to import native ad components (skipped on web)
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;
if (Platform.OS !== 'web') {
  try {
    const ads = require('react-native-google-mobile-ads');
    BannerAd = ads.BannerAd;
    BannerAdSize = ads.BannerAdSize;
    TestIds = ads.TestIds;
  } catch {
    // Native module not available
  }
}

export interface AdBannerProps {
  position?: AdPosition;
  size?: any;
}

export function AdBanner({
  position = 'bottom',
  size,
}: AdBannerProps) {
  const { config, initialized, isAdFree } = useAdContext();

  if (isAdFree || !config.showBanner || !initialized) {
    return null;
  }

  // Mock banner in dev when native module is not available
  if (!BannerAd) {
    if (!__DEV__) return null;
    return (
      <View style={[styles.container, styles.mockBanner, position === 'top' ? styles.top : styles.bottom]}>
        <Text style={styles.mockText}>Ad Banner (mock)</Text>
      </View>
    );
  }

  const adSize = size ?? BannerAdSize.ANCHORED_ADAPTIVE_BANNER;

  const unitId = __DEV__
    ? TestIds.BANNER
    : Platform.select({
        android: config.unitIds.banner.android,
        ios: config.unitIds.banner.ios,
        default: config.unitIds.banner.android,
      });

  return (
    <View
      style={[
        styles.container,
        position === 'top' ? styles.top : styles.bottom,
      ]}
    >
      <BannerAd
        unitId={unitId}
        size={adSize}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  top: {
    position: 'relative',
  },
  bottom: {
    position: 'relative',
  },
  mockBanner: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  mockText: {
    color: '#999',
    fontSize: 12,
  },
});
