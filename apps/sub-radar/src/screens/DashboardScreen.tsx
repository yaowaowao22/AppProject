import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, H1, H2, Body, Caption, Card, Badge } from '@massapp/ui';
import { useSubscriptions } from '../SubscriptionContext';
import type { Subscription } from '../types';
import {
  calcMonthlyAmount,
  getNextBillingDate,
  getDaysUntilBilling,
  isUnused,
  formatCurrency,
} from '../utils/subscriptionUtils';
import { useUIVariant } from '../UIVariantContext';
import { DashboardVariantA } from './DashboardVariantA';
import { DashboardVariantB } from './DashboardVariantB';
import { DashboardVariantC } from './DashboardVariantC';
import { VariantSwitcher } from '../components/VariantSwitcher';

const BUTTON_W = 72;
const { width: SCREEN_W } = Dimensions.get('window');

// ── SwipeableRow（InboxScreen から流用）──────────────────────────────────────
function SwipeableRow({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const offsetRef = useRef(0);
  const { colors } = useTheme();

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
        style={[styles.deleteAction, { backgroundColor: colors.error, width: BUTTON_W }]}
      >
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Caption color="#fff" style={{ fontSize: 10, marginTop: 2 }}>削除</Caption>
      </TouchableOpacity>
      <Animated.View
        style={{ transform: [{ translateX }], backgroundColor: colors.background }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

// ── DashboardScreen ───────────────────────────────────────────────────────────
interface DashboardScreenProps {
  onAddPress?: () => void;
  onEditPress?: (s: Subscription) => void;
}

function OriginalDashboard({ onAddPress }: DashboardScreenProps) {
  const { colors, spacing, radius } = useTheme();
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

  // 今後7日以内に請求日が来るサブスク（日付昇順）
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

  // タップ: lastTappedAt 更新 + 詳細展開トグル
  const handleTap = useCallback(
    (sub: Subscription) => {
      updateSubscription(sub.id, { lastTappedAt: new Date().toISOString() });
      setExpandedId((prev) => (prev === sub.id ? null : sub.id));
    },
    [updateSubscription],
  );

  const renderSubscriptionItem = ({ item }: { item: Subscription }) => {
    const days = getDaysUntilBilling(item);
    const nextDate = getNextBillingDate(item);
    const monthly = calcMonthlyAmount(item);
    const unused = isUnused(item);
    const isExpanded = expandedId === item.id;

    const nextDateStr = nextDate.toLocaleDateString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
    });

    const cycleLabel =
      item.billingCycle === 'monthly'   ? '月次'   :
      item.billingCycle === 'yearly'    ? '年次'   :
      item.billingCycle === 'quarterly' ? '四半期' : '週次';

    return (
      <SwipeableRow onDelete={() => deleteSubscription(item.id)}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => handleTap(item)}>
          <Card style={[styles.subCard, { borderLeftWidth: 3, borderLeftColor: item.color }]}>
            <View style={styles.subRow}>
              {/* アイコン */}
              <View style={[styles.iconCircle, { backgroundColor: item.color + '22' }]}>
                <Ionicons
                  name={(item.iconName as any) ?? 'card-outline'}
                  size={20}
                  color={item.color}
                />
              </View>

              {/* サービス名・次回請求日 */}
              <View style={styles.subInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <H2 style={styles.subName}>{item.name}</H2>
                  {unused && <Badge label="⚠️ 未使用" variant="warning" />}
                </View>
                <Caption color={colors.textMuted}>{nextDateStr} 次回請求</Caption>
              </View>

              {/* 金額・カテゴリ */}
              <View style={styles.subRight}>
                <Body style={{ fontWeight: '600' }}>
                  {formatCurrency(monthly, item.currency)}/月
                </Body>
                <Badge
                  label={item.category}
                  variant="info"
                  style={{ marginTop: 4, alignSelf: 'flex-end' }}
                />
              </View>
            </View>

            {/* 展開時詳細 */}
            {isExpanded && (
              <View
                style={[
                  styles.expandedDetail,
                  { borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.sm },
                ]}
              >
                <View style={styles.detailRow}>
                  <Caption color={colors.textMuted}>請求サイクル</Caption>
                  <Caption color={colors.textSecondary}>{cycleLabel}</Caption>
                </View>
                <View style={[styles.detailRow, { marginTop: spacing.xs }]}>
                  <Caption color={colors.textMuted}>請求日</Caption>
                  <Caption color={colors.textSecondary}>毎月{item.billingDay}日</Caption>
                </View>
                <View style={[styles.detailRow, { marginTop: spacing.xs }]}>
                  <Caption color={colors.textMuted}>月額換算</Caption>
                  <Caption color={colors.textSecondary}>
                    {formatCurrency(monthly, item.currency)}
                  </Caption>
                </View>
                {item.note ? (
                  <View style={[styles.detailRow, { marginTop: spacing.xs }]}>
                    <Caption color={colors.textMuted}>メモ</Caption>
                    <Caption
                      color={colors.textSecondary}
                      style={{ flex: 1, textAlign: 'right' }}
                    >
                      {item.note}
                    </Caption>
                  </View>
                ) : null}
              </View>
            )}
          </Card>
        </TouchableOpacity>
      </SwipeableRow>
    );
  };

  const ListHeader = (
    <View>
      {/* ── ヘッダー ── */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + spacing.sm, marginBottom: spacing.md },
        ]}
      >
        <View>
          <H1 style={{ fontSize: 24 }}>ダッシュボード</H1>
          <Caption color={colors.textMuted}>{activeSubs.length}件のサブスク</Caption>
        </View>
        <Badge
          label={isPremium ? 'プレミアム' : '無料版'}
          variant={isPremium ? 'success' : 'info'}
        />
      </View>

      {/* ── サマリーカード ── */}
      <Card style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
        <Caption color={colors.textOnPrimary + 'CC'}>今月の合計</Caption>
        <H1 style={[styles.totalAmount, { color: colors.textOnPrimary }]}>
          ¥{Math.round(totalMonthly).toLocaleString('ja-JP')}
        </H1>
        <Caption color={colors.textOnPrimary + 'AA'}>
          年間: ¥{Math.round(totalYearly).toLocaleString('ja-JP')}
        </Caption>
        <View style={[styles.summaryDivider, { borderTopColor: colors.textOnPrimary + '33' }]} />
        <View style={styles.summaryFooter}>
          <Caption color={colors.textOnPrimary + 'CC'}>アクティブ</Caption>
          <Caption color={colors.textOnPrimary} style={{ fontWeight: '600' }}>
            {activeSubs.length}件
          </Caption>
        </View>
      </Card>

      {/* ── 次回請求セクション（7日以内）── */}
      {upcomingBillings.length > 0 && (
        <View style={{ marginTop: spacing.lg }}>
          <H2 style={{ marginBottom: spacing.sm }}>次回請求（7日以内）</H2>
          {upcomingBillings.map(({ sub, days }) => (
            <Card key={sub.id} style={[styles.upcomingCard, { marginBottom: spacing.sm }]}>
              <View style={styles.upcomingRow}>
                <View style={styles.rowLeft}>
                  <View style={[styles.dot, { backgroundColor: sub.color }]} />
                  <Body style={{ fontWeight: '500' }}>{sub.name}</Body>
                </View>
                <View style={styles.upcomingRight}>
                  <Body style={{ fontWeight: '600' }}>
                    {formatCurrency(sub.amount, sub.currency)}
                  </Body>
                  <Badge
                    label={days === 0 ? '今日' : `残${days}日`}
                    variant={days <= 1 ? 'error' : days <= 3 ? 'warning' : 'info'}
                    style={{ marginLeft: 8 }}
                  />
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* ── 未使用サービス警告バナー ── */}
      {unusedSubs.length > 0 && (
        <View style={{ marginTop: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <H2>⚠️ 未使用の可能性</H2>
            <Badge
              label={`${unusedSubs.length}件`}
              variant="warning"
              style={{ marginLeft: 8 }}
            />
          </View>
          {unusedSubs.map((sub) => (
            <Card
              key={sub.id}
              style={[
                styles.unusedCard,
                { borderLeftWidth: 3, borderLeftColor: '#FF9800', marginBottom: spacing.sm },
              ]}
            >
              <View style={styles.upcomingRow}>
                <View style={styles.rowLeft}>
                  <Ionicons name="warning-outline" size={16} color="#FF9800" />
                  <Body style={{ marginLeft: 6 }}>{sub.name}</Body>
                </View>
                <Body style={{ fontWeight: '600' }}>
                  {formatCurrency(calcMonthlyAmount(sub), sub.currency)}/月
                </Body>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* ── 全サブスク一覧ヘッダー ── */}
      <H2 style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>すべてのサブスク</H2>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={activeSubs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingBottom: 100 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={renderSubscriptionItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="albums-outline" size={64} color={colors.textMuted} />
            <H2 style={{ marginTop: spacing.md }} color={colors.textSecondary}>
              サブスクがまだありません
            </H2>
            <Body
              color={colors.textMuted}
              style={{ marginTop: spacing.sm, textAlign: 'center' }}
            >
              右下の ＋ ボタンから追加してください
            </Body>
          </View>
        )}
      />

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: colors.primary, bottom: insets.bottom + spacing.lg },
        ]}
        onPress={onAddPress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={colors.textOnPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
  },
  totalAmount: {
    fontSize: 40,
    fontWeight: '700',
    marginVertical: 4,
  },
  summaryDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  upcomingCard: {
    padding: 12,
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
  unusedCard: {
    padding: 12,
  },
  subCard: {
    padding: 12,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subInfo: {
    flex: 1,
  },
  subName: {
    fontSize: 15,
  },
  subRight: {
    alignItems: 'flex-end',
  },
  expandedDetail: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});

// ── バリアントルーター ─────────────────────────────────────────────────────────
export function DashboardScreen({ onAddPress, onEditPress }: DashboardScreenProps) {
  const { variant } = useUIVariant();
  const handleAdd  = onAddPress  ?? (() => {});
  const handleEdit = onEditPress ?? (() => {});

  return (
    <View style={{ flex: 1 }}>
      {variant === 'premium' ? (
        <DashboardVariantA onAddPress={handleAdd} onEditPress={handleEdit} />
      ) : variant === 'minimal' ? (
        <DashboardVariantB onAddPress={handleAdd} onEditPress={handleEdit} />
      ) : variant === 'analytics' ? (
        <DashboardVariantC onAddPress={handleAdd} onEditPress={handleEdit} />
      ) : (
        <OriginalDashboard onAddPress={onAddPress} />
      )}
      <VariantSwitcher />
    </View>
  );
}
