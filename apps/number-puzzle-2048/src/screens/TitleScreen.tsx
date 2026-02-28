import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H2, Body, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const [bestScore] = useLocalStorage<number>('best-score-2048', 0);

  const handleStart = () => {
    navigation.navigate('Game');
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <View
            style={[
              styles.titleBox,
              {
                backgroundColor: colors.primary,
                borderRadius: spacing.md,
                padding: spacing.xl,
                marginBottom: spacing.lg,
              },
            ]}
          >
            <H1 align="center" style={{ color: '#fff', fontSize: 48 }}>
              2048
            </H1>
          </View>
          <H2 align="center" style={{ marginBottom: spacing.md }}>
            数字パズル
          </H2>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center', marginTop: spacing.sm }}
          >
            同じ数字を合わせて2048を目指そう！
          </Body>
        </View>

        {(bestScore || 0) > 0 && (
          <Card
            style={[
              styles.bestScoreCard,
              { padding: spacing.lg, marginBottom: spacing.xl },
            ]}
          >
            <Body
              color={colors.textSecondary}
              style={{ textAlign: 'center' }}
            >
              ベストスコア
            </Body>
            <H2
              align="center"
              style={{ color: colors.primary, marginTop: spacing.xs }}
            >
              {bestScore}
            </H2>
          </Card>
        )}

        <View style={styles.buttonArea}>
          <Button title="ゲームスタート" onPress={handleStart} size="lg" />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  titleArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBox: {
    minWidth: 160,
    alignItems: 'center',
  },
  bestScoreCard: {
    alignItems: 'center',
  },
  buttonArea: {
    paddingBottom: 40,
  },
});
