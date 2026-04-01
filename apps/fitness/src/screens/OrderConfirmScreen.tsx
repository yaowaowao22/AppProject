import React, { useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, TextInput, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/ScreenHeader';
import { SPACING, TYPOGRAPHY, RADIUS, BUTTON_HEIGHT } from '../theme';
import type { TanrenThemeColors } from '../theme';
import { useTheme } from '../ThemeContext';
import { getExerciseById } from '../exerciseDB';
import { useWorkout } from '../WorkoutContext';
import type { WorkoutStackParamList } from '../navigation/RootNavigator';
import type { EquipmentType } from '../types';

// ── 型 ────────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<WorkoutStackParamList, 'OrderConfirm'>;

type ExerciseItem = {
  id: string;
  name: string;
  equipment: EquipmentType;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function OrderConfirmScreen({ navigation, route }: Props) {
  const { exerciseIds } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { saveTemplate, customExercises } = useWorkout();

  const [data, setData] = useState<ExerciseItem[]>(() =>
    exerciseIds
      .map(id => {
        const ex = getExerciseById(id, customExercises);
        if (!ex) return null;
        return { id, name: ex.name, equipment: ex.equipment };
      })
      .filter((item): item is ExerciseItem => item !== null),
  );

  const [sheetVisible, setSheetVisible] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [saving, setSaving] = useState(false);

  function moveUp(index: number) {
    if (index === 0) return;
    setData(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    if (index === data.length - 1) return;
    setData(prev => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function handleConfirm() {
    navigation.navigate('ActiveWorkout', {
      exerciseIds: data.map(item => item.id),
    });
  }

  async function handleSaveTemplate() {
    const name = templateName.trim();
    if (!name) {
      Alert.alert('名前を入力してください');
      return;
    }
    setSaving(true);
    await saveTemplate(name, data.map(item => item.id));
    setSaving(false);
    setSheetVisible(false);
    setTemplateName('');
    Alert.alert('保存しました', `「${name}」をテンプレートとして保存しました。`);
  }

  const renderItem = ({ item, index }: { item: ExerciseItem; index: number }) => {
    const isFirst = index === 0;
    const isLast = index === data.length - 1;
    return (
      <View style={styles.row} accessibilityLabel={item.name}>
        <View style={styles.rowLeft}>
          <Text style={styles.rowName}>{item.name}</Text>
          <Text style={styles.rowEquip}>{item.equipment}</Text>
        </View>
        <View style={styles.sortBtns}>
          <TouchableOpacity
            style={[styles.sortBtn, isFirst && styles.sortBtnDisabled]}
            onPress={() => moveUp(index)}
            disabled={isFirst}
            accessibilityRole="button"
            accessibilityLabel="上に移動"
          >
            <Ionicons
              name="chevron-up"
              size={16}
              color={isFirst ? colors.textTertiary : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortBtn, isLast && styles.sortBtnDisabled]}
            onPress={() => moveDown(index)}
            disabled={isLast}
            accessibilityRole="button"
            accessibilityLabel="下に移動"
          >
            <Ionicons
              name="chevron-down"
              size={16}
              color={isLast ? colors.textTertiary : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader title="トレーニング" showHamburger />
      <TouchableOpacity
        style={styles.detailBackRow}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="種目選択に戻る"
      >
        <Ionicons name="chevron-back" size={20} color={colors.accent} />
        <Text style={styles.detailBackText}>種目選択</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.detailBackInfo}>{data.length}種目</Text>
      </TouchableOpacity>
      <Text style={styles.description}>選択した種目をこの順番でトレーニングします</Text>

      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.templateBtn}
          onPress={() => setSheetVisible(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="テンプレートとして保存"
        >
          <Ionicons name="bookmark-outline" size={16} color={colors.accent} />
          <Text style={styles.templateBtnText}>テンプレートとして保存</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="開始する"
        >
          <Text style={styles.confirmText}>開始する</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={sheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { setSheetVisible(false); setTemplateName(''); }}
      >
        <KeyboardAvoidingView
          style={styles.modalOuter}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => { setSheetVisible(false); setTemplateName(''); }}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>テンプレートとして保存</Text>
            <Text style={styles.modalSubtitle}>名前をつけてこの種目セットを保存します</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="テンプレート名（例: 胸の日）"
              placeholderTextColor={colors.textTertiary}
              value={templateName}
              onChangeText={setTemplateName}
              maxLength={30}
              returnKeyType="done"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setSheetVisible(false); setTemplateName(''); }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sheetSaveBtn, saving && styles.sheetSaveBtnDisabled]}
                onPress={handleSaveTemplate}
                disabled={saving}
                activeOpacity={0.85}
              >
                <Text style={styles.sheetSaveBtnText}>{saving ? '保存中...' : '保存'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(c: TanrenThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    listContent: {
      paddingHorizontal: SPACING.contentMargin,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.xl,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface1,
      borderRadius: RADIUS.card,
      paddingVertical: SPACING.cardPadding,
      paddingHorizontal: SPACING.md,
      marginBottom: SPACING.cardGap,
      minHeight: 60,
    },
    rowLeft: {
      flex: 1,
      gap: SPACING.xs,
    },
    rowName: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textPrimary,
      letterSpacing: -0.2,
    },
    rowEquip: {
      fontSize: TYPOGRAPHY.caption,
      fontWeight: TYPOGRAPHY.regular,
      color: c.textTertiary,
    },
    sortBtns: {
      flexDirection: 'column',
      gap: 4,
      marginLeft: SPACING.sm,
    },
    sortBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: c.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sortBtnDisabled: {
      opacity: 0.4,
    },

    footer: {
      paddingHorizontal: SPACING.contentMargin,
      paddingBottom: SPACING.md,
      paddingTop: SPACING.sm,
      gap: SPACING.sm,
    },
    templateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: BUTTON_HEIGHT.secondary,
      borderRadius: RADIUS.button,
      borderWidth: 1,
      borderColor: c.accent,
    },
    templateBtnText: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.accent,
    },
    confirmBtn: {
      height: BUTTON_HEIGHT.primary,
      backgroundColor: c.accent,
      borderRadius: RADIUS.btnCTA,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmText: {
      fontSize: 17,
      fontWeight: TYPOGRAPHY.bold,
      color: c.onAccent,
      letterSpacing: -0.2,
    },
    description: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.regular,
      color: c.textSecondary,
      paddingHorizontal: SPACING.contentMargin,
      paddingBottom: SPACING.sm,
    },
    detailBackRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.contentMargin,
      paddingVertical: SPACING.sm,
      gap: SPACING.xs,
    },
    detailBackText: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.accent,
    },
    detailBackInfo: {
      fontSize: TYPOGRAPHY.caption,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textTertiary,
    },

    // ── モーダル ───────────────────────────────────────────────────────────────
    modalOuter: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalCard: {
      backgroundColor: c.surface1,
      borderTopLeftRadius: RADIUS.sheet,
      borderTopRightRadius: RADIUS.sheet,
      padding: SPACING.contentMargin,
      paddingBottom: SPACING.xl,
      gap: SPACING.md,
    },
    modalTitle: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: TYPOGRAPHY.bold,
      color: c.textPrimary,
      letterSpacing: -0.3,
    },
    modalSubtitle: {
      fontSize: TYPOGRAPHY.caption,
      fontWeight: TYPOGRAPHY.regular,
      color: c.textSecondary,
      marginTop: -SPACING.xs,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    modalCancelBtn: {
      flex: 1,
      height: BUTTON_HEIGHT.secondary,
      borderRadius: RADIUS.button,
      borderWidth: 1,
      borderColor: c.separator,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCancelText: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.textSecondary,
    },
    nameInput: {
      height: BUTTON_HEIGHT.secondary,
      backgroundColor: c.surface2,
      borderRadius: RADIUS.card,
      paddingHorizontal: SPACING.cardPadding,
      fontSize: TYPOGRAPHY.bodySmall,
      color: c.textPrimary,
    },
    sheetSaveBtn: {
      flex: 1,
      height: BUTTON_HEIGHT.secondary,
      borderRadius: RADIUS.button,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetSaveBtnDisabled: {
      opacity: 0.6,
    },
    sheetSaveBtnText: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.bold,
      color: c.onAccent,
    },
  });
}
