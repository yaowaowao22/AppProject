// ============================================================
// KnowledgeMapScreen — カテゴリグループ表示
// ・カテゴリごとにノードをクラスター配置
// ・ピンチでズーム / 1本指でパン
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
import { Svg, Circle, Line, Text as SvgText, Rect } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useKnowledgeMap } from '../../hooks/useKnowledgeMap';
import { Spacing, Radius } from '../../theme/spacing';
import { TypeScale } from '../../theme/typography';
import { SystemColors, RecallAmber } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { MapStackParamList, DrawerParamList } from '../../navigation/types';
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
  'rgba(99,102,241,0.35)',
  'rgba(168,85,247,0.35)',
  'rgba(20,184,166,0.35)',
  'rgba(59,130,246,0.35)',
  'rgba(34,197,94,0.35)',
  'rgba(249,115,22,0.35)',
  'rgba(234,179,8,0.35)',
  'rgba(239,68,68,0.35)',
  'rgba(236,72,153,0.35)',
  'rgba(0,199,190,0.35)',
] as const;

const NODE_R = 24;
const LABEL_CHARS = 12;
const CAT_LABEL_CHARS = 14;
const GRAPH_PADDING = 24;

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

type VB = { x: number; y: number; w: number; h: number };

// ── カテゴリグループレイアウト構築 ────────────────────────────
function buildGroupedLayout(
  items: ItemWithMeta[],
  w: number,
  h: number,
): { nodes: GNode[]; edges: GEdge[]; groups: CategoryGroup[] } {
  const catMap = new Map<string, ItemWithMeta[]>();
  for (const item of items) {
    const key = item.category ?? '未分類';
    if (!catMap.has(key)) catMap.set(key, []);
    catMap.get(key)!.push(item);
  }

  const cats = [...catMap.keys()];
  const n = cats.length;

  const cols =
    n <= 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 2 : n <= 6 ? 3 : Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);

  const usableW = w - GRAPH_PADDING * 2;
  const usableH = h - GRAPH_PADDING * 2;
  const cellW = usableW / cols;
  const cellH = usableH / rows;

  // ラベルピル分の余白を考慮した最大背景円半径
  const maxBgR = Math.min(cellW, cellH) / 2 - 20;

  const groups: CategoryGroup[] = [];
  const nodes: GNode[] = [];

  cats.forEach((cat, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = GRAPH_PADDING + cellW * col + cellW / 2;
    const cy = GRAPH_PADDING + cellH * row + cellH / 2 + 10;

    const catItems = catMap.get(cat)!;
    const count = catItems.length;

    // count個のノードが重ならない最小配置円半径（弦長 ≥ 2*NODE_R+gap）
    const itemR_min =
      count <= 1
        ? 0
        : (NODE_R * 2 + 10) / (2 * Math.sin(Math.PI / count));

    const itemR =
      count <= 1
        ? 0
        : Math.min(maxBgR - NODE_R - 10, Math.max(itemR_min, NODE_R * 1.8));

    const bgR = Math.max(NODE_R + 28, Math.min(maxBgR, itemR + NODE_R + 20));

    groups.push({ category: cat, cx, cy, bgR, colorIdx: idx });

    catItems.forEach((item, i) => {
      const angle =
        count === 1 ? 0 : (2 * Math.PI * i) / count - Math.PI / 2;
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
  const graphSizeRef = useRef({ w: 0, h: 0 });

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // ── viewBox（ズーム・パン）────────────────────────────────────
  const [viewBox, setViewBox] = useState<VB>({ x: 0, y: 0, w: 0, h: 0 });
  const viewBoxRef = useRef<VB>({ x: 0, y: 0, w: 0, h: 0 });
  const setVB = useCallback((vb: VB) => {
    viewBoxRef.current = vb;
    setViewBox(vb);
  }, []);

  // カードアニメーション
  const cardTranslateY = useRef(new Animated.Value(200)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const { nodes, edges, groups } = useMemo(() => {
    if (!items.length || !graphSize.w || !graphSize.h) {
      return { nodes: [], edges: [], groups: [] };
    }
    return buildGroupedLayout(items, graphSize.w, graphSize.h);
  }, [items, graphSize.w, graphSize.h]);

  const nodesRef = useRef<GNode[]>([]);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

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

  // ── パン・ズーム PanResponder ──────────────────────────────────
  // 1本指パンの基点（ピンチ→1本指切替時もジャンプしない）
  const singleStartRef = useRef({ lx: 0, ly: 0 });
  const singleVBAtStart = useRef<VB>({ x: 0, y: 0, w: 0, h: 0 });
  const lastDistRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        singleStartRef.current = {
          lx: evt.nativeEvent.locationX,
          ly: evt.nativeEvent.locationY,
        };
        singleVBAtStart.current = { ...viewBoxRef.current };
        lastDistRef.current = 0;
      },
      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;
        const { w: gw, h: gh } = graphSizeRef.current;
        if (!gw || !gh) return;

        if (touches.length >= 2) {
          // ── ピンチズーム ──────────────────────────────────────
          const t0 = touches[0];
          const t1 = touches[1];
          const dist = Math.hypot(t0.pageX - t1.pageX, t0.pageY - t1.pageY);

          if (lastDistRef.current > 0) {
            const scaleChange = lastDistRef.current / dist; // ピンチアウトで dist 増加 → viewBox縮小
            const vb = viewBoxRef.current;
            // ピンチ中点（view相対座標）
            const mx = ((t0.locationX ?? 0) + (t1.locationX ?? 0)) / 2;
            const my = ((t0.locationY ?? 0) + (t1.locationY ?? 0)) / 2;
            // 中点に対応するグラフ座標
            const graphMidX = vb.x + mx * vb.w / gw;
            const graphMidY = vb.y + my * vb.h / gh;

            const newW = Math.max(gw * 0.2, Math.min(gw * 6, vb.w * scaleChange));
            const newH = Math.max(gh * 0.2, Math.min(gh * 6, vb.h * scaleChange));

            setVB({
              x: graphMidX - mx * newW / gw,
              y: graphMidY - my * newH / gh,
              w: newW,
              h: newH,
            });
          }
          lastDistRef.current = dist;
        } else if (touches.length === 1) {
          // ── 1本指パン ────────────────────────────────────────
          if (lastDistRef.current > 0) {
            // ピンチ→1本指: 基点をリセットしてジャンプを防ぐ
            lastDistRef.current = 0;
            singleStartRef.current = {
              lx: touches[0].locationX,
              ly: touches[0].locationY,
            };
            singleVBAtStart.current = { ...viewBoxRef.current };
          }
          const dx = touches[0].locationX - singleStartRef.current.lx;
          const dy = touches[0].locationY - singleStartRef.current.ly;
          const vb = singleVBAtStart.current;
          setVB({
            x: vb.x - dx * vb.w / gw,
            y: vb.y - dy * vb.h / gh,
            w: vb.w,
            h: vb.h,
          });
        }
      },
      onPanResponderRelease: (evt) => {
        lastDistRef.current = 0;
        const { locationX, locationY } = evt.nativeEvent;
        // タップ判定: 開始位置から 10px 未満の移動
        const moved = Math.hypot(
          locationX - singleStartRef.current.lx,
          locationY - singleStartRef.current.ly,
        );
        if (moved < 10) {
          const vb = viewBoxRef.current;
          const { w: gw, h: gh } = graphSizeRef.current;
          if (!gw || !gh) return;
          // screen → graph 座標変換
          const svgX = vb.x + locationX * vb.w / gw;
          const svgY = vb.y + locationY * vb.h / gh;
          const hit = nodesRef.current.find(
            (n) => Math.hypot(n.x - svgX, n.y - svgY) <= NODE_R + 8,
          );
          setSelectedId(hit ? hit.id : null);
        }
      },
      onPanResponderTerminate: () => {
        lastDistRef.current = 0;
      },
    }),
  ).current;

  const handleLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = e.nativeEvent.layout;
      if (
        graphSizeRef.current.w === width &&
        graphSizeRef.current.h === height
      ) return;
      graphSizeRef.current = { w: width, h: height };
      setGraphSize({ w: width, h: height });
      const vb = { x: 0, y: 0, w: width, h: height };
      viewBoxRef.current = vb;
      setViewBox(vb);
    },
    [],
  );

  // ── ズームボタン ──────────────────────────────────────────────
  const zoomIn = useCallback(() => {
    const vb = viewBoxRef.current;
    const f = 0.65;
    const newW = Math.max(graphSizeRef.current.w * 0.2, vb.w * f);
    const newH = Math.max(graphSizeRef.current.h * 0.2, vb.h * f);
    setVB({
      x: vb.x + (vb.w - newW) / 2,
      y: vb.y + (vb.h - newH) / 2,
      w: newW,
      h: newH,
    });
  }, [setVB]);

  const zoomOut = useCallback(() => {
    const vb = viewBoxRef.current;
    const f = 1.55;
    const newW = Math.min(graphSizeRef.current.w * 6, vb.w * f);
    const newH = Math.min(graphSizeRef.current.h * 6, vb.h * f);
    setVB({
      x: vb.x + (vb.w - newW) / 2,
      y: vb.y + (vb.h - newH) / 2,
      w: newW,
      h: newH,
    });
  }, [setVB]);

  const resetZoom = useCallback(() => {
    const { w, h } = graphSizeRef.current;
    setVB({ x: 0, y: 0, w, h });
  }, [setVB]);

  // ── タグ凡例 ─────────────────────────────────────────────────
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

  const edgeColor = isDark ? 'rgba(235,235,245,0.15)' : 'rgba(0,0,0,0.10)';
  const labelColor = isDark ? 'rgba(235,235,245,0.88)' : 'rgba(30,30,35,0.88)';
  const catLabelColor = isDark ? 'rgba(235,235,245,0.80)' : 'rgba(30,30,35,0.80)';
  const catLabelBg = isDark ? 'rgba(18,18,22,0.65)' : 'rgba(255,255,255,0.82)';

  const showLoading = isLoading;
  const showEmpty = !isLoading && items.length === 0;

  const vbStr =
    viewBox.w > 0
      ? `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`
      : undefined;

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
            <Ionicons name="map-outline" size={48} color={colors.labelTertiary} />
            <Text style={[styles.emptyText, { color: colors.labelSecondary }]}>
              アイテムを追加すると{'\n'}知識マップが表示されます
            </Text>
            <Pressable
              style={[styles.ctaButton, { backgroundColor: colors.accent }]}
              onPress={() =>
                navigation.getParent<DrawerNavigationProp<DrawerParamList>>()?.navigate(
                  'Library',
                  { screen: 'URLAnalysis', params: {} }
                )
              }
            >
              <Text style={styles.ctaButtonText}>アイテムを追加する</Text>
            </Pressable>
          </View>
        )}

        {!showLoading && !showEmpty && graphSize.w > 0 && vbStr && (
          <Svg width={graphSize.w} height={graphSize.h} viewBox={vbStr}>

            {/* カテゴリグループ背景 */}
            {groups.map((g) => {
              const labelText =
                g.category.length > CAT_LABEL_CHARS
                  ? g.category.slice(0, CAT_LABEL_CHARS) + '…'
                  : g.category;
              // ラベル背景ピルのサイズ（1文字あたり約7.5px + 余白）
              const pillW = Math.min(
                labelText.length * 7.5 + 18,
                g.bgR * 1.9,
              );
              const pillH = 19;
              const pillY = g.cy - g.bgR + 5;
              return (
                <React.Fragment key={g.category}>
                  {/* グループ背景円 */}
                  <Circle
                    cx={g.cx}
                    cy={g.cy}
                    r={g.bgR}
                    fill={catBg(g.colorIdx)}
                    stroke={catStroke(g.colorIdx)}
                    strokeWidth={1.5}
                  />
                  {/* カテゴリラベル背景ピル */}
                  <Rect
                    x={g.cx - pillW / 2}
                    y={pillY}
                    width={pillW}
                    height={pillH}
                    rx={pillH / 2}
                    fill={catLabelBg}
                  />
                  {/* カテゴリラベル */}
                  <SvgText
                    x={g.cx}
                    y={pillY + pillH * 0.72}
                    textAnchor="middle"
                    fill={catLabelColor}
                    fontSize={12}
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
                      r={NODE_R + 8}
                      fill="none"
                      stroke={colors.accent}
                      strokeWidth={3}
                      opacity={0.9}
                    />
                  )}
                  {/* ノード影（疑似シャドウ） */}
                  <Circle
                    cx={node.x}
                    cy={node.y + 2.5}
                    r={NODE_R}
                    fill="rgba(0,0,0,0.18)"
                  />
                  {/* ノード本体 */}
                  <Circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_R}
                    fill={color}
                    stroke="rgba(255,255,255,0.40)"
                    strokeWidth={2}
                    opacity={0.92}
                  />
                  {/* タイトル頭文字 */}
                  <SvgText
                    x={node.x}
                    y={node.y + 5.5}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize={15}
                    fontWeight="700"
                  >
                    {initial}
                  </SvgText>
                  {/* タイトルラベル */}
                  <SvgText
                    x={node.x}
                    y={node.y + NODE_R + 16}
                    textAnchor="middle"
                    fill={labelColor}
                    fontSize={11}
                    fontWeight="500"
                  >
                    {label}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        )}

        {/* ズームコントロール */}
        {!showLoading && !showEmpty && (
          <View style={styles.zoomControls}>
            <Pressable
              style={[
                styles.zoomBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.separator,
                  shadowColor: colors.cardShadowColor,
                },
              ]}
              onPress={zoomIn}
            >
              <Text style={[styles.zoomBtnText, { color: colors.label }]}>+</Text>
            </Pressable>
            <Pressable
              style={[
                styles.zoomBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.separator,
                  shadowColor: colors.cardShadowColor,
                },
              ]}
              onPress={resetZoom}
            >
              <Text style={[styles.zoomBtnText, { color: colors.label }]}>↺</Text>
            </Pressable>
            <Pressable
              style={[
                styles.zoomBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.separator,
                  shadowColor: colors.cardShadowColor,
                },
              ]}
              onPress={zoomOut}
            >
              <Text style={[styles.zoomBtnText, { color: colors.label }]}>−</Text>
            </Pressable>
          </View>
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
                <View
                  style={[styles.legendDot, { backgroundColor: tagColor(tag.id) }]}
                />
                <Text style={[styles.legendLabel, { color: colors.label }]}>
                  {tag.name}
                </Text>
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
            shadowColor: colors.cardShadowColor,
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
                <Text style={[styles.closeBtnText, { color: colors.labelSecondary }]}>
                  ✕
                </Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 24 },
  ctaButton: {
    marginTop: Spacing.s,
    paddingHorizontal: Spacing.l,
    paddingVertical: 10,
    borderRadius: Radius.full,
    alignSelf: 'center',
  },
  ctaButtonText: {
    ...TypeScale.subheadline,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },

  zoomControls: {
    position: 'absolute',
    right: Spacing.m,
    top: Spacing.m,
    gap: Spacing.xs,
  },
  zoomBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  zoomBtnText: { fontSize: 20, fontWeight: '400', lineHeight: 24 },

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
