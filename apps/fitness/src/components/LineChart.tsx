/**
 * LineChart — react-native-svg ベースの汎用折れ線グラフ
 *
 * サードパーティのチャートライブラリを使わず、
 * react-native-svg のプリミティブのみで構築。
 * テーマシステムと完全統合。
 */
import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

// ── 型定義 ────────────────────────────────────────────────────────────────────

export interface LineChartDataPoint {
  label: string;
  value: number;
}

export interface LineChartProps {
  data: LineChartDataPoint[];
  /** コンテナ幅（省略時: window.width - 32） */
  width?: number;
  /** グラフ高さ（デフォルト: 160） */
  height?: number;
  /** 折れ線の色（通常は colors.accent） */
  lineColor: string;
  /** エリア塗りの色（省略時: lineColor を使用） */
  fillColor?: string;
  /** グリッド線の色（通常は colors.separator） */
  gridColor?: string;
  /** ラベルテキスト色（通常は colors.textTertiary） */
  labelColor?: string;
  /** データポイントに円を表示するか（デフォルト: true） */
  showDots?: boolean;
  /** ドット半径（デフォルト: 4） */
  dotRadius?: number;
  /** 線の下をグラデーション塗りつぶし（デフォルト: true） */
  showArea?: boolean;
  /** 水平グリッド線を表示するか（デフォルト: true） */
  showGrid?: boolean;
  /** X軸ラベルを表示するか（デフォルト: true） */
  showLabels?: boolean;
  /** データポイント上に値を表示するか（デフォルト: false） */
  showValues?: boolean;
  /** 値のフォーマット関数 */
  formatValue?: (v: number) => string;
  /** 最後のポイントを強調表示（デフォルト: false） */
  highlightLast?: boolean;
  /** 強調ポイントの色（省略時: lineColor） */
  highlightColor?: string;
  /** Y軸ラベルを表示するか（デフォルト: false） */
  showYAxis?: boolean;
  /** 将来拡張用（現在は無効） */
  animated?: boolean;
}

// ── 定数 ─────────────────────────────────────────────────────────────────────

const PAD_TOP         = 24; // 値ラベル用の上余白
const PAD_BOTTOM      = 28; // X軸ラベル用の下余白
const PAD_LEFT        = 16;
const PAD_LEFT_YAXIS  = 40; // Y軸ラベルあり時の左余白
const PAD_RIGHT       = 16;
const GRID_LINES      = 3;  // 水平グリッド線の本数

// ── Catmull-Rom → cubic bezier 変換 ──────────────────────────────────────────

/**
 * Catmull-Rom スプラインを cubic bezier に変換して SVG Path を生成。
 * tension = 0 で折れ線、tension → 1 で滑らかな曲線（通常 0.5）。
 */
function catmullRomPath(
  points: Array<{ x: number; y: number }>,
  tension = 0.5,
): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const segments: string[] = [`M ${points[0].x} ${points[0].y}`];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * tension / 3;
    const cp1y = p1.y + (p2.y - p0.y) * tension / 3;
    const cp2x = p2.x - (p3.x - p1.x) * tension / 3;
    const cp2y = p2.y - (p3.y - p1.y) * tension / 3;

    segments.push(
      `C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    );
  }

  return segments.join(' ');
}

/** エリア塗りつぶし用: 折れ線パスに底辺を追加して閉じる */
function areaPath(
  linePath: string,
  firstX: number,
  lastX: number,
  bottomY: number,
): string {
  return `${linePath} L ${lastX.toFixed(2)} ${bottomY} L ${firstX.toFixed(2)} ${bottomY} Z`;
}

// ── LineChart コンポーネント ───────────────────────────────────────────────────

export function LineChart({
  data,
  width: widthProp,
  height = 160,
  lineColor,
  fillColor,
  gridColor = 'rgba(0,0,0,0.1)',
  labelColor = 'rgba(0,0,0,0.4)',
  showDots = true,
  dotRadius = 4,
  showArea = true,
  showGrid = true,
  showLabels = true,
  showValues = false,
  formatValue,
  highlightLast = false,
  highlightColor,
  showYAxis = false,
  // animated はフューチャーリザーブ
}: LineChartProps): React.ReactElement {
  const { width: windowWidth } = useWindowDimensions();
  const svgWidth  = widthProp ?? windowWidth - 32;
  const areaColor = fillColor ?? lineColor;
  const hlColor   = highlightColor ?? lineColor;
  const gradientId = 'lgFill';
  const padLeft   = showYAxis ? PAD_LEFT_YAXIS : PAD_LEFT;

  // ── 座標計算（useMemo でメモ化） ────────────────────────────────────────────
  // NOTE: hooks はデータが空でも必ず呼ぶ（Rules of Hooks）。空判定は hooks より後に行う。
  const computed = useMemo(() => {
    if (data.length === 0) return null;

    const values  = data.map(d => d.value);
    const rawMin  = Math.min(...values);
    const rawMax  = Math.max(...values);

    // 全値が同じ場合（フラット）: 中央に水平線
    const valRange = rawMax === rawMin ? 1 : rawMax - rawMin;
    const margin   = valRange * 0.15;
    const minV     = rawMin - margin;
    const maxV     = rawMax + margin;

    const plotW = svgWidth - padLeft - PAD_RIGHT;
    const plotH = height  - PAD_TOP  - PAD_BOTTOM;

    const toX = (i: number) =>
      padLeft + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
    const toY = (v: number) =>
      PAD_TOP + plotH - ((v - minV) / (maxV - minV)) * plotH;

    const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));

    // グリッドY座標
    const gYs: number[] = [];
    for (let g = 0; g <= GRID_LINES; g++) {
      gYs.push(PAD_TOP + (plotH / GRID_LINES) * g);
    }

    // X軸ラベルの間引きステップ
    const maxLabels = Math.floor(plotW / 32);
    const step = data.length <= maxLabels ? 1 : Math.ceil(data.length / maxLabels);

    return {
      points: pts,
      gridYs: gYs,
      labelStep: step,
      minVal: minV,
      maxVal: maxV,
    };
  }, [data, svgWidth, height, padLeft]);

  // ── データが空の場合 ────────────────────────────────────────────────────────
  if (!computed) {
    return <View style={{ width: svgWidth, height }} />;
  }

  const { points, gridYs, labelStep, minVal, maxVal } = computed;

  // ── パス生成 ────────────────────────────────────────────────────────────────
  const linePth = data.length === 1
    ? ''
    : catmullRomPath(points, 0.5);

  const bottomY = height - PAD_BOTTOM;
  const areaPth = data.length > 1 && showArea
    ? areaPath(linePth, points[0].x, points[points.length - 1].x, bottomY)
    : '';

  // ── レンダリング ────────────────────────────────────────────────────────────
  return (
    <Svg width={svgWidth} height={height}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0"   stopColor={areaColor} stopOpacity={0.30} />
          <Stop offset="1"   stopColor={areaColor} stopOpacity={0.04} />
        </LinearGradient>
      </Defs>

      {/* グリッド線 */}
      {showGrid && gridYs.map((gy, i) => (
        <Line
          key={i}
          x1={padLeft}
          y1={gy}
          x2={svgWidth - PAD_RIGHT}
          y2={gy}
          stroke={gridColor}
          strokeWidth={0.5}
          strokeDasharray="4 4"
          opacity={0.6}
        />
      ))}

      {/* Y軸ラベル */}
      {showYAxis && gridYs.map((gy, g) => {
        const v = maxVal - (g / GRID_LINES) * (maxVal - minVal);
        const displayV = Math.max(0, v);
        const txt = formatValue
          ? formatValue(Math.round(displayV))
          : displayV >= 1000
            ? `${Math.round(displayV / 100) / 10}k`
            : String(Math.round(displayV));
        return (
          <SvgText
            key={g}
            x={padLeft - 4}
            y={gy + 3}
            textAnchor="end"
            fontSize={8}
            fill={labelColor}
          >
            {txt}
          </SvgText>
        );
      })}

      {/* エリア塗りつぶし */}
      {showArea && areaPth !== '' && (
        <Path
          d={areaPth}
          fill={`url(#${gradientId})`}
        />
      )}

      {/* 折れ線 */}
      {data.length > 1 && (
        <Path
          d={linePth}
          stroke={lineColor}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* ドット */}
      {showDots && points.map((pt, i) => {
        const isLast    = i === points.length - 1;
        const isHL      = highlightLast && isLast;
        const r         = isHL ? dotRadius + 1 : dotRadius;
        const dotColor  = isHL ? hlColor : lineColor;
        const dotBorder = isHL ? lineColor : 'none';

        return (
          <React.Fragment key={i}>
            {isHL && (
              // 強調リング
              <Circle
                cx={pt.x}
                cy={pt.y}
                r={r + 3}
                fill="none"
                stroke={dotColor}
                strokeWidth={1.5}
                opacity={0.35}
              />
            )}
            <Circle
              cx={pt.x}
              cy={pt.y}
              r={r}
              fill={dotColor}
              stroke={dotBorder}
              strokeWidth={isHL ? 1.5 : 0}
            />
          </React.Fragment>
        );
      })}

      {/* 値ラベル（データポイント上） */}
      {showValues && points.map((pt, i) => {
        const raw = data[i].value;
        const txt = formatValue ? formatValue(raw) : String(raw);
        return (
          <SvgText
            key={i}
            x={pt.x}
            y={pt.y - dotRadius - 5}
            textAnchor="middle"
            fontSize={9}
            fill={labelColor}
            fontWeight="600"
          >
            {txt}
          </SvgText>
        );
      })}

      {/* X軸ラベル */}
      {showLabels && data.map((d, i) => {
        if (i % labelStep !== 0 && i !== data.length - 1) return null;
        const pt = points[i];
        return (
          <SvgText
            key={i}
            x={pt.x}
            y={height - 6}
            textAnchor="middle"
            fontSize={9}
            fill={labelColor}
          >
            {d.label}
          </SvgText>
        );
      })}
    </Svg>
  );
}
