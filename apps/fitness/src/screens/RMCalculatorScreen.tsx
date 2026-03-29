import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RADIUS, SPACING, TYPOGRAPHY } from '../theme';
import type { TanrenThemeColors } from '../theme';
import { useTheme } from '../ThemeContext';
import { ScreenHeader } from '../components/ScreenHeader';

// ── RM計算ロジック ────────────────────────────────────────────────────────────

function calc1RM(weight: number, reps: number) {
  if (reps <= 1) return { epley: weight, brzycki: weight, lander: weight, avg: weight };
  const epley   = weight * (1 + reps / 30);
  const brzycki = weight * 36 / (37 - reps);
  const lander  = (100 * weight) / (101.3 - 2.67123 * reps);
  const avg     = (epley + brzycki + lander) / 3;
  return { epley, brzycki, lander, avg };
}

// 簡易線形近似: nRM = 1RM × (1 - 0.025 × (n - 1))
function calcNRM(oneRM: number, n: number) {
  return oneRM * (1 - 0.025 * (n - 1));
}

const fmt = (v: number) => v.toFixed(1);

// ── 定数 ──────────────────────────────────────────────────────────────────────

const MIN_WEIGHT = 0;
const MAX_WEIGHT = 500;
const WEIGHT_STEP = 2.5;
const MIN_REPS = 1;
const MAX_REPS = 30;

// ── コンポーネント ────────────────────────────────────────────────────────────

export default function RMCalculatorScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [weight, setWeight] = useState(60);
  const [reps,   setReps]   = useState(5);

  const { epley, brzycki, lander, avg } = useMemo(
    () => calc1RM(weight, reps),
    [weight, reps],
  );

  const rmRows = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => {
      const n = i + 1;
      return {
        n,
        epleyN:   calcNRM(epley,   n),
        brzyckiN: calcNRM(brzycki, n),
        landerN:  calcNRM(lander,  n),
        avgN:     calcNRM(avg,     n),
      };
    }),
    [epley, brzycki, lander, avg],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScreenHeader title="RM計算" showHamburger />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── 推定1RM ヒーロー ─────────────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>推定1RM</Text>
          <View style={styles.heroValueRow}>
            <Text style={styles.heroValue}>{fmt(avg)}</Text>
            <Text style={styles.heroUnit}>kg</Text>
          </View>
          <Text style={styles.heroNote}>Epley / Brzycki / Lander 平均</Text>
        </View>

        {/* ── 入力カード ───────────────────────────────────────────────────── */}
        <View style={styles.inputCard}>

          {/* 重量 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>重量 (KG)</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setWeight(w => Math.max(MIN_WEIGHT, +(w - WEIGHT_STEP).toFixed(1)))}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="重量を2.5kg減らす"
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.stepDisplay} accessibilityRole="adjustable" accessibilityLabel={`重量 ${weight}キログラム`}>
                <Text style={styles.stepNumber}>{weight}</Text>
                <Text style={styles.stepUnit}>kg</Text>
              </View>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setWeight(w => Math.min(MAX_WEIGHT, +(w + WEIGHT_STEP).toFixed(1)))}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="重量を2.5kg増やす"
              >
                <Text style={styles.stepBtnText}>＋</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* レップ数 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>レップ数</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setReps(r => Math.max(MIN_REPS, r - 1))}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="レップ数を1減らす"
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.stepDisplay} accessibilityRole="adjustable" accessibilityLabel={`レップ数 ${reps}`}>
                <Text style={styles.stepNumber}>{reps}</Text>
                <Text style={styles.stepUnit}>rep</Text>
              </View>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setReps(r => Math.min(MAX_REPS, r + 1))}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="レップ数を1増やす"
              >
                <Text style={styles.stepBtnText}>＋</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── セクションラベル ─────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>推定RM</Text>

        {/* ── RMテーブル ───────────────────────────────────────────────────── */}
        <View style={styles.table}>

          {/* ヘッダー行 */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cellHead, styles.colRM]}>RM</Text>
            <Text style={[styles.cellHead, styles.colVal]}>Epley</Text>
            <Text style={[styles.cellHead, styles.colVal]}>Brzycki</Text>
            <Text style={[styles.cellHead, styles.colVal]}>Lander</Text>
            <Text style={[styles.cellHead, styles.colAvg]}>平均</Text>
          </View>

          {/* データ行 */}
          {rmRows.map(({ n, epleyN, brzyckiN, landerN, avgN }) => {
            const is1RM = n === 1;
            return (
              <View key={n} style={[styles.tableRow, is1RM && styles.row1RM]}>
                <Text style={[styles.cellRM, styles.colRM, is1RM && styles.cell1RM]}>
                  {n}RM
                </Text>
                <Text style={[styles.cellVal, styles.colVal, is1RM && styles.cell1RM]}>
                  {fmt(epleyN)}
                </Text>
                <Text style={[styles.cellVal, styles.colVal, is1RM && styles.cell1RM]}>
                  {fmt(brzyckiN)}
                </Text>
                <Text style={[styles.cellVal, styles.colVal, is1RM && styles.cell1RM]}>
                  {fmt(landerN)}
                </Text>
                <Text style={[styles.cellAvg, styles.colAvg, is1RM && styles.cell1RM]}>
                  {fmt(avgN)}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: SPACING.xl }} />
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
      paddingTop: SPACING.lg,
    },

    // ─ ヒーローカード ─
    heroCard: {
      marginHorizontal: SPACING.contentMargin,
      marginBottom: SPACING.lg,
      backgroundColor: c.surface1,
      borderRadius: RADIUS.card,
      paddingVertical: SPACING.lg,
      alignItems: 'center',
    },
    heroLabel: {
      fontSize: TYPOGRAPHY.caption,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textTertiary,
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      marginBottom: SPACING.xs,
    },
    heroValueRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    heroValue: {
      fontSize: TYPOGRAPHY.heroNumber,
      fontWeight: TYPOGRAPHY.heavy,
      color: c.accent,          // アクセント: 推定1RM数値のみ
      letterSpacing: -2,
      lineHeight: TYPOGRAPHY.heroNumber * 1.05,
    },
    heroUnit: {
      fontSize: TYPOGRAPHY.exerciseName,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textSecondary,
      marginLeft: SPACING.xs,
      marginBottom: 6,
    },
    heroNote: {
      marginTop: SPACING.xs,
      fontSize: TYPOGRAPHY.captionSmall,
      fontWeight: TYPOGRAPHY.regular,
      color: c.textTertiary,
    },

    // ─ 入力カード ─
    inputCard: {
      marginHorizontal: SPACING.contentMargin,
      backgroundColor: c.surface1,
      borderRadius: RADIUS.card,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      marginBottom: SPACING.md,
    },
    inputGroup: {
      paddingVertical: SPACING.sm,
    },
    inputLabel: {
      fontSize: TYPOGRAPHY.caption,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textTertiary,
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      marginBottom: SPACING.sm,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    stepBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepBtnText: {
      fontSize: TYPOGRAPHY.exerciseName,
      fontWeight: TYPOGRAPHY.bold,
      color: c.textPrimary,
      lineHeight: TYPOGRAPHY.exerciseName * 1.2,
    },
    stepDisplay: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingBottom: 2,
    },
    stepNumber: {
      fontSize: 40,
      fontWeight: TYPOGRAPHY.heavy,
      color: c.textPrimary,
      letterSpacing: -1,
      lineHeight: 44,
    },
    stepUnit: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: TYPOGRAPHY.regular,
      color: c.textSecondary,
      marginLeft: SPACING.xs,
      marginBottom: 4,
    },
    divider: {
      height: 1,
      backgroundColor: c.separator,
      marginVertical: SPACING.xs,
    },

    // ─ セクションラベル ─
    sectionLabel: {
      fontSize: 11,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textTertiary,
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      marginHorizontal: SPACING.contentMargin,
      marginTop: SPACING.md,
      marginBottom: 10,
    },

    // ─ テーブル ─
    table: {
      marginHorizontal: SPACING.contentMargin,
      backgroundColor: c.surface1,
      borderRadius: RADIUS.card,
      overflow: 'hidden',
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
      borderBottomWidth: 1,
      borderBottomColor: c.separator,
      paddingHorizontal: SPACING.md,
    },
    tableHeader: {
      height: 40,
      backgroundColor: c.surface2,
    },
    row1RM: {
      // 1RM行は区切り線を少し強調
      borderBottomColor: c.separator,
    },

    // 列サイズ
    colRM: {
      flex: 0.7,
    },
    colVal: {
      flex: 1,
      textAlign: 'right',
    },
    colAvg: {
      flex: 1,
      textAlign: 'right',
    },

    // ヘッダーセル
    cellHead: {
      fontSize: TYPOGRAPHY.captionSmall,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textTertiary,
      textTransform: 'uppercase',
    },

    // データセル
    cellRM: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textPrimary,
    },
    cellVal: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.regular,
      color: c.textSecondary,
    },
    cellAvg: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textSecondary,
    },

    // 1RM行ハイライト（全列 textPrimary）
    cell1RM: {
      color: c.textPrimary,
    },
  });
}
