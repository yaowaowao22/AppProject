import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, H2, Body, Caption } from '@massapp/ui';
import { useSubscriptions } from '../SubscriptionContext';
import type { Subscription } from '../types';
import { CATEGORY_COLORS } from '../types';
import {
  calcMonthlyAmount,
  getNextBillingDate,
  getDaysUntilBilling,
  isUnused,
  formatCurrency,
} from '../utils/subscriptionUtils';

// ── カラーパレット ─────────────────────────────────────────────────────────────
const AC = {
  bgDeep:       '#0D1117',
  bgCard:       '#161B22',
  bgElevated:   '#1C2128',
  teal:         '#26C6DA',
  tealSoft:     '#4DB6AC',
  upGreen:      '#4CAF50',
  downTeal:     '#26C6DA',
  textBright:   '#E6EDF3',
  textMid:      '#8B949E',
  textDim:      '#484F58',
  borderSubtle: '#21262D',
  borderAccent: '#30363D',
  warnOrange:   '#FF9800',
  warnBg:       '#FF980012',
  warnBorder:   '#FF980030',
};

const WEEK_DAYS = ['日', '月', '火', '水', '木', '金', '土'];

// ── Props ─────────────────────────────────────────────────────────────────────
interface DashboardVariantCProps {
  onAddPress: () => void;
  onEditPress: (s: Subscription) => void;
}

// ── カテゴリ横棒グラフ ─────────────────────────────────────────────────────────
function CategoryBarChart({
  categoryTotals,
  maxAmount,
}: {
  categoryTotals: Array<{ cat: string; amount: number }>;
  maxAmount: number;
}) {
  if (categoryTotals.length === 0) return null;
  return (
    <View style={aStyles.chartCard}>
      <Text style={aStyles.chartTitle}>カテゴリ別支出</Text>
      {categoryTotals.map(({ cat, amount }) => {
        const fillRatio = maxAmount > 0 ? amount / maxAmount : 0;
        const barColor =
          CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] ?? '#78909C';
        return (
          <View key={cat} style={aStyles.barRow}>
            <Text style={aStyles.barLabel} numberOfLines={1}>
              {cat}
            </Text>
            <View style={aStyles.barTrack}>
              <View
                style={[
                  aStyles.barFill,
                  {
                    width: `${Math.max(Math.round(fillRatio * 100), 2)}%` as any,
                    backgroundColor: barColor,
                  },
                ]}
              />
            </View>
            <Text style={aStyles.barAmount}>
              ¥{Math.round(amount).toLocaleString('ja-JP')}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── 請求スケジュールカレンダー ─────────────────────────────────────────────────
type CalendarCell = { day: number | null; subs: Array<{ color: string; name: string }> };

function BillingCalendar({
  weeks,
  today,
  monthLabel,
  monthTotal,
}: {
  weeks: CalendarCell[][];
  today: number;
  monthLabel: string;
  monthTotal: number;
}) {
  return (
    <View style={aStyles.calendarCard}>
      <View style={aStyles.calendarHeader}>
        <Text style={aStyles.calendarTitle}>{monthLabel}の請求スケジュール</Text>
        <Text style={aStyles.calendarTotalBadge}>
          ¥{Math.round(monthTotal).toLocaleString('ja-JP')}
        </Text>
      </View>

      {/* 曜日ヘッダー */}
      <View style={aStyles.weekDayRow}>
        {WEEK_DAYS.map((d) => (
          <View key={d} style={aStyles.weekDayCell}>
            <Text style={aStyles.weekDayText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* 日付グリッド */}
      <View style={aStyles.calendarGrid}>
        {weeks.map((week, wi) => (
          <View key={wi} style={aStyles.calendarWeekRow}>
            {week.map((cell, di) => {
              const isToday = cell.day === today;
              const hasBilling = cell.subs.length > 0;
              const dotsToShow = cell.subs.slice(0, 3);
              const extraCount = cell.subs.length - 3;
              return (
                <View
                  key={di}
                  style={[
                    aStyles.calendarCell,
                    isToday && aStyles.calendarCellToday,
                    hasBilling && !isToday && aStyles.calendarCellBilling,
                  ]}
                >
                  {cell.day !== null && (
                    <>
                      <Text
                        style={[
                          aStyles.calendarDayText,
                          isToday && aStyles.calendarDayTextToday,
                          hasBilling && !isToday && aStyles.calendarDayTextBilling,
                        ]}
                      >
                        {cell.day}
                      </Text>
                      {hasBilling && (
                        <View style={aStyles.calendarDotsRow}>
                          {dotsToShow.map((sub, si) => (
                            <View
                              key={si}
                              style={[aStyles.calendarDot, { backgroundColor: sub.color }]}
                            />
                          ))}
                          {extraCount > 0 && (
                            <Text style={aStyles.calendarMoreText}>+{extraCount}</Text>
                          )}
                        </View>
                      )}
                    </>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

// ── 未使用警告セクション ───────────────────────────────────────────────────────
function UnusedWarningSection({
  unusedSubs,
}: {
  unusedSubs: Subscription[];
}) {
  if (unusedSubs.length === 0) return null;

  const totalUnusedMonthly = unusedSubs.reduce(
    (sum, s) => sum + calcMonthlyAmount(s),
    0,
  );

  return (
    <View style={aStyles.unusedSection}>
      <View style={aStyles.unusedHeader}>
        <Ionicons name="warning-outline" size={16} color={AC.warnOrange} />
        <Text style={aStyles.unusedTitle}>無駄なサブスクの可能性</Text>
        <View style={aStyles.unusedCountBadge}>
          <Text style={aStyles.unusedCountText}>{unusedSubs.length}件</Text>
        </View>
      </View>

      {unusedSubs.map((sub) => {
        const monthly = calcMonthlyAmount(sub);
        const lastTapped = sub.lastTappedAt
          ? Math.floor(
              (Date.now() - new Date(sub.lastTappedAt).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : null;
        return (
          <View key={sub.id} style={aStyles.unusedItem}>
            <Ionicons
              name={(sub.iconName as any) ?? 'card-outline'}
              size={14}
              color={AC.warnOrange}
            />
            <Text style={aStyles.unusedItemName} numberOfLines={1}>
              {sub.name}
            </Text>
            <Text style={aStyles.unusedItemAmount}>
              {formatCurrency(monthly, sub.currency)}/月
            </Text>
            {lastTapped !== null && (
              <Text style={aStyles.unusedItemDays}>{lastTapped}日未使用</Text>
            )}
          </View>
        );
      })}

      <View style={aStyles.unusedTotalRow}>
        <Text style={aStyles.unusedTotalLabel}>合計削減可能額</Text>
        <Text style={aStyles.unusedTotalAmount}>
          ¥{Math.round(totalUnusedMonthly).toLocaleString('ja-JP')}/月
        </Text>
      </View>
    </View>
  );
}

// ── グリッドカードアイテム ────────────────────────────────────────────────────
function GridCard({
  item,
  onPress,
}: {
  item: Subscription;
  onPress: () => void;
}) {
  const days = getDaysUntilBilling(item);
  const monthly = calcMonthlyAmount(item);
  const daysBarColor =
    days <= 1 ? '#F44336' : days <= 3 ? '#FF9800' : AC.teal;
  const daysTextColor =
    days <= 1 ? '#F44336' : days <= 3 ? '#FF9800' : AC.textMid;
  const daysBarWidth = `${Math.min(Math.max((30 - days) / 30, 0.05), 1) * 100}%` as any;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[aStyles.gridCard, { borderLeftColor: item.color }]}
    >
      <View style={aStyles.gridIconRow}>
        <View
          style={[
            aStyles.gridIconCircle,
            { backgroundColor: item.color + '22' },
          ]}
        >
          <Ionicons
            name={(item.iconName as any) ?? 'card-outline'}
            size={16}
            color={item.color}
          />
        </View>
        <Text style={aStyles.gridServiceName} numberOfLines={1}>
          {item.name}
        </Text>
      </View>

      <Text style={aStyles.gridCategory}>{item.category}</Text>

      <Text style={aStyles.gridAmount}>
        ¥{Math.round(monthly).toLocaleString('ja-JP')}
        <Text style={aStyles.gridAmountUnit}>/月</Text>
      </Text>

      <View style={aStyles.gridDaysRow}>
        <View style={aStyles.gridDaysBar}>
          <View
            style={[
              aStyles.gridDaysBarFill,
              { width: daysBarWidth, backgroundColor: daysBarColor },
            ]}
          />
        </View>
        <Text style={[aStyles.gridDaysText, { color: daysTextColor }]}>
          {days === 0 ? '今日' : `残${days}日`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── メインコンポーネント ──────────────────────────────────────────────────────
export function DashboardVariantC({ onAddPress, onEditPress }: DashboardVariantCProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    subscriptions,
    isPremium,
    totalMonthlyJPY,
    totalYearlyJPY,
    momData,
    updateSubscription,
  } = useSubscriptions();

  const [_expandedId, setExpandedId] = useState<string | null>(null);

  const activeSubs = useMemo(
    () => subscriptions.filter((s) => s.isActive),
    [subscriptions],
  );

  const unusedSubs = useMemo(
    () => activeSubs.filter((s) => isUnused(s)),
    [activeSubs],
  );

  // カテゴリ別月額合計（降順）
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const sub of activeSubs) {
      const cat = sub.category ?? 'その他';
      totals[cat] = (totals[cat] ?? 0) + calcMonthlyAmount(sub);
    }
    return Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amount]) => ({ cat, amount }));
  }, [activeSubs]);

  const maxCategoryAmount = useMemo(
    () => Math.max(...categoryTotals.map(({ amount }) => amount), 1),
    [categoryTotals],
  );

  // カレンダーデータ
  const calendarData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthLabel = `${month + 1}月`;

    const billingMap: Record<number, Array<{ color: string; name: string }>> = {};
    for (const sub of activeSubs) {
      const day = Math.min(sub.billingDay, daysInMonth);
      if (!billingMap[day]) billingMap[day] = [];
      billingMap[day].push({ color: sub.color, name: sub.name });
    }

    const weeks: CalendarCell[][] = [];
    let dayPtr = 1 - firstDow;

    for (let w = 0; w < 6; w++) {
      const week: CalendarCell[] = [];
      for (let d = 0; d < 7; d++) {
        const day = dayPtr;
        if (day >= 1 && day <= daysInMonth) {
          week.push({ day, subs: billingMap[day] ?? [] });
        } else {
          week.push({ day: null, subs: [] });
        }
        dayPtr++;
      }
      if (week.some((c) => c.day !== null)) {
        weeks.push(week);
      }
    }

    return { weeks, today, monthLabel };
  }, [activeSubs]);

  const handleCardPress = useCallback(
    (sub: Subscription) => {
      updateSubscription(sub.id, { lastTappedAt: new Date().toISOString() });
      setExpandedId((prev) => (prev === sub.id ? null : sub.id));
      onEditPress(sub);
    },
    [updateSubscription, onEditPress],
  );

  // グリッドを2列ペアに変換
  const gridRows = useMemo(() => {
    const rows: Array<[Subscription, Subscription | null]> = [];
    for (let i = 0; i < activeSubs.length; i += 2) {
      rows.push([activeSubs[i], activeSubs[i + 1] ?? null]);
    }
    return rows;
  }, [activeSubs]);

  return (
    <View style={[aStyles.container, { backgroundColor: AC.bgDeep }]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 100 + insets.bottom,
          paddingTop: insets.top + 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section A: アナリティクスヘッダー ── */}
        <View style={aStyles.analyticsHeader}>
          <View style={aStyles.headerTopRow}>
            <View>
              <Text style={aStyles.headerTitle}>ダッシュボード</Text>
              <Text style={aStyles.headerSubtitle}>
                {activeSubs.length}件のサブスク
                {isPremium ? '  [プレミアム]' : '  [無料版]'}
              </Text>
            </View>
            {/* 前月比バッジ */}
            {momData === null ? (
              <View style={[aStyles.momBadge, aStyles.momBadgeNeutral]}>
                <Ionicons name="remove-outline" size={12} color={AC.textMid} />
                <Text style={[aStyles.momText, { color: AC.textMid }]}>前月比 -</Text>
              </View>
            ) : momData.direction === 'up' ? (
              <View style={[aStyles.momBadge, aStyles.momBadgeUp]}>
                <Ionicons name="trending-up-outline" size={12} color="#F44336" />
                <Text style={[aStyles.momText, { color: '#F44336' }]}>前月比 +{momData.pct}%</Text>
              </View>
            ) : momData.direction === 'down' ? (
              <View style={[aStyles.momBadge, aStyles.momBadgeDown]}>
                <Ionicons name="trending-down-outline" size={12} color={AC.downTeal} />
                <Text style={[aStyles.momText, { color: AC.downTeal }]}>前月比 -{momData.pct}%</Text>
              </View>
            ) : (
              <View style={[aStyles.momBadge, aStyles.momBadgeNeutral]}>
                <Ionicons name="remove-outline" size={12} color={AC.textMid} />
                <Text style={[aStyles.momText, { color: AC.textMid }]}>前月比 ±0%</Text>
              </View>
            )}
          </View>

          <Text style={aStyles.mainAmount}>
            ¥{Math.round(totalMonthlyJPY).toLocaleString('ja-JP')}
          </Text>
          <Text style={aStyles.yearlyAmount}>
            年間換算 ¥{Math.round(totalYearlyJPY).toLocaleString('ja-JP')}
          </Text>

          {/* 3軸KPI */}
          <View style={aStyles.kpiRow}>
            <View style={aStyles.kpiItem}>
              <Text style={aStyles.kpiValue}>
                ¥{Math.round(totalMonthlyJPY).toLocaleString('ja-JP')}
              </Text>
              <Text style={aStyles.kpiLabel}>月額</Text>
            </View>
            <View style={aStyles.kpiDivider} />
            <View style={aStyles.kpiItem}>
              <Text style={aStyles.kpiValue}>
                ¥{Math.round(totalYearlyJPY).toLocaleString('ja-JP')}
              </Text>
              <Text style={aStyles.kpiLabel}>年間</Text>
            </View>
            <View style={aStyles.kpiDivider} />
            <View style={aStyles.kpiItem}>
              <Text style={aStyles.kpiValue}>{activeSubs.length}件</Text>
              <Text style={aStyles.kpiLabel}>件数</Text>
            </View>
          </View>
        </View>

        {/* ── Section B: カテゴリ別横棒グラフ ── */}
        <CategoryBarChart
          categoryTotals={categoryTotals}
          maxAmount={maxCategoryAmount}
        />

        {/* ── Section C: 請求スケジュールカレンダー ── */}
        <BillingCalendar
          weeks={calendarData.weeks}
          today={calendarData.today}
          monthLabel={calendarData.monthLabel}
          monthTotal={totalMonthlyJPY}
        />

        {/* ── Section D: 未使用サブスク警告 ── */}
        <UnusedWarningSection unusedSubs={unusedSubs} />

        {/* ── Section E: 2カラムグリッドリスト ── */}
        {activeSubs.length > 0 ? (
          <>
            <Text style={aStyles.gridSectionTitle}>すべてのサブスク</Text>
            {gridRows.map(([left, right], idx) => (
              <View key={idx} style={aStyles.gridRow}>
                <GridCard item={left} onPress={() => handleCardPress(left)} />
                {right !== null ? (
                  <GridCard item={right} onPress={() => handleCardPress(right)} />
                ) : (
                  <View style={aStyles.gridCardEmpty} />
                )}
              </View>
            ))}
          </>
        ) : (
          <View style={aStyles.emptyContainer}>
            <Ionicons name="albums-outline" size={64} color={AC.textDim} />
            <Text style={[aStyles.kpiValue, { marginTop: 16, textAlign: 'center' }]}>
              サブスクがまだありません
            </Text>
            <Text style={[aStyles.kpiLabel, { marginTop: 8, textAlign: 'center' }]}>
              右下の ＋ ボタンから追加してください
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[aStyles.fab, { bottom: insets.bottom + 24, backgroundColor: AC.teal }]}
        onPress={onAddPress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ── StyleSheet ────────────────────────────────────────────────────────────────
const aStyles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Section A: ヘッダー
  analyticsHeader: {
    backgroundColor: AC.bgCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AC.borderSubtle,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AC.textBright,
  },
  headerSubtitle: {
    fontSize: 12,
    color: AC.textMid,
    marginTop: 2,
  },
  momBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  momBadgeUp: {
    backgroundColor: '#F4433618',
  },
  momBadgeDown: {
    backgroundColor: '#26C6DA18',
  },
  momBadgeNeutral: {
    backgroundColor: '#78909C18',
  },
  momText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mainAmount: {
    fontSize: 38,
    fontWeight: '700',
    color: AC.teal,
    letterSpacing: -1,
  },
  yearlyAmount: {
    fontSize: 13,
    color: AC.textMid,
    marginTop: 2,
    marginBottom: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: AC.borderSubtle,
    paddingTop: 14,
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiDivider: {
    width: 1,
    backgroundColor: AC.borderSubtle,
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '600',
    color: AC.textBright,
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 11,
    color: AC.textMid,
  },

  // Section B: カテゴリ横棒グラフ
  chartCard: {
    backgroundColor: AC.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AC.borderSubtle,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AC.textMid,
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  barLabel: {
    width: 52,
    fontSize: 12,
    color: AC.textMid,
    textAlign: 'right',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: AC.borderSubtle,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barAmount: {
    width: 62,
    fontSize: 12,
    color: AC.textBright,
    textAlign: 'right',
  },

  // Section C: カレンダー
  calendarCard: {
    backgroundColor: AC.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AC.borderSubtle,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AC.textMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarTotalBadge: {
    fontSize: 12,
    color: AC.teal,
    fontWeight: '600',
  },
  weekDayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekDayText: {
    fontSize: 10,
    color: AC.textDim,
    fontWeight: '500',
  },
  calendarGrid: {
    gap: 2,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 2,
  },
  calendarCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    borderRadius: 6,
  },
  calendarCellToday: {
    borderWidth: 1.5,
    borderColor: AC.teal,
    backgroundColor: '#26C6DA10',
  },
  calendarCellBilling: {
    backgroundColor: AC.bgElevated,
  },
  calendarDayText: {
    fontSize: 11,
    color: AC.textMid,
  },
  calendarDayTextToday: {
    color: AC.teal,
    fontWeight: '700',
  },
  calendarDayTextBilling: {
    color: AC.textBright,
    fontWeight: '600',
  },
  calendarDotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    flexWrap: 'nowrap',
  },
  calendarDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  calendarMoreText: {
    fontSize: 7,
    color: AC.textMid,
  },

  // Section D: 未使用警告
  unusedSection: {
    backgroundColor: AC.warnBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AC.warnBorder,
    padding: 14,
    marginBottom: 12,
  },
  unusedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  unusedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: AC.warnOrange,
    flex: 1,
  },
  unusedCountBadge: {
    backgroundColor: '#FF980030',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unusedCountText: {
    fontSize: 11,
    color: AC.warnOrange,
    fontWeight: '600',
  },
  unusedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#FF980020',
    gap: 8,
  },
  unusedItemName: {
    flex: 1,
    fontSize: 13,
    color: AC.textBright,
  },
  unusedItemAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: AC.warnOrange,
  },
  unusedItemDays: {
    fontSize: 11,
    color: AC.textMid,
  },
  unusedTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FF980030',
  },
  unusedTotalLabel: {
    fontSize: 12,
    color: AC.textMid,
  },
  unusedTotalAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: AC.warnOrange,
  },

  // Section E: グリッドリスト
  gridSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AC.textMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  gridCard: {
    flex: 1,
    backgroundColor: AC.bgCard,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: AC.borderSubtle,
    borderLeftWidth: 3,
  },
  gridCardEmpty: {
    flex: 1,
  },
  gridIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  gridIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridServiceName: {
    fontSize: 14,
    fontWeight: '600',
    color: AC.textBright,
    flex: 1,
  },
  gridCategory: {
    fontSize: 10,
    color: AC.textMid,
    marginBottom: 4,
  },
  gridAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: AC.teal,
    marginBottom: 4,
  },
  gridAmountUnit: {
    fontSize: 10,
    color: AC.textMid,
    fontWeight: '400',
  },
  gridDaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  gridDaysBar: {
    height: 3,
    borderRadius: 2,
    flex: 1,
    backgroundColor: AC.borderSubtle,
    overflow: 'hidden',
  },
  gridDaysBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  gridDaysText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // 空状態
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});
