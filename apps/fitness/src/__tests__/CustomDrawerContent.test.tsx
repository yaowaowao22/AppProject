/**
 * CustomDrawerContent コンポーネント テスト
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CustomDrawerContent } from '../components/CustomDrawerContent';
import { TanrenThemeProvider } from '../ThemeContext';
import { WorkoutProvider } from '../WorkoutContext';

// ── モック ─────────────────────────────────────────────────────────────────────
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('@react-navigation/drawer', () => ({
  DrawerContentScrollView: ({ children }: any) => children,
}));

// ── ヘルパー ──────────────────────────────────────────────────────────────────

const mockNavigate = jest.fn();

/** DrawerContentComponentProps の最小モック */
function makeProps(activeRoute = 'Home') {
  return {
    state: {
      routes: [{ name: activeRoute }],
      index: 0,
    },
    navigation: {
      navigate: mockNavigate,
    },
    // DrawerContentComponentProps に必要な残りのフィールドは型的に必要だが
    // レンダリングには影響しないため最低限だけ提供
  } as any;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <WorkoutProvider>
    <TanrenThemeProvider>{children}</TanrenThemeProvider>
  </WorkoutProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  (require('@react-native-async-storage/async-storage').getItem as jest.Mock)
    .mockResolvedValue(null);
});

// ── ナビ項目表示 ───────────────────────────────────────────────────────────────
describe('ナビゲーション項目', () => {
  test('すべてのナビゲーション項目が表示される', () => {
    const { getByLabelText } = render(
      <CustomDrawerContent {...makeProps()} />,
      { wrapper },
    );
    expect(getByLabelText('ホーム')).toBeTruthy();
    expect(getByLabelText('トレーニング')).toBeTruthy();
    expect(getByLabelText('履歴')).toBeTruthy();
    expect(getByLabelText('月別レポート')).toBeTruthy();
    expect(getByLabelText('RM計算機')).toBeTruthy();
    expect(getByLabelText('テンプレート')).toBeTruthy();
  });

  test('設定項目も表示される', () => {
    const { getByLabelText } = render(
      <CustomDrawerContent {...makeProps()} />,
      { wrapper },
    );
    expect(getByLabelText('設定')).toBeTruthy();
  });
});

// ── ナビゲーション押下 ──────────────────────────────────────────────────────────
describe('ナビゲーション押下', () => {
  test('ホームを押すと navigate("Home") が呼ばれる', () => {
    const { getByLabelText } = render(
      <CustomDrawerContent {...makeProps()} />,
      { wrapper },
    );
    fireEvent.press(getByLabelText('ホーム'));
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  test('設定を押すと navigate("Settings") が呼ばれる', () => {
    const { getByLabelText } = render(
      <CustomDrawerContent {...makeProps()} />,
      { wrapper },
    );
    fireEvent.press(getByLabelText('設定'));
    expect(mockNavigate).toHaveBeenCalledWith('Settings');
  });

  test('履歴を押すと navigate("HistoryStack") が呼ばれる', () => {
    const { getByLabelText } = render(
      <CustomDrawerContent {...makeProps()} />,
      { wrapper },
    );
    fireEvent.press(getByLabelText('履歴'));
    expect(mockNavigate).toHaveBeenCalledWith('HistoryStack');
  });
});

// ── アクティブ状態 ─────────────────────────────────────────────────────────────
describe('アクティブ状態', () => {
  test('アクティブなルートのボタンが accessibilityState.selected=true を持つ', () => {
    const { getByLabelText } = render(
      <CustomDrawerContent {...makeProps('Home')} />,
      { wrapper },
    );
    const homeBtn = getByLabelText('ホーム');
    expect(homeBtn.props.accessibilityState?.selected).toBe(true);
  });

  test('非アクティブなルートのボタンは selected=false を持つ', () => {
    const { getByLabelText } = render(
      <CustomDrawerContent {...makeProps('Home')} />,
      { wrapper },
    );
    const historyBtn = getByLabelText('履歴');
    expect(historyBtn.props.accessibilityState?.selected).toBe(false);
  });
});

// ── ミニダッシュボード ──────────────────────────────────────────────────────────
describe('ミニダッシュボード', () => {
  test('「今週」ラベルが表示される', () => {
    const { getByText } = render(
      <CustomDrawerContent {...makeProps()} />,
      { wrapper },
    );
    expect(getByText('今週')).toBeTruthy();
  });

  test('統計ラベル「トレーニング」「ボリューム」「日連続」が表示される', () => {
    const { getAllByText } = render(
      <CustomDrawerContent {...makeProps()} />,
      { wrapper },
    );
    expect(getAllByText('トレーニング').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('ボリューム').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('日連続').length).toBeGreaterThanOrEqual(1);
  });
});

// ── formatVolume ────────────────────────────────────────────────────────────────
describe('formatVolume（ヘルパー関数）', () => {
  // ヘルパーは内部関数のため、コンポーネント経由で間接的に検証

  test('999 以下の値はそのまま文字列として表示される', () => {
    // weeklyStats.totalVolume = 0 (初期値) の場合は '0' が表示されるはず
    const { getAllByText } = render(
      <CustomDrawerContent {...makeProps()} />,
      { wrapper },
    );
    // 初期値 0 が '0' として表示される（複数の '0' が表示される可能性あり）
    expect(getAllByText('0').length).toBeGreaterThanOrEqual(1);
  });
});
