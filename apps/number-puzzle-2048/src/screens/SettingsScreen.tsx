import React from 'react';
import { View, StyleSheet, Alert, Linking } from 'react-native';
import { useTheme, H2, ListItem, Divider } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';

export function SettingsScreen() {
  const { spacing } = useTheme();

  const handleRate = () => {
    Alert.alert('レビュー', 'ストアページを開きます');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://example.com/privacy');
  };

  const handleTerms = () => {
    Linking.openURL('https://example.com/terms');
  };

  return (
    <ScreenWrapper showBanner={false}>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <H2 style={{ marginBottom: spacing.lg }}>設定</H2>

        <ListItem
          title="アプリを評価する"
          leftIcon="⭐"
          showChevron
          onPress={handleRate}
        />
        <Divider />
        <ListItem
          title="プライバシーポリシー"
          leftIcon="🔒"
          showChevron
          onPress={handlePrivacyPolicy}
        />
        <Divider />
        <ListItem
          title="利用規約"
          leftIcon="📄"
          showChevron
          onPress={handleTerms}
        />
        <Divider />
        <ListItem
          title="バージョン"
          subtitle="1.0.0"
          leftIcon="ℹ️"
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
