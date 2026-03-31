/**
 * MonthlyReportScreen テスト
 *
 * 対象: src/screens/MonthlyReportScreen.tsx
 * - ヘルパー関数（fmtVol）のレンダリング検証
 * - 空月のメッセージ
 * - 月間サマリーカード（回数・ボリューム・セット数・平均時間）
 * - 月ナビゲーション（前月・次月）
 * - 部位別ボリュームセクション
 * - 種目別ランキングセクション
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MonthlyReportScreen from '../screens/MonthlyReportScreen';
import { useWorkout } from '../WorkoutContext';
import { useTheme } from '../ThemeContext';

// ── モック ─────────────────────────────────────────────────────────────────────

jest.mock('../WorkoutContext');
jest.mock('../ThemeContext');

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaView: ({ children }: any) => React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('../components/ScreenHeader', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ScreenHeader: ({ title }: any) =>
      React.createElement(Text, { testID: 'header-title' }, title),
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
    {
      id: 'squat',
      name: 'スクワット',
      bodyPart: 'legs',
      nameEn: 'Squat',
      icon: 'barbell',
      equipment: 'バーベル',
    },
  ],
  BODY_PARTS: [
    { id: 'chest', label: '胸' },
    { id: 'back', label: '背中' },
    { id: 'legs', label: '脚' },
    { id: 'shoulders', label: '肩' },
    { id: 'arms', label: '腕' },
    { id: 'core', label: '体幹' },
  ],
}));

// ── フィクスチャ ───────────────────────────────────────────────────────────────

const mockColors = {
  background: '#000000', surface1: '#111111', surface2: '#222222',
  textPrimary: '#ffffff', textSecondary: '#cccccc', textTertiary: '#888888',
  accent: '#ff6600', accentDim: '#331a00', onAccent: '#ffffff',
  separator: '#333333', error: '#ff0000', cardBackground: '#111111',
};

/** 2026-03 の workout（bench-press 3セット: 100×5, 100×5, 100×5 → vol=1500） */
const marchWorkout = {
  id: 'w1',
  date: '2026-03-15',
  totalVolume: 1500,
  duration: 3600,
  sessions: [
    {
      id: 's1',
      exerciseId: 'bench-press',
      startedAt: '2026-03-15T10:00:00.000Z',
      sets: [
        { id: 'set1', weight: 100, reps: 5, completedAt: '2026-03-15T10:01:00.000Z' },
        { id: 'set2', weight: 100, reps: 5, completedAt: '2026-03-15T10:02:00.000Z' },
        { id: 'set3', weight: 100, reps: 5, completedAt: '2026-03-15T10:03:00.000Z' },
      ],
    },
  ],
};

// ── セットアップ ──────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-03-31T10:00:00.000Z'));

  (useTheme as jest.Mock).mockReturnValue({ colors: mockColors });
  (useWorkout as jest.Mock).mockReturnValue({
    workouts: [],
    personalRecords: [],
    weeklyStats: { workoutCount: 0, totalVolume: 0, streakDays: 0 },
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════════
// 1. 空月
// ═══════════════════════════════════════════════════════════════════════════════

describe('空月（ワークアウトなし）', () => {
  it('"この月のトレーニング記録はありません"を表示する', () => {
    const { getByText } = render(<MonthlyReportScreen />);
    expect(getByText('この月のトレーニング記録はありません')).toBeTruthy();
  });

  it('月ラベルが現在月（2026年3月）を表示する', () => {
    const { getByText } = render(<MonthlyReportScreen />);
    expect(getByText('2026年3月')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. 月間サマリーカード
// ═══════════════════════════════════════════════════════════════════════════════

describe('月間サマリーカード', () => {
  beforeEach(() => {
    (useWorkout as jest.Mock).mockReturnValue({
      workouts: [marchWorkout],
      personalRecords: [],
      weeklyStats: { workoutCount: 0, totalVolume: 0, streakDays: 0 },
    });
  });

  it('トレーニング回数を表示する', () => {
    const { getAllByText } = render(<MonthlyReportScreen />);
    // workoutCount=1
    expect(getAllByText('1').length).toBeGreaterThan(0);
  });

  it('総ボリュームを fmtVol 形式で表示する（1500 → "1.5k"）', () => {
    const { getAllByText } = render(<MonthlyReportScreen />);
    // fmtVol(1500) = "1.5k" - 日別グラフにも同じ値が表示される場合があるため getAllByText
    expect(getAllByText('1.5k').length).toBeGreaterThan(0);
  });

  it('総セット数を表示する', () => {
    const { getAllByText } = render(<MonthlyReportScreen />);
    // totalSets=3
    expect(getAllByText('3').length).toBeGreaterThan(0);
  });

  it('平均時間を分単位で表示する（3600秒 = 60分）', () => {
    const { getByText } = render(<MonthlyReportScreen />);
    expect(getByText('60')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. fmtVol ヘルパー（レンダリング経由）
// ═══════════════════════════════════════════════════════════════════════════════

describe('fmtVol（ボリューム表示フォーマット）', () => {
  it('999 → "999"（切り捨て）', () => {
    (useWorkout as jest.Mock).mockReturnValue({
      workouts: [
        {
          ...marchWorkout,
          totalVolume: 999,
          sessions: [
            {
              ...marchWorkout.sessions[0],
              sets: [{ id: 's', weight: 100, reps: 9, completedAt: '' }],
            },
          ],
        },
      ],
      personalRecords: [],
      weeklyStats: { workoutCount: 0, totalVolume: 0, streakDays: 0 },
    });

    const { getByText } = render(<MonthlyReportScreen />);
    // 総ボリューム 999 → fmtVol(999) = "999"
    expect(getByText('999')).toBeTruthy();
  });

  it('1000 → "1.0k"', () => {
    (useWorkout as jest.Mock).mockReturnValue({
      workouts: [
        {
          ...marchWorkout,
          totalVolume: 1000,
          sessions: [
            {
              ...marchWorkout.sessions[0],
              sets: [{ id: 's', weight: 100, reps: 10, completedAt: '' }],
            },
          ],
        },
      ],
      personalRecords: [],
      weeklyStats: { workoutCount: 0, totalVolume: 0, streakDays: 0 },
    });

    const { getAllByText } = render(<MonthlyReportScreen />);
    expect(getAllByText('1.0k').length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. 月ナビゲーション
// ═══════════════════════════════════════════════════════════════════════════════

describe('月ナビゲーション', () => {
  it('"前の月"ボタンを押すと前月ラベルに変わる', () => {
    const { getByLabelText, getByText } = render(<MonthlyReportScreen />);
    fireEvent.press(getByLabelText('前の月'));
    // 2026-03 → 2026-02
    expect(getByText('2026年2月')).toBeTruthy();
  });

  it('"次の月"ボタンを押すと次月ラベルに変わる', () => {
    const { getByLabelText, getByText } = render(<MonthlyReportScreen />);
    fireEvent.press(getByLabelText('次の月'));
    // 2026-03 → 2026-04
    expect(getByText('2026年4月')).toBeTruthy();
  });

  it('前月・次月と連続ナビゲートすると元の月に戻る', () => {
    const { getByLabelText, getByText } = render(<MonthlyReportScreen />);
    fireEvent.press(getByLabelText('前の月'));
    fireEvent.press(getByLabelText('次の月'));
    expect(getByText('2026年3月')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. 部位別ボリュームセクション
// ═══════════════════════════════════════════════════════════════════════════════

describe('部位別ボリュームセクション', () => {
  it('ワークアウトあり時に BODY_PARTS の全ラベルを表示する', () => {
    (useWorkout as jest.Mock).mockReturnValue({
      workouts: [marchWorkout],
      personalRecords: [],
      weeklyStats: { workoutCount: 0, totalVolume: 0, streakDays: 0 },
    });

    const { getByText } = render(<MonthlyReportScreen />);
    expect(getByText('胸')).toBeTruthy();
    expect(getByText('背中')).toBeTruthy();
    expect(getByText('脚')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. 種目別ランキングセクション
// ═══════════════════════════════════════════════════════════════════════════════

describe('種目別ランキングセクション', () => {
  it('ランキングに種目名を表示する', () => {
    (useWorkout as jest.Mock).mockReturnValue({
      workouts: [marchWorkout],
      personalRecords: [],
      weeklyStats: { workoutCount: 0, totalVolume: 0, streakDays: 0 },
    });

    const { getByText } = render(<MonthlyReportScreen />);
    expect(getByText('ベンチプレス')).toBeTruthy();
  });

  it('セット数を表示する', () => {
    (useWorkout as jest.Mock).mockReturnValue({
      workouts: [marchWorkout],
      personalRecords: [],
      weeklyStats: { workoutCount: 0, totalVolume: 0, streakDays: 0 },
    });

    const { getByText } = render(<MonthlyReportScreen />);
    // 3セット
    expect(getByText('3セット')).toBeTruthy();
  });
});
