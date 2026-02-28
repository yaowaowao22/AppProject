import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H3, Body, Button, Caption } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import { puzzles } from '../data/puzzles';

export function TitleScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<any>();

  const [completedIds] = useLocalStorage<string[]>('connect-dots-completed', []);

  const completedCount = completedIds.length;
  const totalCount = puzzles.length;

  const handleStart = () => {
    navigation.navigate('Game');
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View style={styles.titleArea}>
          <Ionicons
            name="git-network-outline"
            size={64}
            color={colors.primary}
            style={{ marginBottom: spacing.lg }}
          />
          <H1 align="center">一筆書き</H1>
          <H3
            color={colors.textSecondary}
            align="center"
            style={{ marginTop: spacing.sm }}
          >
            パズルに挑戦
          </H3>
          <Body
            color={colors.textSecondary}
            style={{ textAlign: 'center', marginTop: spacing.lg }}
          >
            すべての線を一度だけ通って{'\n'}ゴールを目指そう
          </Body>

          {completedCount > 0 && (
            <View
              style={[
                styles.statsContainer,
                {
                  marginTop: spacing.xl,
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: spacing.lg,
                },
              ]}
            >
              <Caption color={colors.textSecondary}>クリア状況</Caption>
              <Body style={{ fontWeight: '700', marginTop: spacing.xs }}>
                {completedCount} / {totalCount}
              </Body>
              <View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: colors.border,
                    marginTop: spacing.sm,
                  },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${(completedCount / totalCount) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.buttonArea}>
          <Button title="パズルに挑戦" onPress={handleStart} size="lg" />
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
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  buttonArea: {
    paddingBottom: 40,
  },
});
