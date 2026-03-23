/**
 * DashboardVariantB — ミニマル・クリーンリスト型
 *
 * デザインコンセプト: Bobby / Chronicle 風
 * - オフホワイト背景 + コーラルオレンジアクセント
 * - カード枠線なし・シャドウのみのフラットデザイン
 * - コンパクトサマリーバー + カテゴリタグフィルター + シンプルリスト
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SectionList,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptions } from '../SubscriptionContext';
import type { Subscription, SubscriptionCategory } from '../types';
import { CATEGORY_COLORS } from '../types';
import {
  calcMonthlyAmount,
  getNextBillingDate,
  getDaysUntilBilling,
  isUnused,
  formatCurrency,
} from '../utils/subscriptionUtils';

// ─────────────────────────────────────────────────────────────────────────────
// カラーパレット（バリアントB専用）
// ─────────────────────────────────────────────────────────────────────────────

const P = {
  background:    '#FAFAFA',  // オフホワイト背景
  surface:       '#FFFFFF',  // カード背景（純白）
  surfaceSunken: '#F4F4F6',  // 凹んだ背景（入力・タグ）
  textPrimary:   '#1A1A1A',  // 本文テキスト
  textSecondary: '#555555',  // サブテキスト
  textMuted:     '#999999',  // プレースホルダー・注釈
  textOnAccent:  '#FFFFFF',  // アクセント上のテキスト
  border:        '#E8E8E8',  // ボーダー
  separator:     '#F2F2F2',  // リストセパレーター
  divider:       '#EBEBEB',  // セクション区切り
  accent:        '#FF6B35',  // メインアクセント（コーラルオレンジ）
  accentLight:   '#FFF0EB',  // アクセントの薄い背景
  warning:       '#FF9500',  // 警告（iOS標準オレンジ）
  warningLight:  '#FFF8EC',
  error:         '#FF3B30',  // エラー（iOS標準レッド）
  errorLight:    '#FFF2F0',
} as const;

// カテゴリ一覧（types.ts と同順）
const ALL_CATEGORIES: SubscriptionCategory[] = [
  'エンタメ', '仕事', '生活', '学習', 'その他',
];

// ─────────────────────────────────────────────────────────────────────────────
// SwipeableRow — 左スワイプで削除ボタン表示
// ─────────────────────────────────────────────────────────────────────────────

const BUTTON_W = 72;
const { width: SCREEN_W } = Dimensions.get('window');

function SwipeableRow({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const offsetRef = useRef(0);

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
      {/* 削除ボタン（右側に固定） */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          snap(0);
          onDelete();
        }}
        style={swipeStyles.deleteBtn}
      >
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={swipeStyles.deleteBtnText}>削除</Text>
      </TouchableOpacity>

      {/* スライドするコンテンツ */}
      <Animated.View
        style={{ transform: [{ translateX }], backgroundColor: P.surface }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SummaryBar — コンパクトサマリーバー（画面最上部）
// ─────────────────────────────────────────────────────────────────────────────

function SummaryBar({
  totalMonthly,
  nextDays,
  onCalendarPress,
  topInset = 0,
}: {
  totalMonthly: number;
  nextDays: number | null;
  onCalendarPress: () => void;
  topInset?: number;
}) {
  return (
    <View style={[summaryStyles.bar, { paddingTop: topInset + 16 }]}>
      {/* 左列: 今月の合計 */}
      <View style={summaryStyles.left}>
        <Text style={summaryStyles.label}>今月の合計</Text>
        <Text style={summaryStyles.value}>
          ¥{Math.round(totalMonthly).toLocaleString('ja-JP')}
        </Text>
      </View>

      {/* 縦区切り */}
      <View style={summaryStyles.vDivider} />

      {/* 右列: 次の請求まで */}
      <View style={summaryStyles.right}>
        <Text style={summaryStyles.label}>次の請求まで</Text>
        {nextDays !== null ? (
          <Text style={summaryStyles.accentValue}>
            {nextDays === 0 ? '今日' : `${nextDays}日`}
          </Text>
        ) : (
          <Text style={summaryStyles.value}>—</Text>
        )}
      </View>

      {/* カレンダーボタン */}
      <TouchableOpacity
        style={summaryStyles.calBtn}
        onPress={onCalendarPress}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar-outline" size={20} color={P.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CategoryTagFilter — カテゴリ横スクロールタグフィルター
// ─────────────────────────────────────────────────────────────────────────────

function CategoryTagFilter({
  subscriptions,
  unusedCount,
  selected,
  onSelect,
}: {
  subscriptions: Subscription[];
  unusedCount: number;
  selected: string | null;
  onSelect: (cat: string | null) => void;
}) {
  return (
    <View style={tagStyles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tagStyles.scroll}
      >
        {/* すべて */}
        <TouchableOpacity
          style={[tagStyles.tag, selected === null && tagStyles.tagActive]}
          onPress={() => onSelect(null)}
          activeOpacity={0.7}
        >
          <Text
            style={[tagStyles.tagText, selected === null && tagStyles.tagTextActive]}
          >
            すべて（{subscriptions.length}）
          </Text>
        </TouchableOpacity>

        {/* カテゴリ別タグ（件数が0のカテゴリは非表示） */}
        {ALL_CATEGORIES.map((cat) => {
          const count = subscriptions.filter((s) => s.category === cat).length;
          if (count === 0) return null;
          const isActive = selected === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[tagStyles.tag, isActive && tagStyles.tagActive]}
              onPress={() => onSelect(cat)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  tagStyles.dot,
                  { backgroundColor: CATEGORY_COLORS[cat] },
                ]}
              />
              <Text
                style={[tagStyles.tagText, isActive && tagStyles.tagTextActive]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* ⚠️未使用タグ */}
        {unusedCount > 0 && (
          <TouchableOpacity
            style={[
              tagStyles.tag,
              selected === '⚠️未使用' && tagStyles.tagActive,
            ]}
            onPress={() => onSelect('⚠️未使用')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                tagStyles.tagText,
                selected === '⚠️未使用' && tagStyles.tagTextActive,
              ]}
            >
              ⚠️ 未使用（{unusedCount}）
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SubscriptionListItem — サブスクリストの1行
// ─────────────────────────────────────────────────────────────────────────────

function SubscriptionListItem({
  subscription: item,
  isExpanded,
  daysUntilBilling,
  onPress,
  onEditPress,
}: {
  subscription: Subscription;
  isExpanded: boolean;
  daysUntilBilling?: number;
  onPress: () => void;
  onEditPress: (s: Subscription) => void;
}) {
  const monthly = calcMonthlyAmount(item);
  const nextDate = getNextBillingDate(item);
  const unused = isUnused(item);
  const catColor = CATEGORY_COLORS[item.category];

  const nextDateStr = nextDate.toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
  });

  const cycleLabel =
    item.billingCycle === 'monthly'   ? '月次'   :
    item.billingCycle === 'yearly'    ? '年次'   :
    item.billingCycle === 'quarterly' ? '四半期' : '週次';

  // カウントダウンバッジの色（7日以内のみ表示）
  const showCountdown =
    daysUntilBilling !== undefined && daysUntilBilling <= 7;
  const countdownBg =
    !showCountdown        ? null
    : daysUntilBilling === 0 ? P.errorLight
    : daysUntilBilling! <= 3 ? P.warningLight
    : P.accentLight;
  const countdownColor =
    !showCountdown           ? null
    : daysUntilBilling === 0 ? P.error
    : daysUntilBilling! <= 3 ? P.warning
    : P.accent;

  return (
    <View style={itemStyles.wrapper}>
      {/* メイン行（タップで詳細展開） */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={itemStyles.row}
      >
        {/* アイコン円 */}
        <View
          style={[
            itemStyles.iconCircle,
            { backgroundColor: item.color + '18' },
          ]}
        >
          <Ionicons
            name={(item.iconName as any) ?? 'card-outline'}
            size={22}
            color={item.color}
          />
        </View>

        {/* テキスト情報 */}
        <View style={itemStyles.info}>
          <View style={itemStyles.nameRow}>
            <Text style={itemStyles.name} numberOfLines={1}>
              {item.name}
            </Text>
            {unused && (
              <Text style={itemStyles.unusedBadge}>⚠️</Text>
            )}
          </View>
          <View style={itemStyles.meta}>
            <Text style={itemStyles.dateText}>{nextDateStr}</Text>
            <View
              style={[itemStyles.catDot, { backgroundColor: catColor }]}
            />
            <Text style={[itemStyles.catLabel, { color: catColor }]}>
              {item.category}
            </Text>
          </View>
        </View>

        {/* 金額 + カウントダウンバッジ */}
        <View style={itemStyles.right}>
          <Text style={itemStyles.amount}>
            {formatCurrency(monthly, item.currency)}/月
          </Text>
          {showCountdown && countdownBg !== null && countdownColor !== null && (
            <View
              style={[itemStyles.countdown, { backgroundColor: countdownBg }]}
            >
              <Text
                style={[
                  itemStyles.countdownText,
                  { color: countdownColor },
                ]}
              >
                {daysUntilBilling === 0 ? '今日' : `残${daysUntilBilling}日`}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* 展開詳細パネル */}
      {isExpanded && (
        <View style={itemStyles.expandPanel}>
          {/* 2カラムグリッドで詳細表示 */}
          <View style={itemStyles.expandGrid}>
            <View style={itemStyles.expandCell}>
              <Text style={itemStyles.cellLabel}>請求サイクル</Text>
              <Text style={itemStyles.cellValue}>{cycleLabel}</Text>
            </View>
            <View style={itemStyles.expandCell}>
              <Text style={itemStyles.cellLabel}>請求日</Text>
              <Text style={itemStyles.cellValue}>
                毎月{item.billingDay}日
              </Text>
            </View>
            <View style={itemStyles.expandCell}>
              <Text style={itemStyles.cellLabel}>月額換算</Text>
              <Text style={itemStyles.cellValue}>
                {formatCurrency(monthly, item.currency)}
              </Text>
            </View>
            {item.note ? (
              <View style={itemStyles.expandCell}>
                <Text style={itemStyles.cellLabel}>メモ</Text>
                <Text style={itemStyles.cellValue} numberOfLines={2}>
                  {item.note}
                </Text>
              </View>
            ) : null}
          </View>

          {/* 編集ボタン */}
          <TouchableOpacity
            style={itemStyles.editBtn}
            onPress={() => onEditPress(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={14} color={P.accent} />
            <Text style={itemStyles.editBtnText}>編集する</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CalendarView — 月間カレンダーボトムシート
// ─────────────────────────────────────────────────────────────────────────────

const SHEET_H = Dimensions.get('window').height * 0.65;
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const;

function CalendarView({
  subscriptions,
  onClose,
}: {
  subscriptions: Subscription[];
  onClose: () => void;
}) {
  const todayDate = new Date();
  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const todayYear = todayDate.getFullYear();
  const todayMonth = todayDate.getMonth();
  const todayDay = todayDate.getDate();

  // billingDay → サブスクのマップ（同じ日に複数登録可）
  const subsOnDay = useMemo<Record<number, Subscription[]>>(() => {
    const map: Record<number, Subscription[]> = {};
    subscriptions.forEach((s) => {
      const day = Math.min(s.billingDay, 28); // 2月対応
      if (!map[day]) map[day] = [];
      map[day].push(s);
    });
    return map;
  }, [subscriptions]);

  // カレンダーグリッド計算
  const firstDow = new Date(year, month, 1).getDay(); // 0=日曜
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = `${year}年${month + 1}月`;

  const weeks = useMemo<(number | null)[][]>(() => {
    const result: (number | null)[][] = [];
    let week: (number | null)[] = Array(firstDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(d);
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      result.push(week);
    }
    return result;
  }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const prevMonth = () => {
    setSelectedDay(null);
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    setSelectedDay(null);
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const selectedSubs =
    selectedDay !== null ? (subsOnDay[selectedDay] ?? []) : [];

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={calStyles.root}>
        {/* 背景タップで閉じる */}
        <TouchableOpacity
          style={calStyles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* シート本体 */}
        <View style={calStyles.sheet}>
          {/* ヘッダー: ナビゲーション + タイトル + 閉じるボタン */}
          <View style={calStyles.header}>
            <TouchableOpacity
              style={calStyles.navBtn}
              onPress={prevMonth}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={P.textPrimary}
              />
            </TouchableOpacity>
            <Text style={calStyles.title}>{monthLabel}</Text>
            <TouchableOpacity
              style={calStyles.navBtn}
              onPress={nextMonth}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={P.textPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={calStyles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={P.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 曜日ヘッダー行 */}
            <View style={calStyles.weekdayRow}>
              {WEEKDAYS.map((w) => (
                <View key={w} style={calStyles.weekdayCell}>
                  <Text style={calStyles.weekdayText}>{w}</Text>
                </View>
              ))}
            </View>

            {/* 日付グリッド */}
            <View style={calStyles.grid}>
              {weeks.map((wk, wi) => (
                <View key={wi} style={calStyles.weekRow}>
                  {wk.map((d, di) => {
                    if (d === null) {
                      return (
                        <View
                          key={`empty-${wi}-${di}`}
                          style={calStyles.dayCell}
                        />
                      );
                    }
                    const isToday =
                      d === todayDay &&
                      month === todayMonth &&
                      year === todayYear;
                    const isSel = d === selectedDay;
                    const dots = subsOnDay[d] ?? [];
                    return (
                      <TouchableOpacity
                        key={d}
                        style={calStyles.dayCell}
                        onPress={() =>
                          setSelectedDay(isSel ? null : d)
                        }
                        activeOpacity={0.7}
                      >
                        {/* 今日 / 選択日 のハイライト円 */}
                        {(isToday || isSel) && (
                          <View
                            style={[
                              calStyles.highlight,
                              isSel
                                ? calStyles.highlightSel
                                : calStyles.highlightToday,
                            ]}
                          />
                        )}
                        {/* 日付テキスト */}
                        <Text
                          style={[
                            calStyles.dayNum,
                            isToday && !isSel && calStyles.dayNumToday,
                            isSel && calStyles.dayNumSel,
                          ]}
                        >
                          {d}
                        </Text>
                        {/* 請求ドット（カテゴリ色） */}
                        {dots.length > 0 && (
                          <View style={calStyles.dotsRow}>
                            {dots.slice(0, 3).map((s) => (
                              <View
                                key={s.id}
                                style={[
                                  calStyles.billDot,
                                  { backgroundColor: s.color },
                                ]}
                              />
                            ))}
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* 選択日の請求一覧 */}
            {selectedDay !== null && (
              <View style={calStyles.selectedList}>
                <Text style={calStyles.selectedTitle}>
                  {month + 1}月{selectedDay}日の請求
                </Text>
                {selectedSubs.length === 0 ? (
                  <Text style={calStyles.selectedEmpty}>
                    この日の請求はありません
                  </Text>
                ) : (
                  selectedSubs.map((s) => (
                    <View key={s.id} style={calStyles.selectedItem}>
                      <View
                        style={[
                          calStyles.selectedDot,
                          { backgroundColor: s.color },
                        ]}
                      />
                      <Text style={calStyles.selectedName}>{s.name}</Text>
                      <Text style={calStyles.selectedAmount}>
                        {formatCurrency(s.amount, s.currency)}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState — サブスク未登録時の空状態UI
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ onAddPress }: { onAddPress?: () => void }) {
  return (
    <View style={emptyStyles.container}>
      {/* アイコン背景円 */}
      <View style={emptyStyles.iconWrapper}>
        <Ionicons name="albums-outline" size={48} color={P.accent} />
      </View>
      <Text style={emptyStyles.title}>まだサブスクがありません</Text>
      <Text style={emptyStyles.subtitle}>
        ＋ボタンでNetflixやSpotifyなど{'\n'}
        お使いのサービスを追加しましょう
      </Text>
      <TouchableOpacity
        style={emptyStyles.addBtn}
        onPress={onAddPress}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={18} color={P.textOnAccent} />
        <Text style={emptyStyles.addBtnText}>最初のサブスクを追加</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DashboardVariantB — メインコンポーネント
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardVariantBProps {
  onAddPress: () => void;
  onEditPress: (s: Subscription) => void;
}

export function DashboardVariantB({
  onAddPress,
  onEditPress,
}: DashboardVariantBProps) {
  const insets = useSafeAreaInsets();
  const {
    subscriptions,
    totalMonthly,
    deleteSubscription,
    updateSubscription,
  } = useSubscriptions();

  // UI状態
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // アクティブなサブスク一覧
  const activeSubs = useMemo(
    () => subscriptions.filter((s) => s.isActive),
    [subscriptions],
  );

  // 7日以内に請求が来るサブスク（日付昇順）
  const upcomingBillings = useMemo(() => {
    return activeSubs
      .map((s) => ({ sub: s, days: getDaysUntilBilling(s) }))
      .filter(({ days }) => days <= 7)
      .sort((a, b) => a.days - b.days);
  }, [activeSubs]);

  // 未使用サービス（30日以上タップなし）
  const unusedSubs = useMemo(
    () => activeSubs.filter((s) => isUnused(s)),
    [activeSubs],
  );

  // カテゴリフィルター適用後のリスト
  const filteredSubs = useMemo(() => {
    if (!selectedCategory) return activeSubs;
    if (selectedCategory === '⚠️未使用') return unusedSubs;
    return activeSubs.filter((s) => s.category === selectedCategory);
  }, [activeSubs, unusedSubs, selectedCategory]);

  // SectionList 用セクションデータ
  const sections = useMemo<{ title: string; data: Subscription[] }[]>(() => {
    const upcomingIds = new Set(upcomingBillings.map((u) => u.sub.id));
    const upcoming = filteredSubs.filter((s) => upcomingIds.has(s.id));
    const rest = filteredSubs.filter((s) => !upcomingIds.has(s.id));
    const result: { title: string; data: Subscription[] }[] = [];
    if (upcoming.length > 0) {
      result.push({ title: '7日以内に請求', data: upcoming });
    }
    if (rest.length > 0) {
      result.push({ title: 'すべてのサブスク', data: rest });
    }
    return result;
  }, [filteredSubs, upcomingBillings]);

  // タップ: 使用日時更新 + 詳細展開トグル
  const handleTap = useCallback(
    (sub: Subscription) => {
      updateSubscription(sub.id, {
        lastTappedAt: new Date().toISOString(),
      });
      setExpandedId((prev) => (prev === sub.id ? null : sub.id));
    },
    [updateSubscription],
  );

  const nextDays = upcomingBillings[0]?.days ?? null;

  // ── 空状態（サブスク未登録） ──────────────────────────────────────────────
  if (activeSubs.length === 0) {
    return (
      <View style={[mainStyles.container, { paddingTop: insets.top }]}>
        <SummaryBar
          totalMonthly={totalMonthly}
          nextDays={null}
          onCalendarPress={() => setShowCalendar(true)}
        />
        <EmptyState onAddPress={onAddPress} />
        {showCalendar && (
          <CalendarView
            subscriptions={[]}
            onClose={() => setShowCalendar(false)}
          />
        )}
      </View>
    );
  }

  // ── 通常表示 ──────────────────────────────────────────────────────────────
  return (
    <View style={mainStyles.container}>
      {/* [A] コンパクトサマリーバー */}
      <SummaryBar
        totalMonthly={totalMonthly}
        nextDays={nextDays}
        onCalendarPress={() => setShowCalendar(true)}
        topInset={insets.top}
      />

      {/* [B] カテゴリタグフィルター */}
      <CategoryTagFilter
        subscriptions={activeSubs}
        unusedCount={unusedSubs.length}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* [C] サブスクリスト（セクション付き） */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={mainStyles.sectionHeader}>
            <Text style={mainStyles.sectionTitle}>
              {(section as { title: string }).title}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => (
          <View style={mainStyles.separator} />
        )}
        renderItem={({ item }) => (
          <SwipeableRow onDelete={() => deleteSubscription(item.id)}>
            <SubscriptionListItem
              subscription={item}
              isExpanded={expandedId === item.id}
              daysUntilBilling={
                upcomingBillings.find((u) => u.sub.id === item.id)?.days
              }
              onPress={() => handleTap(item)}
              onEditPress={onEditPress}
            />
          </SwipeableRow>
        )}
        ListEmptyComponent={() => (
          <View style={mainStyles.filterEmpty}>
            <Ionicons name="search-outline" size={40} color={P.textMuted} />
            <Text style={mainStyles.filterEmptyText}>
              該当するサブスクはありません
            </Text>
          </View>
        )}
      />

      {/* [D] FAB（追加ボタン） */}
      <TouchableOpacity
        style={[mainStyles.fab, { bottom: insets.bottom + 20 }]}
        onPress={onAddPress}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* カレンダーモーダル */}
      {showCalendar && (
        <CalendarView
          subscriptions={activeSubs}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StyleSheets
// ─────────────────────────────────────────────────────────────────────────────

const swipeStyles = StyleSheet.create({
  deleteBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: BUTTON_W,
    backgroundColor: P.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
  },
});

const summaryStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: P.surface,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  left: {
    flex: 1,
  },
  vDivider: {
    width: 1,
    height: 32,
    backgroundColor: P.separator,
    marginHorizontal: 16,
  },
  right: {
    flex: 1,
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 11,
    color: P.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: P.textPrimary,
    letterSpacing: -0.5,
  },
  accentValue: {
    fontSize: 22,
    fontWeight: '700',
    color: P.accent,
    letterSpacing: -0.5,
  },
  calBtn: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: P.surfaceSunken,
  },
});

const tagStyles = StyleSheet.create({
  wrapper: {
    paddingVertical: 10,
    backgroundColor: P.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: P.divider,
  },
  scroll: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: P.surfaceSunken,
    borderWidth: 1,
    borderColor: P.border,
  },
  tagActive: {
    backgroundColor: P.accent,
    borderColor: P.accent,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: P.textSecondary,
  },
  tagTextActive: {
    color: P.textOnAccent,
    fontWeight: '600',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
});

const itemStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: P.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 68,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: P.textPrimary,
    lineHeight: 20,
    flex: 1,
    marginRight: 6,
  },
  unusedBadge: {
    fontSize: 14,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  dateText: {
    fontSize: 12,
    color: P.textMuted,
    marginRight: 6,
  },
  catDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  catLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    color: P.textPrimary,
  },
  countdown: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expandPanel: {
    backgroundColor: P.surfaceSunken,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  expandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 12,
  },
  expandCell: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: P.surface,
    borderRadius: 10,
    padding: 10,
  },
  cellLabel: {
    fontSize: 10,
    color: P.textMuted,
    marginBottom: 3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cellValue: {
    fontSize: 14,
    fontWeight: '600',
    color: P.textPrimary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.accent,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: P.accent,
    marginLeft: 4,
  },
});

const calStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    height: SHEET_H,
    backgroundColor: P.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: P.divider,
  },
  navBtn: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: P.surfaceSunken,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: P.textPrimary,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: P.surfaceSunken,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 11,
    color: P.textMuted,
    fontWeight: '500',
  },
  grid: {
    paddingHorizontal: 8,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlight: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  highlightToday: {
    backgroundColor: P.accentLight,
  },
  highlightSel: {
    backgroundColor: P.accent,
  },
  dayNum: {
    fontSize: 15,
    fontWeight: '400',
    color: P.textPrimary,
  },
  dayNumToday: {
    color: P.accent,
    fontWeight: '700',
  },
  dayNumSel: {
    color: P.textOnAccent,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: 2,
    height: 6,
    gap: 2,
  },
  billDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  selectedList: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  selectedTitle: {
    fontSize: 11,
    color: P.textMuted,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  selectedEmpty: {
    fontSize: 14,
    color: P.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: P.separator,
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  selectedName: {
    flex: 1,
    fontSize: 14,
    color: P.textPrimary,
    fontWeight: '500',
  },
  selectedAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: P.textPrimary,
  },
});

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: P.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: P.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: P.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: P.accent,
    shadowColor: P.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: P.textOnAccent,
    marginLeft: 6,
  },
});

const mainStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.background,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: P.background,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: P.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: P.separator,
    marginLeft: 76, // 20(paddingLeft) + 44(アイコン幅) + 12(マージン)
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: P.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: P.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  filterEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  filterEmptyText: {
    fontSize: 15,
    color: P.textMuted,
    marginTop: 12,
  },
});
