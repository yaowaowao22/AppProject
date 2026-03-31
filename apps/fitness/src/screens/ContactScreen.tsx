import React, { useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RADIUS, SPACING, TYPOGRAPHY, BUTTON_HEIGHT } from '../theme';
import type { TanrenThemeColors } from '../theme';
import { useTheme } from '../ThemeContext';
import { ScreenHeader } from '../components/ScreenHeader';

// ── 問い合わせカテゴリ ─────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'bug',     label: 'バグ報告' },
  { id: 'feature', label: '機能要望' },
  { id: 'usage',   label: '使い方' },
  { id: 'other',   label: 'その他' },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'];

const SUPPORT_EMAIL = 'support@tanren-app.com';

// ── ContactScreen ─────────────────────────────────────────────────────────────

export default function ContactScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [category, setCategory] = useState<CategoryId>('bug');
  const [subject, setSubject]   = useState('');
  const [body, setBody]         = useState('');

  const handleSend = () => {
    if (!subject.trim()) {
      Alert.alert('入力エラー', '件名を入力してください。');
      return;
    }
    if (!body.trim()) {
      Alert.alert('入力エラー', '本文を入力してください。');
      return;
    }

    const categoryLabel = CATEGORIES.find(c => c.id === category)?.label ?? '';
    const encodedSubject = encodeURIComponent(`[TANREN][${categoryLabel}] ${subject.trim()}`);
    const encodedBody    = encodeURIComponent(body.trim());
    const mailto         = `mailto:${SUPPORT_EMAIL}?subject=${encodedSubject}&body=${encodedBody}`;

    Keyboard.dismiss();
    Linking.openURL(mailto).catch(() => {
      Alert.alert(
        'メールアプリが見つかりません',
        'メールアプリが設定されていないか、起動できませんでした。\n\n送信先: ' + SUPPORT_EMAIL,
      );
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScreenHeader title="お問い合わせ" showBack />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── カテゴリ ── */}
        <Text style={styles.label}>カテゴリ</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map(cat => {
            const isSelected = cat.id === category;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setCategory(cat.id)}
                activeOpacity={0.75}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={cat.label}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 件名 ── */}
        <Text style={styles.label}>件名</Text>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="件名を入力"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="next"
            maxLength={100}
          />
        </View>

        {/* ── 本文 ── */}
        <Text style={styles.label}>本文</Text>
        <View style={[styles.inputCard, styles.textAreaCard]}>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={body}
            onChangeText={setBody}
            placeholder="お問い合わせ内容を入力してください"
            placeholderTextColor={colors.textTertiary}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />
        </View>
        <Text style={styles.charCount}>{body.length} / 2000</Text>

        {/* ── 補足説明 ── */}
        <Text style={styles.note}>
          送信ボタンを押すとメールアプリが起動します。送信先: {SUPPORT_EMAIL}
        </Text>

        {/* ── 送信ボタン ── */}
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={handleSend}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="メールを送信する"
        >
          <Text style={styles.sendBtnText}>メールアプリで送信</Text>
        </TouchableOpacity>
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
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: SPACING.contentMargin,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.xxl,
    },

    label: {
      fontSize: TYPOGRAPHY.caption,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textTertiary,
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      marginTop: SPACING.sectionGap,
      marginBottom: 10,
    },

    // ── チップ ──
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
    },
    chip: {
      paddingHorizontal: SPACING.md,
      paddingVertical: 8,
      borderRadius: RADIUS.chip,
      backgroundColor: c.surface1,
      borderWidth: 1,
      borderColor: c.separator,
    },
    chipSelected: {
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    chipText: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textSecondary,
    },
    chipTextSelected: {
      color: c.onAccent,
    },

    // ── 入力フィールド ──
    inputCard: {
      backgroundColor: c.surface1,
      borderRadius: RADIUS.card,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    textAreaCard: {
      minHeight: 160,
    },
    input: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: TYPOGRAPHY.regular,
      color: c.textPrimary,
      minHeight: BUTTON_HEIGHT.icon,
    },
    textArea: {
      minHeight: 140,
    },
    charCount: {
      fontSize: TYPOGRAPHY.captionSmall,
      color: c.textTertiary,
      textAlign: 'right',
      marginTop: SPACING.xs,
    },

    // ── 補足 ──
    note: {
      fontSize: TYPOGRAPHY.captionSmall,
      color: c.textTertiary,
      marginTop: SPACING.lg,
      lineHeight: 18,
    },

    // ── 送信ボタン ──
    sendBtn: {
      marginTop: SPACING.lg,
      backgroundColor: c.accent,
      borderRadius: RADIUS.button,
      height: BUTTON_HEIGHT.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnText: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: TYPOGRAPHY.bold,
      color: c.onAccent,
    },
  });
}
