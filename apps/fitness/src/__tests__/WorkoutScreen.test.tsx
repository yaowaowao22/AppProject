/**
 * WorkoutScreen (ExerciseSelectScreen) テスト
 *
 * 対象: src/screens/WorkoutScreen.tsx → ExerciseSelectScreen
 * - 初期描画（部位タブ・種目リスト）
 * - 部位タブ切り替え
 * - 種目の選択・選択解除
 * - テンプレートセクションの表示
 * - 開始ボタン（選択なし: ナビゲーションしない / 選択あり: OrderConfirm へ遷移）
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ExerciseSelectScreen } from '../screens/WorkoutScreen';
import { THEME_PRESETS } from '../theme';
import { BODY_PARTS } from '../exerciseDB';

// ── モック ─────────────────────────────────────────────────────────────────────

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => () => void) => { cb(); },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../components/ScreenHeader', () => ({
  ScreenHeader: ({ title }: { title: string }) => {
    const { Text } = require('react-native');
    return <Text>{title}</Text>;
  },
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

// ── ヘルパー ──────────────────────────────────────────────────────────────────

function buildNavigation(overrides = {}) {
  return {
    navigate: mockNavigate,
    goBack: jest.fn(),
    ...overrides,
  } as any;
}

function renderScreen(navOverrides = {}) {
  const navigation = buildNavigation(navOverrides);
  const route = {} as any;
  return render(<ExerciseSelectScreen navigation={navigation} route={route} />);
}

// ── テスト ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockNavigate.mockClear();
  mockUseWorkout.mockReturnValue(defaultWorkoutCtx);
});

// ── 1. 初期描画 ───────────────────────────────────────────────────────────────

describe('初期描画', () => {
  test('クラッシュせずにレンダリングできる', () => {
    const { toJSON } = renderScreen();
    expect(toJSON()).not.toBeNull();
  });

  test('ヘッダーに「トレーニング」が表示される', () => {
    const { getByText } = renderScreen();
    expect(getByText('トレーニング')).toBeTruthy();
  });

  test('最初の部位タブが選択状態になっている', () => {
    const firstBP = BODY_PARTS[0];
    const { getByRole } = renderScreen();
    const firstTab = getByRole('tab', { name: firstBP.label });
    expect(firstTab.props.accessibilityState?.selected).toBe(true);
  });

  test('テンプレートなしのとき、テンプレートセクションが非表示', () => {
    const { queryByText } = renderScreen();
    expect(queryByText('テンプレートから開始')).toBeNull();
  });
});

// ── 2. 部位タブ切り替え ───────────────────────────────────────────────────────

describe('部位タブ切り替え', () => {
  test('背中タブを押すと選択状態になる', () => {
    const { getByRole } = renderScreen();
    const backTab = getByRole('tab', { name: '背中' });
    fireEvent.press(backTab);
    expect(backTab.props.accessibilityState?.selected).toBe(true);
  });

  test('タブ切り替え後、前のタブが非選択状態になる', () => {
    const { getByRole } = renderScreen();
    const chestTab = getByRole('tab', { name: '胸' });
    const backTab = getByRole('tab', { name: '背中' });

    fireEvent.press(backTab);
    expect(chestTab.props.accessibilityState?.selected).toBe(false);
  });
});

// ── 3. 種目選択 ───────────────────────────────────────────────────────────────

describe('種目選択', () => {
  test('選択なし時に開始ボタンを押してもナビゲーションされない', () => {
    const { getByText } = renderScreen();
    const btn = getByText(/種目を選択/);
    fireEvent.press(btn);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('種目を選択して開始ボタンを押すと OrderConfirm に遷移する', () => {
    const { getByLabelText, getByText } = renderScreen();
    // 胸タブの最初の種目を選択
    const firstExerciseBtn = getByLabelText('ベンチプレス');
    fireEvent.press(firstExerciseBtn);
    const btn = getByText(/種目を選択/);
    fireEvent.press(btn);
    expect(mockNavigate).toHaveBeenCalledWith('OrderConfirm', expect.objectContaining({
      exerciseIds: expect.arrayContaining(['chest_001']),
    }));
  });

  test('種目を2回押すと選択解除される', () => {
    const { getByLabelText, getByText } = renderScreen();
    const btn = getByLabelText('ベンチプレス');
    fireEvent.press(btn); // 選択
    fireEvent.press(btn); // 解除
    const startBtn = getByText(/種目を選択/);
    fireEvent.press(startBtn);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

// ── 4. テンプレート ───────────────────────────────────────────────────────────

describe('テンプレート', () => {
  const templates = [
    {
      id: 'tmpl1',
      name: '胸トレ',
      exerciseIds: ['chest_001', 'chest_002'],
      createdAt: '2026-03-01T00:00:00.000Z',
    },
  ];

  test('テンプレートがある場合にテンプレートセクションが表示される', () => {
    mockUseWorkout.mockReturnValue({ ...defaultWorkoutCtx, templates });
    const { getByText } = renderScreen();
    expect(getByText('テンプレートから開始')).toBeTruthy();
    expect(getByText('胸トレ')).toBeTruthy();
  });

  test('テンプレートを押すと OrderConfirm に遷移する', () => {
    mockUseWorkout.mockReturnValue({ ...defaultWorkoutCtx, templates });
    const { getByLabelText } = renderScreen();
    fireEvent.press(getByLabelText('胸トレ、2種目'));
    expect(mockNavigate).toHaveBeenCalledWith('OrderConfirm', {
      exerciseIds: ['chest_001', 'chest_002'],
    });
  });
});
