import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H3, Body, Button, Caption } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import { formatTime } from '../utils/wordSearch';

interface GameResult {
  id: string;
  theme: string;
  themeName: string;
  gridSize: number;
  wordsFound: number;
  totalWords: number;
  timeSeconds: number;
  date: string;
}

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();

  const [results] = useLocalStorage<GameResult[]>('wordsearch-results', []);

  const data = results || [];
  const totalGames = data.length;
  const totalWordsFound = data.reduce((sum, r) => sum + r.wordsFound, 0);
  const bestTime =
    data.length > 0
      ? Math.min(...data.map((r) => r.timeSeconds))
      : 0;

  const handleStart = () => {
    navigation.navigate('Game');
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <Ionicons name="search" size={48} color={colors.primary} />
          <H1 align="center" style={{ marginTop: spacing.md }}>
            単語探し
          </H1>
          <H3
            style={{
              textAlign: 'center',
              marginTop: spacing.sm,
              color: colors.textSecondary,
            }}
          >
            カタカナワードサーチ
          </H3>

          {totalGames > 0 && (
            <View
              style={[
                styles.statsContainer,
                {
                  marginTop: spacing.xl,
                  backgroundColor: colors.surface,
                  padding: spacing.lg,
                  borderRadius: 12,
                },
              ]}
            >
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Caption style={{ color: colors.textMuted, textAlign: 'center' }}>
                    プレイ回数
                  </Caption>
                  <Body
                    style={{
                      fontWeight: 'bold',
                      fontSize: 24,
                      color: colors.primary,
                      textAlign: 'center',
                      marginTop: 2,
                    }}
                  >
                    {totalGames}
                  </Body>
                </View>
                <View style={styles.statItem}>
                  <Caption style={{ color: colors.textMuted, textAlign: 'center' }}>
                    発見した単語
                  </Caption>
                  <Body
                    style={{
                      fontWeight: 'bold',
                      fontSize: 24,
                      color: colors.primary,
                      textAlign: 'center',
                      marginTop: 2,
                    }}
                  >
                    {totalWordsFound}
                  </Body>
                </View>
                <View style={styles.statItem}>
                  <Caption style={{ color: colors.textMuted, textAlign: 'center' }}>
                    最速タイム
                  </Caption>
                  <Body
                    style={{
                      fontWeight: 'bold',
                      fontSize: 24,
                      color: colors.primary,
                      textAlign: 'center',
                      marginTop: 2,
                    }}
                  >
                    {formatTime(bestTime)}
                  </Body>
                </View>
              </View>
            </View>
          )}
        </View>

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
  statsContainer: {
    width: '100%',
    maxWidth: 320,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  buttonArea: {
    paddingBottom: 40,
  },
});
