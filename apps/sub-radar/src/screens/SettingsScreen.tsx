import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  TouchableOpacity,
  Linking,
} from 'react-native';

// ── カラーパレット ──────────────────────────────────
const AC = {
  bgDeep:       '#0D1117',
  bgCard:       '#161B22',
  teal:         '#26C6DA',
  textBright:   '#E6EDF3',
  textMid:      '#8B949E',
  borderSubtle: '#21262D',
};
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  useTheme,
  H1,
  H2,
  Body,
  Caption,
  Card,
  Button,
  Badge,
  Divider,
  ListItem,
} from '@massapp/ui';
import type { ThemeMode } from '@massapp/ui';
import { useLocalStorage } from '@massapp/hooks';
import { useSubscriptions } from '../SubscriptionContext';
import { FREE_LIMIT } from '../types';
import type { Currency } from '../types';
import { APP_VERSION, APP_NAME, STORE_KEYS, PREMIUM_PRICE_JPY, USE_MOCK_PURCHASES } from '../config';
import {
  scheduleSubscriptionReminders,
  getScheduledCount,
} from '../utils/notificationUtils';

export function SettingsScreen() {
  const { colors, spacing, radius, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { subscriptions, isPremium, deleteSubscription } = useSubscriptions();

  // プレミアム状態（購入モック用）
  const [, setIsPremium] = useLocalStorage<boolean>(STORE_KEYS.isPremium, false);
  // テーマ永続化
  const [, setSavedMode] = useLocalStorage<string>(STORE_KEYS.themeMode, 'system');
  // 通知設定
  const [notify3days, setNotify3days] = useLocalStorage<boolean>('sub_notify_3days', true);
  const [notify1day, setNotify1day] = useLocalStorage<boolean>('sub_notify_1day', true);
  // デフォルト通貨
  const [defaultCurrency, setDefaultCurrency] = useLocalStorage<Currency>(
    'sub_default_currency',
    'JPY',
  );

  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [scheduledCount, setScheduledCount] = useState<number>(0);

  // 画面表示時にスケジュール済み件数を取得
  useEffect(() => {
    getScheduledCount()
      .then(setScheduledCount)
      .catch(() => {});
  }, []);

  const handleNotify3daysChange = useCallback(
    (val: boolean) => {
      setNotify3days(val);
      scheduleSubscriptionReminders(subscriptions, val, notify1day ?? true)
        .then(() => getScheduledCount())
        .then(setScheduledCount)
        .catch(() => {});
    },
    [setNotify3days, subscriptions, notify1day],
  );

  const handleNotify1dayChange = useCallback(
    (val: boolean) => {
      setNotify1day(val);
      scheduleSubscriptionReminders(subscriptions, notify3days ?? true, val)
        .then(() => getScheduledCount())
        .then(setScheduledCount)
        .catch(() => {});
    },
    [setNotify1day, subscriptions, notify3days],
  );

  const handleSetMode = useCallback(
    (m: ThemeMode) => {
      setMode(m);
      setSavedMode(m);
    },
    [setMode, setSavedMode],
  );

  // プレミアム購入（モック: __DEV__ 環境のみ動作。フェーズ2で RevenueCat 連携予定）
  const handlePurchase = useCallback(async () => {
    if (!USE_MOCK_PURCHASES) {
      Alert.alert('近日公開', 'アプリ内課金は近日公開予定です。');
      return;
    }
    setPurchasing(true);
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 800));
      setIsPremium(true);
      Alert.alert('購入完了', 'プレミアムプランが有効になりました！\n登録数が無制限になります。');
    } catch {
      Alert.alert('エラー', '購入処理中にエラーが発生しました');
    }
    setPurchasing(false);
  }, [setIsPremium]);

  // 購入復元（モック）
  const handleRestorePurchase = useCallback(async () => {
    setRestoring(true);
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 800));
      Alert.alert('復元結果', '復元可能な購入が見つかりませんでした');
    } catch {
      Alert.alert('エラー', '復元処理中にエラーが発生しました');
    }
    setRestoring(false);
  }, []);

  // 全サブスク削除
  const handleClearAll = useCallback(() => {
    if (subscriptions.length === 0) {
      Alert.alert('データなし', '削除するサブスクはありません');
      return;
    }
    Alert.alert(
      '全サブスクを削除',
      `${subscriptions.length}件のサブスクをすべて削除しますか？\nこの操作は元に戻せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'すべて削除',
          style: 'destructive',
          onPress: () => {
            subscriptions.forEach((s) => deleteSubscription(s.id));
            Alert.alert('完了', 'すべてのサブスクを削除しました');
          },
        },
      ],
    );
  }, [subscriptions, deleteSubscription]);

  return (
    <View style={[styles.container, { backgroundColor: AC.bgDeep, paddingTop: insets.top }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <H1 style={{ fontSize: 24, marginBottom: spacing.md, color: AC.textBright }}>設定</H1>

        {/* ── プランセクション ─────────────────────────────── */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md, backgroundColor: AC.bgCard, borderColor: AC.borderSubtle }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="diamond-outline" size={20} color={colors.primary} />
            <H2 style={{ fontSize: 16, marginLeft: 8 }}>プラン</H2>
          </View>
          <View
            style={[
              styles.planCard,
              {
                backgroundColor: isPremium ? colors.success + '15' : colors.primaryLight + '15',
                borderRadius: radius.md,
                padding: spacing.md,
                marginTop: spacing.sm,
              },
            ]}
          >
            <View style={styles.planHeader}>
              <View>
                <H2 style={{ fontSize: 18 }}>
                  {isPremium ? 'プレミアム' : '無料プラン'}
                </H2>
                <Caption color={colors.textSecondary}>
                  {isPremium
                    ? '登録数無制限・買い切り済み'
                    : `${FREE_LIMIT}件まで無料`}
                </Caption>
              </View>
              <Badge
                label={isPremium ? '有効' : `${subscriptions.length}/${FREE_LIMIT}`}
                variant="filled"
                color={isPremium ? AC.teal : AC.textMid}
              />
            </View>
            {!isPremium && (
              <View style={{ marginTop: spacing.sm }}>
                {[
                  '✓ 登録数無制限',
                  '✓ 月次トレンド分析',
                  '✓ 通知カスタマイズ',
                  '✓ CSV出力（近日公開）',
                ].map((feat) => (
                  <Text key={feat} style={{ color: AC.teal, fontSize: 13, marginBottom: 4 }}>
                    {feat}
                  </Text>
                ))}
                <Button
                  title={purchasing ? '処理中...' : `プレミアムにアップグレード — ¥${PREMIUM_PRICE_JPY}`}
                  onPress={handlePurchase}
                  variant="primary"
                  style={{ marginTop: spacing.sm }}
                  disabled={purchasing}
                />
              </View>
            )}
          </View>
          <View style={{ marginTop: spacing.sm }}>
            <Divider />
            <ListItem
              title="購入を復元"
              subtitle={restoring ? '復元中...' : '別端末での購入を復元'}
              onPress={restoring ? undefined : handleRestorePurchase}
              rightIcon={
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              }
            />
          </View>
        </Card>

        {/* ── 通知設定セクション ───────────────────────────── */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md, backgroundColor: AC.bgCard, borderColor: AC.borderSubtle }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
            <H2 style={{ fontSize: 16, marginLeft: 8 }}>通知設定</H2>
          </View>
          <View style={{ marginTop: spacing.sm }}>
            <View style={styles.switchRow}>
              <Body>請求日の3日前に通知</Body>
              <Switch
                value={notify3days}
                onValueChange={handleNotify3daysChange}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor={notify3days ? colors.textOnPrimary : colors.textMuted}
              />
            </View>
            <Divider style={{ marginVertical: spacing.xs }} />
            <View style={styles.switchRow}>
              <Body>請求日の前日に通知</Body>
              <Switch
                value={notify1day}
                onValueChange={handleNotify1dayChange}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor={notify1day ? colors.textOnPrimary : colors.textMuted}
              />
            </View>
            <Caption color={colors.textMuted} style={{ marginTop: spacing.xs }}>
              {scheduledCount}件スケジュール済み
            </Caption>
          </View>
        </Card>

        {/* ── 表示設定セクション ───────────────────────────── */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md, backgroundColor: AC.bgCard, borderColor: AC.borderSubtle }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
            <H2 style={{ fontSize: 16, marginLeft: 8 }}>表示設定</H2>
          </View>
          <View style={{ marginTop: spacing.sm }}>
            {/* テーマ切替 */}
            <Body color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
              テーマ
            </Body>
            <View style={styles.segmentRow}>
              {([
                ['light',  'sunny-outline',           'ライト'],
                ['dark',   'moon-outline',             'ダーク'],
                ['system', 'phone-portrait-outline',   '自動'],
              ] as const).map(([m, icon, label]) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => handleSetMode(m as ThemeMode)}
                  style={[
                    styles.segmentButton,
                    {
                      backgroundColor: mode === m ? colors.primary : colors.surface,
                      borderColor:     mode === m ? colors.primary : colors.border,
                      borderRadius:    radius.sm,
                    },
                  ]}
                >
                  <Ionicons
                    name={icon as any}
                    size={18}
                    color={mode === m ? colors.textOnPrimary : colors.text}
                  />
                  <Caption
                    color={mode === m ? colors.textOnPrimary : colors.textSecondary}
                    style={{ fontSize: 11, marginTop: 2 }}
                  >
                    {label}
                  </Caption>
                </TouchableOpacity>
              ))}
            </View>

            <Divider style={{ marginVertical: spacing.sm }} />

            {/* デフォルト通貨 */}
            <Body color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
              デフォルト通貨
            </Body>
            <View style={styles.segmentRow}>
              {(['JPY', 'USD', 'EUR'] as Currency[]).map((cur) => (
                <TouchableOpacity
                  key={cur}
                  onPress={() => setDefaultCurrency(cur)}
                  style={[
                    styles.segmentButton,
                    {
                      backgroundColor: defaultCurrency === cur ? colors.primary : colors.surface,
                      borderColor:     defaultCurrency === cur ? colors.primary : colors.border,
                      borderRadius:    radius.sm,
                    },
                  ]}
                >
                  <Caption
                    color={defaultCurrency === cur ? colors.textOnPrimary : colors.textSecondary}
                    style={{ fontSize: 14, fontWeight: '600' }}
                  >
                    {cur === 'JPY' ? '¥ JPY' : cur === 'USD' ? '$ USD' : '€ EUR'}
                  </Caption>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        {/* ── データセクション ─────────────────────────────── */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md, backgroundColor: AC.bgCard, borderColor: AC.borderSubtle }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trash-outline" size={20} color={colors.primary} />
            <H2 style={{ fontSize: 16, marginLeft: 8 }}>データ</H2>
          </View>
          <View style={{ marginTop: spacing.sm }}>
            <ListItem
              title="全サブスクを削除"
              subtitle={`${subscriptions.length}件のサブスク`}
              onPress={handleClearAll}
              rightIcon={
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              }
            />
          </View>
        </Card>

        {/* ── このアプリについてセクション ─────────────────── */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md, backgroundColor: AC.bgCard, borderColor: AC.borderSubtle }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <H2 style={{ fontSize: 16, marginLeft: 8 }}>このアプリについて</H2>
          </View>
          <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
            <View style={styles.aboutRow}>
              <Body color={colors.textSecondary}>バージョン</Body>
              <Body>{APP_VERSION}</Body>
            </View>
            <View style={styles.aboutRow}>
              <Body color={colors.textSecondary}>アプリ名</Body>
              <Body>{APP_NAME}</Body>
            </View>
            <Divider />
            <Caption color={colors.textMuted} style={{ lineHeight: 18 }}>
              サブスクリプションを一括管理し、無駄な支出を見える化するアプリです。
              口座連携なし・データはデバイス内のみに保存します。
            </Caption>
            <Divider />
            <ListItem
              title="プライバシーポリシー"
              onPress={() =>
                Linking.openURL('https://massapp.example.com/sub-radar/privacy')
              }
              rightIcon={<Ionicons name="open-outline" size={16} color={colors.textMuted} />}
            />
            <ListItem
              title="利用規約"
              onPress={() =>
                Linking.openURL(
                  'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
                )
              }
              rightIcon={<Ionicons name="open-outline" size={16} color={colors.textMuted} />}
            />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planCard: {},
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
