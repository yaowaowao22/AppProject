// ============================================================
// KnowledgeMapScreen — カテゴリグループ表示
// ・カテゴリごとにノードをクラスター配置
// ・タップで詳細カード表示
// ・タグ ID に基づくカラーパレットで色分け
// ============================================================
import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import { Svg, Circle, Line, Text as SvgText } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useKnowledgeMap } from '../../hooks/useKnowledgeMap';
import { Spacing, Radius } from '../../theme/spacing';
import { SystemColors, RecallAmber } from '../../theme/colors';
import type { MapStackParamList } from '../../navigation/types';
import type { ItemWithMeta, Tag } from '../../types';

type Props = NativeStackScreenProps<MapStackParamList, 'KnowledgeMap'>;

// ── タグカラーパレット（ノード色）────────────────────────────
const TAG_COLORS = [
  SystemColors.indigo,
  SystemColors.purple,
  SystemColors.teal,
  SystemColors.blue,
  SystemColors.green,
  SystemColors.orange,
  RecallAmber.light,
  SystemColors.red,
  '#FF6B9D',
  '#00C7BE',
] as const;

// ── カテゴリグループ背景色 ────────────────────────────────────
const CAT_BG = [
  'rgba(99,102,241,0.10)',
  'rgba(168,85,247,0.10)',
  'rgba(20,184,166,0.10)',
  'rgba(59,130,246,0.10)',
  'rgba(34,197,94,0.10)',
  'rgba(249,115,22,0.10)',
  'rgba(234,179,8,0.10)',
  'rgba(239,68,68,0.10)',
  'rgba(236,72,153,0.10)',
  'rgba(0,199,190,0.10)',
] as const;

const CAT_STROKE = [
  'rgba(99,102,241,0.30)',
  'rgba(168,85,247,0.30)',
  'rgba(20,184,166,0.30)',
  'rgba(59,130,246,0.30)',
  'rgba(34,197,94,0.30)',
  'rgba(249,115,22,0.30)',
  'rgba(234,179,8,0.30)',
  'rgba(239,68,68,0.30)',
  'rgba(236,72,153,0.30)',
  'rgba(0,199,190,0.30)',
] as const;

const NODE_R = 22;
const LABEL_CHARS = 10;
const CAT_LABEL_CHARS = 12;

function tagColor(tagId: number): string {
  return TAG_COLORS[Math.abs(tagId) % TAG_COLORS.length];
}

function nodeColor(tags: Tag[]): string {
  return tags.length > 0 ? tagColor(tags[0].id) : '#8E8E93';
}

function catBg(idx: number): string {
  return CAT_BG[idx % CAT_BG.length];
}

function catStroke(idx: number): string {
  return CAT_STROKE[idx % CAT_STROKE.length];
}

// ── グラフデータ型 ─────────────────────────────────────────────
interface GNode {
  id: number;
  title: string;
  tags: Tag[];
  category: string;
  x: number;
  y: number;
}

interface GEdge {
  id: string;
  src: number;
  tgt: number;
  tagId: number;
}

interface CategoryGroup {
  category: string;
  cx: number;
  cy: number;
  bgR: number;
  colorIdx: number;
}

// ── カテゴリグループレイアウト構築 ────────────────────────────
function buildGroupedLayout(
  items: ItemWithMeta[],
  w: number,
  h: number,
): { nodes: GNode[]; edges: GEdge[]; groups: CategoryGroup[] } {
  // カテゴリ別にグループ化（null は「未分類」へ）
  const catMap = new Map<string, ItemWithMeta[]>();
  for (const item of items) {
    const key = item.category ?? '未分類';
    if (!catMap.has(key)) catMap.set(key, []);
    catMap.get(key)!.push(item);
  }

  const cats = [...catMap.keys()];
  const n = cats.length;

  // グリッド列数を決定
  const cols =
    n <= 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 2 : n <= 6 ? 3 : Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);

  const cellW = w / cols;
  const cellH = h / rows;

  // ラベルスペース（上部 24px）を除いた使用可能半径
  const maxBgR = Math.min(cellW, cellH) / 2 - 28;

  const groups: CategoryGroup[] = [];
  const nodes: GNode[] = [];

  cats.forEach((cat, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    // セル中心（ラベルスペース分、下にオフセット）
    const cx = cellW * col + cellW / 2;
    const cy = cellH * row + cellH / 2 + 12;

    const catItems = catMap.get(cat)!;

    // アイテム配置円の半径（1件の場合は中心に配置）
    const itemR =
      catItems.length <= 1
        ? 0
        : Math.min(maxBgR - NODE_R - 12, NODE_R * 1.4 + catItems.length * NODE_R * 0.55);

    const bgR = Math.max(NODE_R + 20, Math.min(maxBgR, itemR + NODE_R + 16));

    groups.push({ category: cat, cx, cy, bgR, colorIdx: idx });

    catItems.forEach((item, i) => {
      const angle =
        catItems.length === 1
          ? 0
          : (2 * Math.PI * i) / catItems.length - Math.PI / 2;
      nodes.push({
        id: item.id,
        title: item.title,
        tags: item.tags,
        category: cat,
        x: cx + itemR * Math.cos(angle),
        y: cy + itemR * Math.sin(angle),
      });
    });
  });

  // エッジ（共通タグを持つアイテムを接続）
  const edges: GEdge[] = [];
  const edgeSet = new Set<string>();
  const byTag = new Map<number, { itemId: number; tagId: number }[]>();

  for (const item of items) {
    for (const tag of item.tags) {
      if (!byTag.has(tag.id)) byTag.set(tag.id, []);
      byTag.get(tag.id)!.push({ itemId: item.id, tagId: tag.id });
    }
  }

  for (const [, group] of byTag) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      let c = 0;
      for (let j = i + 1; j < group.length && c < 4; j++) {
        const a = Math.min(group[i].itemId, group[j].itemId);
        const b = Math.max(group[i].itemId, group[j].itemId);
        const key = `${a}-${b}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({
            id: key,
            src: group[i].itemId,
            tgt: group[j].itemId,
            tagId: group[i].tagId,
          });
          c++;
        }
      }
    }
  }

  return { nodes, edges, groups };
}

// ── メインコンポーネント ───────────────────────────────────────
export function KnowledgeMapScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { items, isLoading, refresh } = useKnowledgeMap();

  const [graphSize, setGraphSize] = useState({ w: 0, h: 0 });
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // カードアニメーション
  const cardTranslateY = useRef(new Animated.Value(200)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  // フォーカス時にデータ更新
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // グループレイアウトを useMemo で計算
  const { nodes, edges, groups } = useMemo(() => {
    if (!items.length || !graphSize.w || !graphSize.h) {
      return { nodes: [], edges: [], groups: [] };
    }
    return buildGroupedLayout(items, graphSize.w, graphSize.h);
  }, [items, graphSize.w, graphSize.h]);

  // PanResponder から最新 nodes を参照するための ref
  const nodesRef = useRef<GNode[]>([]);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // カードアニメーション
  useEffect(() => {
    const toY = selectedId !== null ? 0 : 200;
    const toOp = selectedId !== null ? 1 : 0;
    Animated.parallel([
      Animated.spring(cardTranslateY, {
        toValue: toY,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }),
      Animated.timing(cardOpacity, {
        toValue: toOp,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // PanResponder（タップのみ・ドラッグなし）
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const hit = nodesRef.current.some(
          (n) => Math.hypot(n.x - locationX, n.y - locationY) <= NODE_R + 8,
        );
        if (!hit) setSelectedId(null);
        return hit;
      },
      onPanResponderRelease: (evt, gs) => {
        if (Math.abs(gs.dx) < 8 && Math.abs(gs.dy) < 8) {
          const { locationX, locationY } = evt.nativeEvent;
          const hit = nodesRef.current.find(
            (n) => Math.hypot(n.x - locationX, n.y - locationY) <= NODE_R + 8,
          );
          if (hit) setSelectedId(hit.id);
        }
      },
    }),
  ).current;

  const handleLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = e.nativeEvent.layout;
      setGraphSize((prev) => {
        if (prev.w === width && prev.h === height) return prev;
        return { w: width, h: height };
      });
    },
    [],
  );

  // タグ凡例（重複排除・id順）
  const allTags = useMemo(() => {
    const map = new Map<number, Tag>();
    for (const item of items) {
      for (const tag of item.tags) {
        if (!map.has(tag.id)) map.set(tag.id, tag);
      }
    }
    return [...map.values()].sort((a, b) => a.id - b.id);
  }, [items]);

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  );

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const edgeColor = isDark ? 'rgba(235,235,245,0.12)' : 'rgba(0,0,0,0.08)';
  const labelColor = isDark ? 'rgba(235,235,245,0.80)' : 'rgba(60,60,67,0.80)';
  const catLabelColor = isDark ? 'rgba(235,235,245,0.65)' : 'rgba(60,60,67,0.65)';

  const showLoading = isLoading;
  const showEmpty = !isLoading && items.length === 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* グラフ描画エリア */}
      <View
        style={styles.graph}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        {showLoading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        )}

        {showEmpty && (
          <View style={styles.center}>
            <Text style={[styles.emptyText, { color: colors.labelSecondary }]}>
              アイテムを追加すると{'\n'}知識マップが表示されます
            </Text>
          </View>
        )}

        {!showLoading && !showEmpty && graphSize.w > 0 && (
          <Svg width={graphSize.w} height={graphSize.h}>
            {/* カテゴリグループ背景 */}
            {groups.map((g) => {
              const labelText =
                g.category.length > CAT_LABEL_CHARS
                  ? g.category.slice(0, CAT_LABEL_CHARS) + '…'
                  : g.category;
              return (
                <React.Fragment key={g.category}>
                  <Circle
                    cx={g.cx}
                    cy={g.cy}
                    r={g.bgR}
                    fill={catBg(g.colorIdx)}
                    stroke={catStroke(g.colorIdx)}
                    strokeWidth={1}
                  />
                  <SvgText
                    x={g.cx}
                    y={g.cy - g.bgR + 15}
                    textAnchor="middle"
                    fill={catLabelColor}
                    fontSize={11}
                    fontWeight="600"
                  >
                    {labelText}
                  </SvgText>
                </React.Fragment>
              );
            })}

            {/* エッジ（共通タグを持つアイテムを接続） */}
            {edges.map((edge) => {
              const src = nodeById.get(edge.src);
              const tgt = nodeById.get(edge.tgt);
              if (!src || !tgt) return null;
              return (
                <Line
                  key={edge.id}
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={edgeColor}
                  strokeWidth={1.5}
                />
              );
            })}

            {/* ノード */}
            {nodes.map((node) => {
              const color = nodeColor(node.tags);
              const isSelected = node.id === selectedId;
              const label =
                node.title.length > LABEL_CHARS
                  ? node.title.slice(0, LABEL_CHARS) + '…'
                  : node.title;
              const initial = (node.title[0] ?? '?').toUpperCase();

              return (
                <React.Fragment key={node.id}>
                  {/* 選択ハイライトリング */}
                  {isSelected && (
                    <Circle
                      cx={node.x}
                      cy={node.y}
                      r={NODE_R + 6}
                      fill="none"
                      stroke={colors.accent}
                      strokeWidth={2.5}
                      opacity={0.85}
                    />
                  )}

                  {/* ノード本体 */}
                  <Circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_R}
                    fill={color}
                    opacity={0.9}
                  />

                  {/* タイトル頭文字 */}
                  <SvgText
                    x={node.x}
                    y={node.y + 5}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize={14}
                    fontWeight="700"
                  >
                    {initial}
                  </SvgText>

                  {/* タイトルラベル */}
                  <SvgText
                    x={node.x}
                    y={node.y + NODE_R + 14}
                    textAnchor="middle"
                    fill={labelColor}
                    fontSize={10}
                  >
                    {label}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        )}
      </View>

      {/* タグ凡例バー */}
      {allTags.length > 0 && (
        <View style={[styles.legendBar, { borderTopColor: colors.separator }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.legendContent}
          >
            {allTags.map((tag) => (
              <View
                key={tag.id}
                style={[
                  styles.legendChip,
                  { backgroundColor: tagColor(tag.id) + '28' },
                ]}
              >
                <View style={[styles.legendDot, { backgroundColor: tagColor(tag.id) }]} />
                <Text style={[styles.legendLabel, { color: colors.label }]}>{tag.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 選択アイテムカード（スライドアップ） */}
      <Animated.View
        pointerEvents={selectedId !== null ? 'auto' : 'none'}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.separator,
            paddingBottom: insets.bottom + Spacing.s,
          },
          {
            transform: [{ translateY: cardTranslateY }],
            opacity: cardOpacity,
          },
        ]}
      >
        {selectedItem && (
          <>
            <View style={styles.cardHeader}>
              <Text
                style={[styles.cardTitle, { color: colors.label }]}
                numberOfLines={2}
              >
                {selectedItem.title}
              </Text>
              <Pressable
                onPress={() => setSelectedId(null)}
                style={styles.closeBtn}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Text style={[styles.closeBtnText, { color: colors.labelSecondary }]}>✕</Text>
              </Pressable>
            </View>

            {/* タグチップ */}
            {selectedItem.tags.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tagRow}
              >
                {selectedItem.tags.map((t) => (
                  <View
                    key={t.id}
                    style={[
                      styles.tagChip,
                      {
                        backgroundColor: tagColor(t.id) + '22',
                        borderColor: tagColor(t.id) + '99',
                      },
                    ]}
                  >
                    <Text style={[styles.tagChipText, { color: tagColor(t.id) }]}>
                      {t.name}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* 詳細ボタン */}
            <Pressable
              style={[styles.detailBtn, { backgroundColor: colors.accent }]}
              onPress={() =>
                navigation.navigate('ItemDetail', { itemId: selectedItem.id })
              }
            >
              <Text style={styles.detailBtnText}>詳細を見る →</Text>
            </Pressable>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  graph: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 24 },

  legendBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.s,
  },
  legendContent: {
    paddingHorizontal: Spacing.m,
    gap: Spacing.s,
    alignItems: 'center',
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.s,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 5,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 12 },

  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.m,
    paddingHorizontal: Spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.s,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '600', lineHeight: 22 },
  closeBtn: { marginLeft: Spacing.s, paddingTop: 2 },
  closeBtnText: { fontSize: 16 },
  tagRow: { marginBottom: Spacing.s },
  tagChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.s,
    paddingVertical: 3,
    marginRight: Spacing.xs,
  },
  tagChipText: { fontSize: 12, fontWeight: '500' },
  detailBtn: {
    borderRadius: Radius.m,
    paddingVertical: Spacing.s + 2,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  detailBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
