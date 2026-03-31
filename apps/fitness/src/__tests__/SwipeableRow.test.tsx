/**
 * SwipeableRow コンポーネント テスト
 *
 * PanResponder を伴うスワイプ操作はテスト環境では再現困難なため、
 * 削除ボタンの表示・押下ロジックを中心に検証する。
 */
import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { SwipeableRow } from '../components/SwipeableRow';
import { TanrenThemeProvider } from '../ThemeContext';

// Ionicons モック
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TanrenThemeProvider>{children}</TanrenThemeProvider>
);

beforeEach(() => jest.clearAllMocks());

// ── 基本レンダリング ────────────────────────────────────────────────────────────
describe('基本レンダリング', () => {
  test('children が表示される', () => {
    const { getByText } = render(
      <SwipeableRow onDelete={jest.fn()}>
        <Text>種目行</Text>
      </SwipeableRow>,
      { wrapper },
    );
    expect(getByText('種目行')).toBeTruthy();
  });

  test('削除ボタンラベルが表示される', () => {
    const { getByText } = render(
      <SwipeableRow onDelete={jest.fn()}>
        <Text>行</Text>
      </SwipeableRow>,
      { wrapper },
    );
    expect(getByText('削除')).toBeTruthy();
  });

  test('削除ボタンの accessibilityLabel が "削除" になっている', () => {
    const { getByLabelText } = render(
      <SwipeableRow onDelete={jest.fn()}>
        <Text>行</Text>
      </SwipeableRow>,
      { wrapper },
    );
    expect(getByLabelText('削除')).toBeTruthy();
  });
});

// ── 削除ボタン押下 ─────────────────────────────────────────────────────────────
describe('削除ボタン押下', () => {
  test('削除ボタンを押すと onDelete が呼ばれる', () => {
    const onDelete = jest.fn();
    const { getByLabelText } = render(
      <SwipeableRow onDelete={onDelete}>
        <Text>行</Text>
      </SwipeableRow>,
      { wrapper },
    );
    fireEvent.press(getByLabelText('削除'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('onDelete が複数回呼ばれてもクラッシュしない', () => {
    const onDelete = jest.fn();
    const { getByLabelText } = render(
      <SwipeableRow onDelete={onDelete}>
        <Text>行</Text>
      </SwipeableRow>,
      { wrapper },
    );
    fireEvent.press(getByLabelText('削除'));
    fireEvent.press(getByLabelText('削除'));
    expect(onDelete).toHaveBeenCalledTimes(2);
  });
});

// ── children バリエーション ────────────────────────────────────────────────────
describe('children バリエーション', () => {
  test('複数の子要素でもクラッシュしない', () => {
    expect(() =>
      render(
        <SwipeableRow onDelete={jest.fn()}>
          <Text>ベンチプレス</Text>
          <Text>3 × 10</Text>
        </SwipeableRow>,
        { wrapper },
      ),
    ).not.toThrow();
  });
});
