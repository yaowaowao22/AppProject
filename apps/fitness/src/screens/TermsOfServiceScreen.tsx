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
    title: '第1条（適用）',
    body: 'この利用規約（以下「本規約」）は、TANREN（以下「本アプリ」）の利用に関する条件を定めるものです。ユーザーは本アプリを利用することにより、本規約に同意したものとみなされます。',
  },
  {
    title: '第2条（サービス概要）',
    body: '本アプリは、筋力トレーニングの記録・管理を目的としたアプリケーションです。トレーニング種目、重量、レップ数、セット数などの記録、トレーニング履歴の閲覧・分析、およびトレーニングメニューのテンプレート管理機能を提供します。',
  },
  {
    title: '第3条（利用条件）',
    body: '本アプリは無料でご利用いただけます。本アプリの利用にあたり、アカウント登録は不要です。データはすべて端末内に保存されるため、インターネット接続がなくても基本機能をご利用いただけます。',
  },
  {
    title: '第4条（禁止事項）',
    body: 'ユーザーは本アプリの利用にあたり、以下の行為を行ってはなりません。\n\n・本アプリの逆コンパイル、リバースエンジニアリング、逆アセンブル\n・本アプリの改変、二次的著作物の作成\n・本アプリを不正な目的で使用する行為\n・その他、運営者が不適切と判断する行為',
  },
  {
    title: '第5条（免責事項）',
    body: '運営者は、本アプリの利用により生じたいかなる損害についても、一切の責任を負いません。トレーニングの実施は自己責任で行ってください。本アプリで表示される記録や計算結果は参考値であり、その正確性を保証するものではありません。端末の故障、紛失、アプリの削除等によるデータの消失について、運営者は責任を負いません。',
  },
  {
    title: '第6条（知的財産権）',
    body: '本アプリに関する著作権、商標権その他の知的財産権は、運営者に帰属します。ユーザーが本アプリ内で作成したトレーニングデータの権利は、ユーザーに帰属します。',
  },
  {
    title: '第7条（規約の変更）',
    body: '運営者は、必要に応じて本規約を変更できるものとします。変更後の利用規約は、アプリ内での表示をもって効力を生じるものとします。',
  },
  {
    title: '第8条（準拠法・管轄）',
    body: '本規約の解釈にあたっては日本法を準拠法とします。',
  },
] as const;

export default function TermsOfServiceScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  usePersistentHeader({ title: '利用規約', showBack: true, onBack: () => navigation.goBack() });

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
