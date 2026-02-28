import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '@massapp/ui';
import { AdBanner } from '@massapp/ads';
import type { AdPosition } from '@massapp/ads';

export interface ScreenWrapperProps {
  children: React.ReactNode;
  showBanner?: boolean;
  bannerPosition?: AdPosition;
  edges?: Edge[];
}

export function ScreenWrapper({
  children,
  showBanner = true,
  bannerPosition = 'bottom',
  edges,
}: ScreenWrapperProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={edges}
    >
      {showBanner && bannerPosition === 'top' && (
        <AdBanner position="top" />
      )}

      <View style={styles.content}>{children}</View>

      {showBanner && bannerPosition === 'bottom' && (
        <AdBanner position="bottom" />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
