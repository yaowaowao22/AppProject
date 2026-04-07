// ============================================================
// URLAnalysisScreen
// URLを入力 → 「スタート」ボタンでジョブ登録 → URLImportList へ遷移
// 実際の解析・保存処理は URLImportListScreen がバックグラウンドで実行する
// ============================================================

import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useDatabase } from '../../hooks/useDatabase';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import { createJob } from '../../db/urlJobRepository';
import type { LibraryStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<LibraryStackParamList, 'URLAnalysis'>;

const URL_PATTERN = /^https?:\/\/.+/i;

export function URLAnalysisScreen({ route, navigation }: Props) {
  const { db, isReady } = useDatabase();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [url, setUrl] = useState(route.params?.initialUrl ?? '');
  const [error, setError] = useState<string | null>(null);

  const isValidUrl = URL_PATTERN.test(url.trim());

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={handleBack} hitSlop={8} accessibilityLabel="戻る">
          <Ionicons name="chevron-back" size={24} color={colors.accent} />
        </Pressable>
      ),
    });
  }, [navigation, handleBack, colors.accent]);

  const handleStart = useCallback(async () => {
    if (!isValidUrl || !db || !isReady) return;

    Keyboard.dismiss();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await createJob(db, url.trim());
    } catch {
      setError('ジョブの登録に失敗しました。もう一度お試しください');
      return;
    }

    // ジョブ登録完了後は前の画面へ戻る
    navigation.goBack();
  }, [url, isValidUrl, db, isReady, navigation]);

  const handleClear = useCallback(() => {
    setUrl('');
    setError(null);
  }, []);

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.backgroundGrouped },
      ]}
    >
      <View style={styles.content}>
        {/* URL入力ラベル */}
        <Text style={[styles.label, { color: colors.labelSecondary }]}>解析するURL</Text>

        {/* URL入力エリア */}
        <View
          style={[
            styles.inputRow,
            { backgroundColor: colors.card, borderColor: colors.separator },
            CardShadow,
          ]}
        >
          <Ionicons
            name="link-outline"
            size={20}
            color={colors.labelTertiary}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.urlInput, { color: colors.label }]}
            value={url}
            onChangeText={(text) => {
              setUrl(text);
              if (error) setError(null);
            }}
            placeholder="https://..."
            placeholderTextColor={colors.labelTertiary}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={isValidUrl ? handleStart : undefined}
          />
          {url.length > 0 && (
            <Pressable
              onPress={handleClear}
              hitSlop={8}
              accessibilityLabel="URLをクリア"
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={colors.labelTertiary} />
            </Pressable>
          )}
        </View>

        {/* 説明テキスト */}
        <Text style={[styles.description, { color: colors.labelTertiary }]}>
          スタートするとバックグラウンドで解析が始まります。取り込み一覧で進捗を確認できます。
        </Text>

        {/* エラー */}
        {error && (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.error + '40',
              },
              CardShadow,
            ]}
          >
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}
      </View>

      {/* スタートボタン */}
      <Pressable
        style={({ pressed }) => [
          styles.startButton,
          {
            backgroundColor: isValidUrl
              ? pressed
                ? colors.accent + 'CC'
                : colors.accent
              : colors.backgroundSecondary,
            marginHorizontal: Spacing.m,
            marginBottom: Math.max(insets.bottom, Spacing.m),
          },
          !isValidUrl && styles.buttonDisabled,
        ]}
        onPress={handleStart}
        disabled={!isValidUrl}
        accessibilityRole="button"
        accessibilityLabel="スタート"
        accessibilityState={{ disabled: !isValidUrl }}
      >
        <View style={styles.startButtonInner}>
          <Ionicons
            name="play-circle-outline"
            size={20}
            color={isValidUrl ? '#FFFFFF' : colors.labelTertiary}
          />
          <Text
            style={[
              styles.startButtonText,
              { color: isValidUrl ? '#FFFFFF' : colors.labelTertiary },
            ]}
          >
            スタート
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

// ============================================================
// スタイル
// ============================================================
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.m,
    gap: Spacing.s,
  },

  // URL入力エリア
  label: {
    ...TypeScale.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.s,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.m,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.m,
    height: 50,
  },
  inputIcon: {
    marginRight: Spacing.s,
  },
  urlInput: {
    flex: 1,
    ...TypeScale.body,
    height: '100%',
  },
  clearButton: {
    marginLeft: Spacing.s,
  },
  description: {
    ...TypeScale.footnote,
    lineHeight: 18,
  },

  // エラー
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.s,
    borderRadius: Radius.m,
    borderWidth: 1,
    padding: Spacing.m,
    marginTop: Spacing.s,
  },
  errorText: {
    flex: 1,
    ...TypeScale.subheadline,
    lineHeight: 20,
  },

  // スタートボタン
  startButton: {
    borderRadius: Radius.m,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  startButtonText: {
    ...TypeScale.headline,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
