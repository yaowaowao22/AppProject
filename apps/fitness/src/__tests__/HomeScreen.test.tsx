/**
 * HomeScreen テスト
 *
 * 対象: src/screens/HomeScreen.tsx
 * - 初期描画（カレンダー・クイックスタート・ボタン）
 * - トレーニング記録なし / あり の表示切り替え
 * - 月ナビゲーション（前月・次月ボタン）
 * - ワークアウト開始ボタンのナビゲーション
 * - クイックスタートチップのナビゲーション
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

import HomeScreen from '../screens/HomeScreen';
import { THEME_PRESETS } from '../theme';

// ── モック ─────────────────────────────────────────────────────────────────────

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: (cb: () => void) => { cb(); },
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

jest.mock('../components/SectionLabel', () => ({
  SectionLabel: ({ children }: { children: React.ReactNode }) => {
    const { Text } = require('react-native');
    return <Text>{children}</Text>;
  },
}));

// loadAppSettings: デフォルトは両方 true
const mockLoadAppSettings = jest.fn().mockResolvedValue({
  showCalendar: true,
  showQuickStart: true,
});

jest.mock('../utils/storage', () => ({
  loadAppSettings: () => mockLoadAppSettings(),
}));

const mockColors = THEME_PRESETS.hakukou.colors;

// WorkoutContext デフォルト値（ワークアウトなし）
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

// ── ヘルパー ──────────────────────────────────────────────────────────────────

function renderHome() {
  return render(<HomeScreen />);
}

// ── テスト ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-03-31T10:00:00.000Z'));
  mockNavigate.mockClear();
  mockUseWorkout.mockReturnValue(defaultWorkoutCtx);
  mockLoadAppSettings.mockResolvedValue({ showCalendar: true, showQuickStart: true });
});

afterEach(() => {
  jest.useRealTimers();
});

// ── 1. 初期描画 ───────────────────────────────────────────────────────────────

describe('初期描画', () => {
  test('クラッシュせずにレンダリングできる', async () => {
    const { toJSON } = renderHome();
    await act(async () => {});
    expect(toJSON()).not.toBeNull();
  });

  test('ワークアウト開始ボタンが表示される', async () => {
    const { getByLabelText } = renderHome();
    await act(async () => {});
    expect(getByLabelText('ワークアウトを開始する')).toBeTruthy();
  });

  test('カレンダーが表示される（showCalendar=true）', async () => {
    const { getByLabelText } = renderHome();
    await act(async () => {});
    expect(getByLabelText('前の月')).toBeTruthy();
    expect(getByLabelText('次の月')).toBeTruthy();
  });
});

// ── 2. 空状態 ─────────────────────────────────────────────────────────────────

describe('空状態（ワークアウトなし）', () => {
  test('「トレーニング記録なし」が表示される', async () => {
    const { getByText } = renderHome();
    await act(async () => {});
    expect(getByText('トレーニング記録なし')).toBeTruthy();
  });

  test('「トレーニングメニューがありません」が表示される', async () => {
    const { getByText } = renderHome();
    await act(async () => {});
    expect(getByText('トレーニングメニューがありません')).toBeTruthy();
  });
});

// ── 3. ワークアウトあり ───────────────────────────────────────────────────────

describe('ワークアウトあり', () => {
  const todayStr = '2026-03-31';
  const workout = {
    id: 'w1',
    date: todayStr,
    totalVolume: 2500,
    duration: 3600,
    sessions: [
      {
        id: 's1',
        exerciseId: 'chest_001',
        sets: [
          { id: 'set1', weight: 80, reps: 10, isPersonalRecord: false },
          { id: 'set2', weight: 85, reps: 8, isPersonalRecord: false },
        ],
        completedAt: todayStr,
      },
    ],
  };

  beforeEach(() => {
    mockUseWorkout.mockReturnValue({
      ...defaultWorkoutCtx,
      workouts: [workout],
    });
  });

  test('セッション数が表示される', async () => {
    const { getAllByText } = renderHome();
    await act(async () => {});
    expect(getAllByText('1').length).toBeGreaterThanOrEqual(1);
  });

  test('ボリュームが表示される（2.5k形式）', async () => {
    const { getByText } = renderHome();
    await act(async () => {});
    expect(getByText('2.5k')).toBeTruthy();
  });
});

// ── 4. カレンダーナビゲーション ───────────────────────────────────────────────

describe('カレンダーナビゲーション', () => {
  test('「前の月」ボタンで前月ラベルに変わる', async () => {
    const { getByLabelText, getByText } = renderHome();
    await act(async () => {});
    fireEvent.press(getByLabelText('前の月'));
    expect(getByText(/2026年2月/)).toBeTruthy();
  });

  test('「次の月」ボタンで翌月ラベルに変わる', async () => {
    const { getByLabelText, getByText } = renderHome();
    await act(async () => {});
    fireEvent.press(getByLabelText('次の月'));
    expect(getByText(/2026年4月/)).toBeTruthy();
  });
});

// ── 5. クイックスタート ───────────────────────────────────────────────────────

describe('クイックスタート', () => {
  test('showQuickStart=true のときクイックスタートセクションが表示される', async () => {
    const { getByText } = renderHome();
    await act(async () => {});
    expect(getByText('クイックスタート')).toBeTruthy();
  });

  test('showQuickStart=false のときクイックスタートが非表示', async () => {
    mockLoadAppSettings.mockResolvedValue({ showCalendar: true, showQuickStart: false });
    const { queryByText } = renderHome();
    await act(async () => {});
    expect(queryByText('クイックスタート')).toBeNull();
  });

  test('チップを押すと WorkoutStack/ActiveWorkout に遷移する', async () => {
    const { getByLabelText } = renderHome();
    await act(async () => {});
    fireEvent.press(getByLabelText('ベンチプレス'));
    expect(mockNavigate).toHaveBeenCalledWith(
      'WorkoutStack',
      expect.objectContaining({ screen: 'ActiveWorkout' }),
    );
  });
});

// ── 6. ワークアウト開始ボタン ─────────────────────────────────────────────────

describe('ワークアウト開始ボタン', () => {
  test('押すと WorkoutStack/ExerciseSelect に遷移する', async () => {
    const { getByLabelText } = renderHome();
    await act(async () => {});
    fireEvent.press(getByLabelText('ワークアウトを開始する'));
    expect(mockNavigate).toHaveBeenCalledWith(
      'WorkoutStack',
      expect.objectContaining({ screen: 'ExerciseSelect' }),
    );
  });
});

// ── 7. カレンダー非表示 ───────────────────────────────────────────────────────

describe('カレンダー非表示', () => {
  test('showCalendar=false のときカレンダーが非表示', async () => {
    mockLoadAppSettings.mockResolvedValue({ showCalendar: false, showQuickStart: true });
    const { queryByLabelText } = renderHome();
    await act(async () => {});
    expect(queryByLabelText('前の月')).toBeNull();
  });
});
