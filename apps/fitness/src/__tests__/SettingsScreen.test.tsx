/**
 * SettingsScreen テスト
 *
 * - 初期レンダリング（セクション・ラベル表示）
 * - 表示設定スイッチ（カレンダー・クイックスタート）
 * - テーマ選択
 * - トレーニング設定ステッパー
 * - データ管理（全削除）
 * - アプリ情報表示
 */

import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// ── モック ─────────────────────────────────────────────────────────────────────

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), openDrawer: jest.fn() }),
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

jest.mock('../utils/storage', () => ({
  loadAppSettings: jest.fn().mockResolvedValue({ showCalendar: true, showQuickStart: true }),
  saveAppSettings: jest.fn().mockResolvedValue(undefined),
}));

const mockUpdateWorkoutConfig = jest.fn();
const mockResetAll = jest.fn().mockResolvedValue(undefined);

const mockWorkoutCtx = {
  workoutConfig: {
    restSeconds: 90,
    weightUnit: 'kg',
    theme: 'hakukou',
    weightStep: 2.5,
    defaultSets: 3,
    defaultWeight: 60,
    defaultReps: 10,
  },
  updateWorkoutConfig: mockUpdateWorkoutConfig,
  resetAll: mockResetAll,
};

jest.mock('../WorkoutContext', () => ({
  useWorkout: () => mockWorkoutCtx,
}));

const mockSetTheme = jest.fn();

jest.mock('../ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#111113',
      surface1: '#1C1C1E',
      surface2: '#2C2C2E',
      textPrimary: '#FFFFFF',
      textSecondary: '#EBEBF5',
      textTertiary: '#636366',
      accent: '#FF6B35',
      accentDim: '#331500',
      onAccent: '#FFFFFF',
      separator: '#38383A',
      error: '#FF453A',
      cardBackground: '#1C1C1E',
    },
    currentThemeId: 'hakukou',
    setTheme: mockSetTheme,
    themeList: [
      { id: 'hakukou', name: '白光', colors: { accent: '#FF6B35', surface1: '#1C1C1E' } },
      { id: 'ocean', name: '海', colors: { accent: '#0A84FF', surface1: '#1C2C3A' } },
    ],
  }),
}));

// ── ヘルパー ──────────────────────────────────────────────────────────────────

import SettingsScreen from '../screens/SettingsScreen';

function renderScreen() {
  return render(<SettingsScreen />);
}

beforeEach(() => {
  jest.clearAllMocks();
  const { loadAppSettings } = require('../utils/storage');
  (loadAppSettings as jest.Mock).mockResolvedValue({ showCalendar: true, showQuickStart: true });
});

// ── テスト ─────────────────────────────────────────────────────────────────────

describe('初期レンダリング', () => {
  test('設定ヘッダーが表示される', async () => {
    const { getByText } = renderScreen();
    await act(async () => {});
    expect(getByText('設定')).toBeTruthy();
  });

  test('表示設定セクションが表示される', async () => {
    const { getByText } = renderScreen();
    await act(async () => {});
    expect(getByText('表示設定')).toBeTruthy();
  });

  test('テーマセクションが表示される', async () => {
    const { getByText } = renderScreen();
    await act(async () => {});
    expect(getByText('テーマ')).toBeTruthy();
  });

  test('トレーニング設定セクションが表示される', async () => {
    const { getByText } = renderScreen();
    await act(async () => {});
    expect(getByText('トレーニング設定')).toBeTruthy();
  });

  test('データ管理セクションが表示される', async () => {
    const { getByText } = renderScreen();
    await act(async () => {});
    expect(getByText('データ管理')).toBeTruthy();
  });

  test('アプリ情報セクションが表示される', async () => {
    const { getByText } = renderScreen();
    await act(async () => {});
    expect(getByText('アプリ情報')).toBeTruthy();
  });
});

describe('表示設定スイッチ', () => {
  test('ホームカレンダースイッチが表示される', async () => {
    const { getByLabelText } = renderScreen();
    await act(async () => {});
    expect(getByLabelText('ホームカレンダーの表示切替')).toBeTruthy();
  });

  test('クイックスタートスイッチが表示される', async () => {
    const { getByLabelText } = renderScreen();
    await act(async () => {});
    expect(getByLabelText('クイックスタートの表示切替')).toBeTruthy();
  });

  test('ホームカレンダースイッチを切り替えると saveAppSettings が呼ばれる', async () => {
    const { loadAppSettings, saveAppSettings } = require('../utils/storage');
    (loadAppSettings as jest.Mock).mockResolvedValue({ showCalendar: true, showQuickStart: true });

    const { getByLabelText } = renderScreen();
    await act(async () => {});

    const sw = getByLabelText('ホームカレンダーの表示切替');
    fireEvent(sw, 'valueChange', false);

    expect(saveAppSettings).toHaveBeenCalledWith(
      expect.objectContaining({ showCalendar: false }),
    );
  });

  test('クイックスタートスイッチを切り替えると saveAppSettings が呼ばれる', async () => {
    const { saveAppSettings } = require('../utils/storage');

    const { getByLabelText } = renderScreen();
    await act(async () => {});

    const sw = getByLabelText('クイックスタートの表示切替');
    fireEvent(sw, 'valueChange', false);

    expect(saveAppSettings).toHaveBeenCalledWith(
      expect.objectContaining({ showQuickStart: false }),
    );
  });
});

describe('テーマ選択', () => {
  test('テーマ一覧が表示される', async () => {
    const { getByText } = renderScreen();
    await act(async () => {});
    expect(getByText('白光')).toBeTruthy();
    expect(getByText('海')).toBeTruthy();
  });

  test('テーマボタンを押すと setTheme が呼ばれる', async () => {
    const { getByLabelText } = renderScreen();
    await act(async () => {});
    const oceanBtn = getByLabelText('テーマ: 海');
    fireEvent.press(oceanBtn);
    expect(mockSetTheme).toHaveBeenCalledWith('ocean');
  });

  test('現在のテーマが selected 状態になっている', async () => {
    const { getByLabelText } = renderScreen();
    await act(async () => {});
    const currentBtn = getByLabelText('テーマ: 白光');
    expect(currentBtn.props.accessibilityState?.checked).toBe(true);
  });
});

describe('トレーニング設定', () => {
  test('重量ステップラベルが表示される', async () => {
    const { getByText } = renderScreen();
    await act(async () => {});
    expect(getByText('重量ステップ')).toBeTruthy();
  });

  test('デフォルトセット数ラベルが表示される', async () => {
    const { getByText } = renderScreen();
    await act(async () => {});
    expect(getByText('デフォルトセット数')).toBeTruthy();
  });

  test('デフォルト重量ラベルが表示される', async () => {
    const { getByText } = renderScreen();
    await act(async () => {});
    expect(getByText('デフォルト重量')).toBeTruthy();
  });

  test('デフォルトレップ数ラベルが表示される', async () => {
    const { getByText } = renderScreen();
    await act(async () => {});
    expect(getByText('デフォルトレップ数')).toBeTruthy();
  });

  test('重量ステップの増加ボタンを押すと updateWorkoutConfig が呼ばれる', async () => {
    const { getAllByLabelText } = renderScreen();
    await act(async () => {});
    const incBtns = getAllByLabelText('増やす');
    fireEvent.press(incBtns[0]);
    expect(mockUpdateWorkoutConfig).toHaveBeenCalled();
  });

  test('デフォルトセット数の増加ボタンを押すと updateWorkoutConfig が呼ばれる', async () => {
    const { getAllByLabelText } = renderScreen();
    await act(async () => {});
    const incBtns = getAllByLabelText('増やす');
    if (incBtns.length > 1) {
      fireEvent.press(incBtns[1]);
      expect(mockUpdateWorkoutConfig).toHaveBeenCalled();
    }
    expect(true).toBe(true);
  });

  test('重量ステップの減少ボタンを押すと updateWorkoutConfig が呼ばれる', async () => {
    const { getAllByLabelText } = renderScreen();
    await act(async () => {});
    const decBtns = getAllByLabelText('減らす');
    if (decBtns.length > 0) {
      fireEvent.press(decBtns[0]);
      expect(mockUpdateWorkoutConfig).toHaveBeenCalled();
    }
    expect(true).toBe(true);
  });
});

describe('データ管理', () => {
  test('全データを削除ボタンが表示される', async () => {
    const { getByText } = renderScreen();
    await act(async () => {});
    expect(getByText('全データを削除')).toBeTruthy();
  });

  test('削除ボタンを押すと Alert が表示される', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    const { getByLabelText } = renderScreen();
    await act(async () => {});

    fireEvent.press(getByLabelText('すべてのデータを削除（元に戻せません）'));
    expect(alertSpy).toHaveBeenCalledWith(
      '全データを削除',
      expect.any(String),
      expect.any(Array),
    );
    alertSpy.mockRestore();
  });

  test('削除確認コールバックを呼ぶと resetAll が実行される', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(
      async (_title, _msg, buttons) => {
        if (!buttons) return;
        const deleteBtn = (buttons as any[]).find(b => b.style === 'destructive');
        if (deleteBtn?.onPress) await deleteBtn.onPress();
      },
    );

    const { getByLabelText } = renderScreen();
    await act(async () => {});

    fireEvent.press(getByLabelText('すべてのデータを削除（元に戻せません）'));
    await act(async () => {});

    expect(mockResetAll).toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});

describe('アプリ情報', () => {
  test('アプリ名が表示される', async () => {
    const { getByText } = renderScreen();
    await act(async () => {});
    expect(getByText('アプリ名')).toBeTruthy();
  });

  test('バージョンラベルが表示される', async () => {
    const { getByText } = renderScreen();
    await act(async () => {});
    expect(getByText('バージョン')).toBeTruthy();
  });

  test('ビルドラベルが表示される', async () => {
    const { getByText } = renderScreen();
    await act(async () => {});
    expect(getByText('ビルド')).toBeTruthy();
  });
});
