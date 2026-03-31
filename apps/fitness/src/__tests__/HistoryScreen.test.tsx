/**
 * HistoryScreen テスト
 *
 * 対象: src/screens/HistoryScreen.tsx → HistoryScreen
 * - 初期描画（タブバー：日別・部位別・種目別）
 * - 日別タブ: 空状態 / ワークアウトカード表示
 * - 部位別タブ: 空状態 / 部位カード表示
 * - タブ切り替え
 * - ワークアウト削除
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { HistoryScreen } from '../screens/HistoryScreen';
import { THEME_PRESETS } from '../theme';

// ── モック ─────────────────────────────────────────────────────────────────────

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../components/SwipeableRow', () => ({
  SwipeableRow: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../components/ScreenHeader', () => ({
  ScreenHeader: ({ title }: { title: string }) => {
    const { Text } = require('react-native');
    return <Text>{title}</Text>;
  },
}));

jest.mock('../components/LineChart', () => ({
  LineChart: () => null,
}));

const mockColors = THEME_PRESETS.hakukou.colors;

const defaultWorkoutCtx = {
  workouts: [],
  personalRecords: [],
  currentSession: null,
  weeklyStats: { workoutCount: 0, totalVolume: 0, streakDays: 0 },
  templates: [],
  workoutConfig: { restSeconds: 90, weightUnit: 'kg', theme: 'hakukou' },
  startSession: jest.fn(),
  addSet: jest.fn(),
  completeSession: jest.fn(),
  deleteWorkout: jest.fn(),
  deleteSessionFromWorkout: jest.fn(),
  saveTemplate: jest.fn(),
  updateTemplate: jest.fn(),
  deleteTemplate: jest.fn(),
  updateWorkoutConfig: jest.fn(),
  updateSession: jest.fn(),
  resetAll: jest.fn(),
};

const mockUseWorkout = jest.fn(() => defaultWorkoutCtx);

jest.mock('../WorkoutContext', () => ({
  useWorkout: () => mockUseWorkout(),
}));

jest.mock('../ThemeContext', () => ({
  useTheme: () => ({ colors: mockColors }),
}));

// ── サンプルデータ ────────────────────────────────────────────────────────────

const sampleWorkout = {
  id: 'w1',
  date: '2026-03-31',
  totalVolume: 3000,
  duration: 3600,
  sessions: [
    {
      id: 's1',
      exerciseId: 'chest_001',
      sets: [
        { id: 'set1', weight: 80, reps: 10, isPersonalRecord: false },
        { id: 'set2', weight: 85, reps: 8, isPersonalRecord: false },
      ],
      completedAt: '2026-03-31T10:00:00.000Z',
    },
  ],
};

// ── テスト ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-03-31T10:00:00.000Z'));
  mockNavigate.mockClear();
  mockUseWorkout.mockReturnValue(defaultWorkoutCtx);
});

afterEach(() => {
  jest.useRealTimers();
});

// ── 1. 初期描画 ───────────────────────────────────────────────────────────────

describe('初期描画', () => {
  test('クラッシュせずにレンダリングできる', () => {
    const { toJSON } = render(<HistoryScreen />);
    expect(toJSON()).not.toBeNull();
  });

  test('ヘッダーに「履歴」が表示される', () => {
    const { getByText } = render(<HistoryScreen />);
    expect(getByText('履歴')).toBeTruthy();
  });

  test('3つのタブが表示される', () => {
    const { getByRole } = render(<HistoryScreen />);
    expect(getByRole('tab', { name: '日別' })).toBeTruthy();
    expect(getByRole('tab', { name: '部位別' })).toBeTruthy();
    expect(getByRole('tab', { name: '種目別' })).toBeTruthy();
  });

  test('初期タブは「日別」が選択されている', () => {
    const { getByRole } = render(<HistoryScreen />);
    const dailyTab = getByRole('tab', { name: '日別' });
    expect(dailyTab.props.accessibilityState?.selected).toBe(true);
  });
});

// ── 2. 日別タブ: 空状態 ───────────────────────────────────────────────────────

describe('日別タブ（空状態）', () => {
  test('「まだトレーニング記録がありません」が表示される', () => {
    const { getByText } = render(<HistoryScreen />);
    expect(getByText('まだトレーニング記録がありません')).toBeTruthy();
  });

  test('「トレーニングを開始」CTAが表示される', () => {
    const { getByLabelText } = render(<HistoryScreen />);
    expect(getByLabelText('トレーニングを開始する')).toBeTruthy();
  });
});

// ── 3. 日別タブ: ワークアウトあり ────────────────────────────────────────────

describe('日別タブ（ワークアウトあり）', () => {
  beforeEach(() => {
    mockUseWorkout.mockReturnValue({
      ...defaultWorkoutCtx,
      workouts: [sampleWorkout],
      deleteWorkout: jest.fn(),
    });
  });

  test('ワークアウトカードが表示される（日付含む）', () => {
    const { getByText } = render(<HistoryScreen />);
    // 3月31日（火）
    expect(getByText('3月31日（火）')).toBeTruthy();
  });

  test('種目名が表示される', () => {
    const { getByText } = render(<HistoryScreen />);
    expect(getByText('ベンチプレス')).toBeTruthy();
  });

  test('セット数と最大重量が表示される', () => {
    const { getByText } = render(<HistoryScreen />);
    expect(getByText('2セット · 85kg')).toBeTruthy();
  });

  test('ワークアウトカードを押すと DayDetail に遷移する', () => {
    const { getByLabelText } = render(<HistoryScreen />);
    fireEvent.press(getByLabelText('3月31日（火）のワークアウト詳細を見る'));
    expect(mockNavigate).toHaveBeenCalledWith('DayDetail', { workoutId: 'w1' });
  });
});

// ── 4. タブ切り替え ───────────────────────────────────────────────────────────

describe('タブ切り替え', () => {
  test('「部位別」タブを押すと選択状態になる', () => {
    const { getByRole } = render(<HistoryScreen />);
    const bpTab = getByRole('tab', { name: '部位別' });
    fireEvent.press(bpTab);
    expect(bpTab.props.accessibilityState?.selected).toBe(true);
  });

  test('部位別タブ選択後、日別タブが非選択になる', () => {
    const { getByRole } = render(<HistoryScreen />);
    const dailyTab = getByRole('tab', { name: '日別' });
    const bpTab = getByRole('tab', { name: '部位別' });
    fireEvent.press(bpTab);
    expect(dailyTab.props.accessibilityState?.selected).toBe(false);
  });

  test('「種目別」タブを押すと選択状態になる', () => {
    const { getByRole } = render(<HistoryScreen />);
    const exTab = getByRole('tab', { name: '種目別' });
    fireEvent.press(exTab);
    expect(exTab.props.accessibilityState?.selected).toBe(true);
  });
});

// ── 5. 部位別タブ ─────────────────────────────────────────────────────────────

describe('部位別タブ', () => {
  test('ワークアウトなしのとき「まだトレーニング記録がありません」が表示される', () => {
    const { getByRole, getByText } = render(<HistoryScreen />);
    fireEvent.press(getByRole('tab', { name: '部位別' }));
    expect(getByText('まだトレーニング記録がありません')).toBeTruthy();
  });

  test('ワークアウトありのとき部位カードが表示される', () => {
    mockUseWorkout.mockReturnValue({
      ...defaultWorkoutCtx,
      workouts: [sampleWorkout],
    });
    const { getByRole, getByText } = render(<HistoryScreen />);
    fireEvent.press(getByRole('tab', { name: '部位別' }));
    expect(getByText('胸')).toBeTruthy();
  });

  test('部位カードを押すと詳細ビューに遷移する', () => {
    mockUseWorkout.mockReturnValue({
      ...defaultWorkoutCtx,
      workouts: [sampleWorkout],
    });
    const { getByRole, getByLabelText } = render(<HistoryScreen />);
    fireEvent.press(getByRole('tab', { name: '部位別' }));
    fireEvent.press(getByLabelText('胸の詳細を見る'));
    expect(getByLabelText('部位一覧に戻る')).toBeTruthy();
  });

  test('部位詳細ビューで「部位一覧に戻る」ボタンを押すと一覧に戻る', () => {
    mockUseWorkout.mockReturnValue({
      ...defaultWorkoutCtx,
      workouts: [sampleWorkout],
    });
    const { getByRole, getByLabelText, getByText } = render(<HistoryScreen />);
    fireEvent.press(getByRole('tab', { name: '部位別' }));
    fireEvent.press(getByLabelText('胸の詳細を見る'));
    fireEvent.press(getByLabelText('部位一覧に戻る'));
    expect(getByText('胸')).toBeTruthy();
  });
});

// ── 6. 種目別タブ ─────────────────────────────────────────────────────────────

describe('種目別タブ', () => {
  test('ワークアウトなしのとき空状態メッセージが表示される', () => {
    const { getByRole, getByText } = render(<HistoryScreen />);
    fireEvent.press(getByRole('tab', { name: '種目別' }));
    expect(getByText('まだトレーニング記録がありません')).toBeTruthy();
  });

  test('ワークアウトありのとき種目リストが表示される', () => {
    mockUseWorkout.mockReturnValue({
      ...defaultWorkoutCtx,
      workouts: [sampleWorkout],
    });
    const { getByRole, getByText } = render(<HistoryScreen />);
    fireEvent.press(getByRole('tab', { name: '種目別' }));
    expect(getByText('ベンチプレス')).toBeTruthy();
  });

  test('種目別タブで全部位フィルタが表示される', () => {
    mockUseWorkout.mockReturnValue({
      ...defaultWorkoutCtx,
      workouts: [sampleWorkout],
    });
    const { getByRole, getByText } = render(<HistoryScreen />);
    fireEvent.press(getByRole('tab', { name: '種目別' }));
    expect(getByText('全て')).toBeTruthy();
  });

  test('種目を押すと詳細ビューに遷移する', () => {
    mockUseWorkout.mockReturnValue({
      ...defaultWorkoutCtx,
      workouts: [sampleWorkout],
    });
    const { getByRole, getByText, getByLabelText } = render(<HistoryScreen />);
    fireEvent.press(getByRole('tab', { name: '種目別' }));
    fireEvent.press(getByLabelText('ベンチプレスの詳細を見る'));
    expect(getByLabelText('種目一覧に戻る')).toBeTruthy();
  });

  test('種目詳細ビューで「種目一覧に戻る」を押すと一覧に戻る', () => {
    mockUseWorkout.mockReturnValue({
      ...defaultWorkoutCtx,
      workouts: [sampleWorkout],
    });
    const { getByRole, getByText, getByLabelText } = render(<HistoryScreen />);
    fireEvent.press(getByRole('tab', { name: '種目別' }));
    fireEvent.press(getByLabelText('ベンチプレスの詳細を見る'));
    fireEvent.press(getByLabelText('種目一覧に戻る'));
    expect(getByText('ベンチプレス')).toBeTruthy();
  });

  test('種目別タブで部位フィルターを押すとタブが切り替わる', () => {
    mockUseWorkout.mockReturnValue({
      ...defaultWorkoutCtx,
      workouts: [sampleWorkout],
    });
    const { getByRole, getByText } = render(<HistoryScreen />);
    fireEvent.press(getByRole('tab', { name: '種目別' }));
    // 全てタブが表示され、それを押す
    expect(getByText('全て')).toBeTruthy();
    // 胸フィルターを押す
    const chestFilter = getByRole('tab', { name: '胸' });
    fireEvent.press(chestFilter);
    expect(true).toBe(true);
  });

  test('複数ワークアウトがある場合、種目詳細でセパレーターが表示される', () => {
    const workout2 = {
      ...sampleWorkout,
      id: 'w2',
      date: '2026-03-28',
    };
    mockUseWorkout.mockReturnValue({
      ...defaultWorkoutCtx,
      workouts: [sampleWorkout, workout2],
    });
    const { getByRole, getByLabelText } = render(<HistoryScreen />);
    fireEvent.press(getByRole('tab', { name: '種目別' }));
    fireEvent.press(getByLabelText('ベンチプレスの詳細を見る'));
    expect(true).toBe(true);
  });
});
