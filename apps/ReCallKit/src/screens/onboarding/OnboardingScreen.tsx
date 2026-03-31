import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { useDB } from '../../hooks/useDatabase';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const db = useDB();

  const handleStart = async () => {
    await db.runAsync(
      `UPDATE app_settings SET value = 'true' WHERE key = 'onboarding_completed'`
    );
    navigation.replace('Main');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.label }]}>ReCallKit へようこそ</Text>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.accent, opacity: pressed ? 0.7 : 1 },
        ]}
        onPress={handleStart}
      >
        <Text style={styles.buttonText}>はじめる</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 20, fontWeight: '700' },
  button: { marginTop: 32, paddingVertical: 14, paddingHorizontal: 48, borderRadius: 12 },
  buttonText: { fontSize: 17, fontWeight: '600', color: '#fff' },
});
