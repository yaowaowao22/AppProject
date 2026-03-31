/**
 * ScreenHeader コンポーネント テスト
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { TanrenThemeProvider } from '../ThemeContext';

// ── Navigation モック ──────────────────────────────────────────────────────────
const mockGoBack = jest.fn();
const mockOpenDrawer = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    openDrawer: mockOpenDrawer,
    navigate: mockNavigate,
  }),
}));

// ── SafeArea モック ───────────────────────────────────────────────────────────
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// ── Ionicons モック ────────────────────────────────────────────────────────────
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TanrenThemeProvider>{children}</TanrenThemeProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
});

// ── タイトル表示 ───────────────────────────────────────────────────────────────
describe('タイトル表示', () => {
  test('title が表示される', () => {
    const { getByText } = render(<ScreenHeader title="ホーム" />, { wrapper });
    expect(getByText('ホーム')).toBeTruthy();
  });

  test('subtitle が渡された場合は表示される', () => {
    const { getByText } = render(
      <ScreenHeader title="履歴" subtitle="直近30件" />,
      { wrapper },
    );
    expect(getByText('直近30件')).toBeTruthy();
  });

  test('subtitle が未指定の場合は表示されない', () => {
    const { queryByText } = render(<ScreenHeader title="設定" />, { wrapper });
    expect(queryByText('直近30件')).toBeNull();
  });
});

// ── 戻るボタン ─────────────────────────────────────────────────────────────────
describe('戻るボタン', () => {
  test('showBack=true の場合、戻るボタンが表示される', () => {
    const { getByLabelText } = render(
      <ScreenHeader title="詳細" showBack />,
      { wrapper },
    );
    expect(getByLabelText('戻る')).toBeTruthy();
  });

  test('戻るボタンを押すと navigation.goBack() が呼ばれる', () => {
    const { getByLabelText } = render(
      <ScreenHeader title="詳細" showBack />,
      { wrapper },
    );
    fireEvent.press(getByLabelText('戻る'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  test('onBack が指定された場合は navigation.goBack() ではなく onBack が呼ばれる', () => {
    const onBack = jest.fn();
    const { getByLabelText } = render(
      <ScreenHeader title="詳細" showBack onBack={onBack} />,
      { wrapper },
    );
    fireEvent.press(getByLabelText('戻る'));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(mockGoBack).not.toHaveBeenCalled();
  });
});

// ── ハンバーガーボタン ──────────────────────────────────────────────────────────
describe('ハンバーガーボタン', () => {
  test('showHamburger=true の場合、メニューボタンが表示される', () => {
    const { getByLabelText } = render(
      <ScreenHeader title="ホーム" showHamburger />,
      { wrapper },
    );
    expect(getByLabelText('メニューを開く')).toBeTruthy();
  });

  test('メニューボタンを押すと navigation.openDrawer() が呼ばれる', () => {
    const { getByLabelText } = render(
      <ScreenHeader title="ホーム" showHamburger />,
      { wrapper },
    );
    fireEvent.press(getByLabelText('メニューを開く'));
    expect(mockOpenDrawer).toHaveBeenCalledTimes(1);
  });

  test('showHamburger が showBack より優先される', () => {
    const { getByLabelText, queryByLabelText } = render(
      <ScreenHeader title="ホーム" showHamburger showBack />,
      { wrapper },
    );
    expect(getByLabelText('メニューを開く')).toBeTruthy();
    expect(queryByLabelText('戻る')).toBeNull();
  });
});

// ── rightAction ────────────────────────────────────────────────────────────────
describe('rightAction', () => {
  test('rightAction に ReactNode を渡すと表示される', () => {
    const { Text: RNText } = require('react-native');
    const { getByText } = render(
      <ScreenHeader
        title="設定"
        rightAction={<RNText>完了</RNText>}
      />,
      { wrapper },
    );
    expect(getByText('完了')).toBeTruthy();
  });
});
