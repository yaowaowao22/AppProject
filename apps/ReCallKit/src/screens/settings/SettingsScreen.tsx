import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDB } from '../../hooks/useDatabase';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import { exportAllDataAsJSON } from '../../services/exportService';

// ============================================================
// 設定画面
// ============================================================
export function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const db = useDB();

  const [reviewTime, setReviewTime] = useState('08:00');
  const [dailyCount, setDailyCount] = useState('5');
  const [isExporting, setIsExporting] = useState(false);

  // DB から設定を読み込む
  useEffect(() => {
    (async () => {
      const rows = await db.getAllAsync<{ key: string; value: string }>(
        `SELECT key, value FROM app_settings WHERE key IN ('review_time', 'daily_review_count')`
      );
      for (const row of rows) {
        if (row.key === 'review_time') setReviewTime(row.value);
        if (row.key === 'daily_review_count') setDailyCount(row.value);
      }
    })();
  }, [db]);

  // 設定を保存するヘルパー
  const saveSetting = useCallback(
    async (key: string, value: string) => {
      await db.runAsync(
        `INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`,
        [key, value]
      );
    },
    [db]
  );

  // 1日の復習数をサイクル変更 (5→10→20→5)
  const cycleDailyCount = useCallback(async () => {
    const next = dailyCount === '5' ? '10' : dailyCount === '10' ? '20' : '5';
    setDailyCount(next);
    await saveSetting('daily_review_count', next);
  }, [dailyCount, saveSetting]);

  // JSONエクスポート
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportAllDataAsJSON(db);
    } catch (err) {
      Alert.alert(
        'エクスポート失敗',
        err instanceof Error ? err.message : '不明なエラーが発生しました',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  }, [db]);

  // データ全削除確認
  const handleDeleteAll = useCallback(() => {
    Alert.alert(
      'すべてのデータを削除',
      'アイテム・復習履歴・タグがすべて削除されます。この操作は元に戻せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            await db.execAsync(`
              DELETE FROM journals;
              DELETE FROM item_tags;
              DELETE FROM reviews;
              DELETE FROM items;
              DELETE FROM tags;
            `);
            Alert.alert('削除完了', 'すべてのデータを削除しました。');
          },
        },
      ]
    );
  }, [db]);

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundGrouped }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.m,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.m,
        }}
      >
        {/* ページタイトル */}
        <Text style={[styles.pageTitle, { color: colors.label }]}>設定</Text>

        {/* ────────── 復習設定 ────────── */}
        <SectionHeader title="復習" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card }, CardShadow]}>
          <SettingsRow
            label="復習リマインダー"
            value={reviewTime}
            colors={colors}
            onPress={() => {
              // TODO: TimePicker 実装
              Alert.alert('時刻設定', '時刻ピッカーは次フェーズで実装します。');
            }}
          />
          <Divider colors={colors} />
          <SettingsRow
            label="1日の復習数"
            value={`${dailyCount} 件`}
            colors={colors}
            onPress={cycleDailyCount}
          />
        </View>

        {/* ────────── データ ────────── */}
        <SectionHeader title="データ" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card }, CardShadow]}>
          <TouchableOpacity
            style={styles.row}
            onPress={handleExport}
            disabled={isExporting}
            accessibilityLabel="JSONでエクスポート"
            accessibilityRole="button"
          >
            <Text style={[styles.rowLabel, { color: colors.label }]}>
              JSONでエクスポート
            </Text>
            {isExporting ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={[styles.rowChevron, { color: colors.accent }]}>↑ 共有</Text>
            )}
          </TouchableOpacity>
          <Divider colors={colors} />
          <TouchableOpacity
            style={styles.row}
            onPress={handleDeleteAll}
            accessibilityLabel="すべてのデータを削除"
            accessibilityRole="button"
          >
            <Text style={[styles.rowLabel, { color: colors.error }]}>
              すべてのデータを削除
            </Text>
          </TouchableOpacity>
        </View>

        {/* ────────── アプリについて ────────── */}
        <SectionHeader title="アプリについて" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card }, CardShadow]}>
          <AboutRow label="バージョン" value="1.0.0" colors={colors} />
          <Divider colors={colors} />
          <AboutRow label="アルゴリズム" value="SM-2" colors={colors} />
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================
// サブコンポーネント
// ============================================================
interface ColorsArg {
  label: string;
  labelSecondary: string;
  separator: string;
  accent: string;
  error: string;
  card: string;
  background: string;
  backgroundGrouped: string;
  [key: string]: string;
}

function SectionHeader({ title, colors }: { title: string; colors: ColorsArg }) {
  return (
    <Text style={[styles.sectionHeader, { color: colors.labelSecondary }]}>
      {title}
    </Text>
  );
}

function Divider({ colors }: { colors: ColorsArg }) {
  return (
    <View style={[styles.divider, { backgroundColor: colors.separator }]} />
  );
}

function SettingsRow({
  label,
  value,
  colors,
  onPress,
}: {
  label: string;
  value: string;
  colors: ColorsArg;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={[styles.rowLabel, { color: colors.label }]}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={[styles.rowValue, { color: colors.labelSecondary }]}>{value}</Text>
        <Text style={[styles.rowChevron, { color: colors.labelSecondary }]}> ›</Text>
      </View>
    </TouchableOpacity>
  );
}

function AboutRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ColorsArg;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.label }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.labelSecondary }]}>{value}</Text>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageTitle: {
    ...TypeScale.largeTitle,
    marginBottom: Spacing.m,
  },
  sectionHeader: {
    ...TypeScale.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.l,
    marginBottom: Spacing.xs,
    marginHorizontal: Spacing.xs,
  },
  card: {
    borderRadius: Radius.m,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    minHeight: 44,
  },
  rowLabel: {
    ...TypeScale.body,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValue: {
    ...TypeScale.body,
  },
  rowChevron: {
    ...TypeScale.body,
    marginLeft: Spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.m,
  },
});
