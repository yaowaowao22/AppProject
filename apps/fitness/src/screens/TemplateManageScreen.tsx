import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, TYPOGRAPHY, BUTTON_HEIGHT } from '../theme';
import type { TanrenThemeColors } from '../theme';
import { useTheme } from '../ThemeContext';
import { useWorkout } from '../WorkoutContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { BODY_PARTS, EXERCISES } from '../exerciseDB';
import type { BodyPart } from '../types';

// ── テンプレート管理画面 ──────────────────────────────────────────────────────

export default function TemplateManageScreen() {
  const { colors } = useTheme();
  const { templates, saveTemplate, deleteTemplate, updateTemplate } = useWorkout();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // ── 表示モード管理 ──
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // ── 編集フォーム状態 ──
  const [editName, setEditName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<BodyPart | null>(null);

  const isEditing = editingTemplateId !== null || isCreating;

  // ── 新規作成開始 ──
  const startCreate = () => {
    setIsCreating(true);
    setEditingTemplateId(null);
    setEditName('');
    setSelectedIds(new Set());
    setActiveTab(null);
  };

  // ── 既存テンプレート編集開始 ──
  const startEdit = (templateId: string) => {
    const tmpl = templates.find(t => t.id === templateId);
    if (!tmpl) return;
    setEditingTemplateId(templateId);
    setIsCreating(false);
    setEditName(tmpl.name);
    setSelectedIds(new Set(tmpl.exerciseIds));
    setActiveTab(null);
  };

  // ── 保存 ──
  const handleSave = async () => {
    const name = editName.trim();
    if (!name) {
      Alert.alert('入力エラー', 'テンプレート名を入力してください。');
      return;
    }
    if (selectedIds.size === 0) {
      Alert.alert('入力エラー', '種目を1つ以上選択してください。');
      return;
    }
    if (editingTemplateId !== null) {
      // 既存テンプレートを更新（IDを保持）
      await updateTemplate(editingTemplateId, name, Array.from(selectedIds));
    } else {
      // 新規作成
      await saveTemplate(name, Array.from(selectedIds));
    }
    setEditingTemplateId(null);
    setIsCreating(false);
  };

  // ── 削除（確認Alert付き）──
  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'テンプレートを削除',
      `「${name}」を削除しますか？この操作は元に戻せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => deleteTemplate(id),
        },
      ],
    );
  };

  // ── 種目選択トグル ──
  const toggleExercise = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ── タブフィルタ適用済み種目 ──
  const filteredExercises = useMemo(
    () => (activeTab ? EXERCISES.filter(e => e.bodyPart === activeTab) : EXERCISES),
    [activeTab],
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 一覧ビュー
  // ════════════════════════════════════════════════════════════════════════════

  if (!isEditing) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScreenHeader
          title="テンプレート管理"
          showHamburger
          rightAction={
            <TouchableOpacity
              style={styles.addBtn}
              onPress={startCreate}
              accessibilityRole="button"
              accessibilityLabel="新規テンプレートを作成"
            >
              <Ionicons name="add" size={28} color={colors.accent} />
            </TouchableOpacity>
          }
        />

        <FlatList
          data={templates}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.listContent,
            templates.length === 0 && styles.listEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="albums-outline" size={52} color={colors.textTertiary} />
              <Text style={styles.emptyText}>テンプレートがありません</Text>
              <Text style={styles.emptySubText}>右上の「+」ボタンで作成してください</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const names = item.exerciseIds
              .map(id => EXERCISES.find(e => e.id === id)?.name ?? id)
              .slice(0, 3);
            const overflow = item.exerciseIds.length - names.length;
            const metaStr =
              names.join(' · ') + (overflow > 0 ? ` +${overflow}` : '');

            return (
              <TouchableOpacity
                style={styles.templateRow}
                onPress={() => startEdit(item.id)}
                onLongPress={() => handleDelete(item.id, item.name)}
                delayLongPress={500}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`テンプレート: ${item.name}`}
              >
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.templateMeta} numberOfLines={1}>
                    {item.exerciseIds.length}種目　{metaStr}
                  </Text>
                </View>
                <View style={styles.templateTrailing}>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id, item.name)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="削除"
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                  <Ionicons
                    name="chevron-forward-outline"
                    size={18}
                    color={colors.textTertiary}
                    style={{ marginLeft: 8 }}
                  />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 編集ビュー
  // ════════════════════════════════════════════════════════════════════════════

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScreenHeader
        title={isCreating ? 'テンプレート作成' : 'テンプレート編集'}
        showBack
        rightAction={
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="保存"
          >
            <Text style={styles.saveBtnText}>保存</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.editContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── テンプレート名 ── */}
        <Text style={styles.fieldLabel}>テンプレート名</Text>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.nameInput}
            value={editName}
            onChangeText={setEditName}
            placeholder="例: 胸・肩の日"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="done"
            maxLength={40}
          />
        </View>

        {/* ── 部位タブ ── */}
        <Text style={styles.fieldLabel}>種目を選択</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
          style={styles.tabScroll}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === null && styles.tabActive]}
            onPress={() => setActiveTab(null)}
          >
            <Text style={[styles.tabText, activeTab === null && styles.tabTextActive]}>
              全て
            </Text>
          </TouchableOpacity>
          {BODY_PARTS.map(bp => (
            <TouchableOpacity
              key={bp.id}
              style={[styles.tab, activeTab === bp.id && styles.tabActive]}
              onPress={() => setActiveTab(bp.id)}
            >
              <Text style={[styles.tabText, activeTab === bp.id && styles.tabTextActive]}>
                {bp.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── 種目一覧 ── */}
        <View style={styles.exerciseCard}>
          {filteredExercises.map((exercise, idx) => {
            const isSelected = selectedIds.has(exercise.id);
            return (
              <React.Fragment key={exercise.id}>
                {idx > 0 && <View style={styles.separator} />}
                <TouchableOpacity
                  style={styles.exerciseRow}
                  onPress={() => toggleExercise(exercise.id)}
                  activeOpacity={0.75}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={exercise.name}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color={colors.background} />
                    )}
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text
                      style={[
                        styles.exerciseName,
                        isSelected && styles.exerciseNameSelected,
                      ]}
                    >
                      {exercise.name}
                    </Text>
                    <Text style={styles.exerciseSub}>{exercise.muscleDetail}</Text>
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>

        {/* ── 選択数インジケーター ── */}
        {selectedIds.size > 0 && (
          <Text style={styles.selectedCount}>{selectedIds.size}種目を選択中</Text>
        )}
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

    // ── 一覧 ──
    listContent: {
      paddingBottom: SPACING.xl,
    },
    listEmpty: {
      flex: 1,
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 80,
      gap: 8,
    },
    emptyText: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textSecondary,
      marginTop: 4,
    },
    emptySubText: {
      fontSize: TYPOGRAPHY.caption,
      color: c.textTertiary,
    },

    addBtn: {
      width: BUTTON_HEIGHT.icon,
      height: BUTTON_HEIGHT.icon,
      alignItems: 'center',
      justifyContent: 'center',
    },

    templateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.contentMargin,
      paddingVertical: SPACING.sm,
      minHeight: 64,
      backgroundColor: c.surface1,
    },
    templateInfo: {
      flex: 1,
      marginRight: SPACING.sm,
    },
    templateName: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textPrimary,
      marginBottom: 3,
    },
    templateMeta: {
      fontSize: TYPOGRAPHY.caption,
      color: c.textTertiary,
    },
    templateTrailing: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.separator,
      marginLeft: SPACING.contentMargin,
    },

    // ── 編集フォーム ──
    editContent: {
      paddingBottom: SPACING.xl,
    },
    fieldLabel: {
      fontSize: TYPOGRAPHY.caption,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textTertiary,
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      paddingHorizontal: SPACING.contentMargin,
      marginTop: SPACING.sectionGap,
      marginBottom: 10,
    },

    inputCard: {
      backgroundColor: c.surface1,
      borderRadius: RADIUS.card,
      marginHorizontal: SPACING.contentMargin,
      paddingHorizontal: SPACING.md,
      paddingVertical: 2,
    },
    nameInput: {
      fontSize: TYPOGRAPHY.body,
      color: c.textPrimary,
      minHeight: 48,
    },

    tabScroll: {
      marginBottom: 12,
    },
    tabRow: {
      paddingHorizontal: SPACING.contentMargin,
      gap: 8,
    },
    tab: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: RADIUS.chip,
      backgroundColor: c.surface1,
    },
    tabActive: {
      backgroundColor: c.accent,
    },
    tabText: {
      fontSize: TYPOGRAPHY.caption,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textSecondary,
    },
    tabTextActive: {
      color: c.background,
    },

    exerciseCard: {
      backgroundColor: c.surface1,
      borderRadius: RADIUS.card,
      marginHorizontal: SPACING.contentMargin,
      overflow: 'hidden',
    },
    exerciseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      minHeight: 52,
      gap: 12,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: c.separator,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    checkboxSelected: {
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    exerciseInfo: {
      flex: 1,
    },
    exerciseName: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: TYPOGRAPHY.regular,
      color: c.textPrimary,
    },
    exerciseNameSelected: {
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.accent,
    },
    exerciseSub: {
      fontSize: TYPOGRAPHY.caption,
      color: c.textTertiary,
      marginTop: 2,
    },

    selectedCount: {
      fontSize: TYPOGRAPHY.caption,
      color: c.accent,
      fontWeight: TYPOGRAPHY.semiBold,
      textAlign: 'center',
      marginTop: SPACING.md,
    },

    saveBtn: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 6,
      borderRadius: RADIUS.badge,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnText: {
      fontSize: TYPOGRAPHY.caption,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.background,
    },
  });
}
