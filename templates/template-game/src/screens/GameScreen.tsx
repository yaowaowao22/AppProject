import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, H2, Body, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useTimer } from '@massapp/hooks';

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();
  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd((reward) => {
    // TODO: Handle reward (e.g., extra life, hint)
    setHints((prev) => prev + reward.amount);
  });

  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [hints, setHints] = useState(0);

  const handleAnswer = (correct: boolean) => {
    if (correct) {
      setScore((prev) => prev + 10 * level);
      setLevel((prev) => prev + 1);
      trackAction(); // May show interstitial every N levels
    }
  };

  const handleUseHint = () => {
    if (hints > 0) {
      setHints((prev) => prev - 1);
      // TODO: Show hint logic
    } else if (rewardedLoaded) {
      showRewardedAd();
    }
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        {/* Score bar */}
        <View style={styles.scoreBar}>
          <Body color={colors.textSecondary}>レベル {level}</Body>
          <H2>{score}点</H2>
          <Body color={colors.textSecondary}>ヒント: {hints}</Body>
        </View>

        {/* Game area - TODO: Replace with actual game content */}
        <Card style={[styles.gameArea, { marginVertical: spacing.lg }]}>
          <H2 align="center">問題エリア</H2>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center', marginTop: spacing.md }}
          >
            ここにクイズ/パズルの問題を表示
          </Body>
        </Card>

        {/* Action buttons */}
        <View style={{ gap: spacing.sm }}>
          <Button title="正解" onPress={() => handleAnswer(true)} />
          <Button title="不正解" onPress={() => handleAnswer(false)} variant="outline" />
          <Button
            title={hints > 0 ? `ヒントを使う (${hints})` : '広告を見てヒント獲得'}
            onPress={handleUseHint}
            variant="ghost"
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scoreBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
