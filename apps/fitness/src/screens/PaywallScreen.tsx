import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RADIUS, SPACING, TYPOGRAPHY } from '../theme';
import type { TanrenThemeColors } from '../theme';
import { useTheme } from '../ThemeContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { useSubscription } from '../SubscriptionContext';

// ── プラン特典リスト ───────────────────────────────────────────────────────────

const FEATURES: { icon: string; label: string; desc: string }[] = [
  { icon: 'layers',        label: '無制限テンプレート', desc: '無料プランは3件まで' },
  { icon: 'bar-chart',     label: '月別レポート',       desc: 'ボリューム・部位分析を閲覧' },
  { icon: 'color-palette', label: '全テーマ解放',       desc: 'プレミアムカラーテーマ全種' },
  { icon: 'cloud-upload',  label: '将来のプレミアム機能', desc: '新機能を優先提供' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function PaywallScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { isPremium, isLoading, subscribe, restorePurchases } = useSubscription();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleSubscribe = async () => {
    const ok = await subscribe();
    if (ok) {
      Alert.alert('プレミアム登録完了', 'ありがとうございます！全機能をお楽しみください。', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('エラー', '購入処理に失敗しました。もう一度お試しください。');
    }
  };

  const handleRestore = async () => {
    const ok = await restorePurchases();
    if (ok) {
      Alert.alert('復元完了', 'プレミアムプランを復元しました。', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('復元失敗', '購入履歴が見つかりませんでした。');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScreenHeader title="プレミアムプラン" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ヒーロー */}
        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="diamond" size={48} color={colors.accent} />
          </View>
          <Text style={styles.heroTitle}>FORGE Premium</Text>
          <Text style={styles.heroSub}>
            あなたのトレーニングを{'\n'}さらに高みへ
          </Text>
        </View>

        {/* 特典リスト */}
        <View style={styles.featuresCard}>
          {FEATURES.map((f, i) => (
            <React.Fragment key={f.label}>
              {i > 0 && <View style={styles.separator} />}
              <View style={styles.featureRow}>
                <View style={[styles.featureIconWrap, { backgroundColor: colors.accentDim }]}>
                  <Ionicons name={f.icon as never} size={20} color={colors.accent} />
                </View>
                <View style={styles.featureTextGroup}>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* 現在のプラン表示 */}
        {isPremium && (
          <View style={styles.currentPlanBadge}>
            <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
            <Text style={styles.currentPlanText}>現在プレミアムプラン加入中</Text>
          </View>
        )}

        {/* CTA ボタン */}
        {!isPremium && (
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleSubscribe}
            disabled={isLoading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="プレミアムプランに登録する"
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Text style={styles.ctaText}>プレミアムプランに登録</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.background} />
              </>
            )}
          </TouchableOpacity>
        )}

        {/* 購入復元 */}
        {!isPremium && (
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="購入を復元する"
          >
            <Text style={styles.restoreText}>購入を復元する</Text>
          </TouchableOpacity>
        )}

        {/* 注記 */}
        <Text style={styles.note}>
          ※ 価格・プラン内容は今後変更される場合があります。{'\n'}
          購入はApp Store / Google Play の規約に準じます。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── スタイル ──────────────────────────────────────────────────────────────────

function makeStyles(c: TanrenThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.background,
    },
    scroll: { flex: 1 },
    content: {
      paddingBottom: SPACING.xl * 2,
    },

    // ── ヒーロー ──
    hero: {
      alignItems: 'center',
      paddingTop: SPACING.xl,
      paddingBottom: SPACING.lg,
      paddingHorizontal: SPACING.contentMargin,
    },
    heroIconWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.accentDim,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.md,
    },
    heroTitle: {
      fontSize: 24,
      fontWeight: TYPOGRAPHY.bold,
      color: c.textPrimary,
      marginBottom: SPACING.xs,
    },
    heroSub: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: TYPOGRAPHY.regular,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },

    // ── 特典カード ──
    featuresCard: {
      backgroundColor: c.surface1,
      borderRadius: RADIUS.card,
      marginHorizontal: SPACING.contentMargin,
      marginBottom: SPACING.lg,
      overflow: 'hidden',
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      gap: SPACING.sm,
    },
    featureIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureTextGroup: {
      flex: 1,
    },
    featureLabel: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textPrimary,
    },
    featureDesc: {
      fontSize: TYPOGRAPHY.captionSmall,
      fontWeight: TYPOGRAPHY.regular,
      color: c.textTertiary,
      marginTop: 2,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.separator,
      marginLeft: SPACING.md,
    },

    // ── 現在プラン ──
    currentPlanBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginHorizontal: SPACING.contentMargin,
      marginBottom: SPACING.md,
      paddingVertical: SPACING.sm,
      backgroundColor: c.accentDim,
      borderRadius: RADIUS.button,
    },
    currentPlanText: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.accent,
    },

    // ── CTA ──
    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginHorizontal: SPACING.contentMargin,
      marginBottom: SPACING.md,
      height: 52,
      backgroundColor: c.accent,
      borderRadius: RADIUS.button,
    },
    ctaText: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: TYPOGRAPHY.bold,
      color: c.background,
    },

    // ── 復元 ──
    restoreButton: {
      alignItems: 'center',
      marginBottom: SPACING.lg,
      paddingVertical: SPACING.sm,
    },
    restoreText: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.regular,
      color: c.textTertiary,
      textDecorationLine: 'underline',
    },

    // ── 注記 ──
    note: {
      fontSize: TYPOGRAPHY.captionSmall,
      fontWeight: TYPOGRAPHY.regular,
      color: c.textTertiary,
      textAlign: 'center',
      paddingHorizontal: SPACING.contentMargin,
      lineHeight: 18,
    },
  });
}
