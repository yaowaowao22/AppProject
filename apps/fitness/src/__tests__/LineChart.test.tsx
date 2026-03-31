/**
 * LineChart コンポーネント テスト
 *
 * react-native-svg のプリミティブを使用しているため、
 * SVG 要素は testID またはコンポーネント構造で検証する。
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { LineChart } from '../components/LineChart';
import type { LineChartDataPoint } from '../components/LineChart';

// react-native-svg モック
jest.mock('react-native-svg', () => {
  const React = require('react');
  const createEl = (name: string) =>
    ({ children, testID, ...rest }: any) =>
      React.createElement(name, { testID, ...rest }, children);

  return {
    __esModule: true,
    default: createEl('Svg'),
    Svg: createEl('Svg'),
    Circle: createEl('Circle'),
    Defs: createEl('Defs'),
    Line: createEl('Line'),
    LinearGradient: createEl('LinearGradient'),
    Path: createEl('Path'),
    Stop: createEl('Stop'),
    Text: createEl('SvgText'),
  };
});

const SAMPLE: LineChartDataPoint[] = [
  { label: '1月', value: 100 },
  { label: '2月', value: 150 },
  { label: '3月', value: 120 },
];

const SINGLE: LineChartDataPoint[] = [{ label: '1月', value: 100 }];

// ── 基本レンダリング ────────────────────────────────────────────────────────────
describe('基本レンダリング', () => {
  test('データがあればクラッシュせずにレンダリングされる', () => {
    expect(() =>
      render(<LineChart data={SAMPLE} lineColor="#FF0000" />),
    ).not.toThrow();
  });

  test('データが空の場合は View を返す', () => {
    const { toJSON } = render(<LineChart data={[]} lineColor="#FF0000" />);
    const tree = toJSON() as any;
    // 空データは <View /> を返すため type が View
    expect(tree.type).toBe('View');
  });

  test('1点だけのデータでもクラッシュしない', () => {
    expect(() =>
      render(<LineChart data={SINGLE} lineColor="#FF0000" />),
    ).not.toThrow();
  });
});

// ── Props 反映 ─────────────────────────────────────────────────────────────────
describe('Props 反映', () => {
  test('width を指定するとその幅が Svg に渡される', () => {
    const { toJSON } = render(
      <LineChart data={SAMPLE} lineColor="#FF0000" width={300} />,
    );
    const tree = toJSON() as any;
    expect(tree.props.width).toBe(300);
  });

  test('height を指定するとその高さが Svg に渡される', () => {
    const { toJSON } = render(
      <LineChart data={SAMPLE} lineColor="#FF0000" height={200} />,
    );
    const tree = toJSON() as any;
    expect(tree.props.height).toBe(200);
  });

  test('height のデフォルトは 160', () => {
    const { toJSON } = render(<LineChart data={SAMPLE} lineColor="#FF0000" />);
    const tree = toJSON() as any;
    expect(tree.props.height).toBe(160);
  });
});

// ── showDots / showArea / showGrid / showLabels ────────────────────────────────
describe('表示フラグ', () => {
  test('showDots=false でもクラッシュしない', () => {
    expect(() =>
      render(<LineChart data={SAMPLE} lineColor="#FF0000" showDots={false} />),
    ).not.toThrow();
  });

  test('showArea=false でもクラッシュしない', () => {
    expect(() =>
      render(<LineChart data={SAMPLE} lineColor="#FF0000" showArea={false} />),
    ).not.toThrow();
  });

  test('showGrid=false でもクラッシュしない', () => {
    expect(() =>
      render(<LineChart data={SAMPLE} lineColor="#FF0000" showGrid={false} />),
    ).not.toThrow();
  });

  test('showLabels=false でもクラッシュしない', () => {
    expect(() =>
      render(<LineChart data={SAMPLE} lineColor="#FF0000" showLabels={false} />),
    ).not.toThrow();
  });

  test('showValues=true でもクラッシュしない', () => {
    expect(() =>
      render(<LineChart data={SAMPLE} lineColor="#FF0000" showValues />),
    ).not.toThrow();
  });
});

// ── highlightLast ──────────────────────────────────────────────────────────────
describe('highlightLast', () => {
  test('highlightLast=true でもクラッシュしない', () => {
    expect(() =>
      render(
        <LineChart data={SAMPLE} lineColor="#FF0000" highlightLast />,
      ),
    ).not.toThrow();
  });

  test('highlightColor を指定してもクラッシュしない', () => {
    expect(() =>
      render(
        <LineChart
          data={SAMPLE}
          lineColor="#FF0000"
          highlightLast
          highlightColor="#00FF00"
        />,
      ),
    ).not.toThrow();
  });
});

// ── formatValue ────────────────────────────────────────────────────────────────
describe('formatValue', () => {
  test('formatValue を渡してもクラッシュしない', () => {
    expect(() =>
      render(
        <LineChart
          data={SAMPLE}
          lineColor="#FF0000"
          showValues
          formatValue={(v) => `${v}kg`}
        />,
      ),
    ).not.toThrow();
  });
});

// ── 全値が同じ（フラット）ケース ───────────────────────────────────────────────
describe('フラットデータ', () => {
  const flat: LineChartDataPoint[] = [
    { label: '1月', value: 100 },
    { label: '2月', value: 100 },
    { label: '3月', value: 100 },
  ];

  test('全値が同じでもクラッシュしない（ゼロ除算ガード）', () => {
    expect(() =>
      render(<LineChart data={flat} lineColor="#FF0000" />),
    ).not.toThrow();
  });
});
