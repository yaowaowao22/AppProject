import React, { useState, useRef, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDB } from '../../hooks/useDatabase';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import type { LibraryStackParamList } from '../../navigation/types';
import type { ItemType } from '../../types';
import { fetchUrlMetadata } from '../../services/urlMetadataService';

type Props = NativeStackScreenProps<LibraryStackParamList, 'AddItem'>;

const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: 'text', label: 'テキスト' },
  { value: 'url', label: 'URL' },
];

const URL_PATTERN = /^https?:\/\/.+/i;
const DEBOUNCE_MS = 800;

export function AddItemScreen({ navigation }: Props) {
  const db = useDB();
  const { colors } = useTheme();

  const [type, setType] = useState<ItemType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // OGP自動取得の状態
  const [fetching, setFetching] = useState(false);
  const [titleAutoFilled, setTitleAutoFilled] = useState(false);
  const [contentAutoFilled, setContentAutoFilled] = useState(false);

  // debounce用タイマー
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMetadata = useCallback(async (url: string) => {
    if (!URL_PATTERN.test(url)) return;

    setFetching(true);
    const metadata = await fetchUrlMetadata(url);
    setFetching(false);

    if (!metadata) return;

    // タイトルが空の場合のみ自動入力
    if (metadata.title) {
      setTitle((prev) => {
        if (prev.trim() === '') {
          setTitleAutoFilled(true);
          return metadata.title ?? '';
        }
        return prev;
      });
    }

    // descriptionをcontentとexcerptに自動入力（空の場合のみ）
    if (metadata.description) {
      setContent((prev) => {
        if (prev.trim() === '') {
          setContentAutoFilled(true);
          return metadata.description ?? '';
        }
        return prev;
      });
      setExcerpt(metadata.description);
    }
  }, []);

  const handleUrlChange = useCallback(
    (text: string) => {
      setSourceUrl(text);

      // 自動入力フラグをリセット（URL変更時）
      setTitleAutoFilled(false);
      setContentAutoFilled(false);

      // debounce
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        fetchMetadata(text);
      }, DEBOUNCE_MS);
    },
    [fetchMetadata]
  );

  const handleTitleChange = (text: string) => {
    setTitle(text);
    setTitleAutoFilled(false); // 手動入力でフラグ解除
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    setContentAutoFilled(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください');
      return;
    }
    if (!content.trim()) {
      Alert.alert('エラー', '内容を入力してください');
      return;
    }

    setSaving(true);
    try {
      const result = await db.runAsync(
        `INSERT INTO items (type, title, content, excerpt, source_url, created_at, updated_at, archived)
         VALUES (?, ?, ?, ?, ?, datetime('now','localtime'), datetime('now','localtime'), 0)`,
        [type, title.trim(), content.trim(), excerpt.trim() || null, sourceUrl.trim() || null]
      );

      // 復習スケジュールを作成（即座に復習対象にする）
      await db.runAsync(
        `INSERT INTO reviews (item_id, repetitions, easiness_factor, interval_days, next_review_at, quality_history)
         VALUES (?, 0, 2.5, 0, datetime('now','localtime'), '[]')`,
        [result.lastInsertRowId]
      );

      navigation.goBack();
    } catch (err) {
      Alert.alert('エラー', '保存に失敗しました');
      console.error('[AddItemScreen] save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.backgroundGrouped }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* タイプ選択 */}
      <Text style={[styles.label, { color: colors.labelSecondary }]}>タイプ</Text>
      <View style={styles.typeRow}>
        {ITEM_TYPES.map((t) => (
          <Pressable
            key={t.value}
            style={[
              styles.typeChip,
              {
                backgroundColor: type === t.value ? colors.accent : colors.backgroundSecondary,
              },
            ]}
            onPress={() => setType(t.value)}
          >
            <Text
              style={[
                styles.typeChipText,
                { color: type === t.value ? '#FFFFFF' : colors.label },
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* URL（URLタイプの場合） */}
      {type === 'url' && (
        <>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.labelSecondary }]}>ソースURL</Text>
            {fetching && (
              <ActivityIndicator
                size="small"
                color={colors.accent}
                style={styles.fetchingIndicator}
              />
            )}
          </View>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.label, borderColor: colors.separator },
            ]}
            value={sourceUrl}
            onChangeText={handleUrlChange}
            placeholder="https://..."
            placeholderTextColor={colors.labelTertiary}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {/* AI解析ボタン: URLAnalysisScreenへ遷移 */}
          <Pressable
            style={({ pressed }) => [
              styles.aiAnalyzeButton,
              {
                backgroundColor: pressed ? colors.accent + 'CC' : colors.accent,
                opacity: URL_PATTERN.test(sourceUrl.trim()) ? 1 : 0.4,
              },
            ]}
            onPress={() => navigation.navigate('URLAnalysis', { initialUrl: sourceUrl.trim() })}
            disabled={!URL_PATTERN.test(sourceUrl.trim())}
            accessibilityRole="button"
            accessibilityLabel="AIで解析してQ&Aを生成"
          >
            <Text style={styles.aiAnalyzeButtonText}>AIで解析してQ&Aを生成</Text>
          </Pressable>
        </>
      )}

      {/* タイトル */}
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.labelSecondary }]}>タイトル</Text>
        {titleAutoFilled && (
          <Text style={[styles.autoTag, { color: colors.accent }]}>自動取得</Text>
        )}
      </View>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.card, color: colors.label, borderColor: colors.separator },
        ]}
        value={title}
        onChangeText={handleTitleChange}
        placeholder="タイトルを入力"
        placeholderTextColor={colors.labelTertiary}
      />

      {/* 内容 */}
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.labelSecondary }]}>内容</Text>
        {contentAutoFilled && (
          <Text style={[styles.autoTag, { color: colors.accent }]}>自動取得</Text>
        )}
      </View>
      <TextInput
        style={[
          styles.input,
          styles.textArea,
          { backgroundColor: colors.card, color: colors.label, borderColor: colors.separator },
        ]}
        value={content}
        onChangeText={handleContentChange}
        placeholder="覚えたい内容を入力..."
        placeholderTextColor={colors.labelTertiary}
        multiline
        textAlignVertical="top"
      />

      {/* 保存ボタン */}
      <Pressable
        style={({ pressed }) => [
          styles.saveButton,
          { backgroundColor: pressed ? colors.accent + 'CC' : colors.accent },
        ]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? '保存中...' : '保存'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.m,
    paddingBottom: Spacing.xxl,
    gap: Spacing.s,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    marginTop: Spacing.s,
  },
  label: {
    ...TypeScale.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  autoTag: {
    ...TypeScale.caption2,
    fontWeight: '500',
  },
  fetchingIndicator: {
    marginLeft: Spacing.xs,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.s,
  },
  typeChip: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: Radius.full,
  },
  typeChipText: {
    ...TypeScale.subheadline,
    fontWeight: '500',
  },
  input: {
    borderRadius: Radius.s,
    padding: Spacing.m,
    ...TypeScale.body,
    borderWidth: StyleSheet.hairlineWidth,
  },
  textArea: {
    minHeight: 160,
  },
  aiAnalyzeButton: {
    borderRadius: Radius.m,
    paddingVertical: Spacing.s,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  aiAnalyzeButtonText: {
    ...TypeScale.subheadline,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: Radius.m,
    paddingVertical: Spacing.m,
    alignItems: 'center',
    marginTop: Spacing.m,
  },
  saveButtonText: {
    ...TypeScale.headline,
    color: '#FFFFFF',
  },
});
