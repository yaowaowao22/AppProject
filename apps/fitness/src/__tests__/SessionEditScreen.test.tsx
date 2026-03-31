/**
 * SessionEditScreen テスト
 *
 * 対象: src/screens/SessionEditScreen.tsx
 * - ワークアウト/セッション未発見時のエラー表示
 * - セット一覧の初期レンダリング
 * - 空セット時のメッセージ
 * - セット追加ボタン
 * - 保存ボタン（updateSession + goBack）
 * - PR バッジ表示
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SessionEditScreen from '../screens/SessionEditScreen';
import { useWorkout } from '../WorkoutContext';
import { useTheme } from '../ThemeContext';

// ── モック ─────────────────────────────────────────────────────────────────────

jest.mock('../WorkoutContext');
jest.mock('../ThemeContext');

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaView: ({ children }: any) => React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('../components/ScreenHeader', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    ScreenHeader: ({ title, subtitle }: any) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, { testID: 'header-title' }, title),
        subtitle ? React.createElement(Text, { testID: 'header-subtitle' }, subtitle) : null,
      ),
  };
});

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

jest.mock('../exerciseDB', () => ({
  EXERCISES: [
    {
      id: 'bench-press',
      name: 'ベンチプレス',
      bodyPart: 'chest',
      nameEn: 'Bench Press',
      icon: 'barbell',
      equipment: 'バーベル',
    },
  ],
  BODY_PARTS: [],
}));

// ── フィクスチャ ───────────────────────────────────────────────────────────────

const mockColors = {
  background: '#000000', surface1: '#111111', surface2: '#222222',
  textPrimary: '#ffffff', textSecondary: '#cccccc', textTertiary: '#888888',
  accent: '#ff6600', accentDim: '#331a00', onAccent: '#ffffff',
  separator: '#333333', error: '#ff0000', cardBackground: '#111111',
};

const mockSession = {
  id: 's1',
  exerciseId: 'bench-press',
  startedAt: '2026-03-31T10:00:00.000Z',
  sets: [
    {
      id: 'set1',
      weight: 100,
      reps: 5,
      completedAt: '2026-03-31T10:01:00.000Z',
      isPersonalRecord: false,
    },
    {
      id: 'set2',
      weight: 110,
      reps: 3,
      completedAt: '2026-03-31T10:02:00.000Z',
      isPersonalRecord: true,
    },
  ],
};

const mockWorkout = {
  id: 'w1',
  date: '2026-03-31',
  totalVolume: 830,
  duration: 3600,
  sessions: [mockSession],
};

// ── セットアップ ──────────────────────────────────────────────────────────────

const { useNavigation, useRoute } = require('@react-navigation/native');

let mockGoBack: jest.Mock;
let mockUpdateSession: jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-03-31T10:00:00.000Z'));

  mockGoBack = jest.fn();
  mockUpdateSession = jest.fn().mockResolvedValue(undefined);

  (useTheme as jest.Mock).mockReturnValue({ colors: mockColors });
  (useNavigation as jest.Mock).mockReturnValue({ goBack: mockGoBack });
  (useRoute as jest.Mock).mockReturnValue({
    params: { workoutId: 'w1', exerciseId: 'bench-press' },
  });
  (useWorkout as jest.Mock).mockReturnValue({
    workouts: [mockWorkout],
    updateSession: mockUpdateSession,
    personalRecords: [],
    weeklyStats: { workoutCount: 0, totalVolume: 0, streakDays: 0 },
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════════
// 1. データ未発見
// ═══════════════════════════════════════════════════════════════════════════════

describe('ワークアウト/セッションが見つからない場合', () => {
  it('"データが見つかりません"を表示する', () => {
    (useWorkout as jest.Mock).mockReturnValue({
      workouts: [],
      updateSession: jest.fn(),
      personalRecords: [],
      weeklyStats: { workoutCount: 0, totalVolume: 0, streakDays: 0 },
    });

    const { getByText } = render(<SessionEditScreen />);
    expect(getByText('データが見つかりません')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. 初期表示
// ═══════════════════════════════════════════════════════════════════════════════

describe('初期表示', () => {
  it('種目名をヘッダーに表示する', () => {
    const { getByTestId } = render(<SessionEditScreen />);
    expect(getByTestId('header-title').props.children).toBe('ベンチプレス');
  });

  it('セット数をサブタイトルに表示する', () => {
    const { getByTestId } = render(<SessionEditScreen />);
    expect(getByTestId('header-subtitle').props.children).toBe('2セット');
  });

  it('各セットの番号を表示する（1, 2）', () => {
    const { getByText } = render(<SessionEditScreen />);
    expect(getByText('1')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
  });

  it('PR バッジをセット2に表示する', () => {
    const { getAllByText } = render(<SessionEditScreen />);
    // isPersonalRecord=true のセットが1つある
    const prBadges = getAllByText('PR');
    expect(prBadges).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. 空セット状態
// ═══════════════════════════════════════════════════════════════════════════════

describe('空セット状態', () => {
  it('"セットがありません"を表示する', () => {
    (useWorkout as jest.Mock).mockReturnValue({
      workouts: [
        {
          ...mockWorkout,
          sessions: [{ ...mockSession, sets: [] }],
        },
      ],
      updateSession: jest.fn(),
      personalRecords: [],
      weeklyStats: { workoutCount: 0, totalVolume: 0, streakDays: 0 },
    });

    const { getByText } = render(<SessionEditScreen />);
    expect(getByText('セットがありません')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. セット追加
// ═══════════════════════════════════════════════════════════════════════════════

describe('セット追加', () => {
  it('"セット追加"ボタンを押すとセット数が1増える', () => {
    const { getByRole, getByTestId } = render(<SessionEditScreen />);
    expect(getByTestId('header-subtitle').props.children).toBe('2セット');

    const addBtn = getByRole('button', { name: 'セットを追加' });
    fireEvent.press(addBtn);

    expect(getByTestId('header-subtitle').props.children).toBe('3セット');
  });

  it('空セット状態から"セット追加"を押すとセットが1つになる', () => {
    (useWorkout as jest.Mock).mockReturnValue({
      workouts: [
        {
          ...mockWorkout,
          sessions: [{ ...mockSession, sets: [] }],
        },
      ],
      updateSession: jest.fn(),
      personalRecords: [],
      weeklyStats: { workoutCount: 0, totalVolume: 0, streakDays: 0 },
    });

    const { getByRole, getByTestId } = render(<SessionEditScreen />);
    fireEvent.press(getByRole('button', { name: 'セットを追加' }));
    expect(getByTestId('header-subtitle').props.children).toBe('1セット');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. 保存
// ═══════════════════════════════════════════════════════════════════════════════

describe('保存ボタン', () => {
  it('"保存"ボタンを押すと updateSession と goBack が呼ばれる', async () => {
    const { getByRole } = render(<SessionEditScreen />);
    const saveBtn = getByRole('button', { name: '変更を保存' });
    fireEvent.press(saveBtn);

    // updateSession は非同期なので Promise を解決させる
    await Promise.resolve();

    expect(mockUpdateSession).toHaveBeenCalledWith(
      'w1',
      expect.objectContaining({ exerciseId: 'bench-press' }),
    );
    expect(mockGoBack).toHaveBeenCalled();
  });
});
