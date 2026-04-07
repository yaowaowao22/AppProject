// ============================================================
// DeepDiveButton - ローカルLLM深掘りトリガーボタン
// タップ → キューに追加 → バックグラウンドで処理
// 結果があればバッジ表示 → タップでモーダル表示
//
// compact=true のとき: 幅いっぱいの1行コンパクト表示
//   URLImportListScreen の各カード下部などで使用
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { View, Pressable, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { useDatabase } from '../hooks/useDatabase';
import {
  getDeepDivesForItem,
  getAllDeepDivesForItem,
} from '../db/deepDiveRepository';
import { enqueueDeepDive, subscribeDeepDive } from '../services/deepDiveService';
import { DeepDiveResultModal } from './DeepDiveResultModal';
import type { DeepDive } from '../types';

interface DeepDiveButtonProps {
  itemId: number;
  question: string;
  answer: string;
  /** true のとき横幅いっぱいのコンパクト1行表示 */
  compact?: boolean;
}

export function DeepDiveButton({ itemId, question, answer, compact = false }: DeepDiveButtonProps) {
  const { db, isReady } = useDatabase();
  const { colors } = useTheme();
  const [dives, setDives] = useState<DeepDive[]>([]);
  const [allDives, setAllDives] = useState<DeepDive[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [enqueueing, setEnqueueing] = useState(false);

  const loadDives = useCallback(async () => {
    if (!db || !isReady) return;
    const done = await getDeepDivesForItem(db, itemId);
    const all = await getAllDeepDivesForItem(db, itemId);
    setDives(done);
    setAllDives(all);
  }, [db, isReady, itemId]);

  useEffect(() => {
    loadDives();
  }, [loadDives]);

  // リスナーで変更を検知してリロード
  useEffect(() => {
    const unsub = subscribeDeepDive(() => {
      loadDives();
    });
    return unsub;
  }, [loadDives]);

  const hasDoneResult = dives.length > 0;
  const hasPending = allDives.some((d) => d.status === 'queued' || d.status === 'processing');

  const handlePress = async () => {
    if (hasDoneResult) {
      setModalVisible(true);
      return;
    }

    if (hasPending) {
      Alert.alert('処理中', '深掘りリクエストを処理しています。完了までお待ちください。');
      return;
    }

    if (!db) return;
    setEnqueueing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await enqueueDeepDive(db, itemId, question, answer);
      await loadDives();
    } finally {
      setEnqueueing(false);
    }
  };

  const buttonColor = hasDoneResult ? '#5856D6' : hasPending ? '#FF9500' : colors.accent;
  const buttonBg = hasDoneResult ? '#5856D61A' : hasPending ? '#FF95001A' : `${colors.accent}1A`;
  const buttonLabel = hasDoneResult
    ? `深掘り結果を見る (${dives.length})`
    : hasPending
      ? '深掘り処理中...'
      : 'AIで深掘り';
  const buttonIcon: React.ComponentProps<typeof Ionicons>['name'] = hasDoneResult
    ? 'reader-outline'
    : hasPending
      ? 'hourglass-outline'
      : 'bulb-outline';

  if (compact) {
    return (
      <>
        <Pressable
          style={({ pressed }) => [
            styles.compactButton,
            {
              backgroundColor: pressed ? `${buttonColor}22` : 'transparent',
            },
          ]}
          onPress={handlePress}
          disabled={enqueueing}
          accessibilityRole="button"
          accessibilityLabel={buttonLabel}
        >
          <Ionicons name={buttonIcon} size={13} color={buttonColor} />
          <Text style={[styles.compactLabel, { color: buttonColor }]}>
            {buttonLabel}
          </Text>
          {hasDoneResult && (
            <View style={[styles.badge, { backgroundColor: buttonColor }]}>
              <Text style={styles.badgeText}>{dives.length}</Text>
            </View>
          )}
        </Pressable>

        <DeepDiveResultModal
          visible={modalVisible}
          dives={dives}
          onClose={() => setModalVisible(false)}
        />
      </>
    );
  }

  return (
    <>
      <View style={styles.wrapper}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: pressed ? `${buttonColor}33` : buttonBg,
              borderColor: `${buttonColor}40`,
            },
          ]}
          onPress={handlePress}
          disabled={enqueueing}
          accessibilityRole="button"
          accessibilityLabel={buttonLabel}
        >
          <Ionicons name={buttonIcon} size={16} color={buttonColor} />
          <Text style={[styles.label, { color: buttonColor }]}>
            {buttonLabel}
          </Text>
        </Pressable>
      </View>

      <DeepDiveResultModal
        visible={modalVisible}
        dives={dives}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.m,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    minHeight: 40,
    borderRadius: Radius.m,
    borderWidth: 1,
    paddingHorizontal: Spacing.m,
  },
  label: {
    ...TypeScale.footnote,
    fontWeight: '600',
  },
  // ---- compact mode ----
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: Radius.xs,
  },
  compactLabel: {
    ...TypeScale.caption1,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
