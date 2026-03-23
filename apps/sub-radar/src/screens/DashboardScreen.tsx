import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, H1, H2, Body, Caption, Card, Badge } from '@massapp/ui';
import { useLocalStorage } from '@massapp/hooks';
import type { Subscription } from '../types';
import { toJPY, daysUntilBilling, isUnused, CURRENCY_SYMBOLS } from '../types';

export function DashboardScreen() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [subscriptions] = useLocalStorage<Subscription[]>('subradar_subscriptions', []);

  const stats = useMemo(() => {
    const monthlyJPY = subscriptions.reduce(
      (sum, s) => sum + toJPY(s.amount, s.currency),
      0
    );
    const annualJPY = monthlyJPY * 12;

    const upcoming = [...subscriptions]
      .map((s) => ({ ...s, daysLeft: daysUntilBilling(s.billingDay) }))
      .filter((s) => s.daysLeft <= 30)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    const unused = subscriptions.filter((s) => isUnused(s.lastTappedAt));

    return { monthlyJPY, annualJPY, upcoming, unused };
  }, [subscriptions]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <H1 style={{ fontSize: 24, marginBottom: spacing.md }}>ダッシュボード</H1>

        {/* 月額合計 */}
        <Card style={[styles.summaryCard, { backgroundColor: colors.primary, marginBottom: spacing.md }]}>
          <Caption color={colors.textOnPrimary} style={{ opacity: 0.8 }}>月額合計</Caption>
          <H1 style={[styles.bigAmount, { color: colors.textOnPrimary }]}>
            ¥{stats.monthlyJPY.toLocaleString()}
          </H1>
          <View style={styles.annualRow}>
            <Caption color={colors.textOnPrimary} style={{ opacity: 0.7 }}>年間合計</Caption>
            <Caption color={colors.textOnPrimary} style={{ opacity: 0.9, fontWeight: '600' }}>
              ¥{stats.annualJPY.toLocaleString()}
            </Caption>
          </View>
          <Caption color={colors.textOnPrimary} style={{ opacity: 0.6, marginTop: spacing.xs }}>
            {subscriptions.length}件のサブスク
          </Caption>
        </Card>

        {/* 未使用サービス警告 */}
        {stats.unused.length > 0 && (
          <Card style={[styles.warningCard, { backgroundColor: colors.warning + '18', borderColor: colors.warning + '40', marginBottom: spacing.md, borderWidth: 1 }]}>
            <View style={styles.warningHeader}>
              <Ionicons name="warning-outline" size={20} color={colors.warning} />
              <H2 style={{ fontSize: 15, marginLeft: 8, color: colors.warning }}>
                未使用のサービス ({stats.unused.length}件)
              </H2>
            </View>
            <Caption color={colors.textSecondary} style={{ marginTop: spacing.xs, lineHeight: 18 }}>
              30日以上使っていないサービスがあります。解約を検討してみましょう。
            </Caption>
            {stats.unused.map((s) => (
              <View key={s.id} style={[styles.unusedItem, { marginTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: spacing.sm }]}>
                <View style={styles.unusedRow}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.warning} />
                  <Body style={{ marginLeft: 6, flex: 1 }}>{s.name}</Body>
                  <Caption color={colors.textMuted}>
                    ¥{toJPY(s.amount, s.currency).toLocaleString()}/月
                  </Caption>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* 次回請求リスト */}
        <H2 style={{ fontSize: 16, marginBottom: spacing.sm }}>直近の請求</H2>
        {stats.upcoming.length === 0 ? (
          <Card style={{ padding: spacing.md }}>
            <Body color={colors.textMuted} style={{ textAlign: 'center' }}>
              直近30日以内の請求はありません
            </Body>
          </Card>
        ) : (
          stats.upcoming.map((s) => (
            <Card key={s.id} style={[styles.upcomingCard, { marginBottom: spacing.sm }]}>
              <View style={styles.upcomingRow}>
                <View style={[styles.daysCircle, {
                  backgroundColor: s.daysLeft <= 3
                    ? colors.error + '15'
                    : s.daysLeft <= 7
                    ? colors.warning + '15'
                    : colors.primary + '15',
                  borderRadius: radius.full,
                }]}>
                  <Body style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: s.daysLeft <= 3 ? colors.error : s.daysLeft <= 7 ? colors.warning : colors.primary,
                  }}>
                    {s.daysLeft}
                  </Body>
                  <Caption style={{
                    fontSize: 9,
                    color: s.daysLeft <= 3 ? colors.error : s.daysLeft <= 7 ? colors.warning : colors.primary,
                  }}>日後</Caption>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <H2 style={{ fontSize: 15 }}>{s.name}</H2>
                  <Caption color={colors.textMuted}>{s.category} · 毎月{s.billingDay}日</Caption>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Body style={{ fontWeight: '600' }}>
                    {CURRENCY_SYMBOLS[s.currency]}{s.amount.toLocaleString()}
                  </Body>
                  {s.currency !== 'JPY' && (
                    <Caption color={colors.textMuted}>
                      ≈¥{toJPY(s.amount, s.currency).toLocaleString()}
                    </Caption>
                  )}
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
  },
  bigAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 8,
  },
  annualRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  warningCard: {
    padding: 14,
    borderRadius: 12,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unusedItem: {},
  unusedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingCard: {
    padding: 12,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysCircle: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
