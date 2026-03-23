import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, H1, H2, Body, Caption, Card, Button, Badge, Divider, ListItem } from '@massapp/ui';
import type { ThemeMode } from '@massapp/ui';
import { useLocalStorage } from '@massapp/hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Subscription } from '../types';
import { FREE_LIMIT } from '../types';
import { buyPremium, restorePurchases } from '../utils/purchases';

export function SettingsScreen() {
  const { colors, spacing, radius, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [isPremium, setIsPremium] = useLocalStorage('subradar_is_premium', false);
  const [subscriptions, setSubscriptions] = useLocalStorage<Subscription[]>('subradar_subscriptions', []);
  const [, setSavedMode] = useLocalStorage<string>('subradar_theme_mode', 'system');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleSetMode = useCallback((m: ThemeMode) => {
    setMode(m);
    setSavedMode(m);
    AsyncStorage.setItem('subradar_theme_mode', JSON.stringify(m)).catch(() => {});
  }, [setMode, setSavedMode]);

  const handlePurchase = useCallback(async () => {
    setPurchasing(true);
    try {
      const result = await buyPremium();
      if (result.success) {
        setIsPremium(true);
        Alert.alert('購入完了', 'SubRadar プレミアムが有効になりました！\n登録件数が無制限になります。');
      } else if (result.error !== 'cancelled') {
        Alert.alert('購入エラー', result.error ?? '購入処理に失敗しました');
      }
    } catch {
      Alert.alert('エラー', '購入処理中にエラーが発生しました');
    }
    setPurchasing(false);
  }, [setIsPremium]);

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        setIsPremium(true);
        Alert.alert('復元完了', 'プレミアムプランが復元されました！');
      } else {
        Alert.alert('復元結果', '復元可能な購入が見つかりませんでした');
      }
    } catch {
      Alert.alert('エラー', '復元処理中にエラーが発生しました');
    }
    setRestoring(false);
  }, [setIsPremium]);

  const handleClearData = useCallback(() => {
    if (subscriptions.length === 0) {
      Alert.alert('データなし', '削除するデータはありません');
      return;
    }
    Alert.alert('全データを削除', `${subscriptions.length}件のサブスクをすべて削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'すべて削除',
        style: 'destructive',
        onPress: () => {
          setSubscriptions([]);
          Alert.alert('完了', 'すべてのデータを削除しました');
        },
      },
    ]);
  }, [subscriptions, setSubscriptions]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <H1 style={{ fontSize: 24, marginBottom: spacing.md }}>設定</H1>

        {/* プランカード */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="diamond-outline" size={20} color={colors.primary} />
            <H2 style={{ fontSize: 16, marginLeft: 8 }}>プラン</H2>
          </View>
          <View style={[styles.planCard, {
            backgroundColor: isPremium ? colors.success + '15' : colors.primary + '15',
            borderRadius: radius.md,
            padding: spacing.md,
            marginTop: spacing.sm,
          }]}>
            <View style={styles.planRow}>
              <View>
                <H2 style={{ fontSize: 18 }}>{isPremium ? 'プレミアム' : '無料プラン'}</H2>
                <Caption color={colors.textSecondary}>
                  {isPremium ? '登録件数無制限 · 買い切り済み' : `${FREE_LIMIT}件まで無料`}
                </Caption>
              </View>
              <Badge
                label={isPremium ? '有効' : `${subscriptions.length}/${FREE_LIMIT}`}
                variant={isPremium ? 'success' : 'info'}
              />
            </View>
            {!isPremium && (
              <>
                <Button
                  title={purchasing ? '処理中...' : 'プレミアムにアップグレード — ¥480'}
                  onPress={handlePurchase}
                  variant="primary"
                  style={{ marginTop: spacing.md }}
                  disabled={purchasing}
                />
                {purchasing && <ActivityIndicator style={{ marginTop: spacing.sm }} color={colors.primary} />}
              </>
            )}
          </View>
        </Card>

        {/* アカウント */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={colors.primary} />
            <H2 style={{ fontSize: 16, marginLeft: 8 }}>アカウント</H2>
          </View>
          <View style={{ marginTop: spacing.sm }}>
            <ListItem
              title="購入を復元"
              subtitle={restoring ? '復元中...' : '別端末での購入を復元'}
              onPress={restoring ? undefined : handleRestore}
              rightIcon={
                restoring
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              }
            />
          </View>
        </Card>

        {/* 表示設定 */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="moon-outline" size={20} color={colors.primary} />
            <H2 style={{ fontSize: 16, marginLeft: 8 }}>テーマ</H2>
          </View>
          <View style={[styles.themeRow, { marginTop: spacing.sm }]}>
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
                <Caption color={mode === m ? colors.textOnPrimary : colors.textSecondary} style={{ fontSize: 11, marginTop: 2 }}>
                  {label}
                </Caption>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* データ管理 */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trash-outline" size={20} color={colors.primary} />
            <H2 style={{ fontSize: 16, marginLeft: 8 }}>データ管理</H2>
          </View>
          <View style={{ marginTop: spacing.sm }}>
            <ListItem
              title="すべてのデータを削除"
              subtitle={`${subscriptions.length}件のサブスク`}
              onPress={handleClearData}
              rightIcon={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
            />
          </View>
        </Card>

        {/* アプリについて */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
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
              <Body>SubRadar</Body>
            </View>
            <Divider />
            <Caption color={colors.textMuted} style={{ lineHeight: 18 }}>
              サブスクリプションの管理・節約提案アプリです。{'\n'}
              口座連携不要。あなたのデータはデバイスから外に出ません。
            </Caption>
          </View>
        </Card>
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
  planCard: {},
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
