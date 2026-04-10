import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import { useHistory } from '../../hooks/useHistory';
import type { HistoryEntry } from '../../hooks/useHistory';
import { colors, fontFamily } from '../../theme/tokens';

// ══════════════════════════════════════════════
// 無音の演算 — HistoryPane
// HTML mock: .sb-pane#pane-hist
// FlatList で calculatorStore.history を表示
// タップで式を復元、下部に「履歴を消去」ボタン
// ══════════════════════════════════════════════

interface HistoryPaneProps {
  /** 項目タップ後にサイドバーを閉じる場合に使用 */
  onClose?: () => void;
}

// ── 履歴アイテム ────────────────────────────────
interface HistoryItemProps {
  entry: HistoryEntry;
  onRecall: (entry: HistoryEntry) => void;
}

const HistoryItem = memo<HistoryItemProps>(({ entry, onRecall }) => {
  const timestamp = new Date(entry.timestamp);
  const timeStr = `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={() => onRecall(entry)}
      activeOpacity={0.7}
    >
      <Text style={styles.itemExpr} numberOfLines={1} ellipsizeMode="tail">
        {entry.expression}
      </Text>
      <View style={styles.itemBottom}>
        <Text style={styles.itemResult} numberOfLines={1} ellipsizeMode="tail">
          = {entry.result}
        </Text>
        <Text style={styles.itemTime}>{timeStr}</Text>
      </View>
    </TouchableOpacity>
  );
});
HistoryItem.displayName = 'HistoryItem';

// ── 空状態 ──────────────────────────────────────
const EmptyHistory = memo(() => (
  <View style={styles.empty}>
    <Text style={styles.emptyText}>計算履歴はありません</Text>
  </View>
));
EmptyHistory.displayName = 'EmptyHistory';

// ── HistoryPane ─────────────────────────────────
const HistoryPane = memo<HistoryPaneProps>(({ onClose }) => {
  const { recentHistory, clearHistory, recallEntry } = useHistory();

  const handleRecall = useCallback(
    (entry: HistoryEntry) => {
      recallEntry(entry);
      onClose?.();
    },
    [recallEntry, onClose],
  );

  const keyExtractor = useCallback(
    (item: HistoryEntry) => String(item.timestamp),
    [],
  );

  const renderItem = useCallback<ListRenderItem<HistoryEntry>>(
    ({ item }) => <HistoryItem entry={item} onRecall={handleRecall} />,
    [handleRecall],
  );

  const separator = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  return (
    <View style={styles.container}>
      {/* 計算履歴ラベル */}
      <Text style={styles.sectionLabel}>計算履歴</Text>

      {/* 履歴リスト */}
      <FlatList
        data={recentHistory}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={separator}
        ListEmptyComponent={EmptyHistory}
        scrollEnabled={false}        // ScrollView内でネストするため無効化
        style={styles.list}
      />

      {/* 「履歴を消去」ボタン */}
      <View style={styles.clearBtnWrapper}>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={clearHistory}
          activeOpacity={0.7}
        >
          <Text style={styles.clearBtnText}>履歴を消去</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

HistoryPane.displayName = 'HistoryPane';

export default HistoryPane;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.g2,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    fontFamily: fontFamily.ui,
  },
  list: {
    paddingTop: 8,
    paddingBottom: 0,
  },
  separator: {
    height: 1,
    backgroundColor: colors.g0,
    marginHorizontal: 16,
  },
  // 履歴アイテム
  item: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  itemExpr: {
    fontSize: 11,
    color: colors.g2,
    fontFamily: fontFamily.mono,
    marginBottom: 2,
  },
  itemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  itemResult: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.black,
    fontFamily: fontFamily.mono,
    flex: 1,
  },
  itemTime: {
    fontSize: 10,
    color: colors.g2,
    fontFamily: fontFamily.ui,
    marginLeft: 8,
  },
  // 空状態
  empty: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.g2,
    fontFamily: fontFamily.ui,
  },
  // 「履歴を消去」ボタン
  clearBtnWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  clearBtn: {
    width: '100%',
    height: 44,
    backgroundColor: colors.g0,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 13,
    color: colors.g2,
    fontFamily: fontFamily.ui,
    fontWeight: '500',
  },
});
