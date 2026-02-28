import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, EmptyState } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';

export function HistoryScreen() {
  const { spacing } = useTheme();

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <EmptyState
          icon="🏆"
          title="まだ記録がありません"
          subtitle="ゲームをプレイして記録を残しましょう"
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
