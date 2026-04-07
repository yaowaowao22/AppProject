// ============================================================
// QAPreviewScreen
// Bedrock解析結果のQ&Aペアをプレビューし、保存 or キャンセルを選択する画面
// 機能:
//   - カードスタック（デフォルト）/ リスト の切り替え
//   - 50件上限（超過時バナー表示）
//   - カードモード: スワイプでinclude/exclude、タップでフリップ、長押しで編集
//   - リストモード: チェックボックスで選択保存、インライン編集
//   - 全カード確認後の集計確認画面（除外カードを戻すボタン付き）
//   - 自動カテゴリタグをDBに保存
// ============================================================

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import type { SQLiteDatabase } from 'expo-sqlite';
import { useDB } from '../../hooks/useDatabase';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow, CardShadowStrong } from '../../theme/spacing';
import type { LibraryStackParamList } from '../../navigation/types';
import { getCategoryConfig } from '../../config/categories';
import { SystemColors } from '../../theme/colors';

type Props = NativeStackScreenProps<LibraryStackParamList, 'QAPreview'>;
type ViewMode = 'card' | 'list';

// ---- 定数 ----
const MAX_ITEMS = 50;
const SWIPE_THRESHOLD = 80;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_HEIGHT = 340;
const FLIP_DURATION = 300;
const Q_MAX_CHARS = 120;
const A_MAX_CHARS = 300;


// カテゴリをタグとしてDBに登録し、tag_id を返す
async function upsertCategoryTag(
  db: SQLiteDatabase,
  categoryLabel: string,
): Promise<number> {
  await db.runAsync(
    'INSERT OR IGNORE INTO tags (name) VALUES (?)',
    [categoryLabel],
  );
  const row = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM tags WHERE name = ?',
    [categoryLabel],
  );
  if (!row) throw new Error(`Tag not found after upsert: ${categoryLabel}`);
  return row.id;
}

// ============================================================
// EditModal — 質問・答えのモーダル編集（文字数カウンター付き）
// ============================================================
interface EditModalProps {
  visible: boolean;
  qa: { question: string; answer: string };
  onSave: (q: string, a: string) => void;
  onDismiss: () => void;
}

function EditModal({ visible, qa, onSave, onDismiss }: EditModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState(qa.question);
  const [a, setA] = useState(qa.answer);

  // モーダルが開くたびに最新値でリセット
  useEffect(() => {
    if (visible) {
      setQ(qa.question);
      setA(qa.answer);
    }
  }, [visible, qa.question, qa.answer]);

  const canSave = q.trim().length > 0 && a.trim().length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.modalKAV, { backgroundColor: colors.backgroundGrouped }]}
      >
        {/* モーダルヘッダー */}
        <View
          style={[
            styles.modalHeader,
            { borderBottomColor: colors.separator, paddingTop: insets.top + Spacing.s },
          ]}
        >
          <Pressable onPress={onDismiss} hitSlop={8} accessibilityRole="button" accessibilityLabel="キャンセル">
            <Text style={[styles.modalAction, { color: colors.labelSecondary }]}>キャンセル</Text>
          </Pressable>
          <Text style={[styles.modalTitle, { color: colors.label }]}>カードを編集</Text>
          <Pressable
            onPress={() => { if (canSave) onSave(q.trim(), a.trim()); }}
            hitSlop={8}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityLabel="保存"
          >
            <Text style={[styles.modalAction, { color: canSave ? colors.accent : colors.labelTertiary }]}>
              保存
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* 質問入力 */}
          <Text style={[styles.modalLabel, { color: colors.labelSecondary }]}>質問</Text>
          <TextInput
            style={[
              styles.modalInput,
              { color: colors.label, borderColor: colors.separator, backgroundColor: colors.card },
            ]}
            value={q}
            onChangeText={setQ}
            multiline
            placeholder="質問を入力"
            placeholderTextColor={colors.labelTertiary}
            maxLength={Q_MAX_CHARS}
            accessibilityLabel="質問"
          />
          <Text
            style={[
              styles.charCount,
              { color: q.length > Q_MAX_CHARS * 0.9 ? SystemColors.orange : colors.labelTertiary },
            ]}
          >
            {q.length} / {Q_MAX_CHARS}
          </Text>

          {/* 答え入力 */}
          <Text style={[styles.modalLabel, { color: colors.labelSecondary }]}>答え</Text>
          <TextInput
            style={[
              styles.modalInput,
              styles.modalInputAnswer,
              { color: colors.label, borderColor: colors.separator, backgroundColor: colors.card },
            ]}
            value={a}
            onChangeText={setA}
            multiline
            placeholder="答えを入力"
            placeholderTextColor={colors.labelTertiary}
            maxLength={A_MAX_CHARS}
            accessibilityLabel="答え"
          />
          <Text
            style={[
              styles.charCount,
              { color: a.length > A_MAX_CHARS * 0.9 ? SystemColors.orange : colors.labelTertiary },
            ]}
          >
            {a.length} / {A_MAX_CHARS}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ============================================================
// SwipeFlipCard — スワイプ判定 + フリップアニメーション
// ⚠️ key={cardIndex} で毎回リマウントして状態リセット
// ============================================================
interface SwipeFlipCardProps {
  question: string;
  answer: string;
  onInclude: () => void;
  onExclude: () => void;
  onEdit: () => void;
}

function SwipeFlipCard({ question, answer, onInclude, onExclude, onEdit }: SwipeFlipCardProps) {
  const { colors, isDark } = useTheme();

  // コールバックをrefで保持して worklet 内から runOnJS で安全に呼び出す
  const onIncludeRef = useRef(onInclude);
  onIncludeRef.current = onInclude;
  const onExcludeRef = useRef(onExclude);
  onExcludeRef.current = onExclude;

  // ⚠️ Haptics は JS スレッドで呼ぶ必要があるため runOnJS 経由に集約
  const callInclude = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onIncludeRef.current();
  }, []);
  const callExclude = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onExcludeRef.current();
  }, []);

  // スワイプ量
  const translateX = useSharedValue(0);

  // フリップ状態: 0=表(Q), 1=裏(A)
  const flip = useSharedValue(0);

  // タップでフリップ（Pressable.onPress から JS スレッドで呼ぶ）
  const handleFlip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const target = flip.value < 0.5 ? 1 : 0;
    flip.value = withTiming(target, { duration: FLIP_DURATION, easing: Easing.out(Easing.cubic) });
  }, [flip]);

  // ⚠️ Pan Gesture — activeOffsetX で水平方向を明示分離（ScrollView競合回避）
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        // 右スワイプ → 保存 (Haptics は callInclude 内で JS スレッドから実行)
        translateX.value = withTiming(
          SCREEN_WIDTH * 1.5,
          { duration: 250 },
          (finished) => { if (finished) runOnJS(callInclude)(); },
        );
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        // 左スワイプ → 除外
        translateX.value = withTiming(
          -SCREEN_WIDTH * 1.5,
          { duration: 250 },
          (finished) => { if (finished) runOnJS(callExclude)(); },
        );
      } else {
        // しきい値未満 → 元に戻す
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  // カード本体のアニメーション（移動 + 傾き）
  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      {
        rotate: `${interpolate(
          translateX.value,
          [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
          [-12, 0, 12],
          Extrapolation.CLAMP,
        )}deg`,
      },
    ],
  }));

  // 右スワイプ時の「保存」オーバーレイ opacity
  const includeOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  // 左スワイプ時の「除外」オーバーレイ opacity
  const excludeOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  // 表面アニメーション（0→0.5: 0→90deg、途中でフェードアウト）
  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(flip.value, [0, 0.5], [0, 90], Extrapolation.CLAMP)}deg` },
    ],
    opacity: interpolate(flip.value, [0.32, 0.5], [1, 0], Extrapolation.CLAMP),
  }));

  // 裏面アニメーション（0.5→1: -90→0deg、途中でフェードイン）
  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(flip.value, [0.5, 1], [-90, 0], Extrapolation.CLAMP)}deg` },
    ],
    opacity: interpolate(flip.value, [0.5, 0.68], [0, 1], Extrapolation.CLAMP),
  }));

  const cardBase = {
    backgroundColor: colors.card,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.35 : 0.14,
    shadowRadius: 14,
    elevation: 7,
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.swipeCardWrapper, cardAnimStyle]}>
        {/* 保存オーバーレイ（右スワイプ） */}
        <Animated.View
          style={[styles.swipeOverlay, styles.includeOverlay, includeOverlayStyle]}
          pointerEvents="none"
        >
          <Text style={styles.swipeOverlayText}>✓ 保存</Text>
        </Animated.View>

        {/* 除外オーバーレイ（左スワイプ） */}
        <Animated.View
          style={[styles.swipeOverlay, styles.excludeOverlay, excludeOverlayStyle]}
          pointerEvents="none"
        >
          <Text style={styles.swipeOverlayText}>✕ 除外</Text>
        </Animated.View>

        {/* タップでフリップ / 長押しで編集 */}
        <Pressable
          onPress={handleFlip}
          onLongPress={onEdit}
          delayLongPress={500}
          style={styles.swipeCardPressable}
          accessibilityRole="button"
          accessibilityLabel="タップして答えを見る、長押しで編集"
        >
          {/* ── 表面: 質問 ── */}
          <Animated.View style={[styles.swipeCard, cardBase, frontStyle]}>
            {/* 編集ボタン（小） */}
            <Pressable
              onPress={onEdit}
              style={styles.cardEditBtn}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="カードを編集"
            >
              <Ionicons name="pencil-outline" size={15} color={colors.labelSecondary} />
            </Pressable>

            <View style={styles.swipeCardBody}>
              <Text style={[styles.swipeCardSectionLabel, { color: colors.labelTertiary }]}>
                QUESTION
              </Text>
              <Text
                style={[styles.swipeCardQuestion, { color: colors.label }]}
                numberOfLines={9}
              >
                {question}
              </Text>
            </View>

            <View style={styles.swipeFlipHint}>
              <View style={[styles.flipDot, { backgroundColor: colors.accent }]} />
              <View style={[styles.flipDot, { backgroundColor: colors.accent, opacity: 0.45 }]} />
              <View style={[styles.flipDot, { backgroundColor: colors.accent, opacity: 0.2 }]} />
              <Text style={[styles.swipeFlipHintText, { color: colors.labelTertiary }]}>
                タップして答えを見る
              </Text>
            </View>
          </Animated.View>

          {/* ── 裏面: 答え ── */}
          <Animated.View style={[styles.swipeCard, cardBase, StyleSheet.absoluteFillObject, backStyle]}>
            <Pressable
              onPress={onEdit}
              style={styles.cardEditBtn}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="カードを編集"
            >
              <Ionicons name="pencil-outline" size={15} color={colors.labelSecondary} />
            </Pressable>

            <View style={styles.swipeCardBody}>
              <Text style={[styles.swipeCardSectionLabel, { color: colors.labelTertiary }]}>Q</Text>
              <Text
                style={[styles.swipeCardQuestionSmall, { color: colors.labelSecondary }]}
                numberOfLines={2}
              >
                {question}
              </Text>
              <View style={[styles.swipeCardDivider, { backgroundColor: colors.separator }]} />
              <Text style={[styles.swipeCardSectionLabel, { color: colors.labelTertiary }]}>
                ANSWER
              </Text>
              <Text
                style={[styles.swipeCardAnswer, { color: colors.label }]}
                numberOfLines={9}
              >
                {answer}
              </Text>
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

// ============================================================
// QAPreviewScreen — メイン画面
// ============================================================

export function QAPreviewScreen({ route, navigation }: Props) {
  const { url, title, summary, qa_pairs: rawPairs, category } = route.params;
  const { colors } = useTheme();
  const db = useDB();
  const insets = useSafeAreaInsets();

  // 25件上限
  const wasTruncated = rawPairs.length > MAX_ITEMS;
  const clippedPairs = useMemo(() => rawPairs.slice(0, MAX_ITEMS), [rawPairs]);

  // ── 共通状態 ──
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [editedQAs, setEditedQAs] = useState<{ question: string; answer: string }[]>(
    () => clippedPairs.map((p) => ({ ...p })),
  );
  // selected: カードモードではスワイプ結果、リストモードではチェックボックス状態を共有
  const [selected, setSelected] = useState<boolean[]>(() => clippedPairs.map(() => true));
  const [saving, setSaving] = useState(false);

  // ── カードモード状態 ──
  const [cardIndex, setCardIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  // ── リストモード状態 ──
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // ── 編集モーダル（両モード共通） ──
  const [editModalIndex, setEditModalIndex] = useState<number | null>(null);

  const catConfig = getCategoryConfig(category);
  const selectedCount = selected.filter(Boolean).length;
  const allSelected = selected.every(Boolean);

  // ── ヘッダー右: カード/リスト切り替えボタン ──
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => setViewMode((prev) => (prev === 'card' ? 'list' : 'card'))}
          hitSlop={8}
          style={{ marginRight: Spacing.xs }}
          accessibilityRole="button"
          accessibilityLabel={viewMode === 'card' ? 'リスト表示に切り替え' : 'カード表示に切り替え'}
        >
          <Ionicons
            name={viewMode === 'card' ? 'list-outline' : 'albums-outline'}
            size={22}
            color={colors.accent}
          />
        </Pressable>
      ),
    });
  }, [navigation, viewMode, colors.accent]);

  // ── カードモード: 保存決定 ──
  const handleCardInclude = useCallback(() => {
    setSelected((prev) => prev.map((v, i) => (i === cardIndex ? true : v)));
    if (cardIndex >= editedQAs.length - 1) {
      setShowSummary(true);
    } else {
      setCardIndex((prev) => prev + 1);
    }
  }, [cardIndex, editedQAs.length]);

  // ── カードモード: 除外決定 ──
  const handleCardExclude = useCallback(() => {
    setSelected((prev) => prev.map((v, i) => (i === cardIndex ? false : v)));
    if (cardIndex >= editedQAs.length - 1) {
      setShowSummary(true);
    } else {
      setCardIndex((prev) => prev + 1);
    }
  }, [cardIndex, editedQAs.length]);

  // ── リストモード操作 ──
  const toggleSelect = useCallback((index: number) => {
    setSelected((prev) => prev.map((v, i) => (i === index ? !v : v)));
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelected((prev) => prev.map(() => !allSelected));
  }, [allSelected]);

  const toggleExpand = useCallback((index: number) => {
    if (editingIndex === index) return;
    setExpandedIndex((prev) => (prev === index ? null : index));
  }, [editingIndex]);

  const startEdit = useCallback((index: number) => {
    setExpandedIndex(index);
    setEditingIndex(index);
  }, []);

  const commitEdit = useCallback(() => {
    setEditingIndex(null);
  }, []);

  const updateQuestion = useCallback((index: number, text: string) => {
    setEditedQAs((prev) => prev.map((q, i) => (i === index ? { ...q, question: text } : q)));
  }, []);

  const updateAnswer = useCallback((index: number, text: string) => {
    setEditedQAs((prev) => prev.map((q, i) => (i === index ? { ...q, answer: text } : q)));
  }, []);

  // ── 編集モーダル ──
  const openEditModal = useCallback((index: number) => {
    setEditModalIndex(index);
  }, []);

  const handleEditSave = useCallback((q: string, a: string) => {
    if (editModalIndex === null) return;
    setEditedQAs((prev) =>
      prev.map((qa, i) => (i === editModalIndex ? { question: q, answer: a } : qa)),
    );
    setEditModalIndex(null);
  }, [editModalIndex]);

  // ── 保存共通処理（selectedIds を返す） ──
  const performSave = useCallback(async (): Promise<number[] | null> => {
    const targets = editedQAs.filter((_, i) => selected[i]);
    if (targets.length === 0) {
      Alert.alert('未選択', '保存するQ&Aを1件以上選択してください');
      return null;
    }

    setSaving(true);
    try {
      const tagId = await upsertCategoryTag(db, catConfig.label);
      const savedIds: number[] = [];

      for (const qa of targets) {
        const result = await db.runAsync(
          `INSERT INTO items (type, title, content, excerpt, source_url, category, created_at, updated_at, archived)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now','localtime'), datetime('now','localtime'), 0)`,
          ['text', qa.question, qa.answer, summary, url, catConfig.label],
        );
        const itemId = result.lastInsertRowId;
        savedIds.push(itemId);
        await db.runAsync(
          'INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)',
          [itemId, tagId],
        );
        await db.runAsync(
          `INSERT INTO reviews (item_id, repetitions, easiness_factor, interval_days, next_review_at, quality_history)
           VALUES (?, 0, 2.5, 0, datetime('now','localtime'), '[]')`,
          [itemId],
        );
      }
      return savedIds;
    } catch (err) {
      Alert.alert('エラー', '保存に失敗しました');
      console.error('[QAPreviewScreen] save error:', err);
      return null;
    } finally {
      setSaving(false);
    }
  }, [db, url, summary, editedQAs, selected, catConfig]);

  // ── 保存 → ライブラリへ ──
  const handleSaveSelected = useCallback(async () => {
    const savedIds = await performSave();
    if (!savedIds) return;
    Alert.alert(
      '保存完了',
      `${savedIds.length}件のQ&Aをライブラリに追加しました`,
      [
        {
          text: 'ライブラリへ',
          style: 'cancel',
          onPress: () => navigation.popToTop(),
        },
        {
          text: '今すぐ復習',
          onPress: () => {
            (navigation.getParent() as any)?.navigate('Review', {
              screen: 'ReviewSession',
              params: { reviewIds: savedIds },
            });
          },
        },
      ],
    );
  }, [performSave, navigation]);

  // ── 保存 → そのまま復習開始 ──
  const handleSaveAndReview = useCallback(async () => {
    const savedIds = await performSave();
    if (!savedIds) return;
    (navigation.getParent() as any)?.navigate('Review', {
      screen: 'ReviewSession',
      params: { reviewIds: savedIds },
    });
  }, [performSave, navigation]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      '取り込み終了',
      '取り込みを終了しますか？作成中のQ&Aは破棄されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'OK', onPress: () => navigation.popToTop() },
      ],
    );
  }, [navigation]);

  // ============================================================
  // ─── カードモード UI ───
  // ============================================================
  const renderCardMode = () => {
    // ── 集計確認画面 ──
    if (showSummary) {
      const excludedIndices = editedQAs.map((_, i) => i).filter((i) => !selected[i]);
      const includedCount = selected.filter(Boolean).length;
      const excludedCount = excludedIndices.length;

      return (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.xxl + 80 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* 集計ヘッダー */}
          <View
            style={[styles.summaryHeader, { backgroundColor: colors.card, borderColor: colors.separator }, CardShadow]}
          >
            <View style={[styles.summaryIconWrap, { backgroundColor: SystemColors.green + '1A' }]}>
              <Ionicons name="checkmark-circle" size={44} color={SystemColors.green} />
            </View>
            <Text style={[styles.summaryTitle, { color: colors.label }]}>確認完了！</Text>
            <Text style={[styles.summarySubtitle, { color: colors.labelSecondary }]}>
              <Text style={{ color: SystemColors.green, fontWeight: '700' }}>
                {includedCount}件
              </Text>
              {' '}を保存、
              <Text style={{ color: SystemColors.red, fontWeight: '700' }}>
                {excludedCount}件
              </Text>
              {' '}を除外
            </Text>
          </View>

          {/* やり直しボタン */}
          <Pressable
            style={[styles.reviewAgainBtn, { borderColor: colors.separator }]}
            onPress={() => {
              setShowSummary(false);
              setCardIndex(0);
            }}
            accessibilityRole="button"
            accessibilityLabel="最初からやり直す"
          >
            <Ionicons name="refresh-outline" size={15} color={colors.accent} />
            <Text style={[styles.reviewAgainText, { color: colors.accent }]}>
              最初からやり直す
            </Text>
          </Pressable>

          {/* 除外カードリスト */}
          {excludedCount > 0 && (
            <>
              <Text style={[styles.summarySectionLabel, { color: colors.labelSecondary }]}>
                除外したカード
              </Text>
              {excludedIndices.map((origIdx) => (
                <View
                  key={origIdx}
                  style={[styles.summaryExcludedCard, { backgroundColor: colors.card, borderColor: colors.separator }, CardShadow]}
                >
                  <View style={styles.summaryExcludedBody}>
                    <View style={[styles.summaryExcludedBadge, { backgroundColor: SystemColors.red + '15' }]}>
                      <Text style={[styles.summaryExcludedBadgeText, { color: SystemColors.red }]}>
                        Q{origIdx + 1}
                      </Text>
                    </View>
                    <Text
                      style={[styles.summaryExcludedQ, { color: colors.labelSecondary }]}
                      numberOfLines={2}
                    >
                      {editedQAs[origIdx].question}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      setSelected((prev) =>
                        prev.map((v, i) => (i === origIdx ? true : v)),
                      )
                    }
                    style={[styles.restoreBtn, { backgroundColor: SystemColors.green + '15' }]}
                    accessibilityRole="button"
                    accessibilityLabel="保存リストに戻す"
                  >
                    <Text style={[styles.restoreBtnText, { color: SystemColors.green }]}>
                      戻す
                    </Text>
                  </Pressable>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      );
    }

    // ── カードスタック表示 ──
    const nextIndex = cardIndex + 1;
    const nextNextIndex = cardIndex + 2;

    return (
      <View style={styles.cardModeContainer}>
        {/* ソース情報（コンパクト） */}
        <View
          style={[styles.sourceCardCompact, { backgroundColor: colors.card, borderColor: colors.separator }, CardShadow]}
        >
          <View style={[styles.categoryChip, { backgroundColor: catConfig.color + '1A' }]}>
            <Text style={styles.categoryIcon}>{catConfig.icon}</Text>
            <Text style={[styles.categoryLabel, { color: catConfig.color }]}>
              {catConfig.label}
            </Text>
          </View>
          <Text style={[styles.sourceCardCompactTitle, { color: colors.label }]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* 25件超過バナー */}
        {wasTruncated && (
          <View
            style={[
              styles.truncateBanner,
              { backgroundColor: SystemColors.orange + '1A', borderColor: SystemColors.orange + '40' },
            ]}
          >
            <Ionicons name="information-circle-outline" size={14} color={SystemColors.orange} />
            <Text style={[styles.truncateBannerText, { color: SystemColors.orange }]}>
              先頭{MAX_ITEMS}件を表示（AI生成{rawPairs.length}件）
            </Text>
          </View>
        )}

        {/* カードスタック（背景カード + メインカード） */}
        <View style={styles.cardStackArea}>
          {/* 3枚目（最背面） */}
          {nextNextIndex < editedQAs.length && (
            <View
              style={[
                styles.bgCard,
                styles.bgCard3,
                { backgroundColor: colors.card },
              ]}
            />
          )}
          {/* 2枚目 */}
          {nextIndex < editedQAs.length && (
            <View
              style={[
                styles.bgCard,
                styles.bgCard2,
                { backgroundColor: colors.card },
              ]}
            />
          )}

          {/* メインカード（key でリマウントしてアニメ状態をリセット） */}
          <SwipeFlipCard
            key={cardIndex}
            question={editedQAs[cardIndex].question}
            answer={editedQAs[cardIndex].answer}
            onInclude={handleCardInclude}
            onExclude={handleCardExclude}
            onEdit={() => openEditModal(cardIndex)}
          />
        </View>

        {/* ドットインジケーター */}
        <View style={styles.dotRow}>
          {editedQAs.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i < cardIndex
                      ? selected[i]
                        ? SystemColors.green
                        : SystemColors.red
                      : i === cardIndex
                      ? colors.accent
                      : colors.separator,
                  width: i === cardIndex ? 18 : 6,
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.cardCounter, { color: colors.labelSecondary }]}>
          {cardIndex + 1} / {editedQAs.length}
        </Text>

        {/* 手動アクションボタン（スワイプの代替） */}
        <View style={styles.cardActions}>
          <Pressable
            style={[
              styles.cardActionBtn,
              {
                backgroundColor: SystemColors.red + '12',
                borderColor: SystemColors.red + '35',
              },
            ]}
            onPress={handleCardExclude}
            accessibilityRole="button"
            accessibilityLabel="除外"
          >
            <Ionicons name="close" size={28} color={SystemColors.red} />
            <Text style={[styles.cardActionLabel, { color: SystemColors.red }]}>除外</Text>
          </Pressable>

          <Pressable
            style={[
              styles.cardActionBtn,
              {
                backgroundColor: SystemColors.green + '12',
                borderColor: SystemColors.green + '35',
              },
            ]}
            onPress={handleCardInclude}
            accessibilityRole="button"
            accessibilityLabel="保存"
          >
            <Ionicons name="checkmark" size={28} color={SystemColors.green} />
            <Text style={[styles.cardActionLabel, { color: SystemColors.green }]}>保存</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  // ============================================================
  // ─── リストモード UI（既存ロジック維持） ───
  // ============================================================
  const renderListMode = () => (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: insets.bottom + Spacing.xxl + 72 },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ─── ソース情報カード ─── */}
      <View style={[styles.sourceCard, { backgroundColor: colors.card, borderColor: colors.separator }, CardShadow]}>
        <View style={styles.categoryRow}>
          <View style={[styles.categoryChip, { backgroundColor: catConfig.color + '1A' }]}>
            <Text style={styles.categoryIcon}>{catConfig.icon}</Text>
            <Text style={[styles.categoryLabel, { color: catConfig.color }]}>
              {catConfig.label}
            </Text>
          </View>
          <View style={[styles.autoBadge, { backgroundColor: colors.accent + '1A' }]}>
            <Text style={[styles.autoBadgeText, { color: colors.accent }]}>AI自動判定</Text>
          </View>
        </View>
        <Text style={[styles.sourceTitle, { color: colors.label }]} numberOfLines={3}>
          {title}
        </Text>
        {summary.length > 0 && (
          <Text
            style={[styles.sourceSummary, { color: colors.labelSecondary }]}
            numberOfLines={4}
          >
            {summary}
          </Text>
        )}
        <Text style={[styles.sourceUrl, { color: colors.labelTertiary }]} numberOfLines={1}>
          {url}
        </Text>
      </View>

      {/* ─── 25件超過バナー ─── */}
      {wasTruncated && (
        <View
          style={[
            styles.truncateBanner,
            { backgroundColor: SystemColors.orange + '1A', borderColor: SystemColors.orange + '40' },
          ]}
        >
          <Ionicons name="information-circle-outline" size={16} color={SystemColors.orange} />
          <Text style={[styles.truncateBannerText, { color: SystemColors.orange }]}>
            AI生成 {rawPairs.length}件 → 先頭{MAX_ITEMS}件を表示（上限）
          </Text>
        </View>
      )}

      {/* ─── セクションヘッダー ─── */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.labelSecondary }]}>Q&Aペア</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.accent + '1A' }]}>
          <Text style={[styles.countText, { color: colors.accent }]}>
            {selectedCount}/{editedQAs.length}件選択
          </Text>
        </View>
        <Pressable
          onPress={toggleSelectAll}
          hitSlop={8}
          style={[styles.selectAllButton, { borderColor: colors.separator }]}
          accessibilityRole="button"
          accessibilityLabel={allSelected ? '全解除' : '全選択'}
        >
          <Text style={[styles.selectAllText, { color: colors.accent }]}>
            {allSelected ? '全解除' : '全選択'}
          </Text>
        </Pressable>
      </View>

      {/* ─── Q&Aカード一覧 ─── */}
      {editedQAs.map((qa, index) => {
        const isExpanded = expandedIndex === index;
        const isEditing = editingIndex === index;
        const isSelected = selected[index];

        return (
          <View
            key={index}
            style={[
              styles.qaCard,
              { backgroundColor: colors.card, borderColor: colors.separator },
              !isSelected && styles.qaCardDeselected,
              CardShadow,
            ]}
          >
            {/* ─ カードヘッダー ─ */}
            <Pressable
              style={styles.qaHeader}
              onPress={() => toggleExpand(index)}
              accessibilityRole="button"
              accessibilityLabel={`Q&A ${index + 1}: ${qa.question}`}
              accessibilityState={{ expanded: isExpanded, checked: isSelected }}
            >
              <Pressable
                onPress={() => toggleSelect(index)}
                hitSlop={8}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`Q${index + 1}を${isSelected ? '選択解除' : '選択'}`}
              >
                <Ionicons
                  name={isSelected ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={isSelected ? colors.accent : colors.labelTertiary}
                />
              </Pressable>
              <View style={[styles.qaIndexBadge, { backgroundColor: colors.accent + '1A' }]}>
                <Text style={[styles.qaIndexText, { color: colors.accent }]}>Q{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }} />
              <Pressable
                onPress={() => (isEditing ? commitEdit() : startEdit(index))}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={isEditing ? '編集を確定' : '編集'}
                style={[
                  styles.editButton,
                  { borderColor: isEditing ? colors.accent : colors.separator },
                ]}
              >
                <Ionicons
                  name={isEditing ? 'checkmark-outline' : 'pencil-outline'}
                  size={14}
                  color={isEditing ? colors.accent : colors.labelSecondary}
                />
                <Text
                  style={[
                    styles.editButtonText,
                    { color: isEditing ? colors.accent : colors.labelSecondary },
                  ]}
                >
                  {isEditing ? '確定' : '編集'}
                </Text>
              </Pressable>
              {!isEditing && (
                <Text
                  style={[
                    styles.chevron,
                    { color: colors.labelTertiary },
                    isExpanded && styles.chevronExpanded,
                  ]}
                >
                  ›
                </Text>
              )}
            </Pressable>

            {/* ─ 質問テキスト or 編集 ─ */}
            {isEditing ? (
              <TextInput
                style={[
                  styles.editInput,
                  {
                    color: colors.label,
                    borderColor: colors.accent + '60',
                    backgroundColor: colors.backgroundGrouped,
                  },
                ]}
                value={qa.question}
                onChangeText={(text) => updateQuestion(index, text)}
                multiline
                placeholder="質問"
                placeholderTextColor={colors.labelTertiary}
                accessibilityLabel="質問を編集"
              />
            ) : (
              <Text
                style={[
                  styles.question,
                  { color: isSelected ? colors.label : colors.labelTertiary },
                ]}
                numberOfLines={isExpanded ? undefined : 2}
              >
                {qa.question}
              </Text>
            )}

            {/* ─ 答えエリア（展開時 or 編集時） ─ */}
            {(isExpanded || isEditing) && (
              <View style={[styles.answerContainer, { borderTopColor: colors.separator }]}>
                <Text style={[styles.answerLabel, { color: colors.labelTertiary }]}>答え</Text>
                {isEditing ? (
                  <TextInput
                    style={[
                      styles.editInput,
                      {
                        color: colors.labelSecondary,
                        borderColor: colors.separator,
                        backgroundColor: colors.backgroundGrouped,
                      },
                    ]}
                    value={qa.answer}
                    onChangeText={(text) => updateAnswer(index, text)}
                    multiline
                    placeholder="答え"
                    placeholderTextColor={colors.labelTertiary}
                    accessibilityLabel="答えを編集"
                  />
                ) : (
                  <Text style={[styles.answer, { color: colors.labelSecondary }]}>
                    {qa.answer}
                  </Text>
                )}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );

  // ============================================================
  // ─── Root Render ───
  // ============================================================
  return (
    <View style={[styles.root, { backgroundColor: colors.backgroundGrouped }]}>
      {viewMode === 'card' ? renderCardMode() : renderListMode()}

      {/* ─── 固定ボタンエリア ─── */}
      <View
        style={[
          styles.buttonArea,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.separator,
            paddingBottom: Math.max(insets.bottom, Spacing.m),
          },
        ]}
      >
        {/* 1行目: キャンセル + ライブラリに保存 */}
        <View style={styles.buttonRow}>
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              {
                backgroundColor: pressed
                  ? colors.backgroundSecondary
                  : colors.backgroundGrouped,
                borderColor: colors.separator,
              },
            ]}
            onPress={handleCancel}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="キャンセル"
          >
            <Text style={[styles.cancelButtonText, { color: colors.label }]}>キャンセル</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              {
                borderColor: selectedCount === 0 ? colors.separator : colors.accent,
                backgroundColor: pressed ? colors.accent + '14' : 'transparent',
              },
              (saving || selectedCount === 0) && styles.buttonDisabled,
            ]}
            onPress={handleSaveSelected}
            disabled={saving || selectedCount === 0}
            accessibilityRole="button"
            accessibilityLabel={`選択した${selectedCount}件を保存`}
          >
            {saving ? (
              <ActivityIndicator color={colors.accent} size="small" />
            ) : (
              <Text
                style={[
                  styles.saveButtonText,
                  { color: selectedCount === 0 ? colors.labelTertiary : colors.accent },
                ]}
              >
                {selectedCount}件を保存
              </Text>
            )}
          </Pressable>
        </View>

        {/* 2行目: 保存して復習開始（プライマリCTA） */}
        <Pressable
          style={({ pressed }) => [
            styles.reviewStartButton,
            {
              backgroundColor:
                selectedCount === 0
                  ? colors.backgroundSecondary
                  : pressed
                  ? colors.accent + 'CC'
                  : colors.accent,
            },
            (saving || selectedCount === 0) && styles.buttonDisabled,
          ]}
          onPress={handleSaveAndReview}
          disabled={saving || selectedCount === 0}
          accessibilityRole="button"
          accessibilityLabel={`${selectedCount}件を保存して復習開始`}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons
                name="play-circle-outline"
                size={18}
                color={selectedCount === 0 ? colors.labelTertiary : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.reviewStartButtonText,
                  { color: selectedCount === 0 ? colors.labelTertiary : '#FFFFFF' },
                ]}
              >
                保存して復習開始
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* ─── 編集モーダル（両モード共通） ─── */}
      {editModalIndex !== null && (
        <EditModal
          visible
          qa={editedQAs[editModalIndex]}
          onSave={handleEditSave}
          onDismiss={() => setEditModalIndex(null)}
        />
      )}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.m,
    gap: Spacing.s,
  },

  // ── ソースカード（リストモード） ──
  sourceCard: {
    borderRadius: Radius.m,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.m,
    gap: Spacing.s,
    marginBottom: Spacing.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    flexWrap: 'wrap',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.s,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryLabel: {
    ...TypeScale.footnote,
    fontWeight: '600',
  },
  autoBadge: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  autoBadgeText: {
    ...TypeScale.caption2,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  sourceTitle: {
    ...TypeScale.headline,
  },
  sourceSummary: {
    ...TypeScale.subheadline,
    lineHeight: 20,
  },
  sourceUrl: {
    ...TypeScale.caption1,
    marginTop: Spacing.xs,
  },

  // ── ソースカード（カードモード・コンパクト版） ──
  sourceCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    marginHorizontal: Spacing.m,
    marginTop: Spacing.s,
    borderRadius: Radius.m,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  sourceCardCompactTitle: {
    ...TypeScale.footnote,
    flex: 1,
  },

  // ── 25件超過バナー ──
  truncateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginHorizontal: Spacing.m,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: Radius.m,
    borderWidth: 1,
  },
  truncateBannerText: {
    ...TypeScale.footnote,
    flex: 1,
    lineHeight: 18,
  },

  // ── セクションヘッダー（リストモード） ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    marginTop: Spacing.s,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    ...TypeScale.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  countBadge: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  countText: {
    ...TypeScale.caption2,
    fontWeight: '700',
  },
  selectAllButton: {
    marginLeft: 'auto',
    paddingHorizontal: Spacing.s,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  selectAllText: {
    ...TypeScale.caption1,
    fontWeight: '600',
  },

  // ── Q&Aカード（リストモード） ──
  qaCard: {
    borderRadius: Radius.m,
    borderWidth: 1,
    padding: Spacing.m,
    gap: Spacing.s,
  },
  qaCardDeselected: {
    opacity: 0.5,
  },
  qaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  qaIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaIndexText: {
    ...TypeScale.caption1,
    fontWeight: '700',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.s,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  editButtonText: {
    ...TypeScale.caption2,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '300',
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  question: {
    ...TypeScale.body,
    lineHeight: 24,
  },
  editInput: {
    ...TypeScale.body,
    borderWidth: 1,
    borderRadius: Radius.s,
    padding: Spacing.s,
    minHeight: 60,
    lineHeight: 22,
  },
  answerContainer: {
    paddingTop: Spacing.m,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
  },
  answerLabel: {
    ...TypeScale.caption1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  answer: {
    ...TypeScale.subheadline,
    lineHeight: 22,
  },

  // ── 固定ボタンエリア ──
  buttonArea: {
    gap: Spacing.s,
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.m,
    borderTopWidth: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.s,
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: Radius.m,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    ...TypeScale.subheadline,
  },
  saveButton: {
    flex: 2,
    height: 46,
    borderRadius: Radius.m,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  saveButtonText: {
    ...TypeScale.subheadline,
    fontWeight: '600' as const,
  },
  reviewStartButton: {
    height: 50,
    borderRadius: Radius.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s,
  },
  reviewStartButtonText: {
    ...TypeScale.headline,
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // ── カードモード コンテナ ──
  cardModeContainer: {
    flex: 1,
  },

  // ── カードスタックエリア ──
  cardStackArea: {
    alignItems: 'center',
    marginTop: Spacing.m,
    paddingHorizontal: Spacing.m,
    // 背景カードがはみ出る分の余白
    paddingTop: 16,
  },

  // 背景カード（装飾的なスタック表現）
  bgCard: {
    position: 'absolute',
    borderRadius: Radius.l,
    height: CARD_HEIGHT,
  },
  bgCard2: {
    top: 8,
    left: Spacing.m + 8,
    right: Spacing.m + 8,
    opacity: 0.7,
  },
  bgCard3: {
    top: 0,
    left: Spacing.m + 20,
    right: Spacing.m + 20,
    opacity: 0.4,
  },

  // ── SwipeFlipCard ──
  swipeCardWrapper: {
    width: SCREEN_WIDTH - Spacing.m * 2,
    height: CARD_HEIGHT,
    zIndex: 10,
  },
  swipeCardPressable: {
    flex: 1,
  },
  swipeCard: {
    height: CARD_HEIGHT,
    borderRadius: Radius.l,
    padding: Spacing.l,
    justifyContent: 'space-between',
  },

  // スワイプオーバーレイ
  swipeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radius.l,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  includeOverlay: {
    backgroundColor: SystemColors.green + '20',
    borderWidth: 3,
    borderColor: SystemColors.green + '60',
  },
  excludeOverlay: {
    backgroundColor: SystemColors.red + '20',
    borderWidth: 3,
    borderColor: SystemColors.red + '60',
  },
  swipeOverlayText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // カード内パーツ
  cardEditBtn: {
    alignSelf: 'flex-end',
    padding: Spacing.xs,
  },
  swipeCardBody: {
    flex: 1,
    marginTop: Spacing.xs,
  },
  swipeCardSectionLabel: {
    ...TypeScale.caption1,
    letterSpacing: 1.2,
    marginBottom: Spacing.xs,
  },
  swipeCardQuestion: {
    ...TypeScale.title2,
    marginTop: Spacing.xs,
  },
  swipeCardQuestionSmall: {
    ...TypeScale.headline,
    marginTop: Spacing.xs,
  },
  swipeCardDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.m,
  },
  swipeCardAnswer: {
    ...TypeScale.bodyJA,
  },
  swipeFlipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.s,
  },
  flipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  swipeFlipHintText: {
    ...TypeScale.footnote,
    marginLeft: Spacing.xs,
  },

  // ── ドットインジケーター ──
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: Spacing.m,
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.m,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  cardCounter: {
    ...TypeScale.caption1,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },

  // ── カードアクションボタン ──
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.l,
    marginTop: Spacing.m,
    paddingHorizontal: Spacing.m,
  },
  cardActionBtn: {
    width: 80,
    height: 64,
    borderRadius: Radius.l,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 1.5,
  },
  cardActionLabel: {
    ...TypeScale.caption1,
    fontWeight: '700',
  },

  // ── 集計確認画面 ──
  summaryHeader: {
    borderRadius: Radius.l,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.l,
    alignItems: 'center',
    gap: Spacing.s,
  },
  summaryIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  summaryTitle: {
    ...TypeScale.title2,
    textAlign: 'center',
  },
  summarySubtitle: {
    ...TypeScale.subheadline,
    textAlign: 'center',
    lineHeight: 22,
  },
  reviewAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.s,
    borderRadius: Radius.m,
    borderWidth: 1,
    marginTop: Spacing.s,
  },
  reviewAgainText: {
    ...TypeScale.subheadline,
    fontWeight: '600',
  },
  summarySectionLabel: {
    ...TypeScale.footnote,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.m,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  summaryExcludedCard: {
    borderRadius: Radius.m,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  summaryExcludedBody: {
    flex: 1,
    gap: Spacing.xs,
  },
  summaryExcludedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.s,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  summaryExcludedBadgeText: {
    ...TypeScale.caption2,
    fontWeight: '700',
  },
  summaryExcludedQ: {
    ...TypeScale.subheadline,
    lineHeight: 20,
  },
  restoreBtn: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: Radius.m,
    alignSelf: 'center',
  },
  restoreBtnText: {
    ...TypeScale.footnote,
    fontWeight: '700',
  },

  // ── 編集モーダル ──
  modalKAV: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    ...TypeScale.headline,
  },
  modalAction: {
    ...TypeScale.body,
    fontWeight: '600',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: Spacing.m,
    gap: Spacing.xs,
  },
  modalLabel: {
    ...TypeScale.footnote,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.m,
    marginBottom: Spacing.xs,
  },
  modalInput: {
    ...TypeScale.body,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.m,
    minHeight: 72,
    lineHeight: 22,
  },
  modalInputAnswer: {
    minHeight: 120,
  },
  charCount: {
    ...TypeScale.caption2,
    textAlign: 'right',
    marginTop: 2,
  },
});
