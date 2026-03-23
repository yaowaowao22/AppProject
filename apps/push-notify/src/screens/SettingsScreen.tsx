import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, Linking, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, H1, H2, Body, Caption, Card, Button, Badge, Divider, ListItem } from '@massapp/ui';
import type { ThemeMode } from '@massapp/ui';
import { useLocalStorage } from '@massapp/hooks';
import type { PushNotification } from '../types';
import { FREE_LIMIT } from '../types';
import { generateApiKey, getCurrentMonthKey } from '../utils/apiKey';
import { useUsage } from '../UsageContext';
import { buyPremium, restorePurchases } from '../utils/purchases';
import { API_BASE } from '../config';

const WHATS_NEW_ITEMS = [
  { icon: 'moon-outline', title: 'ダークモード', desc: '設定タブからライト/ダーク/自動を切り替えられます', type: 'new' },
  { icon: 'text-outline', title: 'フォントカスタマイズ', desc: 'フォントサイズとカラーを自由に調整できます', type: 'new' },
  { icon: 'folder-outline', title: 'カテゴリ機能', desc: '通知にカテゴリを設定してグループ分けできます', type: 'new' },
  { icon: 'funnel-outline', title: '未読/既読フィルター', desc: '受信箱で未読・既読の絞り込みができます', type: 'new' },
  { icon: 'ellipse', title: '未読マーク', desc: '未読通知にドットマークが表示されます', type: 'new' },
  { icon: 'time-outline', title: '受信時刻の修正', desc: '受信時刻がアプリを開いた時間になる問題を修正', type: 'fix' },
  { icon: 'color-palette-outline', title: '既読文字色の改善', desc: '既読通知の文字色が薄すぎた問題を改善', type: 'fix' },
  { icon: 'notifications-outline', title: 'タブバー・受信箱の修正', desc: 'タブバーが切れる・受信箱が更新されない問題を修正', type: 'fix' },
];

export function SettingsScreen() {
  const { colors, spacing, radius, mode, setMode, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { usage, isPremium } = useUsage();
  const [, setIsPremium] = useLocalStorage('push_is_premium', false);
  const [apiKey, setApiKey] = useLocalStorage<string | null>('push_api_key', null);
  const [notifications, setNotifications] = useLocalStorage<PushNotification[]>(
    'push_notifications',
    []
  );
  const [fontSize, setFontSize] = useLocalStorage<number>('push_font_size', 14);
  const [fontColor, setFontColor] = useLocalStorage<string | null>('push_font_color', null);
  const [inboxLayout, setInboxLayout] = useLocalStorage<'flat' | 'category'>('push_inbox_layout', 'flat');
  const [, setSavedMode] = useLocalStorage<string>('push_theme_mode', 'system');

  const handleSetMode = useCallback((m: ThemeMode) => {
    setMode(m);
    setSavedMode(m);
  }, [setMode, setSavedMode]);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  const syncPremiumToServer = useCallback(
    (token: string) => {
      fetch(`${API_BASE}/api/premium`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).catch(() => {});
    },
    []
  );

  const handlePurchase = useCallback(async () => {
    setPurchasing(true);
    try {
      const result = await buyPremium();
      if (result.success) {
        setIsPremium(true);
        if (apiKey) syncPremiumToServer(apiKey);
        Alert.alert('購入完了', 'プレミアムプランが有効になりました！\n送信数が無制限になります。');
      } else if (result.error !== 'cancelled') {
        Alert.alert('購入エラー', result.error ?? '購入処理に失敗しました');
      }
    } catch {
      Alert.alert('エラー', '購入処理中にエラーが発生しました');
    }
    setPurchasing(false);
  }, [setIsPremium, apiKey, syncPremiumToServer]);

  const handleRestorePurchase = useCallback(async () => {
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        setIsPremium(true);
        if (apiKey) syncPremiumToServer(apiKey);
        Alert.alert('復元完了', 'プレミアムプランが復元されました！');
      } else {
        Alert.alert('復元結果', '復元可能な購入が見つかりませんでした');
      }
    } catch {
      Alert.alert('エラー', '復元処理中にエラーが発生しました');
    }
    setRestoring(false);
  }, [setIsPremium, apiKey, syncPremiumToServer]);

  const handleResetKey = useCallback(() => {
    Alert.alert(
      'APIキーをリセット',
      '新しいAPIキーが発行されます。古いキーは使えなくなります。\n\n連携中のサービスのキーも更新してください。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: () => {
            setApiKey(generateApiKey());
            Alert.alert('完了', '新しいAPIキーが発行されました');
          },
        },
      ]
    );
  }, [setApiKey]);

  const handleClearHistory = useCallback(() => {
    if (notifications.length === 0) {
      Alert.alert('通知なし', '削除する通知はありません');
      return;
    }
    Alert.alert('通知履歴を削除', `${notifications.length}件の通知をすべて削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'すべて削除',
        style: 'destructive',
        onPress: () => {
          setNotifications([]);
          Alert.alert('完了', '通知履歴を削除しました');
        },
      },
    ]);
  }, [notifications, setNotifications]);

  const monthKey = getCurrentMonthKey();
  const currentCount = usage.monthKey === monthKey ? usage.count : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <H1 style={{ fontSize: 24, marginBottom: spacing.md }}>設定</H1>

        {/* Plan Section */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
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
                    ? '送信数無制限・買い切り済み'
                    : `月${FREE_LIMIT}通まで無料`}
                </Caption>
              </View>
              <Badge
                label={isPremium ? '有効' : `${currentCount}/${FREE_LIMIT}`}
                variant={isPremium ? 'success' : 'info'}
              />
            </View>
            {!isPremium && (
              <>
                <Button
                  title={purchasing ? '処理中...' : 'プレミアムにアップグレード — ¥300'}
                  onPress={handlePurchase}
                  variant="primary"
                  style={{ marginTop: spacing.md }}
                  disabled={purchasing}
                />
                {purchasing && (
                  <ActivityIndicator style={{ marginTop: spacing.sm }} color={colors.primary} />
                )}
              </>
            )}
          </View>
        </Card>

        {/* Account Section */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={colors.primary} />
            <H2 style={{ fontSize: 16, marginLeft: 8 }}>アカウント</H2>
          </View>
          <View style={{ marginTop: spacing.sm }}>
            <ListItem
              title="APIキーをリセット"
              subtitle="新しいキーを発行します"
              onPress={handleResetKey}
              rightIcon={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
            />
            <Divider />
            <ListItem
              title="購入を復元"
              subtitle={restoring ? '復元中...' : '別端末での購入を復元'}
              onPress={restoring ? undefined : handleRestorePurchase}
              rightIcon={
                restoring
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              }
            />
          </View>
        </Card>

        {/* Data Section */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trash-outline" size={20} color={colors.primary} />
            <H2 style={{ fontSize: 16, marginLeft: 8 }}>データ</H2>
          </View>
          <View style={{ marginTop: spacing.sm }}>
            <ListItem
              title="通知履歴を削除"
              subtitle={`${notifications.length}件の通知`}
              onPress={handleClearHistory}
              rightIcon={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
            />
          </View>
        </Card>

        {/* Display Section */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="text-outline" size={20} color={colors.primary} />
            <H2 style={{ fontSize: 16, marginLeft: 8 }}>表示設定</H2>
          </View>
          <View style={{ marginTop: spacing.sm }}>
            {/* Dark Mode */}
            <Body color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>テーマ</Body>
            <View style={styles.themeRow}>
              {([['light', 'sunny-outline', 'ライト'], ['dark', 'moon-outline', 'ダーク'], ['system', 'phone-portrait-outline', '自動']] as const).map(([m, icon, label]) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => handleSetMode(m as ThemeMode)}
                  style={[
                    styles.themeButton,
                    {
                      backgroundColor: mode === m ? colors.primary : colors.surface,
                      borderColor: mode === m ? colors.primary : colors.border,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Ionicons name={icon as any} size={18} color={mode === m ? colors.textOnPrimary : colors.text} />
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

            {/* Inbox Layout */}
            <Body color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>受信箱レイアウト</Body>
            <View style={styles.themeRow}>
              {([
                ['flat', 'list-outline', 'リスト'],
                ['category', 'folder-outline', 'カテゴリ'],
              ] as const).map(([layout, icon, label]) => (
                <TouchableOpacity
                  key={layout}
                  onPress={() => setInboxLayout(layout)}
                  style={[
                    styles.themeButton,
                    {
                      backgroundColor: inboxLayout === layout ? colors.primary : colors.surface,
                      borderColor: inboxLayout === layout ? colors.primary : colors.border,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Ionicons name={icon as any} size={18} color={inboxLayout === layout ? colors.textOnPrimary : colors.text} />
                  <Caption
                    color={inboxLayout === layout ? colors.textOnPrimary : colors.textSecondary}
                    style={{ fontSize: 11, marginTop: 2 }}
                  >
                    {label}
                  </Caption>
                </TouchableOpacity>
              ))}
            </View>

            <Divider style={{ marginVertical: spacing.sm }} />

            {/* Font Size */}
            <View style={styles.aboutRow}>
              <Body color={colors.textSecondary}>フォントサイズ</Body>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setFontSize(Math.max(11, fontSize - 1))}
                  style={[styles.fontSizeButton, { borderColor: colors.border, borderRadius: radius.sm }]}
                >
                  <Ionicons name="remove" size={18} color={colors.text} />
                </TouchableOpacity>
                <Body style={{ fontSize: 16, minWidth: 28, textAlign: 'center' }}>{fontSize}</Body>
                <TouchableOpacity
                  onPress={() => setFontSize(Math.min(22, fontSize + 1))}
                  style={[styles.fontSizeButton, { borderColor: colors.border, borderRadius: radius.sm }]}
                >
                  <Ionicons name="add" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <Divider style={{ marginVertical: spacing.sm }} />

            {/* Font Color */}
            <Body color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>フォントカラー</Body>
            <View style={styles.colorRow}>
              {[
                { value: null, label: 'デフォルト', color: colors.text },
                { value: '#1A237E', label: '紺', color: '#1A237E' },
                { value: '#333333', label: '濃灰', color: '#333333' },
                { value: '#4A4A4A', label: '灰', color: '#4A4A4A' },
                { value: '#1B5E20', label: '緑', color: '#1B5E20' },
                { value: '#B71C1C', label: '赤', color: '#B71C1C' },
                { value: '#E8EAF6', label: '白', color: '#E8EAF6' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  onPress={() => setFontColor(opt.value)}
                  style={[
                    styles.colorButton,
                    {
                      borderColor: fontColor === opt.value ? colors.primary : colors.border,
                      borderWidth: fontColor === opt.value ? 2 : 1,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <View style={[styles.colorSwatch, { backgroundColor: opt.color, borderRadius: 10 }]} />
                  <Caption style={{ fontSize: 9 }} color={colors.textSecondary}>{opt.label}</Caption>
                </TouchableOpacity>
              ))}
            </View>

            {/* Preview */}
            <View style={[styles.fontPreview, { backgroundColor: colors.backgroundSecondary, borderRadius: radius.sm, marginTop: spacing.sm, padding: spacing.sm }]}>
              <Body style={{ fontSize, lineHeight: fontSize * 1.5, color: fontColor ?? colors.text }}>
                プレビュー: このサイズと色で通知が表示されます
              </Body>
            </View>
            {(fontSize !== 14 || fontColor !== null) && (
              <TouchableOpacity onPress={() => { setFontSize(14); setFontColor(null); }} style={{ marginTop: spacing.xs }}>
                <Caption color={colors.primary}>すべてデフォルトに戻す</Caption>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* About Section */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <H2 style={{ fontSize: 16, marginLeft: 8 }}>このアプリについて</H2>
          </View>
          <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
            <View style={styles.aboutRow}>
              <Body color={colors.textSecondary}>バージョン</Body>
              <Body>1.1.0-ota7</Body>
            </View>
            <View style={styles.aboutRow}>
              <Body color={colors.textSecondary}>アプリ名</Body>
              <Body>かんたんプッシュ</Body>
            </View>
            <Divider />
            <Caption color={colors.textMuted} style={{ lineHeight: 18 }}>
              外部サービスやスクリプトから、スマホにプッシュ通知を簡単に送れるアプリです。
              サーバー監視、IoTアラート、CI/CD通知などにお使いください。
            </Caption>
            <Divider />
            <ListItem
              title="新機能・修正履歴"
              onPress={() => setShowWhatsNew(!showWhatsNew)}
              rightIcon={<Ionicons name={showWhatsNew ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />}
            />
            {showWhatsNew && (
              <View style={{ gap: spacing.xs, marginBottom: spacing.xs }}>
                <Caption color={colors.textMuted} style={{ fontWeight: '600' }}>新機能</Caption>
                {WHATS_NEW_ITEMS.filter(i => i.type === 'new').map((item, i) => (
                  <View key={`new-${i}`} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                    <Ionicons name={item.icon as any} size={16} color={colors.primary} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Caption color={colors.text} style={{ fontWeight: '600' }}>{item.title}</Caption>
                      <Caption color={colors.textSecondary}>{item.desc}</Caption>
                    </View>
                  </View>
                ))}
                <Caption color={colors.textMuted} style={{ fontWeight: '600', marginTop: spacing.xs }}>不具合修正</Caption>
                {WHATS_NEW_ITEMS.filter(i => i.type === 'fix').map((item, i) => (
                  <View key={`fix-${i}`} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                    <Ionicons name={item.icon as any} size={16} color={colors.success} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Caption color={colors.text} style={{ fontWeight: '600' }}>{item.title}</Caption>
                      <Caption color={colors.textSecondary}>{item.desc}</Caption>
                    </View>
                  </View>
                ))}
              </View>
            )}
            <Divider />
            <ListItem
              title="プライバシーポリシー"
              onPress={() => Linking.openURL('https://push-api.selectinfo-yaowao.workers.dev/privacy')}
              rightIcon={<Ionicons name="open-outline" size={16} color={colors.textMuted} />}
            />
            <ListItem
              title="利用規約"
              onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}
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
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fontSizeButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontPreview: {},
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorButton: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  colorSwatch: {
    width: 20,
    height: 20,
    marginBottom: 2,
  },
});
