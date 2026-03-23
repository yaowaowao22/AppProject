import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, H1, H2, Body, Caption, Card, Button, Badge, Divider, ListItem } from '@massapp/ui';
import type { ThemeMode } from '@massapp/ui';
import { useLocalStorage } from '@massapp/hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buyPremium, restorePurchases } from '../utils/purchases';

export function SettingsScreen() {
  const { colors, spacing, radius, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [isPremium, setIsPremium] = useLocalStorage('firecalc_is_premium', false);
  const [, setSavedMode] = useLocalStorage<string>('firecalc_theme_mode', 'system');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleSetMode = useCallback((m: ThemeMode) => {
    setMode(m);
    setSavedMode(m);
    AsyncStorage.setItem('firecalc_theme_mode', JSON.stringify(m)).catch(() => {});
  }, [setMode, setSavedMode]);

  const handlePurchase = useCallback(async () => {
    setPurchasing(true);
    try {
      const result = await buyPremium();
      if (result.success) {
        setIsPremium(true);
        Alert.alert('購入完了', 'FIRECalc JP プレミアムが有効になりました！\nすべての計算機能が使えます。');
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

  const handleResetData = useCallback(() => {
    Alert.alert(
      'データをリセット',
      '保存済みのシナリオなどのデータをリセットします。よろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: () => {
            // TODO: 保存シナリオをクリア
            Alert.alert('完了', 'データをリセットしました');
          },
        },
      ]
    );
  }, []);

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
                  {isPremium
                    ? 'すべての計算機能 · 買い切り済み'
                    : 'FIREシミュレーターのみ無料'}
                </Caption>
              </View>
              <Badge label={isPremium ? '有効' : '無料'} variant={isPremium ? 'success' : 'info'} />
            </View>
            {!isPremium && (
              <>
                <View style={[styles.featureList, { marginTop: spacing.sm, marginBottom: spacing.sm }]}>
                  {[
                    { icon: 'lock-closed-outline', text: '新NISA計算機（非課税効果の試算）' },
                    { icon: 'lock-closed-outline', text: 'iDeCo節税計算機（職業別節税額）' },
                    { icon: 'lock-closed-outline', text: 'シナリオ保存・比較' },
                  ].map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Ionicons name={f.icon as any} size={14} color={colors.textMuted} />
                      <Caption color={colors.textMuted} style={{ marginLeft: 6 }}>{f.text}</Caption>
                    </View>
                  ))}
                </View>
                <Button
                  title={purchasing ? '処理中...' : 'プレミアムにアップグレード — ¥730'}
                  onPress={handlePurchase}
                  variant="primary"
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

        {/* テーマ */}
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
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
            <H2 style={{ fontSize: 16, marginLeft: 8 }}>データ管理</H2>
          </View>
          <View style={{ marginTop: spacing.sm }}>
            <ListItem
              title="データをリセット"
              subtitle="保存済みシナリオをクリア"
              onPress={handleResetData}
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
              <Body>FIRECalc JP</Body>
            </View>
            <Divider />
            <Caption color={colors.textMuted} style={{ lineHeight: 18 }}>
              新NISA・iDeCo・FIREを統合した日本向け資産形成計算機です。{'\n'}
              完全オフライン。あなたの資産情報はサーバーに送られません。
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
  featureList: {
    gap: 6,
  },
  featureRow: {
    flexDirection: 'row',
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
