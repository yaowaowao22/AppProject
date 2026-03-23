import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, H1, H2, Body, Caption, Card, Badge } from '@massapp/ui';
import { useLocalStorage } from '@massapp/hooks';
import type { FireInput, FireScenario } from '../types';
import { calcFireResult } from '../types';

const SCENARIOS: Pick<FireScenario, 'type' | 'returnRateDelta'>[] = [
  { type: '楽観', returnRateDelta: 2 },
  { type: '中立', returnRateDelta: 0 },
  { type: '悲観', returnRateDelta: -2 },
];

const defaultInput: FireInput = {
  currentAge: 30,
  currentAssets: 300,
  monthlyInvestment: 10,
  annualReturnRate: 5,
  annualExpenses: 300,
};

function NumberInput({
  label,
  value,
  onChangeText,
  suffix,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  suffix?: string;
  hint?: string;
}) {
  const { colors, radius } = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      <Caption color={colors.textSecondary} style={{ marginBottom: 6 }}>{label}</Caption>
      <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.sm }]}>
        <TextInput
          style={[styles.input, { color: colors.text, flex: 1 }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholderTextColor={colors.textMuted}
        />
        {suffix && <Caption color={colors.textMuted} style={{ marginRight: 12 }}>{suffix}</Caption>}
      </View>
      {hint && <Caption color={colors.textMuted} style={{ marginTop: 3 }}>{hint}</Caption>}
    </View>
  );
}

export function SimulatorScreen() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [isPremium] = useLocalStorage('firecalc_is_premium', false);

  const [input, setInput] = useState({
    currentAge: String(defaultInput.currentAge),
    currentAssets: String(defaultInput.currentAssets),
    monthlyInvestment: String(defaultInput.monthlyInvestment),
    annualReturnRate: String(defaultInput.annualReturnRate),
    annualExpenses: String(defaultInput.annualExpenses),
  });

  const parsedInput: FireInput = useMemo(() => ({
    currentAge: parseInt(input.currentAge, 10) || 0,
    currentAssets: parseFloat(input.currentAssets) || 0,
    monthlyInvestment: parseFloat(input.monthlyInvestment) || 0,
    annualReturnRate: parseFloat(input.annualReturnRate) || 0,
    annualExpenses: parseFloat(input.annualExpenses) || 0,
  }), [input]);

  const scenarios: FireScenario[] = useMemo(() => {
    return SCENARIOS.map((s) => ({
      ...s,
      result: calcFireResult({
        ...parsedInput,
        annualReturnRate: Math.max(0.1, parsedInput.annualReturnRate + s.returnRateDelta),
      }),
    }));
  }, [parsedInput]);

  const mainResult = scenarios.find((s) => s.type === '中立')?.result;

  const set = (key: keyof typeof input) => (v: string) =>
    setInput((prev) => ({ ...prev, [key]: v }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <H1 style={{ fontSize: 24, marginBottom: spacing.md }}>FIREシミュレーター</H1>

        {/* 結果カード（中立シナリオ） */}
        {mainResult ? (
          <Card style={[styles.resultCard, { backgroundColor: colors.primary, marginBottom: spacing.md }]}>
            <Caption color={colors.textOnPrimary} style={{ opacity: 0.8 }}>FIRE達成年齢（中立シナリオ）</Caption>
            <H1 style={[styles.bigAge, { color: colors.textOnPrimary }]}>
              {mainResult.fireAge}歳
            </H1>
            <Caption color={colors.textOnPrimary} style={{ opacity: 0.8 }}>
              今から{mainResult.yearsToFire}年後
            </Caption>
            <View style={[styles.targetRow, { marginTop: spacing.sm }]}>
              <Caption color={colors.textOnPrimary} style={{ opacity: 0.7 }}>目標資産（4%ルール）</Caption>
              <Caption color={colors.textOnPrimary} style={{ opacity: 0.9, fontWeight: '600' }}>
                {mainResult.targetAssets.toLocaleString()}万円
              </Caption>
            </View>
          </Card>
        ) : (
          <Card style={[styles.resultCard, { backgroundColor: colors.surface, marginBottom: spacing.md }]}>
            <Body color={colors.textMuted} style={{ textAlign: 'center' }}>
              数値を入力するとFIRE達成年齢が計算されます
            </Body>
          </Card>
        )}

        {/* 入力フォーム */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
          <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <H2 style={{ fontSize: 15, marginLeft: 6 }}>入力条件</H2>
          </View>

          <NumberInput label="現在の年齢" value={input.currentAge} onChangeText={set('currentAge')} suffix="歳" />
          <NumberInput
            label="現在の資産"
            value={input.currentAssets}
            onChangeText={set('currentAssets')}
            suffix="万円"
            hint="株・投資信託・預貯金の合計"
          />
          <NumberInput
            label="月々の積立額"
            value={input.monthlyInvestment}
            onChangeText={set('monthlyInvestment')}
            suffix="万円/月"
          />
          <NumberInput
            label="想定年利回り（中立）"
            value={input.annualReturnRate}
            onChangeText={set('annualReturnRate')}
            suffix="%"
            hint="楽観+2% / 悲観-2% で自動計算"
          />
          <NumberInput
            label="FIRE後の年間生活費"
            value={input.annualExpenses}
            onChangeText={set('annualExpenses')}
            suffix="万円/年"
            hint="この金額 × 25 が目標資産額（4%ルール）"
          />
        </Card>

        {/* 3シナリオ比較 */}
        <H2 style={{ fontSize: 16, marginBottom: spacing.sm }}>シナリオ比較</H2>
        {scenarios.map((s) => {
          const isMain = s.type === '中立';
          const color = s.type === '楽観' ? colors.success : s.type === '中立' ? colors.primary : colors.error;
          return (
            <Card
              key={s.type}
              style={[
                styles.scenarioCard,
                { marginBottom: spacing.sm, borderLeftWidth: isMain ? 3 : 0, borderLeftColor: colors.primary },
              ]}
            >
              <View style={styles.scenarioHeader}>
                <View style={[styles.scenarioBadge, { backgroundColor: color + '15', borderRadius: radius.sm }]}>
                  <Caption color={color} style={{ fontWeight: '600' }}>{s.type}</Caption>
                  <Caption color={color} style={{ fontSize: 10, marginLeft: 4 }}>
                    {s.returnRateDelta > 0 ? `+${s.returnRateDelta}%` : s.returnRateDelta === 0 ? '±0%' : `${s.returnRateDelta}%`}
                  </Caption>
                </View>
                <Caption color={colors.textMuted}>
                  利回り {(parsedInput.annualReturnRate + s.returnRateDelta).toFixed(1)}%
                </Caption>
              </View>
              {s.result ? (
                <View style={[styles.scenarioResult, { marginTop: spacing.xs }]}>
                  <View style={{ flex: 1 }}>
                    <H2 style={{ fontSize: 22, color }}>{s.result.fireAge}歳</H2>
                    <Caption color={colors.textMuted}>{s.result.yearsToFire}年後</Caption>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Body color={colors.textSecondary} style={{ fontSize: 13 }}>目標</Body>
                    <Body style={{ fontWeight: '600' }}>{s.result.targetAssets.toLocaleString()}万円</Body>
                  </View>
                </View>
              ) : (
                <Caption color={colors.textMuted} style={{ marginTop: spacing.xs }}>
                  60年以内にFIRE達成困難（条件を見直してください）
                </Caption>
              )}
            </Card>
          );
        })}

        {!isPremium && (
          <Card style={[styles.premiumBanner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30', borderWidth: 1 }]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
            <Caption color={colors.primary} style={{ marginLeft: 8, flex: 1 }}>
              プレミアムでシナリオ保存・NISA/iDeCo計算が使えます — ¥730
            </Caption>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  resultCard: {
    padding: 20,
    borderRadius: 16,
  },
  bigAge: {
    fontSize: 52,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 4,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  scenarioCard: {
    padding: 12,
  },
  scenarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scenarioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scenarioResult: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
});
