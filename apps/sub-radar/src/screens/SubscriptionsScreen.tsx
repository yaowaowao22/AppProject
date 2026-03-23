import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Animated,
  PanResponder,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, H1, H2, Body, Caption, Card, Button, Badge } from '@massapp/ui';
import { useLocalStorage } from '@massapp/hooks';
import type { Subscription, Currency, Category } from '../types';
import {
  CURRENCIES,
  CATEGORIES,
  CURRENCY_SYMBOLS,
  FREE_LIMIT,
  toJPY,
  daysUntilBilling,
  isUnused,
} from '../types';

const BUTTON_W = 72;
const { width: SCREEN_W } = Dimensions.get('window');

function SwipeableRow({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const offsetRef = useRef(0);
  const { colors } = useTheme();

  const snap = (to: number) => {
    offsetRef.current = to;
    Animated.timing(translateX, { toValue: to, duration: 200, useNativeDriver: true }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 4 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => {
        translateX.setValue(Math.max(Math.min(offsetRef.current + g.dx, 0), -SCREEN_W));
      },
      onPanResponderRelease: (_, g) => {
        const next = offsetRef.current + g.dx;
        if (g.vx < -0.5 || next < -BUTTON_W * 0.4) snap(-BUTTON_W);
        else snap(0);
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  return (
    <View style={{ overflow: 'hidden' }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => { snap(0); onDelete(); }}
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

const defaultForm = {
  name: '',
  amount: '',
  billingDay: '1',
  currency: 'JPY' as Currency,
  category: 'その他' as Category,
};

export function SubscriptionsScreen() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [subscriptions, setSubscriptions] = useLocalStorage<Subscription[]>('subradar_subscriptions', []);
  const [isPremium] = useLocalStorage('subradar_is_premium', false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const handleAdd = useCallback(() => {
    if (!form.name.trim()) {
      Alert.alert('エラー', 'サービス名を入力してください');
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('エラー', '金額を正しく入力してください');
      return;
    }
    const billingDay = parseInt(form.billingDay, 10);
    if (isNaN(billingDay) || billingDay < 1 || billingDay > 28) {
      Alert.alert('エラー', '請求日は1〜28の範囲で入力してください');
      return;
    }
    if (!isPremium && subscriptions.length >= FREE_LIMIT) {
      Alert.alert(
        '無料プランの上限',
        `無料プランでは${FREE_LIMIT}件まで登録できます。\n設定タブからプレミアムにアップグレードしてください。`
      );
      return;
    }

    const newSub: Subscription = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: form.name.trim(),
      amount,
      billingDay,
      currency: form.currency,
      category: form.category,
      createdAt: new Date().toISOString(),
      lastTappedAt: new Date().toISOString(),
    };
    setSubscriptions([...subscriptions, newSub]);
    setForm(defaultForm);
    setModalVisible(false);
  }, [form, subscriptions, setSubscriptions, isPremium]);

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert('削除確認', 'このサブスクを削除しますか？', [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: () => setSubscriptions(subscriptions.filter((s) => s.id !== id)) },
      ]);
    },
    [subscriptions, setSubscriptions]
  );

  const handleTap = useCallback(
    (id: string) => {
      setSubscriptions(
        subscriptions.map((s) => (s.id === id ? { ...s, lastTappedAt: new Date().toISOString() } : s))
      );
    },
    [subscriptions, setSubscriptions]
  );

  const renderItem = ({ item }: { item: Subscription }) => {
    const unused = isUnused(item.lastTappedAt);
    const daysLeft = daysUntilBilling(item.billingDay);

    return (
      <SwipeableRow onDelete={() => handleDelete(item.id)}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => handleTap(item.id)}>
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.nameRow}>
                {unused && (
                  <Ionicons name="warning-outline" size={16} color={colors.warning} style={{ marginRight: 4 }} />
                )}
                <H2 style={{ fontSize: 15, flex: 1 }}>{item.name}</H2>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Body style={{ fontWeight: '600' }}>
                  {CURRENCY_SYMBOLS[item.currency]}{item.amount.toLocaleString()}
                  <Caption color={colors.textMuted}>/月</Caption>
                </Body>
                {item.currency !== 'JPY' && (
                  <Caption color={colors.textMuted}>
                    ≈¥{toJPY(item.amount, item.currency).toLocaleString()}
                  </Caption>
                )}
              </View>
            </View>
            <View style={[styles.cardFooter, { marginTop: spacing.xs }]}>
              <Badge label={item.category} variant="info" />
              <Caption color={daysLeft <= 3 ? colors.error : daysLeft <= 7 ? colors.warning : colors.textMuted}>
                {daysLeft === 0 ? '今日請求' : `${daysLeft}日後（毎月${item.billingDay}日）`}
              </Caption>
            </View>
          </Card>
        </TouchableOpacity>
      </SwipeableRow>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { padding: spacing.md, paddingBottom: spacing.sm }]}>
        <View>
          <H1 style={{ fontSize: 24 }}>サブスク一覧</H1>
          <Caption color={colors.textMuted}>
            {isPremium ? `${subscriptions.length}件` : `${subscriptions.length}/${FREE_LIMIT}件（無料）`}
          </Caption>
        </View>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[styles.addButton, { backgroundColor: colors.primary, borderRadius: radius.full }]}
        >
          <Ionicons name="add" size={22} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={subscriptions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          subscriptions.length === 0
            ? styles.emptyList
            : { paddingHorizontal: spacing.md, paddingBottom: 16 }
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={64} color={colors.textMuted} />
            <H2 style={{ marginTop: spacing.md }} color={colors.textSecondary}>
              まだサブスクがありません
            </H2>
            <Body color={colors.textMuted} style={{ marginTop: spacing.sm, textAlign: 'center' }}>
              ＋ボタンからサブスクを追加しましょう
            </Body>
          </View>
        }
      />

      {/* 追加モーダル */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
            <View style={[styles.modalHeader, { padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
              <H2 style={{ fontSize: 18 }}>サブスクを追加</H2>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.md }} showsVerticalScrollIndicator={false}>
              {/* サービス名 */}
              <Caption color={colors.textSecondary} style={styles.label}>サービス名 *</Caption>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, borderRadius: radius.sm }]}
                placeholder="例: Netflix, Spotify"
                placeholderTextColor={colors.textMuted}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              />

              {/* 金額・通貨 */}
              <Caption color={colors.textSecondary} style={styles.label}>金額 *</Caption>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: colors.background, color: colors.text, borderColor: colors.border, borderRadius: radius.sm }]}
                  placeholder="1490"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={form.amount}
                  onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
                />
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {CURRENCIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setForm((f) => ({ ...f, currency: c }))}
                      style={[
                        styles.chipButton,
                        {
                          backgroundColor: form.currency === c ? colors.primary : colors.background,
                          borderColor: form.currency === c ? colors.primary : colors.border,
                          borderRadius: radius.sm,
                        },
                      ]}
                    >
                      <Caption color={form.currency === c ? colors.textOnPrimary : colors.textSecondary}>
                        {c}
                      </Caption>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 請求日 */}
              <Caption color={colors.textSecondary} style={styles.label}>毎月の請求日 *</Caption>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, borderRadius: radius.sm }]}
                placeholder="1〜28"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={form.billingDay}
                onChangeText={(v) => setForm((f) => ({ ...f, billingDay: v }))}
              />

              {/* カテゴリ */}
              <Caption color={colors.textSecondary} style={styles.label}>カテゴリ</Caption>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setForm((f) => ({ ...f, category: cat }))}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: form.category === cat ? colors.primary : colors.background,
                        borderColor: form.category === cat ? colors.primary : colors.border,
                        borderRadius: radius.sm,
                      },
                    ]}
                  >
                    <Caption color={form.category === cat ? colors.textOnPrimary : colors.textSecondary}>
                      {cat}
                    </Caption>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={{ padding: spacing.md, paddingTop: 0 }}>
              <Button title="追加する" onPress={handleAdd} variant="primary" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: { padding: 12 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyList: { flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 2,
  },
  chipButton: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
});
