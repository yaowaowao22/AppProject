/**
 * BottomSheet / SheetRow / SparkBars コンポーネント テスト
 */
import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { BottomSheet, SheetRow, SparkBars } from '../components/BottomSheet';
import { TanrenThemeProvider } from '../ThemeContext';

// ── モック ─────────────────────────────────────────────────────────────────────
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TanrenThemeProvider>{children}</TanrenThemeProvider>
);

// ── BottomSheet ────────────────────────────────────────────────────────────────
describe('BottomSheet', () => {
  const baseProps = {
    visible: true,
    onClose: jest.fn(),
    title: 'テストシート',
    children: <Text>本文</Text>,
  };

  beforeEach(() => jest.clearAllMocks());

  test('visible=true の場合、タイトルが表示される', () => {
    const { getByText } = render(<BottomSheet {...baseProps} />, { wrapper });
    expect(getByText('テストシート')).toBeTruthy();
  });

  test('children が表示される', () => {
    const { getByText } = render(<BottomSheet {...baseProps} />, { wrapper });
    expect(getByText('本文')).toBeTruthy();
  });

  test('subtitle を渡すと表示される', () => {
    const { getByText } = render(
      <BottomSheet {...baseProps} subtitle="サブタイトル" />,
      { wrapper },
    );
    expect(getByText('サブタイトル')).toBeTruthy();
  });

  test('subtitle が未指定の場合は表示されない', () => {
    const { queryByText } = render(<BottomSheet {...baseProps} />, { wrapper });
    expect(queryByText('サブタイトル')).toBeNull();
  });

  test('visible=false の場合は何もレンダリングしない', () => {
    const { queryByText } = render(
      <BottomSheet {...baseProps} visible={false} />,
      { wrapper },
    );
    expect(queryByText('テストシート')).toBeNull();
  });

  test('maxHeight を渡してもクラッシュしない', () => {
    expect(() =>
      render(<BottomSheet {...baseProps} maxHeight={400} />, { wrapper }),
    ).not.toThrow();
  });

  test('maxHeight に % 文字列を渡してもクラッシュしない', () => {
    expect(() =>
      render(<BottomSheet {...baseProps} maxHeight="60%" />, { wrapper }),
    ).not.toThrow();
  });
});

// ── SheetRow ───────────────────────────────────────────────────────────────────
describe('SheetRow', () => {
  beforeEach(() => jest.clearAllMocks());

  test('label が表示される', () => {
    const { getByText } = render(
      <SheetRow label="スクワット" />,
      { wrapper },
    );
    expect(getByText('スクワット')).toBeTruthy();
  });

  test('detail が渡された場合は表示される', () => {
    const { getByText } = render(
      <SheetRow label="スクワット" detail="下半身" />,
      { wrapper },
    );
    expect(getByText('下半身')).toBeTruthy();
  });

  test('value が渡された場合は表示される', () => {
    const { getByText } = render(
      <SheetRow label="スクワット" value="100kg" />,
      { wrapper },
    );
    expect(getByText('100kg')).toBeTruthy();
  });

  test('badge=true の場合、PR バッジが表示される', () => {
    const { getByText } = render(
      <SheetRow label="スクワット" badge />,
      { wrapper },
    );
    expect(getByText('PR')).toBeTruthy();
  });

  test('onPress を渡すと押せる行になり、押すとコールバックが呼ばれる', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <SheetRow label="スクワット" onPress={onPress} />,
      { wrapper },
    );
    fireEvent.press(getByText('スクワット'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('onPress なしの場合、chevron（›）は表示されない', () => {
    const { queryByText } = render(
      <SheetRow label="スクワット" />,
      { wrapper },
    );
    expect(queryByText('›')).toBeNull();
  });

  test('onPress ありの場合、chevron（›）が表示される', () => {
    const { getByText } = render(
      <SheetRow label="スクワット" onPress={jest.fn()} />,
      { wrapper },
    );
    expect(getByText('›')).toBeTruthy();
  });

  test('isLast=true でもクラッシュしない', () => {
    expect(() =>
      render(<SheetRow label="最後の行" isLast />, { wrapper }),
    ).not.toThrow();
  });
});

// ── SparkBars ──────────────────────────────────────────────────────────────────
describe('SparkBars', () => {
  const bars = [
    { label: '月', value: 50 },
    { label: '火', value: 80 },
    { label: '水', value: 0 },
    { label: '木', value: 120, isCurrent: true },
  ];

  test('ラベルが表示される', () => {
    const { getByText } = render(<SparkBars bars={bars} />, { wrapper });
    expect(getByText('月')).toBeTruthy();
    expect(getByText('木')).toBeTruthy();
  });

  test('全バーが value=0 でもクラッシュしない', () => {
    const zeroBars = [
      { label: '月', value: 0 },
      { label: '火', value: 0 },
    ];
    expect(() =>
      render(<SparkBars bars={zeroBars} />, { wrapper }),
    ).not.toThrow();
  });

  test('全バーが同じ値でもクラッシュしない（maxVal=value ケース）', () => {
    const sameBars = [
      { label: '月', value: 100 },
      { label: '火', value: 100 },
    ];
    expect(() =>
      render(<SparkBars bars={sameBars} />, { wrapper }),
    ).not.toThrow();
  });

  test('isCurrent=true のバーが含まれてもクラッシュしない', () => {
    expect(() =>
      render(<SparkBars bars={bars} />, { wrapper }),
    ).not.toThrow();
  });
});
