import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, H2, Body, EmptyState } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';

export function ResultScreen() {
  const { spacing } = useTheme();

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <EmptyState
          icon="📊"
          title="結果がありません"
          subtitle="ホーム画面で計算を実行してください"
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});
