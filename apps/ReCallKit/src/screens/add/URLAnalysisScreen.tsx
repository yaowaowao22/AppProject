// ============================================================
// URLAnalysisScreen
// URLを入力 → Bedrock AI解析 → QAPreviewへ遷移する専用画面
// ios-uiux準拠・ローディングステップ表示・エラーカード付き
// ============================================================

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import { analyzeUrlPipeline } from '../../services/urlAnalysisPipeline';
import type { LibraryStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<LibraryStackParamList, 'URLAnalysis'>;

const URL_PATTERN = /^https?:\/\/.+/i;

// フェッチ → AI解析 のステップ切り替えタイミング（ms）
const STEP_SWITCH_MS = 3500;

export function URLAnalysisScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [url, setUrl] = useState(route.params?.initialUrl ?? '');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<'fetch' | 'analyze'>('fetch');
  const [error, setError] = useState<string | null>(null);

  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isValidUrl = URL_PATTERN.test(url.trim());

  const handleAnalyze = useCallback(async () => {
    if (!isValidUrl || loading) return;

    Keyboard.dismiss();
    setError(null);
    setLoading(true);
    setLoadingStep('fetch');

    // 一定時間後に「AIが解析中...」へステップ切り替え
    stepTimerRef.current = setTimeout(() => {
      setLoadingStep('analyze');
    }, STEP_SWITCH_MS);

    try {
      const result = await analyzeUrlPipeline(url.trim());
      navigation.navigate('QAPreview', {
        url: result.sourceUrl,
        title: result.title,
        summary: result.summary,
        qa_pairs: result.qa_pairs,
        category: result.category,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'URL解析に失敗しました');
    } finally {
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
        stepTimerRef.current = null;
      }
      setLoading(false);
    }
  }, [url, isValidUrl, loading, navigation]);

  const handleClear = useCallback(() => {
    setUrl('');
    setError(null);
  }, []);

  // ─── ローディング画面 ───
  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.backgroundGrouped }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.label }]}>
            {loadingStep === 'fetch' ? 'ページを読み込み中...' : 'AIが解析中...'}
          </Text>
          {loadingStep === 'analyze' && (
            <Text style={[styles.loadingSubText, { color: colors.labelSecondary }]}>
              Bedrockが内容を分析しています
            </Text>
          )}
        </View>
      </View>
    );
  }

  // ─── メイン画面 ───
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

        {/* URL入力エリア（アイコン＋TextInput＋クリアボタン） */}
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
            onSubmitEditing={isValidUrl ? handleAnalyze : undefined}
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
          URLのページをAIが自動解析してQ&Aを生成します
        </Text>

        {/* エラーカード */}
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
            <View style={styles.errorBody}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                {
                  borderColor: colors.accent,
                  backgroundColor: colors.accent + '14',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={handleAnalyze}
              accessibilityRole="button"
              accessibilityLabel="再試行"
            >
              <Ionicons name="refresh-outline" size={16} color={colors.accent} />
              <Text style={[styles.retryText, { color: colors.accent }]}>再試行</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* 解析ボタン */}
      <Pressable
        style={({ pressed }) => [
          styles.analyzeButton,
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
        onPress={handleAnalyze}
        disabled={!isValidUrl}
        accessibilityRole="button"
        accessibilityLabel="解析する"
        accessibilityState={{ disabled: !isValidUrl }}
      >
        <View style={styles.analyzeButtonInner}>
          <Ionicons
            name="search-outline"
            size={18}
            color={isValidUrl ? '#FFFFFF' : colors.labelTertiary}
          />
          <Text
            style={[
              styles.analyzeButtonText,
              { color: isValidUrl ? '#FFFFFF' : colors.labelTertiary },
            ]}
          >
            解析する
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

  // ローディング
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.m,
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    ...TypeScale.headline,
    textAlign: 'center',
  },
  loadingSubText: {
    ...TypeScale.subheadline,
    textAlign: 'center',
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

  // エラーカード
  errorCard: {
    borderRadius: Radius.m,
    borderWidth: 1,
    padding: Spacing.m,
    gap: Spacing.s,
    marginTop: Spacing.s,
  },
  errorBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.s,
  },
  errorText: {
    flex: 1,
    ...TypeScale.subheadline,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    height: 36,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.m,
  },
  retryText: {
    ...TypeScale.subheadline,
    fontWeight: '600',
  },

  // 解析ボタン
  analyzeButton: {
    borderRadius: Radius.m,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  analyzeButtonText: {
    ...TypeScale.headline,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
