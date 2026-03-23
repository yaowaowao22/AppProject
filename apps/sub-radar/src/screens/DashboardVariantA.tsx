import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptions } from '../SubscriptionContext';
import type { Subscription, SubscriptionCategory } from '../types';
import {
  calcMonthlyAmount,
  getNextBillingDate,
  getDaysUntilBilling,
  isUnused,
  formatCurrency,
} from '../utils/subscriptionUtils';

const BUTTON_W = 72;
const { width: SCREEN_W } = Dimensions.get('window');

// ── バリアントAカラー定数 ─────────────────────────────────────────────────────
const VA = {
  bgTop:            '#0D0F1E',
  bgBottom:         '#1A1033',
  surfaceGlass:     'rgba(255,255,255,0.07)',
  surfaceRaised:    'rgba(255,255,255,0.12)',
  borderGlass:      'rgba(255,255,255,0.15)',
  borderGlassInner: 'rgba(255,255,255,0.08)',
  borderAccent:     'rgba(107,127,255,0.40)',
  accentBlue:       '#6B7FFF',
  accentPurple:     '#A855F7',
  textPrimary:      '#FFFFFF',
  textSecondary:    'rgba(255,255,255,0.75)',
  textMuted:        'rgba(255,255,255,0.45)',
  statusError:      '#FF5B6B',
  statusWarning:    '#FFAA4B',
  statusSuccess:    '#4BFFB5',
  catEntertainment: '#FF4D8D',
  catWork:          '#5B9BFF',
  catLife:          '#FFB74D',
  catLearning:      '#CE7CFF',
  catOther:         '#A0AEC0',
} as const;

const CATEGORY_VA_COLORS: Record<SubscriptionCategory, string> = {
  'エンタメ': VA.catEntertainment,
  '仕事':     VA.catWork,
  '生活':     VA.catLife,
  '学習':     VA.catLearning,
  'その他':   VA.catOther,
};

// ── SwipeableRow ─────────────────────────────────────────────────────────────
function SwipeableRow({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const offsetRef  = useRef(0);

  const snap = (to: number) => {
    offsetRef.current = to;
    Animated.timing(translateX, {
      toValue: to,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 4 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => {
        const next = offsetRef.current + g.dx;
        translateX.setValue(Math.max(Math.min(next, 0), -SCREEN_W));
      },
      onPanResponderRelease: (_, g) => {
        const next = offsetRef.current + g.dx;
        if (g.vx < -0.5 || next < -BUTTON_W * 0.4) {
          snap(-BUTTON_W);
        } else {
          snap(0);
        }
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
    <View style={{ overflow: 'hidden' }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          snap(0);
          onDelete();
        }}
        style={styles.deleteAction}
      >
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.deleteText}>削除</Text>
      </TouchableOpacity>
      <Animated.View
        style={[styles.animatedRow, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

// ── CategoryRingChart ────────────────────────────────────────────────────────
interface CategoryStat {
  category: SubscriptionCategory;
  total:    number;
  percent:  number;
  color:    string;
}

function CategoryRingChart({ subscriptions }: { subscriptions: Subscription[] }) {
  const categoryData = useMemo((): CategoryStat[] => {
    const totals: Partial<Record<SubscriptionCategory, number>> = {};
    for (const sub of subscriptions) {
      const monthly = calcMonthlyAmount(sub);
      totals[sub.category] = (totals[sub.category] ?? 0) + monthly;
    }
    const totalAll = (Object.values(totals) as number[]).reduce((a, b) => a + b, 0);
    if (totalAll === 0) return [];
    return (Object.entries(totals) as [SubscriptionCategory, number][])
      .map(([cat, total]) => ({
        category: cat,
        total,
        percent: Math.round((total / totalAll) * 100),
        color: CATEGORY_VA_COLORS[cat],
      }))
      .sort((a, b) => b.total - a.total);
  }, [subscriptions]);

  // border-color トリックで最大4象限のドーナツを表現
  const ringColors = useMemo(() => {
    const fb = '#3A3A5C';
    if (categoryData.length === 0) return [fb, fb, fb, fb];
    const c = categoryData.map((d) => d.color);
    return [
      c[0] ?? fb,
      c[1] ?? (c[0] ?? fb),
      c[2] ?? (c[1] ?? c[0] ?? fb),
      c[3] ?? (c[2] ?? c[1] ?? c[0] ?? fb),
    ];
  }, [categoryData]);

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartRow}>
        {/* ドーナツリング */}
        <View style={styles.ringContainer}>
          <View
            style={[
              styles.ringOuter,
              {
                borderTopColor:    ringColors[0],
                borderRightColor:  ringColors[1],
                borderBottomColor: ringColors[2],
                borderLeftColor:   ringColors[3],
              },
            ]}
          />
          <View style={styles.ringHole}>
            <Text style={styles.ringHoleText}>
              {categoryData.length > 0 ? `${categoryData.length}\nカテゴリ` : 'なし'}
            </Text>
          </View>
        </View>

        {/* 凡例 */}
        <View style={styles.legendContainer}>
          {categoryData.length > 0 ? (
            categoryData.map((item) => (
              <View key={item.category} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.category}</Text>
                <Text style={styles.legendPercent}>{item.percent}%</Text>
              </View>
            ))
          ) : (
            <Text style={styles.legendEmpty}>データなし</Text>
          )}
        </View>
      </View>
    </View>
  );
}

// ── DashboardVariantA ────────────────────────────────────────────────────────
interface DashboardVariantAProps {
  onAddPress:  () => void;
  onEditPress: (s: Subscription) => void;
}

export function DashboardVariantA({ onAddPress, onEditPress }: DashboardVariantAProps) {
  const insets = useSafeAreaInsets();
  const {
    subscriptions,
    isPremium,
    totalMonthly,
    totalYearly,
    deleteSubscription,
    updateSubscription,
  } = useSubscriptions();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [periodMode, setPeriodMode] = useState<'monthly' | 'yearly'>('monthly');

  const displayAmount = periodMode === 'monthly' ? totalMonthly : totalYearly;
  const displayLabel  = periodMode === 'monthly' ? '今月の合計' : '年間の合計';

  // 今後7日以内に請求日が来るサブスク
  const upcomingBillings = useMemo(() => {
    return subscriptions
      .filter((s) => s.isActive)
      .map((s) => ({ sub: s, days: getDaysUntilBilling(s) }))
      .filter(({ days }) => days <= 7)
      .sort((a, b) => a.days - b.days);
  }, [subscriptions]);

  // 未使用サービス（30日以上タップなし）
  const unusedSubs = useMemo(
    () => subscriptions.filter((s) => s.isActive && isUnused(s)),
    [subscriptions],
  );

  const activeSubs = useMemo(
    () => subscriptions.filter((s) => s.isActive),
    [subscriptions],
  );

  // 最大月額（スプレッドによる空配列問題を避けるために reduce を使用）
  const maxMonthly = useMemo(
    () => activeSubs.reduce((max, s) => Math.max(max, calcMonthlyAmount(s)), 0),
    [activeSubs],
  );

  // 未使用コスト合計
  const unusedCost = useMemo(
    () => unusedSubs.reduce((acc, s) => acc + calcMonthlyAmount(s), 0),
    [unusedSubs],
  );

  // タップ: lastTappedAt 更新 + 詳細展開トグル
  const handleTap = useCallback(
    (sub: Subscription) => {
      updateSubscription(sub.id, { lastTappedAt: new Date().toISOString() });
      setExpandedId((prev) => (prev === sub.id ? null : sub.id));
    },
    [updateSubscription],
  );

  const renderSubscriptionItem = useCallback(
    ({ item }: { item: Subscription }) => {
      const days      = getDaysUntilBilling(item);
      const nextDate  = getNextBillingDate(item);
      const monthly   = calcMonthlyAmount(item);
      const unused    = isUnused(item);
      const isExpanded = expandedId === item.id;

      const nextDateStr = nextDate.toLocaleDateString('ja-JP', {
        month: 'numeric',
        day:   'numeric',
      });

      const cycleLabel =
        item.billingCycle === 'monthly'   ? '月次'   :
        item.billingCycle === 'yearly'    ? '年次'   :
        item.billingCycle === 'quarterly' ? '四半期' : '週次';

      const daysAccent =
        days <= 1 ? VA.statusError   :
        days <= 3 ? VA.statusWarning :
        VA.accentBlue;

      return (
        <SwipeableRow onDelete={() => deleteSubscription(item.id)}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleTap(item)}
            onLongPress={() => onEditPress(item)}
            delayLongPress={500}
          >
            <View style={[styles.subCard, { borderLeftColor: item.color }]}>
              <View style={styles.subRow}>
                {/* アイコン円 */}
                <View style={[styles.iconCircle, { backgroundColor: item.color + '30' }]}>
                  <Ionicons
                    name={(item.iconName as any) ?? 'card-outline'}
                    size={20}
                    color={item.color}
                  />
                </View>

                {/* サービス名・次回請求日 */}
                <View style={styles.subInfo}>
                  <View style={styles.subNameRow}>
                    <Text style={styles.subName} numberOfLines={1}>{item.name}</Text>
                    {unused && (
                      <View style={styles.warnBadge}>
                        <Text style={styles.warnBadgeText}>未使用</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.subDateText}>{nextDateStr} 次回請求</Text>
                </View>

                {/* 金額・残日数 */}
                <View style={styles.subRight}>
                  <Text style={styles.subAmount}>
                    {formatCurrency(monthly, item.currency)}/月
                  </Text>
                  <View
                    style={[
                      styles.daysBadge,
                      {
                        borderColor:     daysAccent + '80',
                        backgroundColor: daysAccent + '20',
                      },
                    ]}
                  >
                    <Text style={[styles.daysBadgeText, { color: daysAccent }]}>
                      {days === 0 ? '今日' : `残${days}日`}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 展開時詳細 */}
              {isExpanded && (
                <View style={styles.expandedDetail}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>請求サイクル</Text>
                    <Text style={styles.detailValue}>{cycleLabel}</Text>
                  </View>
                  <View style={[styles.detailRow, { marginTop: 6 }]}>
                    <Text style={styles.detailLabel}>請求日</Text>
                    <Text style={styles.detailValue}>毎月{item.billingDay}日</Text>
                  </View>
                  <View style={[styles.detailRow, { marginTop: 6 }]}>
                    <Text style={styles.detailLabel}>月額換算</Text>
                    <Text style={styles.detailValue}>
                      {formatCurrency(monthly, item.currency)}
                    </Text>
                  </View>
                  {item.note ? (
                    <View style={[styles.detailRow, { marginTop: 6 }]}>
                      <Text style={styles.detailLabel}>メモ</Text>
                      <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>
                        {item.note}
                      </Text>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => onEditPress(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil-outline" size={13} color={VA.accentBlue} />
                    <Text style={styles.editButtonText}>編集</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </SwipeableRow>
      );
    },
    [expandedId, deleteSubscription, handleTap, onEditPress],
  );

  const ListHeader = useCallback(
    () => (
      <View>
        {/* ── ヘッダー行 ── */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View>
            <Text style={styles.headerTitle}>ダッシュボード</Text>
            <Text style={styles.headerSubtitle}>{activeSubs.length}件のサブスク</Text>
          </View>
          <View style={[styles.premiumBadge, isPremium ? styles.premiumBadgeActive : null]}>
            <Text style={[styles.premiumBadgeText, isPremium ? styles.premiumBadgeTextActive : null]}>
              {isPremium ? 'プレミアム' : '無料版'}
            </Text>
          </View>
        </View>

        {/* ── HeroSummaryCard ── */}
        <View style={styles.heroCard}>
          {/* ラベル + 月次/年次トグル */}
          <View style={styles.heroHeader}>
            <Text style={styles.heroLabel}>{displayLabel}</Text>
            <View style={styles.periodToggle}>
              <TouchableOpacity
                style={[
                  styles.periodToggleBtn,
                  periodMode === 'monthly' && styles.periodToggleBtnActive,
                ]}
                onPress={() => setPeriodMode('monthly')}
              >
                <Text
                  style={[
                    styles.periodToggleText,
                    periodMode === 'monthly' && styles.periodToggleTextActive,
                  ]}
                >
                  月次
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodToggleBtn,
                  periodMode === 'yearly' && styles.periodToggleBtnActive,
                ]}
                onPress={() => setPeriodMode('yearly')}
              >
                <Text
                  style={[
                    styles.periodToggleText,
                    periodMode === 'yearly' && styles.periodToggleTextActive,
                  ]}
                >
                  年次
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 金額（月次は大きく・年次はやや小さく） */}
          <Text
            style={periodMode === 'monthly' ? styles.heroAmount : styles.heroAmountSmall}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            ¥{Math.round(displayAmount).toLocaleString('ja-JP')}
          </Text>

          <View style={styles.heroDivider} />

          {/* 3カラム統計: アクティブ件数 | 最大月額 | 未使用コスト */}
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{activeSubs.length}件</Text>
              <Text style={styles.heroStatLabel}>アクティブ</Text>
            </View>
            <View style={[styles.heroStatItem, styles.heroStatBorder]}>
              <Text style={styles.heroStatValue}>
                ¥{Math.round(maxMonthly).toLocaleString('ja-JP')}
              </Text>
              <Text style={styles.heroStatLabel}>最大月額</Text>
            </View>
            <View style={[styles.heroStatItem, styles.heroStatBorder]}>
              <Text
                style={[
                  styles.heroStatValue,
                  unusedCost > 0 ? { color: VA.statusWarning } : null,
                ]}
              >
                ¥{Math.round(unusedCost).toLocaleString('ja-JP')}
              </Text>
              <Text style={styles.heroStatLabel}>未使用計</Text>
            </View>
          </View>
        </View>

        {/* ── カテゴリ内訳チャート ── */}
        {activeSubs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>カテゴリ内訳</Text>
            <CategoryRingChart subscriptions={activeSubs} />
          </View>
        )}

        {/* ── 次回請求（7日以内）── */}
        {upcomingBillings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>次回請求（7日以内）</Text>
            {upcomingBillings.map(({ sub, days }) => {
              const upAccent =
                days <= 1 ? VA.statusError   :
                days <= 3 ? VA.statusWarning :
                VA.accentBlue;
              return (
                <View key={sub.id} style={[styles.upcomingCard, { marginBottom: 8 }]}>
                  <View style={styles.upcomingRow}>
                    <View style={styles.rowLeft}>
                      <View style={[styles.dot, { backgroundColor: sub.color }]} />
                      <Text style={styles.upcomingName}>{sub.name}</Text>
                    </View>
                    <View style={styles.upcomingRight}>
                      <Text style={styles.upcomingAmount}>
                        {formatCurrency(sub.amount, sub.currency)}
                      </Text>
                      <View
                        style={[
                          styles.daysBadge,
                          {
                            borderColor:     upAccent + '80',
                            backgroundColor: upAccent + '20',
                            marginLeft: 8,
                          },
                        ]}
                      >
                        <Text style={[styles.daysBadgeText, { color: upAccent }]}>
                          {days === 0 ? '今日' : `残${days}日`}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── 未使用サービス警告バナー ── */}
        {unusedSubs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>未使用の可能性</Text>
              <View style={styles.warnCountBadge}>
                <Text style={styles.warnCountText}>{unusedSubs.length}件</Text>
              </View>
            </View>
            {unusedSubs.map((sub) => (
              <View key={sub.id} style={[styles.unusedCard, { marginBottom: 8 }]}>
                <View style={styles.upcomingRow}>
                  <View style={styles.rowLeft}>
                    <Ionicons name="warning-outline" size={16} color={VA.statusWarning} />
                    <Text style={[styles.upcomingName, { marginLeft: 6 }]}>{sub.name}</Text>
                  </View>
                  <Text style={styles.unusedAmount}>
                    {formatCurrency(calcMonthlyAmount(sub), sub.currency)}/月
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── 全サブスク一覧ヘッダー ── */}
        <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>
          すべてのサブスク ({activeSubs.length}件)
        </Text>
      </View>
    ),
    [
      activeSubs,
      upcomingBillings,
      unusedSubs,
      isPremium,
      periodMode,
      displayAmount,
      displayLabel,
      maxMonthly,
      unusedCost,
      insets.top,
    ],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={activeSubs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 100 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={renderSubscriptionItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="albums-outline" size={64} color={VA.textMuted} />
            <Text style={styles.emptyTitle}>サブスクがまだありません</Text>
            <Text style={styles.emptySubtitle}>
              右下の ＋ ボタンから追加してください
            </Text>
          </View>
        )}
      />

      {/* ── FAB（アクセントブルー + グローシャドウ）── */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={onAddPress}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

// ── StyleSheet ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // コンテナ（常時ダーク背景）
  container: {
    flex: 1,
    backgroundColor: VA.bgTop,
  },

  // ── SwipeableRow ────────────────────────────────────────────────────────────
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: BUTTON_W,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: VA.statusError,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  deleteText: {
    fontSize: 10,
    color: '#FFFFFF',
    marginTop: 2,
  },
  animatedRow: {
    backgroundColor: 'transparent',
  },

  // ── ヘッダー行 ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: VA.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: VA.textMuted,
    marginTop: 2,
  },
  premiumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: VA.surfaceGlass,
    borderWidth: 1,
    borderColor: VA.borderGlass,
  },
  premiumBadgeActive: {
    backgroundColor: 'rgba(255,170,75,0.15)',
    borderColor: 'rgba(255,170,75,0.40)',
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: VA.textMuted,
  },
  premiumBadgeTextActive: {
    color: VA.statusWarning,
  },

  // ── HeroSummaryCard ──────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: VA.surfaceRaised,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: VA.borderAccent,
    padding: 24,
    marginBottom: 16,
    shadowColor: VA.accentBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 6,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroLabel: {
    fontSize: 13,
    color: VA.textMuted,
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontSize: 52,
    fontWeight: '800',
    color: VA.textPrimary,
    letterSpacing: -1,
    marginVertical: 8,
  },
  heroAmountSmall: {
    fontSize: 40,
    fontWeight: '800',
    color: VA.textPrimary,
    letterSpacing: -0.5,
    marginVertical: 8,
  },
  heroDivider: {
    height: 1,
    backgroundColor: VA.borderGlassInner,
    marginVertical: 16,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStatItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  heroStatBorder: {
    borderLeftWidth: 1,
    borderLeftColor: VA.borderGlassInner,
  },
  heroStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: VA.textPrimary,
  },
  heroStatLabel: {
    fontSize: 11,
    color: VA.textMuted,
    marginTop: 2,
  },

  // ── 月次/年次トグル ──────────────────────────────────────────────────────────
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 8,
    padding: 2,
  },
  periodToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  periodToggleBtnActive: {
    backgroundColor: 'rgba(107,127,255,0.60)',
  },
  periodToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.50)',
  },
  periodToggleTextActive: {
    color: VA.textPrimary,
  },

  // ── カテゴリリングチャート ───────────────────────────────────────────────────
  chartCard: {
    backgroundColor: VA.surfaceGlass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: VA.borderGlass,
    padding: 16,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringContainer: {
    width: 120,
    height: 120,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 14,
    position: 'absolute',
  },
  ringHole: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: VA.bgTop,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  ringHoleText: {
    fontSize: 10,
    color: VA.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  legendContainer: {
    flex: 1,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: VA.textSecondary,
    flex: 1,
  },
  legendPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: VA.textPrimary,
  },
  legendEmpty: {
    fontSize: 12,
    color: VA.textMuted,
  },

  // ── セクション共通 ───────────────────────────────────────────────────────────
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: VA.textSecondary,
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  // ── 次回請求カード ───────────────────────────────────────────────────────────
  upcomingCard: {
    padding: 12,
    backgroundColor: 'rgba(107,127,255,0.10)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(107,127,255,0.30)',
  },
  upcomingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  upcomingName: {
    fontSize: 14,
    fontWeight: '500',
    color: VA.textSecondary,
  },
  upcomingAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: VA.textPrimary,
  },

  // ── 未使用カード ─────────────────────────────────────────────────────────────
  unusedCard: {
    padding: 12,
    backgroundColor: 'rgba(255,170,75,0.10)',
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderColor: 'rgba(255,170,75,0.25)',
    borderLeftColor: VA.statusWarning,
  },
  unusedAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: VA.statusWarning,
  },
  warnCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255,170,75,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255,170,75,0.40)',
    marginLeft: 8,
  },
  warnCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: VA.statusWarning,
  },

  // ── サブスクグラスカード ─────────────────────────────────────────────────────
  subCard: {
    padding: 14,
    backgroundColor: VA.surfaceGlass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: VA.borderGlass,
    borderLeftWidth: 3,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subInfo: {
    flex: 1,
  },
  subNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  subName: {
    fontSize: 15,
    fontWeight: '600',
    color: VA.textPrimary,
    flexShrink: 1,
  },
  subDateText: {
    fontSize: 12,
    color: VA.textMuted,
    marginTop: 2,
  },
  subRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  subAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: VA.textPrimary,
  },
  daysBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  daysBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  warnBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: 'rgba(255,170,75,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255,170,75,0.40)',
  },
  warnBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: VA.statusWarning,
  },

  // ── 展開詳細パネル ───────────────────────────────────────────────────────────
  expandedDetail: {
    borderTopWidth: 1,
    borderTopColor: VA.borderGlassInner,
    marginTop: 12,
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: VA.textMuted,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: VA.textSecondary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(107,127,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(107,127,255,0.30)',
    gap: 4,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: VA.accentBlue,
  },

  // ── 空状態 ───────────────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: VA.textSecondary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: VA.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },

  // ── FAB ──────────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: VA.accentBlue,
    shadowColor: VA.accentPurple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
});
