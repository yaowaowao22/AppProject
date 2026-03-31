/**
 * ThemeContext — TanrenThemeProvider / useTheme フック テスト
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { TanrenThemeProvider, useTheme } from '../ThemeContext';
import { THEME_PRESETS } from '../theme';
import type { ThemeId } from '../theme';

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// ── ラッパー ──────────────────────────────────────────────────────────────────
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TanrenThemeProvider>{children}</TanrenThemeProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  mockAsyncStorage.getItem.mockResolvedValue(null);
  mockAsyncStorage.setItem.mockResolvedValue();
});

// ── デフォルト状態 ─────────────────────────────────────────────────────────────
describe('デフォルト状態', () => {
  test('currentThemeId が hakukou で初期化される', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    // useEffect の非同期完了を待つ
    await act(async () => {});
    expect(result.current.currentThemeId).toBe('hakukou');
  });

  test('colors が THEME_PRESETS.hakukou.colors と一致する（cardBackground 除く）', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    const { cardBackground: _, ...colorsWithout } = result.current.colors;
    const { cardBackground: __, ...presetWithout } = THEME_PRESETS.hakukou.colors;
    expect(colorsWithout).toMatchObject(presetWithout);
  });
});

// ── cardBackground 導出 ───────────────────────────────────────────────────────
describe('cardBackground 導出', () => {
  test('ライトテーマ(hakukou)は cardBackground が #FFFFFF', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.colors.cardBackground).toBe('#FFFFFF');
  });

  test('ダークテーマ(tanren)は cardBackground が surface1 と同じ', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    act(() => { result.current.setTheme('tanren'); });
    expect(result.current.colors.cardBackground).toBe(THEME_PRESETS.tanren.colors.surface1);
  });
});

// ── setTheme ──────────────────────────────────────────────────────────────────
describe('setTheme', () => {
  const targets: ThemeId[] = ['tanren', 'shirotae', 'bokuen', 'kaihaku'];

  test.each(targets)('setTheme("%s") で currentThemeId が変わる', async (id) => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    act(() => { result.current.setTheme(id); });
    expect(result.current.currentThemeId).toBe(id);
  });

  test('setTheme 後に AsyncStorage.setItem が正しいキーで呼ばれる', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    act(() => { result.current.setTheme('suiran'); });
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@tanren_theme_id', 'suiran');
  });

  test('setTheme で colors が新テーマに更新される', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    act(() => { result.current.setTheme('tamahagane'); });
    expect(result.current.colors.accent).toBe(THEME_PRESETS.tamahagane.colors.accent);
  });
});

// ── 永続化（起動時ロード） ───────────────────────────────────────────────────────
describe('永続化', () => {
  test('AsyncStorage に保存済みテーマがあれば起動時に復元される', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce('kuroshio');
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.currentThemeId).toBe('kuroshio');
  });

  test('保存値が不正な場合はデフォルト(hakukou)のまま', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce('invalid_id');
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.currentThemeId).toBe('hakukou');
  });

  test('AsyncStorage.getItem がエラーでもデフォルト(hakukou)のまま', async () => {
    mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('storage error'));
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.currentThemeId).toBe('hakukou');
  });
});

// ── themeList ──────────────────────────────────────────────────────────────────
describe('themeList', () => {
  test('themeList の件数が THEME_PRESETS のキー数と一致する', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.themeList).toHaveLength(Object.keys(THEME_PRESETS).length);
  });

  test('themeList の各エントリに id / name / colors が含まれる', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    for (const theme of result.current.themeList) {
      expect(theme).toHaveProperty('id');
      expect(theme).toHaveProperty('name');
      expect(theme).toHaveProperty('colors');
    }
  });
});
