import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, H1, H2, Body, Caption, Card, Divider } from '@massapp/ui';
import { useLocalStorage } from '@massapp/hooks';
import type { NisaInput, IdecoInput, Occupation } from '../types';
import {
  calcNisaResult,
  calcIdecoResult,
  NISA_TSUMITATE_ANNUAL_LIMIT,
  NISA_SEICHOU_ANNUAL_LIMIT,
  IDECO_LIMITS,
  OCCUPATIONS,
} from '../types';

type Tab = 'nisa' | 'ideco';

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

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.resultRow}>
      <Body color={colors.textSecondary}>{label}</Body>
      <Body style={highlight ? { fontWeight: 'bold', color: colors.primary } : {}}>{value}</Body>
    </View>
  );
}

function NisaCalculator() {
  const { colors, spacing } = useTheme();
  const [isPremium] = useLocalStorage('firecalc_is_premium', false);
  const [form, setForm] = useState({
    monthlyAmount: '3',
    lumpSumAmount: '0',
    annualReturnRate: '5',
    years: '20',
  });

  const set = (key: keyof typeof form) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const parsedInput: NisaInput = useMemo(() => ({
    monthlyAmount: parseFloat(form.monthlyAmount) || 0,
    lumpSumAmount: parseFloat(form.lumpSumAmount) || 0,
    annualReturnRate: parseFloat(form.annualReturnRate) || 0,
    years: parseInt(form.years, 10) || 0,
  }), [form]);

  const result = useMemo(() => {
    if (parsedInput.years <= 0 || parsedInput.annualReturnRate <= 0) return null;
    return calcNisaResult(parsedInput);
  }, [parsedInput]);

  const monthlyLimit = NISA_TSUMITATE_ANNUAL_LIMIT / 12;

  return (
    <View>
      <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
        <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
          <Ionicons name="trending-up-outline" size={18} color={colors.primary} />
          <H2 style={{ fontSize: 15, marginLeft: 6 }}>新NISA シミュレーター</H2>
        </View>

        <NumberInput
          label={`積立投資枠（月額・上限${monthlyLimit}万円）`}
          value={form.monthlyAmount}
          onChangeText={set('monthlyAmount')}
          suffix="万円/月"
          hint={`年間上限 ${NISA_TSUMITATE_ANNUAL_LIMIT}万円`}
        />
        <NumberInput
          label={`成長投資枠（年額・上限${NISA_SEICHOU_ANNUAL_LIMIT}万円）`}
          value={form.lumpSumAmount}
          onChangeText={set('lumpSumAmount')}
          suffix="万円/年"
        />
        <NumberInput label="想定年利回り" value={form.annualReturnRate} onChangeText={set('annualReturnRate')} suffix="%" />
        <NumberInput label="投資期間" value={form.years} onChangeText={set('years')} suffix="年" />
      </Card>

      {result && (
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
          <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
            <Ionicons name="bar-chart-outline" size={18} color={colors.primary} />
            <H2 style={{ fontSize: 15, marginLeft: 6 }}>計算結果</H2>
          </View>

          <ResultRow label="総投資額" value={`${result.totalInvestment.toLocaleString()}万円`} />
          <Divider style={{ marginVertical: 8 }} />
          <ResultRow
            label="通常課税時の最終資産"
            value={`${result.taxableResult.toLocaleString()}万円`}
          />
          <ResultRow
            label="NISA非課税の最終資産"
            value={`${result.nonTaxableResult.toLocaleString()}万円`}
          />
          <Divider style={{ marginVertical: 8 }} />
          <ResultRow
            label="非課税メリット（節税効果）"
            value={`+${result.taxSaving.toLocaleString()}万円`}
            highlight
          />

          <View style={[styles.taxNote, { backgroundColor: colors.primary + '10', borderRadius: 8, marginTop: spacing.sm }]}>
            <Caption color={colors.textSecondary} style={{ lineHeight: 18 }}>
              ※ 非課税期間は無期限。年間非課税枠 積立120万+成長360万=480万円。
              生涯非課税枠は1,800万円（うち成長投資枠1,200万円）
            </Caption>
          </View>
        </Card>
      )}
    </View>
  );
}

function IdecoCalculator() {
  const { colors, spacing, radius } = useTheme();
  const [occupation, setOccupation] = useState<Occupation>('会社員（企業年金なし）');
  const [form, setForm] = useState({
    monthlyContribution: '23000',
    annualIncome: '500',
    years: '30',
  });

  const set = (key: keyof typeof form) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const limit = IDECO_LIMITS[occupation];

  const parsedInput: IdecoInput = useMemo(() => ({
    occupation,
    monthlyContribution: Math.min(parseInt(form.monthlyContribution, 10) || 0, limit),
    annualIncome: parseInt(form.annualIncome, 10) || 0,
    years: parseInt(form.years, 10) || 0,
  }), [form, occupation, limit]);

  const result = useMemo(() => {
    if (parsedInput.years <= 0 || parsedInput.monthlyContribution <= 0) return null;
    return calcIdecoResult(parsedInput);
  }, [parsedInput]);

  return (
    <View>
      <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
        <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
          <H2 style={{ fontSize: 15, marginLeft: 6 }}>iDeCo 節税計算機</H2>
        </View>

        {/* 職業選択 */}
        <Caption color={colors.textSecondary} style={{ marginBottom: 8 }}>職業・加入区分</Caption>
        <View style={styles.occupationGrid}>
          {OCCUPATIONS.map((occ) => (
            <TouchableOpacity
              key={occ}
              onPress={() => {
                setOccupation(occ);
                setForm((f) => ({ ...f, monthlyContribution: String(IDECO_LIMITS[occ]) }));
              }}
              style={[
                styles.occupationChip,
                {
                  backgroundColor: occupation === occ ? colors.primary : colors.background,
                  borderColor: occupation === occ ? colors.primary : colors.border,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Caption
                color={occupation === occ ? colors.textOnPrimary : colors.textSecondary}
                style={{ fontSize: 11, textAlign: 'center' }}
              >
                {occ}
              </Caption>
            </TouchableOpacity>
          ))}
        </View>
        <Caption color={colors.textMuted} style={{ marginTop: 6, marginBottom: 14 }}>
          掛け金上限: 月{limit.toLocaleString()}円
        </Caption>

        <NumberInput
          label="月額掛け金"
          value={form.monthlyContribution}
          onChangeText={set('monthlyContribution')}
          suffix="円/月"
          hint={`上限 ${limit.toLocaleString()}円/月`}
        />
        <NumberInput label="年収" value={form.annualIncome} onChangeText={set('annualIncome')} suffix="万円" hint="所得税率の推定に使用します" />
        <NumberInput label="掛け金拠出期間" value={form.years} onChangeText={set('years')} suffix="年" />
      </Card>

      {result && (
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
          <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
            <Ionicons name="wallet-outline" size={18} color={colors.primary} />
            <H2 style={{ fontSize: 15, marginLeft: 6 }}>節税効果</H2>
          </View>

          <ResultRow
            label="年間掛け金"
            value={`${(parsedInput.monthlyContribution * 12).toLocaleString()}円`}
          />
          <Divider style={{ marginVertical: 8 }} />
          <ResultRow
            label="年間節税額（所得税＋住民税）"
            value={`${result.annualTaxSaving.toLocaleString()}円/年`}
          />
          <ResultRow
            label={`${parsedInput.years}年間の累計節税額`}
            value={`${result.totalTaxSaving.toLocaleString()}円`}
            highlight
          />
          <ResultRow
            label="累計掛け金"
            value={`${result.totalContribution.toLocaleString()}円`}
          />

          <View style={[styles.taxNote, { backgroundColor: colors.primary + '10', borderRadius: 8, marginTop: spacing.sm }]}>
            <Caption color={colors.textSecondary} style={{ lineHeight: 18 }}>
              ※ 所得税・住民税の節税効果のみ表示。受取時の課税は考慮していません。
              実際の節税額は確定申告・年末調整で確定します。
            </Caption>
          </View>
        </Card>
      )}
    </View>
  );
}

export function CalculatorsScreen() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('nisa');

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={{ padding: spacing.md, paddingBottom: 0 }}>
        <H1 style={{ fontSize: 24, marginBottom: spacing.md }}>計算機</H1>

        {/* タブ */}
        <View style={[styles.tabBar, { backgroundColor: colors.surface, borderRadius: radius.md, marginBottom: spacing.md }]}>
          {([['nisa', '新NISA', 'trending-up-outline'], ['ideco', 'iDeCo', 'shield-checkmark-outline']] as const).map(([key, label, icon]) => (
            <TouchableOpacity
              key={key}
              onPress={() => setTab(key)}
              style={[
                styles.tabItem,
                {
                  backgroundColor: tab === key ? colors.primary : 'transparent',
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Ionicons
                name={icon as any}
                size={16}
                color={tab === key ? colors.textOnPrimary : colors.textSecondary}
              />
              <Body
                style={{
                  marginLeft: 6,
                  fontSize: 14,
                  fontWeight: tab === key ? '600' : 'normal',
                  color: tab === key ? colors.textOnPrimary : colors.textSecondary,
                }}
              >
                {label}
              </Body>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingTop: 0, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {tab === 'nisa' ? <NisaCalculator /> : <IdecoCalculator />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  taxNote: {
    padding: 10,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  occupationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  occupationChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
  },
});
