import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RADIUS, SPACING, TYPOGRAPHY } from '../theme';
import type { TanrenThemeColors } from '../theme';
import { useTheme } from '../ThemeContext';
import { useWorkout } from '../WorkoutContext';
import type { WorkoutConfig } from '../WorkoutContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import { APP } from '../config';
import type { AppSettings } from '../types';
import { loadAppSettings, saveAppSettings } from '../utils/storage';

// expo-constants は任意依存。インストール済みならビルド番号を表示する
let buildVersion = '-';
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Constants = require('expo-constants').default;
  buildVersion = Constants?.expoConfig?.version ?? '-';
} catch {
  // expo-constants が未インストールの場合はフォールバック
}

// ── サブコンポーネント ──────────────────────────────────────────────────────────

function SectionHeader({ title, style }: { title: string; style?: object }) {
  return <Text style={style}>{title}</Text>;
}

interface StepperProps {
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  decimals?: number;
  onChangeValue: (v: number) => void;
  colors: TanrenThemeColors;
}

function Stepper({ value, min, max, step, unit, decimals = 0, onChangeValue, colors }: StepperProps) {
  const canDec = value > min;
  const canInc = value < max;
  const fmt = decimals > 0 ? value.toFixed(decimals) : String(value);

  return (
    <View style={stepperStyles.row}>
      <TouchableOpacity
        style={[
          stepperStyles.btn,
          { backgroundColor: canDec ? colors.accent : colors.surface2 },
        ]}
        onPress={() => onChangeValue(Math.round((value - step) * 1000) / 1000)}
        disabled={!canDec}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
        accessibilityRole="button"
        accessibilityLabel="減らす"
      >
        <Text style={[stepperStyles.btnText, { color: canDec ? colors.background : colors.textTertiary }]}>
          −
        </Text>
      </TouchableOpacity>

      <Text style={[stepperStyles.valueText, { color: colors.textPrimary }]}>
        {fmt}{unit}
      </Text>

      <TouchableOpacity
        style={[
          stepperStyles.btn,
          { backgroundColor: canInc ? colors.accent : colors.surface2 },
        ]}
        onPress={() => onChangeValue(Math.round((value + step) * 1000) / 1000)}
        disabled={!canInc}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="増やす"
      >
        <Text style={[stepperStyles.btnText, { color: canInc ? colors.background : colors.textTertiary }]}>
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  valueText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: '500',
    minWidth: 56,
    textAlign: 'center',
  },
});

// ── メイン画面 ────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { colors, setTheme, themeList, currentThemeId } = useTheme();
  const { workoutConfig, updateWorkoutConfig, resetAll } = useWorkout();
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [appSettings, setAppSettings] = useState<AppSettings>({ showCalendar: true, showQuickStart: true });

  useEffect(() => {
    loadAppSettings().then(s => setAppSettings(s));
  }, []);

  const handleCalendarToggle = (val: boolean) => {
    const next = { ...appSettings, showCalendar: val };
    setAppSettings(next);
    saveAppSettings(next);
  };

  const handleQuickStartToggle = (val: boolean) => {
    const next = { ...appSettings, showQuickStart: val };
    setAppSettings(next);
    saveAppSettings(next);
  };

  const handleDeleteAll = () => {
    Alert.alert(
      '全データを削除',
      'すべてのトレーニングデータが削除されます。テーマ設定も初期化されます。この操作は元に戻せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            await resetAll();
            Alert.alert(
              '削除完了',
              'データをすべて削除しました。',
            );
          },
        },
      ],
    );
  };

  const handleConfigChange = (partial: Partial<WorkoutConfig>) => {
    updateWorkoutConfig(partial);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScreenHeader title="設定" showHamburger />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 表示設定 ── */}
        <SectionHeader title="表示設定" style={styles.sectionHeader} />
        <View style={styles.sectionCard}>
          <View style={styles.row}>
            <View style={styles.rowLabelGroup}>
              <Text style={styles.rowLabel}>ホームカレンダー</Text>
            </View>
            <Switch
              value={appSettings.showCalendar}
              onValueChange={handleCalendarToggle}
              trackColor={{ false: colors.surface2, true: colors.accentDim }}
              thumbColor={appSettings.showCalendar ? colors.accent : colors.textTertiary}
              accessibilityRole="switch"
              accessibilityLabel="ホームカレンダーの表示切替"
            />
          </View>
          <View style={styles.rowSeparator} />
          <View style={styles.row}>
            <View style={styles.rowLabelGroup}>
              <Text style={styles.rowLabel}>クイックスタート</Text>
              <Text style={styles.rowDescription}>ホーム画面にクイックスタートを表示</Text>
            </View>
            <Switch
              value={appSettings.showQuickStart}
              onValueChange={handleQuickStartToggle}
              trackColor={{ false: colors.surface2, true: colors.accentDim }}
              thumbColor={appSettings.showQuickStart ? colors.accent : colors.textTertiary}
              accessibilityRole="switch"
              accessibilityLabel="クイックスタートの表示切替"
            />
          </View>
        </View>

        {/* ── テーマ ── */}
        <SectionHeader title="テーマ" style={styles.sectionHeader} />
        <View style={styles.sectionCard}>
          <View style={styles.themeGrid}>
            {themeList.map(theme => {
              const isSelected = theme.id === currentThemeId;
              return (
                <View key={theme.id} style={styles.themeCircleItem}>
                  <TouchableOpacity
                    style={[
                      styles.themeCircle,
                      { backgroundColor: theme.colors.accent },
                      isSelected
                        ? { borderWidth: 2, borderColor: colors.accent }
                        : { borderWidth: 2, borderColor: 'transparent' },
                    ]}
                    onPress={() => setTheme(theme.id)}
                    activeOpacity={0.75}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={`テーマ: ${theme.name}`}
                  >
                    <View
                      style={[
                        styles.themeCircleInner,
                        { backgroundColor: theme.colors.surface1 },
                      ]}
                    />
                  </TouchableOpacity>
                  <Text style={styles.themeCircleName}>{theme.name}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── トレーニング設定 ── */}
        <SectionHeader title="トレーニング設定" style={styles.sectionHeader} />
        <View style={styles.sectionCard}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>重量ステップ</Text>
            <Stepper
              value={workoutConfig.weightStep}
              min={0.5} max={10} step={0.5} unit=" kg" decimals={1}
              onChangeValue={v => handleConfigChange({ weightStep: v })}
              colors={colors}
            />
          </View>
          <View style={styles.rowSeparator} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>デフォルトセット数</Text>
            <Stepper
              value={workoutConfig.defaultSets}
              min={1} max={10} step={1} unit=" セット"
              onChangeValue={v => handleConfigChange({ defaultSets: v })}
              colors={colors}
            />
          </View>
          <View style={styles.rowSeparator} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>デフォルト重量</Text>
            <Stepper
              value={workoutConfig.defaultWeight}
              min={0} max={300} step={5} unit=" kg"
              onChangeValue={v => handleConfigChange({ defaultWeight: v })}
              colors={colors}
            />
          </View>
          <View style={styles.rowSeparator} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>デフォルトレップ数</Text>
            <Stepper
              value={workoutConfig.defaultReps}
              min={1} max={100} step={1} unit=" 回"
              onChangeValue={v => handleConfigChange({ defaultReps: v })}
              colors={colors}
            />
          </View>
        </View>

        {/* ── データ管理 ── */}
        <SectionHeader title="データ管理" style={styles.sectionHeader} />
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.row}
            onPress={handleDeleteAll}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="すべてのデータを削除（元に戻せません）"
          >
            <Text style={[styles.rowLabel, styles.destructiveText]}>
              全データを削除
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── サポート ── */}
        <SectionHeader title="サポート" style={styles.sectionHeader} />
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('Contact')}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.rowLabel}>お問い合わせ</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* ── 法的情報 ── */}
        <SectionHeader title="法的情報" style={styles.sectionHeader} />
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('PrivacyPolicy')}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.rowLabel}>プライバシーポリシー</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.rowSeparator} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('TermsOfService')}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.rowLabel}>利用規約</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* ── アプリ情報 ── */}
        <SectionHeader title="アプリ情報" style={styles.sectionHeader} />
        <View style={styles.sectionCard}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>アプリ名</Text>
            <Text style={styles.rowValue}>{APP.NAME}</Text>
          </View>
          <View style={styles.rowSeparator} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>バージョン</Text>
            <Text style={styles.rowValue}>{APP.VERSION}</Text>
          </View>
          <View style={styles.rowSeparator} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>ビルド</Text>
            <Text style={styles.rowValue}>{buildVersion}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── スタイル ──────────────────────────────────────────────────────────────────

function makeStyles(c: TanrenThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.background,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingBottom: SPACING.xl,
    },

    sectionHeader: {
      fontSize: TYPOGRAPHY.caption,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textTertiary,
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      paddingHorizontal: SPACING.contentMargin,
      marginTop: SPACING.sectionGap,
      marginBottom: 10,
    },

    sectionCard: {
      backgroundColor: c.surface1,
      borderRadius: RADIUS.card,
      marginHorizontal: SPACING.contentMargin,
      overflow: 'hidden',
    },

    // ── テーマ円グリッド ──
    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: SPACING.md,
      gap: 10,
    },

    themeCircleItem: {
      alignItems: 'center',
      width: 52,
    },

    themeCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },

    themeCircleInner: {
      width: 18,
      height: 18,
      borderRadius: 9,
    },

    themeCircleName: {
      fontSize: TYPOGRAPHY.captionSmall,
      color: c.textTertiary,
      marginTop: 5,
      textAlign: 'center',
    },

    // ── リスト行 ──
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 48,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },

    rowLabelGroup: {
      flex: 1,
      justifyContent: 'center',
    },

    rowLabel: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textPrimary,
      flex: 1,
    },

    rowDescription: {
      fontSize: TYPOGRAPHY.captionSmall,
      fontWeight: TYPOGRAPHY.regular,
      color: c.textTertiary,
      marginTop: 2,
    },

    rowValue: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.regular,
      color: c.textSecondary,
    },

    destructiveText: {
      color: c.error,
    },

    rowSeparator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.separator,
      marginLeft: SPACING.md,
    },
  });
}
