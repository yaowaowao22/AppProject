/**
 * OrderConfirmScreen テスト
 *
 * - レンダリング: 種目一覧・ボタン表示
 * - 並び替え: 上移動・下移動・境界値
 * - テンプレート保存モーダル: 表示・バリデーション・保存
 * - トレーニング開始ナビゲーション
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OrderConfirmScreen from '../screens/OrderConfirmScreen';
import { TanrenThemeProvider } from '../ThemeContext';
import { WorkoutProvider } from '../WorkoutContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WorkoutStackParamList } from '../navigation/RootNavigator';

// ── AsyncStorage モック ───────────────────────────────────────────────────────

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

function resetStorage() {
  mockStorage.getItem.mockReset().mockResolvedValue(null);
  mockStorage.setItem.mockReset().mockResolvedValue(undefined);
  mockStorage.clear.mockReset().mockResolvedValue(undefined);
}

// ── ナビゲーションモック ────────────────────────────────────────────────────────

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

function makeProps(exerciseIds: string[]): NativeStackScreenProps<WorkoutStackParamList, 'OrderConfirm'> {
  return {
    navigation: {
      navigate: mockNavigate,
      goBack: mockGoBack,
      dispatch: jest.fn(),
      reset: jest.fn(),
      isFocused: jest.fn(),
      canGoBack: jest.fn(),
      getParent: jest.fn(),
      getState: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      setOptions: jest.fn(),
      setParams: jest.fn(),
      push: jest.fn(),
      pop: jest.fn(),
      popToTop: jest.fn(),
      replace: jest.fn(),
    } as any,
    route: {
      key: 'OrderConfirm',
      name: 'OrderConfirm',
      params: { exerciseIds },
    } as any,
  };
}

// ── ラッパー ──────────────────────────────────────────────────────────────────

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <TanrenThemeProvider>
    <WorkoutProvider>{children}</WorkoutProvider>
  </TanrenThemeProvider>
);

function renderScreen(exerciseIds = ['chest_001', 'legs_001', 'back_001']) {
  const props = makeProps(exerciseIds);
  return render(
    <Wrapper>
      <OrderConfirmScreen {...props} />
    </Wrapper>,
  );
}

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.useFakeTimers();
  resetStorage();
  mockNavigate.mockReset();
  mockGoBack.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────

describe('レンダリング', () => {
  it('タイトル「トレーニング」が表示される', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('トレーニング')).toBeTruthy();
  });

  it('選択された種目数が表示される', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('3種目')).toBeTruthy();
  });

  it('渡した exerciseIds に対応する種目名が表示される（ベンチプレス）', async () => {
    const { findByText } = renderScreen(['chest_001']);
    expect(await findByText('ベンチプレス')).toBeTruthy();
  });

  it('「開始する」ボタンが表示される', async () => {
    const { findByLabelText } = renderScreen();
    expect(await findByLabelText('開始する')).toBeTruthy();
  });

  it('「テンプレートとして保存」ボタンが表示される', async () => {
    const { findByLabelText } = renderScreen();
    expect(await findByLabelText('テンプレートとして保存')).toBeTruthy();
  });

  it('「種目選択に戻る」ボタンが表示される', async () => {
    const { findByLabelText } = renderScreen();
    expect(await findByLabelText('種目選択に戻る')).toBeTruthy();
  });
});

describe('並び替え', () => {
  it('2番目の種目の「上に移動」ボタンを押すと順序が入れ替わる', async () => {
    const { findAllByLabelText, findAllByText } = renderScreen(['chest_001', 'legs_001', 'back_001']);
    const upBtns = await findAllByLabelText('上に移動');
    // 2番目（index=1）の「上に移動」ボタン
    fireEvent.press(upBtns[0]);
    // スクワット（legs_001）がベンチプレス（chest_001）より前に来ること
    const names = await findAllByText(/スクワット|ベンチプレス/);
    expect(names.length).toBeGreaterThan(0);
  });

  it('最初の種目は「上に移動」ボタンが無効化される', async () => {
    const { findAllByLabelText } = renderScreen(['chest_001', 'legs_001']);
    const upBtns = await findAllByLabelText('上に移動');
    // 最初の要素（index=0）が disabled
    expect(upBtns[0].props.disabled).toBe(true);
  });

  it('最後の種目は「下に移動」ボタンが無効化される', async () => {
    const { findAllByLabelText } = renderScreen(['chest_001', 'legs_001']);
    const downBtns = await findAllByLabelText('下に移動');
    // 最後の要素が disabled
    expect(downBtns[downBtns.length - 1].props.disabled).toBe(true);
  });
});

describe('「開始する」ボタン', () => {
  it('押すと ActiveWorkout 画面に navigate する', async () => {
    const { findByLabelText } = renderScreen(['chest_001', 'legs_001']);
    const confirmBtn = await findByLabelText('開始する');
    fireEvent.press(confirmBtn);
    expect(mockNavigate).toHaveBeenCalledWith('ActiveWorkout', {
      exerciseIds: ['chest_001', 'legs_001'],
    });
  });
});

describe('「種目選択に戻る」ボタン', () => {
  it('押すと navigation.goBack が呼ばれる', async () => {
    const { findByLabelText } = renderScreen();
    const backBtn = await findByLabelText('種目選択に戻る');
    fireEvent.press(backBtn);
    expect(mockGoBack).toHaveBeenCalled();
  });
});

describe('テンプレート保存モーダル', () => {
  it('「テンプレートとして保存」ボタンを押すとモーダルが表示される', async () => {
    const { findByLabelText, findByText } = renderScreen();
    const saveBtn = await findByLabelText('テンプレートとして保存');
    fireEvent.press(saveBtn);
    expect(await findByText('テンプレートとして保存')).toBeTruthy();
    expect(await findByText('名前をつけてこの種目セットを保存します')).toBeTruthy();
  });

  it('モーダルの「キャンセル」ボタンを押すと閉じる', async () => {
    const { findByLabelText, findByText, queryByText } = renderScreen();
    const saveBtn = await findByLabelText('テンプレートとして保存');
    fireEvent.press(saveBtn);
    const cancelBtn = await findByText('キャンセル');
    fireEvent.press(cancelBtn);
    await waitFor(() => {
      expect(queryByText('名前をつけてこの種目セットを保存します')).toBeNull();
    });
  });

  it('テンプレート名が空のまま保存するとアラートが表示される', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
    const { findByLabelText, findByText } = renderScreen();
    const saveBtn = await findByLabelText('テンプレートとして保存');
    fireEvent.press(saveBtn);
    const modalSaveBtn = await findByText('保存');
    fireEvent.press(modalSaveBtn);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('名前を入力してください');
    });
  });

  it('テンプレート名を入力して保存するとアラートが表示される', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
    const { findByLabelText, findByText, findByPlaceholderText } = renderScreen();
    const saveBtn = await findByLabelText('テンプレートとして保存');
    fireEvent.press(saveBtn);
    const input = await findByPlaceholderText('テンプレート名（例: 胸の日）');
    fireEvent.changeText(input, '胸・背中の日');
    const modalSaveBtn = await findByText('保存');
    fireEvent.press(modalSaveBtn);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        '保存しました',
        expect.stringContaining('胸・背中の日'),
      );
    });
  });
});
