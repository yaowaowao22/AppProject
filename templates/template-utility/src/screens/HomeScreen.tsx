import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, H2, Body, Input, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd } from '@massapp/ads';

export function HomeScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const handleCalculate = () => {
    // TODO: Replace with your app's logic
    setResult(`Result: ${inputValue}`);
    trackAction();
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <H2 style={{ marginBottom: spacing.md }}>__APP_DISPLAY_NAME__</H2>

        <Card style={{ marginBottom: spacing.lg }}>
          <Input
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="入力してください"
            label="入力"
          />
          <View style={{ height: spacing.md }} />
          <Button title="計算する" onPress={handleCalculate} />
        </Card>

        {result && (
          <Card>
            <Body color={colors.textSecondary}>結果</Body>
            <H2 style={{ marginTop: spacing.sm }}>{result}</H2>
          </Card>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
