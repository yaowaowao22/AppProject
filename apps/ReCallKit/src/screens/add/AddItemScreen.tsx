import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDB } from '../../hooks/useDatabase';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import type { LibraryStackParamList } from '../../navigation/types';
import type { ItemType } from '../../types';

type Props = NativeStackScreenProps<LibraryStackParamList, 'AddItem'>;

const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: 'text', label: 'テキスト' },
  { value: 'url', label: 'URL' },
];

export function AddItemScreen({ navigation }: Props) {
  const db = useDB();
  const { colors } = useTheme();

  const [type, setType] = useState<ItemType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [saving, setSaving] = useState(false);

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
        `INSERT INTO items (type, title, content, source_url, created_at, updated_at, archived)
         VALUES (?, ?, ?, ?, datetime('now','localtime'), datetime('now','localtime'), 0)`,
        [type, title.trim(), content.trim(), sourceUrl.trim() || null]
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

      {/* タイトル */}
      <Text style={[styles.label, { color: colors.labelSecondary }]}>タイトル</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.label, borderColor: colors.separator }]}
        value={title}
        onChangeText={setTitle}
        placeholder="タイトルを入力"
        placeholderTextColor={colors.labelTertiary}
      />

      {/* URL（URLタイプの場合） */}
      {type === 'url' && (
        <>
          <Text style={[styles.label, { color: colors.labelSecondary }]}>ソースURL</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.label, borderColor: colors.separator }]}
            value={sourceUrl}
            onChangeText={setSourceUrl}
            placeholder="https://..."
            placeholderTextColor={colors.labelTertiary}
            keyboardType="url"
            autoCapitalize="none"
          />
        </>
      )}

      {/* 内容 */}
      <Text style={[styles.label, { color: colors.labelSecondary }]}>内容</Text>
      <TextInput
        style={[
          styles.input,
          styles.textArea,
          { backgroundColor: colors.card, color: colors.label, borderColor: colors.separator },
        ]}
        value={content}
        onChangeText={setContent}
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
  label: {
    ...TypeScale.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.s,
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
