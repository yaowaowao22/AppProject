import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, H1, H2, Body, Caption, Card, Button, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { PushNotification, UsageInfo, Priority } from '../types';
import { FREE_LIMIT } from '../types';
import { generateApiKey, getCurrentMonthKey } from '../utils/apiKey';
import { API_BASE } from '../config';

type CodeTab = 'curl' | 'python' | 'node';

function copyToClipboard(text: string) {
  if (Platform.OS === 'web') {
    navigator.clipboard?.writeText(text).catch(() => {});
  } else {
    try {
      const Clipboard = require('expo-clipboard');
      Clipboard.setStringAsync(text);
    } catch {
      // clipboard unavailable
    }
  }
}

export function SetupScreen() {
  const { colors, spacing, radius } = useTheme();
  const [apiKey, setApiKey] = useLocalStorage<string | null>('push_api_key', null);
  const [notifications, setNotifications] = useLocalStorage<PushNotification[]>(
    'push_notifications',
    []
  );
  const [usage, setUsage] = useLocalStorage<UsageInfo>('push_usage', {
    monthKey: getCurrentMonthKey(),
    count: 0,
  });
  const [isPremium] = useLocalStorage('push_is_premium', false);
  const [pushToken] = useLocalStorage<string | null>('push_token', null);
  const [deviceRegistered] = useLocalStorage('push_device_registered', false);
  const [activeTab, setActiveTab] = useState<CodeTab>('curl');

  // Initialize API key on first render
  if (apiKey === null) {
    const key = generateApiKey();
    setApiKey(key);
  }

  const currentKey = apiKey ?? '読み込み中...';

  const handleCopy = useCallback(
    (text: string, label: string) => {
      copyToClipboard(text);
      Alert.alert('コピー完了', `${label}をクリップボードにコピーしました`);
    },
    []
  );

  const handleTestSend = useCallback(() => {
    const monthKey = getCurrentMonthKey();
    let currentUsage = usage;
    if (currentUsage.monthKey !== monthKey) {
      currentUsage = { monthKey, count: 0 };
    }

    if (!isPremium && currentUsage.count >= FREE_LIMIT) {
      Alert.alert('送信制限', `無料プランの月${FREE_LIMIT}通に達しました。\n設定タブからプレミアムにアップグレードしてください。`);
      return;
    }

    const priorities: Priority[] = ['low', 'normal', 'high', 'urgent'];
    const testMessages = [
      { title: 'サーバー監視', message: 'CPU使用率が正常範囲内です。全システム稼働中。', priority: 'normal' as Priority },
      { title: 'デプロイ完了', message: 'v2.1.0が本番環境にデプロイされました。ビルド時間: 3分42秒', priority: 'high' as Priority },
      { title: 'バックアップ完了', message: 'データベースの自動バックアップが完了しました。サイズ: 2.4GB', priority: 'low' as Priority },
      { title: 'エラー検知', message: 'APIエンドポイント /users で500エラーが5回連続で発生しています。', priority: 'urgent' as Priority, url: 'https://example.com/errors/12345' },
      { title: 'IoTセンサー', message: 'リビングの温度が28℃を超えました。エアコンを自動起動します。', priority: 'normal' as Priority },
    ];

    const sample = testMessages[Math.floor(Math.random() * testMessages.length)];

    const newNotification: PushNotification = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: sample.title,
      message: sample.message,
      priority: sample.priority,
      timestamp: new Date().toISOString(),
      read: false,
      url: sample.url,
    };

    setNotifications([newNotification, ...notifications]);
    setUsage({ monthKey, count: currentUsage.count + 1 });
    Alert.alert('送信完了', '受信箱にテスト通知を送信しました');
  }, [notifications, setNotifications, usage, setUsage, isPremium]);

  const curlExample = `curl -X POST ${API_BASE}/api/send \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "${currentKey}",
    "title": "サーバーダウン",
    "message": "Web server is not responding",
    "priority": "high"
  }'`;

  const pythonExample = `import requests

requests.post("${API_BASE}/api/send", json={
    "token": "${currentKey}",
    "title": "サーバーダウン",
    "message": "Web server is not responding",
    "priority": "high",
})`;

  const nodeExample = `fetch("${API_BASE}/api/send", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    token: "${currentKey}",
    title: "サーバーダウン",
    message: "Web server is not responding",
    priority: "high",
  }),
});`;

  const codeExamples: Record<CodeTab, string> = { curl: curlExample, python: pythonExample, node: nodeExample };
  const tabLabels: Record<CodeTab, string> = { curl: 'cURL', python: 'Python', node: 'Node.js' };

  const monthKey = getCurrentMonthKey();
  const currentCount = usage.monthKey === monthKey ? usage.count : 0;

  return (
    <ScreenWrapper edges={['top']} showBanner={false}>
      <ScrollView style={[styles.container, { padding: spacing.md }]} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <H1 style={{ fontSize: 24, marginBottom: spacing.md }}>API設定</H1>

        {/* API Key */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="key" size={18} color={colors.primary} />
              <H2 style={{ fontSize: 15, marginLeft: 6 }}>APIキー</H2>
            </View>
            <TouchableOpacity onPress={() => handleCopy(currentKey, 'APIキー')}>
              <View style={[styles.copyBtn, { backgroundColor: colors.primaryLight + '20', borderRadius: radius.sm }]}>
                <Ionicons name="copy-outline" size={16} color={colors.primary} />
                <Caption color={colors.primary} style={{ marginLeft: 4 }}>コピー</Caption>
              </View>
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.codeBox,
              {
                backgroundColor: colors.background,
                borderRadius: radius.sm,
                padding: spacing.sm,
                marginTop: spacing.sm,
              },
            ]}
          >
            <Body style={{ fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier', fontSize: 14 }}>
              {currentKey}
            </Body>
          </View>
        </Card>

        {/* Endpoint */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="globe-outline" size={18} color={colors.primary} />
              <H2 style={{ fontSize: 15, marginLeft: 6 }}>エンドポイント</H2>
            </View>
            <TouchableOpacity onPress={() => handleCopy(`${API_BASE}/api/send`, 'エンドポイント')}>
              <View style={[styles.copyBtn, { backgroundColor: colors.primaryLight + '20', borderRadius: radius.sm }]}>
                <Ionicons name="copy-outline" size={16} color={colors.primary} />
                <Caption color={colors.primary} style={{ marginLeft: 4 }}>コピー</Caption>
              </View>
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.codeBox,
              {
                backgroundColor: colors.background,
                borderRadius: radius.sm,
                padding: spacing.sm,
                marginTop: spacing.sm,
              },
            ]}
          >
            <Body style={{ fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier', fontSize: 13 }}>
              POST {API_BASE}/send
            </Body>
          </View>
        </Card>

        {/* Device Status */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
          <View style={styles.cardTitleRow}>
            <Ionicons
              name={deviceRegistered ? 'checkmark-circle' : 'alert-circle-outline'}
              size={18}
              color={deviceRegistered ? colors.success : colors.warning}
            />
            <H2 style={{ fontSize: 15, marginLeft: 6 }}>デバイス登録</H2>
          </View>
          <View style={{ marginTop: spacing.sm }}>
            {deviceRegistered ? (
              <>
                <Body color={colors.success}>登録済み — プッシュ通知を受信できます</Body>
                {pushToken && (
                  <Caption color={colors.textMuted} style={{ marginTop: 4 }} numberOfLines={1}>
                    {pushToken}
                  </Caption>
                )}
              </>
            ) : (
              <Body color={colors.textSecondary}>
                実機でアプリを起動すると自動登録されます{'\n'}
                （Web版ではテスト送信のみ利用可能）
              </Body>
            )}
          </View>
        </Card>

        {/* Usage */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="bar-chart-outline" size={18} color={colors.primary} />
            <H2 style={{ fontSize: 15, marginLeft: 6 }}>今月の使用状況</H2>
          </View>
          <View style={{ marginTop: spacing.sm }}>
            <View style={styles.usageRow}>
              <Body>{isPremium ? '無制限' : `${currentCount} / ${FREE_LIMIT} 通`}</Body>
              <Badge
                label={isPremium ? 'プレミアム' : '無料プラン'}
                variant={isPremium ? 'success' : 'info'}
              />
            </View>
            {!isPremium && (
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: colors.border, borderRadius: radius.full, marginTop: spacing.sm },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: currentCount >= FREE_LIMIT ? colors.error : colors.primary,
                      borderRadius: radius.full,
                      width: `${Math.min((currentCount / FREE_LIMIT) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
            )}
          </View>
        </Card>

        {/* Code Examples */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="code-slash-outline" size={18} color={colors.primary} />
            <H2 style={{ fontSize: 15, marginLeft: 6 }}>送信サンプル</H2>
          </View>
          <View style={[styles.tabRow, { marginTop: spacing.sm }]}>
            {(Object.keys(tabLabels) as CodeTab[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: activeTab === tab ? colors.primary : colors.background,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Caption
                  color={activeTab === tab ? colors.textOnPrimary : colors.textSecondary}
                  style={{ fontWeight: activeTab === tab ? 'bold' : 'normal' }}
                >
                  {tabLabels[tab]}
                </Caption>
              </TouchableOpacity>
            ))}
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={() => handleCopy(codeExamples[activeTab], 'コード')}>
              <Ionicons name="copy-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.codeBox,
              {
                backgroundColor: '#0D1117',
                borderRadius: radius.sm,
                padding: spacing.sm,
                marginTop: spacing.sm,
              },
            ]}
          >
            <Body
              style={{
                fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
                fontSize: 12,
                lineHeight: 20,
                color: '#E6EDF3',
              }}
            >
              {codeExamples[activeTab]}
            </Body>
          </View>
        </Card>

        {/* Request Body Schema */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <H2 style={{ fontSize: 15, marginLeft: 6 }}>リクエストBody</H2>
          </View>
          <View style={{ marginTop: spacing.sm, gap: 8 }}>
            {[
              { name: 'token', type: 'string', required: true, desc: 'あなたのAPIキー' },
              { name: 'title', type: 'string', required: true, desc: '通知タイトル' },
              { name: 'message', type: 'string', required: true, desc: '通知本文' },
              { name: 'priority', type: 'string', required: false, desc: 'low / normal / high / urgent' },
              { name: 'url', type: 'string', required: false, desc: 'タップ時に開くURL' },
            ].map((field) => (
              <View key={field.name} style={styles.fieldRow}>
                <View style={styles.fieldNameRow}>
                  <Body style={{ fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier', fontSize: 13 }}>
                    {field.name}
                  </Body>
                  {field.required && (
                    <Badge label="必須" variant="error" />
                  )}
                </View>
                <Caption color={colors.textMuted}>{field.type} — {field.desc}</Caption>
              </View>
            ))}
          </View>
        </Card>

        {/* Test Send */}
        <Button
          title="テスト通知を送信"
          onPress={handleTestSend}
          variant="primary"
          style={{ marginBottom: spacing.xxl }}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  codeBox: {
    overflow: 'hidden',
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBar: {
    height: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  fieldRow: {
    gap: 2,
  },
  fieldNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
