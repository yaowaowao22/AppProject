import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, TextInput, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/ScreenHeader';
import { SPACING, TYPOGRAPHY, RADIUS, BUTTON_HEIGHT } from '../theme';
import type { TanrenThemeColors } from '../theme';
import { useTheme } from '../ThemeContext';
import { EXERCISES } from '../exerciseDB';
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
  const { saveTemplate } = useWorkout();

  const [data, setData] = useState<ExerciseItem[]>(() =>
    exerciseIds
      .map(id => {
        const ex = EXERCISES.find(e => e.id === id);
        if (!ex) return null;
        return { id, name: ex.name, equipment: ex.equipment };
      })
      .filter((item): item is ExerciseItem => item !== null),
  );

  const [sheetVisible, setSheetVisible] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [saving, setSaving] = useState(false);

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

  const renderItem = ({ item, drag, isActive }: RenderItemParams<ExerciseItem>) => (
    <ScaleDecorator>
      <View
        style={[styles.row, isActive && styles.rowActive]}
        accessibilityLabel={`${item.name}、長押しで並び替え`}
      >
        <View style={styles.rowLeft}>
          <Text style={styles.rowName}>{item.name}</Text>
          <Text style={styles.rowEquip}>{item.equipment}</Text>
        </View>
        <TouchableOpacity
          onLongPress={drag}
          delayLongPress={150}
          style={styles.handle}
          accessibilityRole="button"
          accessibilityLabel="並び替えハンドル"
        >
          <Ionicons name="reorder-three-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </ScaleDecorator>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader title="順序確認" showBack />
      <Text style={styles.description}>選択した種目をこの順番でトレーニングします</Text>

      <DraggableFlatList
        data={data}
        onDragEnd={({ data: reordered }) => setData(reordered)}
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
    rowActive: {
      backgroundColor: c.surface2,
      opacity: 0.95,
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
    handle: {
      width: BUTTON_HEIGHT.icon,
      height: BUTTON_HEIGHT.icon,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: SPACING.sm,
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
      color: c.textPrimary,
      letterSpacing: -0.2,
    },
    description: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.regular,
      color: c.textSecondary,
      paddingHorizontal: SPACING.contentMargin,
      paddingBottom: SPACING.sm,
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
