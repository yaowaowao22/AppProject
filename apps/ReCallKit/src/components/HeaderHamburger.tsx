import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

export function HeaderHamburger() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      style={({ pressed }) => [styles.button, pressed && { backgroundColor: colors.hamburgerPressedBg }]}
      accessibilityLabel="メニューを開く"
      accessibilityRole="button"
      hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
    >
      <Ionicons name="menu" size={22} color={colors.hamburgerTint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
