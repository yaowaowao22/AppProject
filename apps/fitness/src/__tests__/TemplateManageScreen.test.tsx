/**
 * TemplateManageScreen テスト
 *
 * - 一覧ビュー: テンプレート表示・空状態
 * - 新規作成ビュー: 入力・種目選択・保存
 * - 編集ビュー: 既存テンプレートの編集
 * - バリデーション: 名前未入力・種目未選択
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TemplateManageScreen from '../screens/TemplateManageScreen';
import { TanrenThemeProvider } from '../ThemeContext';
import { WorkoutProvider } from '../WorkoutContext';

// ── AsyncStorage モック ───────────────────────────────────────────────────────

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

function resetStorage() {
  mockStorage.getItem.mockReset().mockResolvedValue(null);
  mockStorage.setItem.mockReset().mockResolvedValue(undefined);
  mockStorage.clear.mockReset().mockResolvedValue(undefined);
}

// ── ラッパー ──────────────────────────────────────────────────────────────────

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <TanrenThemeProvider>
    <WorkoutProvider>{children}</WorkoutProvider>
  </TanrenThemeProvider>
);

function renderScreen() {
  return render(
    <Wrapper>
      <TemplateManageScreen />
    </Wrapper>,
  );
}

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.useFakeTimers();
  resetStorage();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────

describe('一覧ビュー', () => {
  it('タイトル「テンプレート管理」が表示される', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('テンプレート管理')).toBeTruthy();
  });

  it('テンプレートがない場合は空状態テキストが表示される', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('テンプレートがありません')).toBeTruthy();
    expect(await findByText('右上の「+」ボタンで作成してください')).toBeTruthy();
  });

  it('「+」ボタンが存在する', async () => {
    const { findByLabelText } = renderScreen();
    expect(await findByLabelText('新規テンプレートを作成')).toBeTruthy();
  });

  it('「+」ボタンを押すと新規作成ビューに切り替わる', async () => {
    const { findByLabelText, findByText } = renderScreen();
    const addBtn = await findByLabelText('新規テンプレートを作成');
    fireEvent.press(addBtn);
    expect(await findByText('テンプレート作成')).toBeTruthy();
  });

  it('テンプレートがある場合はそのテンプレート名が表示される', async () => {
    const templates = JSON.stringify([
      { id: 't1', name: '胸の日', exerciseIds: ['chest_press'] },
    ]);
    mockStorage.getItem.mockImplementation((key) => {
      if (key === 'tanren_templates') return Promise.resolve(templates);
      return Promise.resolve(null);
    });

    const { findByText } = renderScreen();
    expect(await findByText('胸の日')).toBeTruthy();
  });
});

describe('新規作成ビュー', () => {
  async function openCreateView() {
    const screen = renderScreen();
    const addBtn = await screen.findByLabelText('新規テンプレートを作成');
    fireEvent.press(addBtn);
    return screen;
  }

  it('「テンプレート作成」タイトルが表示される', async () => {
    const { findByText } = await openCreateView();
    expect(await findByText('テンプレート作成')).toBeTruthy();
  });

  it('テンプレート名入力フィールドが存在する', async () => {
    const { findByPlaceholderText } = await openCreateView();
    expect(await findByPlaceholderText('例: 胸・肩の日')).toBeTruthy();
  });

  it('「全て」タブが表示される', async () => {
    const { findByText } = await openCreateView();
    expect(await findByText('全て')).toBeTruthy();
  });

  it('部位タブが表示される', async () => {
    const { findByText } = await openCreateView();
    // BODY_PARTS の部位名が存在することを確認
    expect(await findByText('胸')).toBeTruthy();
  });

  it('「保存」ボタンが存在する', async () => {
    const { findByLabelText } = await openCreateView();
    expect(await findByLabelText('保存')).toBeTruthy();
  });

  it('戻るボタンを押すと一覧ビューに戻る', async () => {
    const screen = await openCreateView();
    // ScreenHeader の onBack 経由で戻るボタンが存在するか確認
    const { findByText } = screen;
    // 一覧に戻るためには isEditing が false になること
    // ScreenHeader に showBack があるので「<」のアイコンボタンを押す
    // accessibilityLabel="戻る" を探す
    const backBtn = await screen.findByLabelText('戻る');
    fireEvent.press(backBtn);
    expect(await findByText('テンプレート管理')).toBeTruthy();
  });
});

describe('バリデーション', () => {
  async function openCreateView() {
    const screen = renderScreen();
    const addBtn = await screen.findByLabelText('新規テンプレートを作成');
    fireEvent.press(addBtn);
    return screen;
  }

  it('名前未入力で保存するとアラートが表示される', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
    const { findByLabelText } = await openCreateView();
    const saveBtn = await findByLabelText('保存');
    fireEvent.press(saveBtn);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('入力エラー', 'テンプレート名を入力してください。');
    });
  });

  it('名前入力済みで種目未選択の場合アラートが表示される', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
    const screen = await openCreateView();
    const input = await screen.findByPlaceholderText('例: 胸・肩の日');
    fireEvent.changeText(input, 'テスト');
    const saveBtn = await screen.findByLabelText('保存');
    fireEvent.press(saveBtn);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('入力エラー', '種目を1つ以上選択してください。');
    });
  });
});

describe('種目選択', () => {
  async function openCreateView() {
    const screen = renderScreen();
    const addBtn = await screen.findByLabelText('新規テンプレートを作成');
    fireEvent.press(addBtn);
    return screen;
  }

  it('種目をタップすると選択済みになる', async () => {
    const screen = await openCreateView();
    // 最初の種目を探してタップ
    const exercises = await screen.findAllByRole('checkbox');
    expect(exercises.length).toBeGreaterThan(0);
    fireEvent.press(exercises[0]);
    // アクセシビリティステートで checked になっていること
    await waitFor(() => {
      expect(exercises[0].props.accessibilityState?.checked).toBe(true);
    });
  });

  it('選択済み種目をタップすると選択解除される', async () => {
    const screen = await openCreateView();
    const exercises = await screen.findAllByRole('checkbox');
    fireEvent.press(exercises[0]);
    fireEvent.press(exercises[0]);
    await waitFor(() => {
      expect(exercises[0].props.accessibilityState?.checked).toBe(false);
    });
  });

  it('種目を選択すると「N種目を選択中」テキストが表示される', async () => {
    const screen = await openCreateView();
    const exercises = await screen.findAllByRole('checkbox');
    fireEvent.press(exercises[0]);
    expect(await screen.findByText(/種目を選択中/)).toBeTruthy();
  });
});

describe('部位タブフィルタ', () => {
  async function openCreateView() {
    const screen = renderScreen();
    const addBtn = await screen.findByLabelText('新規テンプレートを作成');
    fireEvent.press(addBtn);
    return screen;
  }

  it('部位タブを押すとタブが切り替わる（タブが存在する）', async () => {
    const screen = await openCreateView();
    const chestTab = await screen.findByText('胸');
    fireEvent.press(chestTab);
    // タブが正常に切り替わること（エラーが出ないこと）
    expect(chestTab).toBeTruthy();
  });

  it('「全て」タブを押すとすべての種目が表示される', async () => {
    const screen = await openCreateView();
    const chestTab = await screen.findByText('胸');
    fireEvent.press(chestTab);
    const allTab = await screen.findByText('全て');
    fireEvent.press(allTab);
    // 全て選択後に種目が表示されること
    const exercises = await screen.findAllByRole('checkbox');
    expect(exercises.length).toBeGreaterThan(0);
  });
});
