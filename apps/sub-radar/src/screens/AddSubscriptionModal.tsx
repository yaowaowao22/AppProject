import React, { useState } from 'react';
import {
  Modal,
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, H2, Body, Caption, Card } from '@massapp/ui';
import type { Subscription, BillingCycle, Currency, SubscriptionCategory } from '../types';
import { BILLING_CYCLE_LABEL, CATEGORY_COLORS } from '../types';

const AC = {
  bgDeep: '#0D1117',
  bgCard: '#161B22',
  bgElevated: '#1C2128',
  teal: '#26C6DA',
  textBright: '#E6EDF3',
  textMid: '#8B949E',
  textDim: '#484F58',
  borderSubtle: '#21262D',
  warnOrange: '#FF9800',
};

interface Props {
  subscription?: Subscription;
  onClose: () => void;
  onSave: (sub: Subscription) => void;
  onDelete?: () => void;
}

const CURRENCIES: Currency[] = ['JPY', 'USD', 'EUR'];
const BILLING_CYCLES: BillingCycle[] = ['monthly', 'yearly', 'quarterly', 'weekly'];
const CATEGORIES: SubscriptionCategory[] = ['エンタメ', '仕事', '生活', '学習', 'その他'];
const ICON_CANDIDATES = [
  'tv-outline',
  'musical-notes-outline',
  'cloud-outline',
  'game-controller-outline',
  'book-outline',
  'fitness-outline',
  'cart-outline',
  'globe-outline',
  'laptop-outline',
  'newspaper-outline',
  'headset-outline',
  'camera-outline',
] as const;

export function AddSubscriptionModal({ subscription, onClose, onSave, onDelete }: Props) {
  const { spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const isEdit = !!subscription;

  const [name, setName] = useState(subscription?.name ?? '');
  const [amount, setAmount] = useState(subscription?.amount?.toString() ?? '');
  const [currency, setCurrency] = useState<Currency>(subscription?.currency ?? 'JPY');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    subscription?.billingCycle ?? 'monthly'
  );
  const [billingDay, setBillingDay] = useState<number>(subscription?.billingDay ?? 1);
  const [category, setCategory] = useState<SubscriptionCategory>(
    subscription?.category ?? 'エンタメ'
  );
  const [iconName, setIconName] = useState<string | undefined>(subscription?.iconName);
  const [note, setNote] = useState(subscription?.note ?? '');

  const showBillingDay = billingCycle === 'monthly' || billingCycle === 'quarterly';

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('入力エラー', 'サービス名を入力してください');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('入力エラー', '金額を正しく入力してください');
      return;
    }

    const now = new Date().toISOString();
    const saved: Subscription = {
      id: subscription?.id ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      amount: parsedAmount,
      currency,
      billingCycle,
      billingDay,
      category,
      color: CATEGORY_COLORS[category],
      iconName,
      isActive: subscription?.isActive ?? true,
      lastTappedAt: subscription?.lastTappedAt,
      createdAt: subscription?.createdAt ?? now,
      note: note.trim() || undefined,
    };

    onSave(saved);
  };

  const handleDelete = () => {
    Alert.alert(
      '削除確認',
      `「${name}」を削除しますか？この操作は取り消せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            onDelete?.();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: AC.bgDeep }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ヘッダー */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: AC.bgCard,
              paddingTop: insets.top + spacing.sm,
              paddingHorizontal: spacing.md,
              paddingBottom: spacing.sm,
              borderBottomColor: AC.borderSubtle,
            },
          ]}
        >
          <H2 style={{ fontSize: 17, color: AC.textBright }}>
            {isEdit ? 'サブスクを編集' : 'サブスクを追加'}
          </H2>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={28} color={AC.textMid} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* サービス名 */}
          <Card style={{ backgroundColor: AC.bgCard, padding: spacing.md, marginBottom: spacing.md }}>
            <Caption style={{ color: AC.textMid, marginBottom: spacing.xs }}>
              サービス名 <Caption style={{ color: AC.warnOrange }}>*</Caption>
            </Caption>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="例: Netflix, Spotify"
              placeholderTextColor={AC.textDim}
              style={[
                styles.textInput,
                {
                  backgroundColor: AC.bgElevated,
                  color: AC.textBright,
                  borderColor: AC.borderSubtle,
                  borderRadius: radius.sm,
                  padding: spacing.sm,
                },
              ]}
            />
          </Card>

          {/* 金額 */}
          <Card style={{ backgroundColor: AC.bgCard, padding: spacing.md, marginBottom: spacing.md }}>
            <Caption style={{ color: AC.textMid, marginBottom: spacing.xs }}>
              金額 <Caption style={{ color: AC.warnOrange }}>*</Caption>
            </Caption>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={AC.textDim}
              keyboardType="numeric"
              style={[
                styles.textInput,
                {
                  backgroundColor: AC.bgElevated,
                  color: AC.textBright,
                  borderColor: AC.borderSubtle,
                  borderRadius: radius.sm,
                  padding: spacing.sm,
                },
              ]}
            />
          </Card>

          {/* 通貨 */}
          <Card style={{ backgroundColor: AC.bgCard, padding: spacing.md, marginBottom: spacing.md }}>
            <Caption style={{ color: AC.textMid, marginBottom: spacing.sm }}>
              通貨
            </Caption>
            <View style={styles.buttonGroup}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCurrency(c)}
                  style={[
                    styles.segmentButton,
                    {
                      backgroundColor: currency === c ? AC.teal + '20' : AC.bgElevated,
                      borderColor: currency === c ? AC.teal : AC.borderSubtle,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Body
                    style={{
                      color: currency === c ? AC.textBright : AC.textMid,
                      fontWeight: currency === c ? 'bold' : 'normal',
                    }}
                  >
                    {c}
                  </Body>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* 請求サイクル */}
          <Card style={{ backgroundColor: AC.bgCard, padding: spacing.md, marginBottom: spacing.md }}>
            <Caption style={{ color: AC.textMid, marginBottom: spacing.sm }}>
              請求サイクル
            </Caption>
            <View style={styles.buttonGroupWrap}>
              {BILLING_CYCLES.map((cycle) => (
                <TouchableOpacity
                  key={cycle}
                  onPress={() => setBillingCycle(cycle)}
                  style={[
                    styles.segmentButton,
                    {
                      backgroundColor: billingCycle === cycle ? AC.teal + '20' : AC.bgElevated,
                      borderColor: billingCycle === cycle ? AC.teal : AC.borderSubtle,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Body
                    style={{
                      color: billingCycle === cycle ? AC.textBright : AC.textMid,
                      fontWeight: billingCycle === cycle ? 'bold' : 'normal',
                    }}
                  >
                    {BILLING_CYCLE_LABEL[cycle]}
                  </Body>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* 請求日（月次・四半期のみ） */}
          {showBillingDay && (
            <Card style={{ backgroundColor: AC.bgCard, padding: spacing.md, marginBottom: spacing.md }}>
              <Caption style={{ color: AC.textMid, marginBottom: spacing.sm }}>
                請求日
              </Caption>
              <View style={styles.dayGrid}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => setBillingDay(day)}
                    style={[
                      styles.dayButton,
                      {
                        backgroundColor: billingDay === day ? AC.teal + '20' : AC.bgElevated,
                        borderColor: billingDay === day ? AC.teal : AC.borderSubtle,
                        borderRadius: radius.sm,
                      },
                    ]}
                  >
                    <Body
                      style={{
                        color: billingDay === day ? AC.textBright : AC.textMid,
                        fontWeight: billingDay === day ? 'bold' : 'normal',
                        fontSize: 13,
                      }}
                    >
                      {day}
                    </Body>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          )}

          {/* カテゴリ */}
          <Card style={{ backgroundColor: AC.bgCard, padding: spacing.md, marginBottom: spacing.md }}>
            <Caption style={{ color: AC.textMid, marginBottom: spacing.sm }}>
              カテゴリ
            </Caption>
            <View style={styles.buttonGroupWrap}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.segmentButton,
                    {
                      backgroundColor:
                        category === cat ? CATEGORY_COLORS[cat] : AC.bgElevated,
                      borderColor: category === cat ? CATEGORY_COLORS[cat] : AC.borderSubtle,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Body
                    style={{
                      color: category === cat ? '#FFFFFF' : AC.textMid,
                      fontWeight: category === cat ? 'bold' : 'normal',
                    }}
                  >
                    {cat}
                  </Body>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* アイコン選択 */}
          <Card style={{ backgroundColor: AC.bgCard, padding: spacing.md, marginBottom: spacing.md }}>
            <Caption style={{ color: AC.textMid, marginBottom: spacing.sm }}>
              アイコン（任意）
            </Caption>
            <View style={styles.iconGrid}>
              {ICON_CANDIDATES.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  onPress={() => setIconName(iconName === icon ? undefined : icon)}
                  style={[
                    styles.iconButton,
                    {
                      backgroundColor: iconName === icon ? AC.teal + '20' : AC.bgElevated,
                      borderColor: iconName === icon ? AC.teal : AC.borderSubtle,
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <Ionicons
                    name={icon as any}
                    size={24}
                    color={iconName === icon ? AC.teal : AC.textMid}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* メモ */}
          <Card style={{ backgroundColor: AC.bgCard, padding: spacing.md, marginBottom: spacing.lg }}>
            <Caption style={{ color: AC.textMid, marginBottom: spacing.xs }}>
              メモ（任意）
            </Caption>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="備考など"
              placeholderTextColor={AC.textDim}
              multiline
              numberOfLines={3}
              style={[
                styles.textInput,
                styles.textArea,
                {
                  backgroundColor: AC.bgElevated,
                  color: AC.textBright,
                  borderColor: AC.borderSubtle,
                  borderRadius: radius.sm,
                  padding: spacing.sm,
                },
              ]}
            />
          </Card>

          {/* 保存ボタン */}
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.7}
            style={[
              styles.saveButton,
              { borderRadius: radius.md, marginBottom: spacing.sm },
            ]}
          >
            <Text style={styles.saveButtonText}>保存</Text>
          </TouchableOpacity>

          {/* 削除ボタン（編集モードのみ） */}
          {isEdit && (
            <TouchableOpacity
              onPress={handleDelete}
              style={[
                styles.deleteButton,
                {
                  borderColor: AC.warnOrange,
                  borderRadius: radius.md,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              <Ionicons name="trash-outline" size={16} color={AC.warnOrange} style={{ marginRight: 6 }} />
              <Body style={{ color: AC.warnOrange, fontWeight: '600' }}>削除</Body>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  buttonGroupWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segmentButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconButton: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  saveButton: {
    backgroundColor: '#26C6DA',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
  },
});
