import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPACING, TYPOGRAPHY } from '../theme';
import type { TanrenThemeColors } from '../theme';
import { useTheme } from '../ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { usePersistentHeader } from '../contexts/PersistentHeaderContext';

const SECTIONS = [
  {
    title: 'はじめに',
    body: 'TANREN（以下「本アプリ」）は、筋力トレーニングの記録・管理を目的としたアプリケーションです。本プライバシーポリシーは、本アプリにおける個人情報およびユーザーデータの取り扱いについて説明します。',
  },
  {
    title: '収集するデータ',
    body: '本アプリでは以下のデータを取り扱います。\n\n・トレーニング記録（種目名、重量、レップ数、セット数、日時）\n・アプリ設定情報（テーマ、表示設定、トレーニング設定）\n・テンプレート情報（ユーザーが作成したトレーニングメニュー）',
  },
  {
    title: 'データの保存場所',
    body: '上記のデータはすべてお使いの端末内にのみ保存されます。外部サーバーへの送信やクラウドへのアップロードは一切行いません。',
  },
  {
    title: '第三者への提供',
    body: '本アプリはユーザーデータを第三者に提供・共有・販売することはありません。',
  },
  {
    title: '外部サービスとの通信',
    body: '本アプリはオフラインで動作し、ユーザーデータに関する外部サービスとの通信は行いません。アプリのアップデート確認のためにExpo Updates サービスとの通信が発生する場合がありますが、個人情報は送信されません。',
  },
  {
    title: 'データの削除',
    body: 'アプリ内の「設定」画面からすべてのデータを削除できます。また、アプリをアンインストールすることで、端末内に保存されたすべてのデータが削除されます。',
  },
  {
    title: 'お子様のプライバシー',
    body: '本アプリは特定の年齢層を対象としたものではなく、13歳未満の児童から意図的に個人情報を収集することはありません。',
  },
  {
    title: 'プライバシーポリシーの変更',
    body: '本プライバシーポリシーは、必要に応じて変更される場合があります。重要な変更がある場合は、アプリ内で通知します。',
  },
  {
    title: 'お問い合わせ',
    body: '本プライバシーポリシーに関するご質問やお問い合わせは、App Store のアプリページからお問い合わせください。',
  },
] as const;

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  usePersistentHeader({ title: 'プライバシーポリシー', showBack: true, onBack: () => navigation.goBack() });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>最終更新日: 2026年4月1日</Text>

        {SECTIONS.map((sec, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <Text style={styles.sectionBody}>{sec.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: TanrenThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.background,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: SPACING.contentMargin,
      paddingBottom: SPACING.xl,
    },
    lastUpdated: {
      fontSize: TYPOGRAPHY.captionSmall,
      color: c.textTertiary,
      marginTop: SPACING.md,
      marginBottom: SPACING.md,
    },
    section: {
      marginBottom: SPACING.sectionGap,
    },
    sectionTitle: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textPrimary,
      marginBottom: SPACING.xs,
    },
    sectionBody: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.regular,
      color: c.textSecondary,
      lineHeight: 22,
    },
  });
}
