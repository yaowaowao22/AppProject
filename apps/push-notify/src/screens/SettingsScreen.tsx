import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, H1, H2, Body, Caption, Card, Button, Badge, Divider, ListItem } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { PushNotification, UsageInfo } from '../types';
import { FREE_LIMIT } from '../types';
import { generateApiKey, getCurrentMonthKey } from '../utils/apiKey';

export function SettingsScreen() {
  const { colors, spacing, radius } = useTheme();
  const [isPremium, setIsPremium] = useLocalStorage('push_is_premium', false);
  const [apiKey, setApiKey] = useLocalStorage<string | null>('push_api_key', null);
  const [notifications, setNotifications] = useLocalStorage<PushNotification[]>(
    'push_notifications',
    []
  );
  const [usage, setUsage] = useLocalStorage<UsageInfo>('push_usage', {
    monthKey: getCurrentMonthKey(),
    count: 0,
  });

  const handlePurchase = useCallback(() => {
    Alert.alert(
      'プレミアムにアップグレード',
      '300円（買い切り）で月の送信制限がなくなります。\n\n※ デモ版のため、このボタンで即座に有効になります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '購入する（300円）',
          onPress: () => {
            setIsPremium(true);
            Alert.alert('購入完了', 'プレミアムプランが有効になりました！\n送信数が無制限になります。');
          },
        },
      ]
    );
  }, [setIsPremium]);

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

  const handleRestorePurchase = useCallback(() => {
    Alert.alert('復元', '購入情報の復元を試みます。\n\n※ デモ版のため、復元機能はシミュレーションです。');
  }, []);

  const handleResetUsage = useCallback(() => {
    if (isPremium) {
      Alert.alert('プレミアム', 'プレミアムプランでは送信数に制限はありません');
      return;
    }
    Alert.alert(
      '使用状況をリセット（デモ用）',
      '今月の送信カウントを0に戻します。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          onPress: () => setUsage({ monthKey: getCurrentMonthKey(), count: 0 }),
        },
      ]
    );
  }, [isPremium, setUsage]);

  const monthKey = getCurrentMonthKey();
  const currentCount = usage.monthKey === monthKey ? usage.count : 0;

  return (
    <ScreenWrapper edges={['top']}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: spacing.md }}>
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
                <Button
                  title="プレミアムにアップグレード — ¥300"
                  onPress={handlePurchase}
                  variant="primary"
                  style={{ marginTop: spacing.md }}
                />
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
                rightIcon="chevron-forward"
              />
              <Divider />
              <ListItem
                title="使用状況をリセット"
                subtitle="今月の送信カウントを0に戻す（デモ用）"
                onPress={handleResetUsage}
                rightIcon="chevron-forward"
              />
              {isPremium && (
                <>
                  <Divider />
                  <ListItem
                    title="購入を復元"
                    subtitle="別端末での購入を復元"
                    onPress={handleRestorePurchase}
                    rightIcon="chevron-forward"
                  />
                </>
              )}
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
                rightIcon="chevron-forward"
              />
            </View>
          </Card>

          {/* About Section */}
          <Card style={{ padding: spacing.md, marginBottom: spacing.xxl }}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <H2 style={{ fontSize: 16, marginLeft: 8 }}>このアプリについて</H2>
            </View>
            <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
              <View style={styles.aboutRow}>
                <Body color={colors.textSecondary}>バージョン</Body>
                <Body>1.0.0</Body>
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
            </View>
          </Card>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
});
