/**
 * DayDetailScreen テスト
 *
 * 対象: src/screens/DayDetailScreen.tsx
 * - ワークアウト未発見時のエラー表示
 * - 日付フォーマット（formatDate ヘルパー）
 * - セッション一覧のレンダリング
 * - PR バッジ表示
 * - SessionEdit へのナビゲーション
 * - deleteSessionFromWorkout 呼び出し
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DayDetailScreen from '../screens/DayDetailScreen';
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

jest.mock('../components/SwipeableRow', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');
  return {
    SwipeableRow: ({ children, onDelete }: any) =>
      React.createElement(
        View,
        null,
        children,
        React.createElement(
          TouchableOpacity,
          { onPress: onDelete, testID: 'swipe-delete-btn' },
          React.createElement(Text, null, '削除'),
        ),
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

const mockWorkout = {
  id: 'w1',
  date: '2026-03-31',
  totalVolume: 500,
  duration: 3600,
  sessions: [
    {
      id: 's1',
      exerciseId: 'bench-press',
      startedAt: '2026-03-31T10:00:00.000Z',
      sets: [
        {
          id: 'set1',
          weight: 100,
          reps: 5,
          completedAt: '2026-03-31T10:01:00.000Z',
          isPersonalRecord: true,
        },
      ],
    },
  ],
};

const mockWorkoutNoPR = {
  ...mockWorkout,
  sessions: [
    {
      ...mockWorkout.sessions[0],
      sets: [
        {
          id: 'set1',
          weight: 80,
          reps: 8,
          completedAt: '2026-03-31T10:01:00.000Z',
          isPersonalRecord: false,
        },
      ],
    },
  ],
};

// ── セットアップ ──────────────────────────────────────────────────────────────

const { useNavigation, useRoute } = require('@react-navigation/native');

let mockNavigate: jest.Mock;
let mockDeleteSession: jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-03-31T10:00:00.000Z'));

  mockNavigate = jest.fn();
  mockDeleteSession = jest.fn().mockResolvedValue(undefined);

  (useTheme as jest.Mock).mockReturnValue({ colors: mockColors });
  (useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate });
  (useRoute as jest.Mock).mockReturnValue({ params: { workoutId: 'w1' } });
  (useWorkout as jest.Mock).mockReturnValue({
    workouts: [mockWorkout],
    deleteSessionFromWorkout: mockDeleteSession,
    personalRecords: [],
    weeklyStats: { workoutCount: 0, totalVolume: 0, streakDays: 0 },
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ワークアウト未発見時
// ═══════════════════════════════════════════════════════════════════════════════

describe('ワークアウトが見つからない場合', () => {
  it('"データが見つかりません"を表示する', () => {
    (useWorkout as jest.Mock).mockReturnValue({
      workouts: [],
      deleteSessionFromWorkout: jest.fn(),
      personalRecords: [],
      weeklyStats: { workoutCount: 0, totalVolume: 0, streakDays: 0 },
    });

    const { getByText } = render(<DayDetailScreen />);
    expect(getByText('データが見つかりません')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. 日付フォーマット（formatDate ヘルパー）
// ═══════════════════════════════════════════════════════════════════════════════

describe('formatDate', () => {
  it('2026-03-31 を "3月31日（火曜日）" にフォーマットする', () => {
    const { getByTestId } = render(<DayDetailScreen />);
    // 2026-03-31 は火曜日
    expect(getByTestId('header-title').props.children).toBe('3月31日（火曜日）');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. セッション一覧
// ═══════════════════════════════════════════════════════════════════════════════

describe('セッション一覧', () => {
  it('種目名を表示する', () => {
    const { getByText } = render(<DayDetailScreen />);
    expect(getByText('ベンチプレス')).toBeTruthy();
  });

  it('セット数と最大重量を表示する', () => {
    const { getByText } = render(<DayDetailScreen />);
    expect(getByText('1セット · 最大100kg')).toBeTruthy();
  });

  it('重量なし（weight=null）のセットは "自重" と表示する', () => {
    (useWorkout as jest.Mock).mockReturnValue({
      workouts: [
        {
          ...mockWorkout,
          sessions: [
            {
              ...mockWorkout.sessions[0],
              sets: [
                { id: 'set1', weight: null, reps: 60, completedAt: '', isPersonalRecord: false },
              ],
            },
          ],
        },
      ],
      deleteSessionFromWorkout: jest.fn(),
      personalRecords: [],
      weeklyStats: { workoutCount: 0, totalVolume: 0, streakDays: 0 },
    });

    const { getByText } = render(<DayDetailScreen />);
    expect(getByText('1セット · 自重')).toBeTruthy();
  });

  it('PR があるセッションに "PR" テキストを表示する', () => {
    const { getByText } = render(<DayDetailScreen />);
    expect(getByText('PR')).toBeTruthy();
  });

  it('PR がないセッションには "PR" テキストを表示しない', () => {
    (useWorkout as jest.Mock).mockReturnValue({
      workouts: [mockWorkoutNoPR],
      deleteSessionFromWorkout: jest.fn(),
      personalRecords: [],
      weeklyStats: { workoutCount: 0, totalVolume: 0, streakDays: 0 },
    });

    const { queryByText } = render(<DayDetailScreen />);
    expect(queryByText('PR')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. サマリーサブタイトル
// ═══════════════════════════════════════════════════════════════════════════════

describe('サマリーサブタイトル', () => {
  it('種目数・セット数・ボリュームを含む', () => {
    const { getByTestId } = render(<DayDetailScreen />);
    const subtitle = getByTestId('header-subtitle').props.children;
    expect(subtitle).toContain('1種目');
    expect(subtitle).toContain('1セット');
    expect(subtitle).toContain('500');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. ナビゲーション
// ═══════════════════════════════════════════════════════════════════════════════

describe('ナビゲーション', () => {
  it('セッション行をタップすると SessionEdit へナビゲートする', () => {
    const { getByRole } = render(<DayDetailScreen />);
    // TouchableOpacity に accessibilityLabel="ベンチプレス を編集" が設定されている
    const btn = getByRole('button', { name: 'ベンチプレス を編集' });
    fireEvent.press(btn);
    expect(mockNavigate).toHaveBeenCalledWith('SessionEdit', {
      workoutId: 'w1',
      exerciseId: 'bench-press',
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. セッション削除
// ═══════════════════════════════════════════════════════════════════════════════

describe('セッション削除', () => {
  it('削除ボタンを押すと deleteSessionFromWorkout が呼ばれる', () => {
    const { getByTestId } = render(<DayDetailScreen />);
    fireEvent.press(getByTestId('swipe-delete-btn'));
    expect(mockDeleteSession).toHaveBeenCalledWith('w1', 'bench-press');
  });
});
