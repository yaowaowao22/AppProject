import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useHistory } from '../../hooks/useHistory';
import type { HistoryRecord } from '../../types/history';

// --- Navigation types (inline until RootNavigator is wired up) ---
type NavProp = {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
};

type Props = {
  navigation: NavProp;
};

// --- Date grouping helpers ---
type Section = {
  title: string;
  data: HistoryRecord[];
};

function groupByDate(records: HistoryRecord[]): Section[] {
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const buckets: { 今日: HistoryRecord[]; 昨日: HistoryRecord[]; それ以前: HistoryRecord[] } = {
    今日: [],
    昨日: [],
    それ以前: [],
  };

  for (const record of records) {
    const ds = new Date(record.createdAt).toDateString();
    if (ds === todayStr) {
      buckets['今日'].push(record);
    } else if (ds === yesterdayStr) {
      buckets['昨日'].push(record);
    } else {
      buckets['それ以前'].push(record);
    }
  }

  const sections: Section[] = [];
  if (buckets['今日'].length > 0) sections.push({ title: '今日', data: buckets['今日'] });
  if (buckets['昨日'].length > 0) sections.push({ title: '昨日', data: buckets['昨日'] });
  if (buckets['それ以前'].length > 0) sections.push({ title: 'それ以前', data: buckets['それ以前'] });

  return sections;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  const ds = d.toDateString();

  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const time = `${hh}:${mm}`;

  if (ds === todayStr) return `今日 ${time}`;
  if (ds === yesterdayStr) return `昨日 ${time}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
}

// --- Mini φ grid lines overlay (縦61.8% / 横38.2%) ---
function ThumbnailPhiLines() {
  return (
    <View style={styles.thumbLines} pointerEvents="none">
      <View style={[styles.thumbLineV, { left: '61.8%' as unknown as number }]} />
      <View style={[styles.thumbLineH, { top: '38.2%' as unknown as number }]} />
    </View>
  );
}

// --- Delete action revealed on left swipe ---
function DeleteAction({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.deleteAction} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.deleteActionText}>削除</Text>
    </TouchableOpacity>
  );
}

// --- Single history item row ---
function HistoryItem({
  record,
  onDelete,
  onPress,
}: {
  record: HistoryRecord;
  onDelete: (id: string) => void;
  onPress: (record: HistoryRecord) => void;
}) {
  const renderRightActions = useCallback(
    () => <DeleteAction onPress={() => onDelete(record.id)} />,
    [record.id, onDelete],
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      rightThreshold={60}
      overshootRight={false}
    >
      <TouchableOpacity
        style={styles.item}
        onPress={() => onPress(record)}
        activeOpacity={0.7}
      >
        {/* Thumbnail 64×64 */}
        <View style={styles.thumb}>
          {record.thumbnailPath ? (
            <Image source={{ uri: record.thumbnailPath }} style={styles.thumbImage} />
          ) : (
            <View style={styles.thumbPlaceholder} />
          )}
          <ThumbnailPhiLines />
          {/* "AFTER" mini badge — bottom-left per mock.html::after */}
          <View style={styles.afterBadge}>
            <Text style={styles.afterBadgeText}>AFTER</Text>
          </View>
        </View>

        {/* Info column */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {record.label}
          </Text>
          <Text style={styles.date}>
            {formatDateTime(record.createdAt)} · 強度 {record.intensity}%
          </Text>
        </View>

        {/* Score badge */}
        <View style={styles.badge}>
          <Text style={styles.score}>{record.score}%</Text>
          <Text style={styles.scoreLabel}>φ適合</Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

// --- Screen ---
export default function HistoryScreen({ navigation }: Props) {
  const { records, loading, deleteRecord } = useHistory();

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteRecord(id);
    },
    [deleteRecord],
  );

  const handlePress = useCallback(
    (record: HistoryRecord) => {
      navigation.navigate('Editor', { record: record as unknown as Record<string, unknown> });
    },
    [navigation],
  );

  const sections = groupByDate(records);

  return (
    <View style={styles.container}>
      {/* NavBar */}
      <View style={styles.navBar}>
        <View style={styles.navBtnEmpty} />
        <Text style={styles.navTitle}>加工履歴</Text>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.navigate('Upload')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.navBtnPlus}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Page title */}
      <Text style={styles.pageTitle}>記録</Text>

      {/* List / loading / empty */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color="#AAAAAA" />
        </View>
      ) : records.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>まだ記録がありません</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionTitle}>{title}</Text>
          )}
          renderItem={({ item }) => (
            <HistoryItem record={item} onDelete={handleDelete} onPress={handlePress} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ── NavBar ──────────────────────────────────────────────────────────────
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 34,
    paddingTop: 21,    // --u3
    paddingBottom: 13, // --u2
  },
  navBtnEmpty: {
    width: 32,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: '#111111',
  },
  navBtn: {
    width: 32,
    alignItems: 'flex-end',
  },
  navBtnPlus: {
    fontSize: 22,
    fontWeight: '300',
    color: '#111111',
    lineHeight: 26,
  },

  // ── Page title ──────────────────────────────────────────────────────────
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: '#111111',
    paddingHorizontal: 34,
    paddingTop: 8,   // --u1
    paddingBottom: 0,
  },

  // ── SectionList ─────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 34,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#AAAAAA',
    paddingTop: 21,  // --u3
    paddingBottom: 13, // --u2
  },

  // ── Item row ────────────────────────────────────────────────────────────
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 21,           // --u3
    paddingVertical: 13, // --u2
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0', // --gray-1
    backgroundColor: '#FFFFFF',
  },

  // ── Thumbnail ───────────────────────────────────────────────────────────
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12, // --r-md
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    flexShrink: 0,
  },
  thumbImage: {
    width: 64,
    height: 64,
  },
  thumbPlaceholder: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  thumbLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  thumbLineV: {
    position: 'absolute',
    width: 0.5,
    top: 0,
    bottom: 0,
    backgroundColor: '#C8A96E',
    opacity: 0.5,
  },
  thumbLineH: {
    position: 'absolute',
    height: 0.5,
    left: 0,
    right: 0,
    backgroundColor: '#C8A96E',
    opacity: 0.5,
  },
  afterBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  afterBadgeText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#C8A96E',
  },

  // ── Info column ─────────────────────────────────────────────────────────
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 3,
  },
  date: {
    fontSize: 11,
    color: '#AAAAAA',
  },

  // ── Score badge ─────────────────────────────────────────────────────────
  badge: {
    alignItems: 'flex-end',
    gap: 2,
  },
  score: {
    fontSize: 20,
    fontWeight: '200',
    color: '#111111',
    letterSpacing: -1,
    lineHeight: 22,
  },
  scoreLabel: {
    fontSize: 9,
    color: '#AAAAAA',
    letterSpacing: 0.3,
  },

  // ── Delete action (right swipe) ─────────────────────────────────────────
  deleteAction: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  deleteActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Empty / loading states ──────────────────────────────────────────────
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#AAAAAA',
  },
});
