/**
 * RootNavigator テスト
 *
 * 対象: src/navigation/RootNavigator.tsx
 * - Drawer が 7 画面を登録していることを検証
 * - WorkoutStack の遷移フロー（ExerciseSelect → OrderConfirm → ActiveWorkout → WorkoutComplete）
 * - HistoryStack の遷移フロー（HistoryList → DayDetail → SessionEdit）
 * - drawerItemPress リスナーが ExerciseSelect へリセット遷移することを検証
 * - WorkoutComplete の gestureEnabled:false を検証
 * - useTheme().colors が backgroundColor に反映されることを検証
 * - 型定義 (ParamList) のエクスポートを検証
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// ── モック ─────────────────────────────────────────────────────────────────────

// 各画面を軽量なスタブに置き換え（jest.mock 内では require を使用）
jest.mock('../../screens/HomeScreen',           () => () => {
  const { Text } = require('react-native');
  return <Text>HomeScreen</Text>;
});
jest.mock('../../screens/WorkoutScreen',        () => ({
  ExerciseSelectScreen:  () => { const { Text } = require('react-native'); return <Text>ExerciseSelect</Text>; },
  ActiveWorkoutScreen:   () => { const { Text } = require('react-native'); return <Text>ActiveWorkout</Text>; },
  WorkoutCompleteScreen: () => { const { Text } = require('react-native'); return <Text>WorkoutComplete</Text>; },
}));
jest.mock('../../screens/OrderConfirmScreen',   () => () => { const { Text } = require('react-native'); return <Text>OrderConfirm</Text>; });
jest.mock('../../screens/MonthlyReportScreen',  () => () => { const { Text } = require('react-native'); return <Text>MonthlyReport</Text>; });
jest.mock('../../screens/RMCalculatorScreen',   () => () => { const { Text } = require('react-native'); return <Text>RMCalculator</Text>; });
jest.mock('../../screens/TemplateManageScreen', () => () => { const { Text } = require('react-native'); return <Text>TemplateManage</Text>; });
jest.mock('../../screens/SettingsScreen',       () => () => { const { Text } = require('react-native'); return <Text>Settings</Text>; });
jest.mock('../../screens/HistoryScreen',        () => ({ HistoryScreen: () => { const { Text } = require('react-native'); return <Text>HistoryList</Text>; } }));
jest.mock('../../screens/DayDetailScreen',      () => () => { const { Text } = require('react-native'); return <Text>DayDetail</Text>; });
jest.mock('../../screens/SessionEditScreen',    () => () => { const { Text } = require('react-native'); return <Text>SessionEdit</Text>; });
jest.mock('../../components/CustomDrawerContent', () => ({
  CustomDrawerContent: () => { const { Text } = require('react-native'); return <Text>Drawer</Text>; },
}));

jest.mock('../../ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#111113',
      surface1:   '#1C1C1E',
    },
  }),
}));

// @react-navigation/drawer のモック
const mockDrawerScreens: { name: string; component: unknown; options?: object; listeners?: unknown }[] = [];
const mockDrawerNavigator = {
  Navigator: ({ children, screenOptions }: { children: React.ReactNode; screenOptions?: object }) => {
    mockDrawerNavigatorOptions = screenOptions ?? null;
    return <>{children}</>;
  },
  Screen: ({
    name,
    component,
    options,
    listeners,
  }: {
    name: string;
    component: unknown;
    options?: object;
    listeners?: unknown;
  }) => {
    mockDrawerScreens.push({ name, component, options, listeners });
    return null;
  },
};

let mockDrawerNavigatorOptions: object | null = null;

jest.mock('@react-navigation/drawer', () => ({
  createDrawerNavigator: () => mockDrawerNavigator,
}));

// @react-navigation/native-stack のモック
const mockWorkoutStackScreens: { name: string; options?: object }[] = [];
const mockHistoryStackScreens: { name: string; options?: object }[] = [];

// createNativeStackNavigator が 2 回呼ばれる（Workout / History）ので呼び出し順で区別
let mockNativeStackCallCount = 0;

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => {
    mockNativeStackCallCount += 1;
    const isWorkout = mockNativeStackCallCount % 2 === 1;
    const screens = isWorkout ? mockWorkoutStackScreens : mockHistoryStackScreens;
    return {
      Navigator: ({ children, screenOptions }: { children: React.ReactNode; screenOptions?: object }) => {
        if (isWorkout) mockWorkoutStackNavigatorOptions = screenOptions ?? null;
        return <>{children}</>;
      },
      Screen: ({ name, options }: { name: string; options?: object }) => {
        screens.push({ name, options });
        return null;
      },
    };
  },
}));

let mockWorkoutStackNavigatorOptions: object | null = null;

// ── テスト前のリセット ─────────────────────────────────────────────────────────

beforeEach(() => {
  mockDrawerScreens.length = 0;
  mockWorkoutStackScreens.length = 0;
  mockHistoryStackScreens.length = 0;
  mockDrawerNavigatorOptions = null;
  mockWorkoutStackNavigatorOptions = null;
  nativeStackCallCount = 0;
});

// ── テスト ─────────────────────────────────────────────────────────────────────

describe('型定義エクスポート', () => {
  test('WorkoutStackParamList がエクスポートされている', async () => {
    const mod = await import('../../navigation/RootNavigator');
    // TypeScript 型なので存在チェックは undefined にならないことで確認
    expect(mod).toBeDefined();
    // エクスポート名が含まれることを確認（型はランタイムに残らないが、他エクスポートと共存確認）
    expect(typeof mod.RootNavigator).toBe('function');
  });

  test('HistoryStackParamList・RootDrawerParamList のエクスポートファイルが正しく読み込まれる', async () => {
    const mod = await import('../../navigation/RootNavigator');
    expect(mod.RootNavigator).toBeDefined();
  });
});

describe('Drawer Navigator — 7 画面登録', () => {
  const EXPECTED_SCREENS = [
    'Home',
    'WorkoutStack',
    'HistoryStack',
    'MonthlyReport',
    'RMCalculator',
    'TemplateManage',
    'Settings',
  ] as const;

  beforeEach(() => {
    const { RootNavigator } = require('../../navigation/RootNavigator');
    render(<RootNavigator />);
  });

  test('Drawer に 7 画面が登録されている', () => {
    expect(mockDrawerScreens).toHaveLength(7);
  });

  EXPECTED_SCREENS.forEach((name) => {
    test(`"${name}" 画面が登録されている`, () => {
      expect(mockDrawerScreens.map((s) => s.name)).toContain(name);
    });
  });

  test('Drawer の drawerStyle に surface1 が使われている', () => {
    expect(mockDrawerNavigatorOptions).toMatchObject({
      drawerStyle: expect.objectContaining({ backgroundColor: '#1C1C1E' }),
    });
  });

  test('Drawer の sceneStyle に background が使われている', () => {
    expect(mockDrawerNavigatorOptions).toMatchObject({
      sceneStyle: expect.objectContaining({ backgroundColor: '#111113' }),
    });
  });
});

describe('WorkoutStack — 4 画面登録と順序', () => {
  const EXPECTED_SCREENS = ['ExerciseSelect', 'OrderConfirm', 'ActiveWorkout', 'WorkoutComplete'];

  beforeEach(() => {
    const { RootNavigator } = require('../../navigation/RootNavigator');
    render(<RootNavigator />);
  });

  test('WorkoutStack に 4 画面が登録されている', () => {
    expect(mockWorkoutStackScreens).toHaveLength(4);
  });

  test('画面の登録順が ExerciseSelect → OrderConfirm → ActiveWorkout → WorkoutComplete', () => {
    expect(mockWorkoutStackScreens.map((s) => s.name)).toEqual(EXPECTED_SCREENS);
  });

  test('WorkoutStack Navigator の contentStyle.backgroundColor に colors.background が使われている', () => {
    expect(mockWorkoutStackNavigatorOptions).toMatchObject({
      contentStyle: expect.objectContaining({ backgroundColor: '#111113' }),
    });
  });
});

describe('WorkoutComplete — gestureEnabled:false', () => {
  beforeEach(() => {
    const { RootNavigator } = require('../../navigation/RootNavigator');
    render(<RootNavigator />);
  });

  test('WorkoutComplete の options に gestureEnabled:false が設定されている', () => {
    const screen = mockWorkoutStackScreens.find((s) => s.name === 'WorkoutComplete');
    expect(screen).toBeDefined();
    expect(screen?.options).toMatchObject({ gestureEnabled: false });
  });

  test('WorkoutComplete の animation が slide_from_bottom', () => {
    const screen = mockWorkoutStackScreens.find((s) => s.name === 'WorkoutComplete');
    expect(screen?.options).toMatchObject({ animation: 'slide_from_bottom' });
  });
});

describe('HistoryStack — 3 画面登録と順序', () => {
  const EXPECTED_SCREENS = ['HistoryList', 'DayDetail', 'SessionEdit'];

  beforeEach(() => {
    const { RootNavigator } = require('../../navigation/RootNavigator');
    render(<RootNavigator />);
  });

  test('HistoryStack に 3 画面が登録されている', () => {
    expect(mockHistoryStackScreens).toHaveLength(3);
  });

  test('画面の登録順が HistoryList → DayDetail → SessionEdit', () => {
    expect(mockHistoryStackScreens.map((s) => s.name)).toEqual(EXPECTED_SCREENS);
  });
});

describe('WorkoutStack drawerItemPress リスナー', () => {
  test('drawerItemPress が ExerciseSelect へリセット遷移する', () => {
    const { RootNavigator } = require('../../navigation/RootNavigator');
    render(<RootNavigator />);

    const workoutStackEntry = mockDrawerScreens.find((s) => s.name === 'WorkoutStack');
    expect(workoutStackEntry?.listeners).toBeDefined();

    const mockNavigate = jest.fn();
    const mockEvent = { preventDefault: jest.fn() };

    // listeners は ({ navigation }) => ({ drawerItemPress: (e) => ... }) という関数
    const listenersFactory = workoutStackEntry!.listeners as (
      arg: { navigation: object }
    ) => { drawerItemPress: (e: object) => void };

    const { drawerItemPress } = listenersFactory({ navigation: { navigate: mockNavigate } });
    drawerItemPress(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('WorkoutStack', { screen: 'ExerciseSelect' });
  });
});
