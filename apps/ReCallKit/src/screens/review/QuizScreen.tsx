// ============================================================
// QuizScreen - クイズモード（準備中プレースホルダー）
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Quiz'>;

export function QuizScreen({ navigation }: Props) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={styles.emoji}>🧠</Text>
        <Text style={[styles.title, { color: colors.label }]}>クイズモード</Text>
        <Text style={[styles.subtitle, { color: colors.labelSecondary }]}>
          このモードは現在準備中です。
        </Text>
        <Pressable
          style={[styles.closeButton, { backgroundColor: colors.accent }]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
        >
          <Text style={styles.closeButtonText}>閉じる</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.m,
  },
  emoji: {
    fontSize: 56,
    marginBottom: Spacing.s,
  },
  title: {
    ...TypeScale.title2,
    textAlign: 'center',
  },
  subtitle: {
    ...TypeScale.body,
    textAlign: 'center',
  },
  closeButton: {
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.m,
    marginTop: Spacing.l,
  },
  closeButtonText: {
    ...TypeScale.headline,
    color: '#FFFFFF',
  },
});
