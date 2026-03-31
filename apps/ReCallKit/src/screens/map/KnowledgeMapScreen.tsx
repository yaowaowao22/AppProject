// ============================================================
// KnowledgeMapScreen — SVG 力学グラフ
// ・フォースシミュレーション（反発・引力・中心力）
// ・ノードドラッグ & タップで詳細カード表示
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

// ── カラーパレット（10色）─────────────────────────────────────
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

const NODE_R = 22;
const LABEL_CHARS = 10;

function tagColor(tagId: number): string {
  return TAG_COLORS[Math.abs(tagId) % TAG_COLORS.length];
}

function nodeColor(tags: Tag[]): string {
  return tags.length > 0 ? tagColor(tags[0].id) : '#8E8E93';
}

// ── グラフデータ型 ─────────────────────────────────────────────
interface GNode {
  id: number;
  title: string;
  tags: Tag[];
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GEdge {
  id: string;
  src: number;
  tgt: number;
  tagId: number;
}

// ── グラフ構築 ────────────────────────────────────────────────
function buildGraph(
  items: ItemWithMeta[],
  w: number,
  h: number,
  existingPositions: Map<number, { x: number; y: number }>,
): { nodes: GNode[]; edges: GEdge[] } {
  const nodes: GNode[] = items.map((item) => {
    const pos = existingPositions.get(item.id);
    return {
      id: item.id,
      title: item.title,
      tags: item.tags,
      x: pos?.x ?? w / 2 + (Math.random() - 0.5) * w * 0.65,
      y: pos?.y ?? h / 2 + (Math.random() - 0.5) * h * 0.65,
      vx: 0,
      vy: 0,
    };
  });

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
          edges.push({ id: key, src: group[i].itemId, tgt: group[j].itemId, tagId: group[i].tagId });
          c++;
        }
      }
    }
  }

  return { nodes, edges };
}

// ── フォースシミュレーション ───────────────────────────────────
function simulate(nodes: GNode[], edges: GEdge[], w: number, h: number): GNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, { ...n }]));
  const arr = [...nodeMap.values()];
  const N = arr.length;

  const KR = 7000;   // 反発力
  const KA = 0.03;   // 引力（バネ定数）
  const KC = 0.007;  // 中心引力
  const RL = 120;    // バネの自然長
  const DAMP = 0.88; // 減衰係数
  const cx = w / 2;
  const cy = h / 2;

  for (let iter = 0; iter < 200; iter++) {
    // 減衰
    for (const n of arr) {
      n.vx *= DAMP;
      n.vy *= DAMP;
    }

    // ノード間反発力（クーロン則）
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const a = arr[i];
        const b = arr[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.max(Math.hypot(dx, dy), 1);
        const f = KR / (d * d);
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    // エッジ引力（フックの法則）
    for (const e of edges) {
      const a = nodeMap.get(e.src);
      const b = nodeMap.get(e.tgt);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.max(Math.hypot(dx, dy), 1);
      const f = KA * (d - RL);
      const fx = (dx / d) * f;
      const fy = (dy / d) * f;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    // 中心力 & 座標更新
    for (const n of arr) {
      n.vx += (cx - n.x) * KC;
      n.vy += (cy - n.y) * KC;
      n.x = Math.max(NODE_R + 4, Math.min(w - NODE_R - 4, n.x + n.vx));
      n.y = Math.max(NODE_R + 4, Math.min(h - NODE_R - 4, n.y + n.vy));
    }
  }

  return arr;
}

// ── メインコンポーネント ───────────────────────────────────────
export function KnowledgeMapScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { items, isLoading, refresh } = useKnowledgeMap();

  // グラフ状態
  const nodesRef = useRef<GNode[]>([]);
  const [edges, setEdges] = useState<GEdge[]>([]);
  const [graphSize, setGraphSize] = useState({ w: 0, h: 0 });
  const graphSizeRef = useRef({ w: 0, h: 0 });
  const [renderKey, forceUpdate] = useState(0);

  // インタラクション状態
  const draggingId = useRef<number | null>(null);
  const dragStartNode = useRef({ x: 0, y: 0 });
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

  // items or サイズが揃ったらグラフを構築
  useEffect(() => {
    if (!items.length || !graphSize.w || !graphSize.h) {
      if (!items.length && !isLoading) {
        nodesRef.current = [];
        setEdges([]);
        forceUpdate((k) => k + 1);
      }
      return;
    }
    // 既存位置を引き継ぐ
    const existingPos = new Map(nodesRef.current.map((n) => [n.id, { x: n.x, y: n.y }]));
    const { nodes: initNodes, edges: initEdges } = buildGraph(items, graphSize.w, graphSize.h, existingPos);
    // 新規ノードのみシミュレーション対象に（既存位置は保持）
    const hasNewNodes = initNodes.some((n) => !existingPos.has(n.id));
    nodesRef.current = hasNewNodes
      ? simulate(initNodes, initEdges, graphSize.w, graphSize.h)
      : initNodes;
    setEdges(initEdges);
    forceUpdate((k) => k + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, graphSize.w, graphSize.h]);

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

  // PanResponder（ドラッグ & タップ）
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        for (const n of nodesRef.current) {
          if (Math.hypot(n.x - locationX, n.y - locationY) <= NODE_R + 8) {
            draggingId.current = n.id;
            dragStartNode.current = { x: n.x, y: n.y };
            return true;
          }
        }
        setSelectedId(null);
        return false;
      },
      onPanResponderMove: (_, gs) => {
        if (draggingId.current === null) return;
        const { w, h } = graphSizeRef.current;
        const nx = Math.max(NODE_R + 4, Math.min(w - NODE_R - 4, dragStartNode.current.x + gs.dx));
        const ny = Math.max(NODE_R + 4, Math.min(h - NODE_R - 4, dragStartNode.current.y + gs.dy));
        nodesRef.current = nodesRef.current.map((n) =>
          n.id === draggingId.current ? { ...n, x: nx, y: ny } : n,
        );
        forceUpdate((k) => k + 1);
      },
      onPanResponderRelease: (_, gs) => {
        if (Math.hypot(gs.dx, gs.dy) < 8 && draggingId.current !== null) {
          setSelectedId(draggingId.current);
        }
        draggingId.current = null;
      },
    }),
  ).current;

  const handleLayout = useCallback((e: { nativeEvent: { layout: { width: number; height: number } } }) => {
    const { width, height } = e.nativeEvent.layout;
    if (width === graphSizeRef.current.w && height === graphSizeRef.current.h) return;
    graphSizeRef.current = { w: width, h: height };
    setGraphSize({ w: width, h: height });
  }, []);

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

  // レンダリング用スナップショット（renderKey で更新トリガー）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const nodes = useMemo(() => nodesRef.current, [renderKey]);
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const edgeColor = isDark ? 'rgba(235,235,245,0.12)' : 'rgba(0,0,0,0.08)';
  const labelColor = isDark ? 'rgba(235,235,245,0.80)' : 'rgba(60,60,67,0.80)';

  const showLoading = isLoading || (items.length > 0 && nodes.length === 0 && graphSize.w > 0);
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
