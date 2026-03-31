import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
} from 'react-native';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { LightColors, DarkColors } from '../theme/colors';

const menuItems = [
  { label: 'ホーム', icon: 'home-outline' as const, route: 'MainTabs' },
  { label: '設定', icon: 'settings-outline' as const, route: 'Settings' },
] as const;

export function DrawerContent({ navigation }: DrawerContentComponentProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <Text style={[styles.title, { color: colors.accent }]}>ReCall</Text>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {menuItems.map((item) => (
          <Pressable
            key={item.route}
            style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.6 : 1 }]}
            onPress={() => navigation.navigate(item.route)}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={colors.label}
              style={styles.menuIcon}
            />
            <Text style={[styles.menuLabel, { color: colors.label }]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  menu: {
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 16,
  },
});
