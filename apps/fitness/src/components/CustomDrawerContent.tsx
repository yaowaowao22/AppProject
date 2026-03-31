import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, TYPOGRAPHY, RADIUS } from '../theme';
import type { TanrenThemeColors } from '../theme';
import { useTheme } from '../ThemeContext';
import { useWorkout } from '../WorkoutContext';

// ── ナビ項目定義 ──────────────────────────────────────────────────────────────

type NavItem = {
  routeName: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const NAV_ITEMS: NavItem[] = [
  { routeName: 'Home',          label: 'ホーム',         icon: 'barbell-outline',     iconActive: 'barbell' },
  { routeName: 'WorkoutStack',  label: 'トレーニング',   icon: 'fitness-outline',     iconActive: 'fitness' },
  { routeName: 'HistoryStack',  label: '履歴',           icon: 'time-outline',        iconActive: 'time' },
  { routeName: 'MonthlyReport', label: '月別レポート',   icon: 'calendar-outline',    iconActive: 'calendar' },
  { routeName: 'RMCalculator',  label: 'RM計算機',       icon: 'calculator-outline',       iconActive: 'calculator' },
  { routeName: 'TemplateManage', label: 'テンプレート', icon: 'document-text-outline',    iconActive: 'document-text' },
];

// ── ヘルパー ──────────────────────────────────────────────────────────────────

function formatVolume(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { state, navigation } = props;
  const insets = useSafeAreaInsets();
  const { weeklyStats } = useWorkout();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const activeRouteName = state.routes[state.index]?.name ?? '';

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* ステータスバー領域を background 色で塗りつぶし */}
      <View style={{ height: insets.top, backgroundColor: colors.background }} />
      <DrawerContentScrollView
        {...props}
        scrollEnabled={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]}
      >
        {/* ── 上部ミニダッシュボード ─────────────────────────────────────── */}
        <View style={[styles.miniDash, { paddingTop: SPACING.sm }]}>
          <Text style={styles.dashTitle}>今週</Text>
          <View style={styles.dashRow}>
            <View style={styles.dashItem}>
              <Text style={styles.dashNum}>{weeklyStats.workoutCount}</Text>
              <Text style={styles.dashKey}>トレーニング</Text>
            </View>
            <View style={[styles.dashItem, styles.dashBorder]}>
              <Text style={styles.dashNum}>{formatVolume(weeklyStats.totalVolume)}</Text>
              <Text style={styles.dashKey}>ボリューム</Text>
            </View>
            <View style={[styles.dashItem, styles.dashBorder]}>
              <Text style={styles.dashNum}>{weeklyStats.streakDays}</Text>
              <Text style={styles.dashKey}>日連続</Text>
            </View>
          </View>
        </View>

        {/* ── ナビゲーションリンク ──────────────────────────────────────── */}
        <View style={styles.navList}>
          {NAV_ITEMS.map(item => {
            const isActive = activeRouteName === item.routeName;
            return (
              <TouchableOpacity
                key={item.routeName}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => navigation.navigate(item.routeName)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: isActive }}
              >
                <Ionicons
                  name={isActive ? item.iconActive : item.icon}
                  size={22}
                  color={isActive ? colors.accent : colors.textSecondary}
                  style={styles.navIcon}
                />
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </DrawerContentScrollView>

      {/* ── セパレータ + 設定 ─────────────────────────────────────────── */}
      <View style={styles.footer}>
        <View style={styles.separator} />
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="設定"
        >
          <Ionicons
            name="settings-outline"
            size={22}
            color={colors.textSecondary}
            style={styles.navIcon}
          />
          <Text style={styles.navLabel}>設定</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const DRAWER_WIDTH = Dimensions.get('window').width * 0.75;

function makeStyles(c: TanrenThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      width: DRAWER_WIDTH,
      backgroundColor: c.surface1,
    },
    scrollContent: {
      flexGrow: 1,
    },

    miniDash: {
      backgroundColor: c.surface2,
      paddingHorizontal: SPACING.md,
      paddingBottom: SPACING.md,
      marginBottom: SPACING.sm,
    },
    dashTitle: {
      fontSize: 10,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.9,
      marginBottom: SPACING.sm,
    },
    dashRow: {
      flexDirection: 'row',
    },
    dashItem: {
      flex: 1,
      gap: 3,
    },
    dashBorder: {
      borderLeftWidth: 1,
      borderLeftColor: c.separator,
      paddingLeft: SPACING.md,
    },
    dashNum: {
      fontSize: 20,
      fontWeight: TYPOGRAPHY.heavy,
      color: c.textPrimary,
      letterSpacing: -0.5,
      fontVariant: ['tabular-nums'],
      lineHeight: 22,
    },
    dashKey: {
      fontSize: 9,
      fontWeight: TYPOGRAPHY.regular,
      color: c.textTertiary,
    },

    navList: {
      paddingHorizontal: SPACING.sm,
      paddingTop: SPACING.sm,
    },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
      borderRadius: RADIUS.button,
      paddingHorizontal: SPACING.md,
      marginBottom: 2,
    },
    navItemActive: {
      backgroundColor: c.accentDim,
    },
    navIcon: {
      width: 26,
    },
    navLabel: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textSecondary,
      marginLeft: SPACING.sm,
    },
    navLabelActive: {
      color: c.accent,
    },

    footer: {
      paddingHorizontal: SPACING.sm,
      paddingBottom: SPACING.md,
    },
    separator: {
      height: 1,
      backgroundColor: c.separator,
      marginHorizontal: SPACING.sm,
      marginBottom: SPACING.sm,
    },
  });
}
