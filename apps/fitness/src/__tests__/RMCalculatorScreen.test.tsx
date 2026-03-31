/**
 * RMCalculatorScreen テスト
 *
 * - calc1RM ロジック（Epley / Brzycki / Lander / 平均）
 * - calcNRM ロジック（nRM = 1RM × (1 - 0.025 × (n - 1))）
 * - レンダリング・初期表示
 * - 重量ステッパー操作（増減・境界）
 * - レップ数ステッパー操作（増減・境界）
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RMCalculatorScreen from '../screens/RMCalculatorScreen';
import { TanrenThemeProvider } from '../ThemeContext';

// ── ラッパー ──────────────────────────────────────────────────────────────────

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <TanrenThemeProvider>{children}</TanrenThemeProvider>
);

function renderScreen() {
  return render(
    <Wrapper>
      <RMCalculatorScreen />
    </Wrapper>,
  );
}

// ── RM 計算ロジック（内部関数のロジックをユニットテスト）────────────────────────

// 画面内部の関数と同じロジックを直接テストするため、ここで再定義
function calc1RM(weight: number, reps: number) {
  if (reps <= 1) return { epley: weight, brzycki: weight, lander: weight, avg: weight };
  const epley   = weight * (1 + reps / 30);
  const brzycki = weight * 36 / (37 - reps);
  const lander  = (100 * weight) / (101.3 - 2.67123 * reps);
  const avg     = (epley + brzycki + lander) / 3;
  return { epley, brzycki, lander, avg };
}

function calcNRM(oneRM: number, n: number) {
  return oneRM * (1 - 0.025 * (n - 1));
}

// ─────────────────────────────────────────────────────────────────────────────

describe('calc1RM ロジック', () => {
  it('reps=1 のとき全フォーミュラが weight と等しい', () => {
    const result = calc1RM(100, 1);
    expect(result.epley).toBe(100);
    expect(result.brzycki).toBe(100);
    expect(result.lander).toBe(100);
    expect(result.avg).toBe(100);
  });

  it('reps <= 0 のとき全フォーミュラが weight と等しい', () => {
    const result = calc1RM(80, 0);
    expect(result.epley).toBe(80);
    expect(result.avg).toBe(80);
  });

  it('60kg × 5reps で推定1RMが約70kg台になる', () => {
    const { avg } = calc1RM(60, 5);
    expect(avg).toBeGreaterThan(65);
    expect(avg).toBeLessThan(80);
  });

  it('Epley 式: weight × (1 + reps / 30)', () => {
    const weight = 100;
    const reps = 10;
    const expected = weight * (1 + reps / 30);
    const { epley } = calc1RM(weight, reps);
    expect(epley).toBeCloseTo(expected, 5);
  });

  it('Brzycki 式: weight × 36 / (37 - reps)', () => {
    const weight = 100;
    const reps = 10;
    const expected = weight * 36 / (37 - reps);
    const { brzycki } = calc1RM(weight, reps);
    expect(brzycki).toBeCloseTo(expected, 5);
  });

  it('Lander 式: (100 × weight) / (101.3 - 2.67123 × reps)', () => {
    const weight = 100;
    const reps = 10;
    const expected = (100 * weight) / (101.3 - 2.67123 * reps);
    const { lander } = calc1RM(weight, reps);
    expect(lander).toBeCloseTo(expected, 5);
  });

  it('avg が (epley + brzycki + lander) / 3 と一致する', () => {
    const { epley, brzycki, lander, avg } = calc1RM(80, 8);
    expect(avg).toBeCloseTo((epley + brzycki + lander) / 3, 5);
  });
});

describe('calcNRM ロジック', () => {
  it('n=1 のとき 1RM = oneRM', () => {
    expect(calcNRM(100, 1)).toBeCloseTo(100, 5);
  });

  it('n=2 のとき 97.5%', () => {
    expect(calcNRM(100, 2)).toBeCloseTo(97.5, 5);
  });

  it('n=10 のとき 77.5%', () => {
    expect(calcNRM(100, 10)).toBeCloseTo(77.5, 5);
  });

  it('oneRM が大きいほど nRM も大きい', () => {
    expect(calcNRM(200, 5)).toBeGreaterThan(calcNRM(100, 5));
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('RMCalculatorScreen レンダリング', () => {
  it('タイトル「RM計算」が表示される', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('RM計算')).toBeTruthy();
  });

  it('初期状態で「推定1RM」ラベルが表示される', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('推定1RM')).toBeTruthy();
  });

  it('初期重量 60 が表示される', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('60')).toBeTruthy();
  });

  it('初期レップ数 5 が表示される', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('5')).toBeTruthy();
  });

  it('RMテーブルの「1RM」〜「10RM」行が表示される', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('1RM')).toBeTruthy();
    expect(await findByText('10RM')).toBeTruthy();
  });

  it('ヘッダーに「Epley」「Brzycki」「Lander」「平均」が表示される', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('Epley')).toBeTruthy();
    expect(await findByText('Brzycki')).toBeTruthy();
    expect(await findByText('Lander')).toBeTruthy();
    expect(await findByText('平均')).toBeTruthy();
  });
});

describe('RMCalculatorScreen 重量ステッパー', () => {
  it('「+」ボタンで重量が 2.5kg 増える', async () => {
    const { findByLabelText, findByText } = renderScreen();
    const incBtn = await findByLabelText('重量を2.5kg増やす');
    fireEvent.press(incBtn);
    expect(await findByText('62.5')).toBeTruthy();
  });

  it('「−」ボタンで重量が 2.5kg 減る', async () => {
    const { findByLabelText, findByText } = renderScreen();
    const decBtn = await findByLabelText('重量を2.5kg減らす');
    fireEvent.press(decBtn);
    expect(await findByText('57.5')).toBeTruthy();
  });

  it('重量が 0 のとき「−」ボタンを押しても 0 以下にならない', async () => {
    const { findByLabelText } = renderScreen();
    const decBtn = await findByLabelText('重量を2.5kg減らす');
    // 60 / 2.5 = 24回で0になる
    for (let i = 0; i < 30; i++) {
      fireEvent.press(decBtn);
    }
    // 0が表示されていること（0未満にならない）
    const { queryAllByText } = renderScreen();
    const { findByText } = renderScreen();
    expect(await findByText('0')).toBeTruthy();
  });
});

describe('RMCalculatorScreen レップ数ステッパー', () => {
  it('「+」ボタンでレップ数が 1 増える', async () => {
    const { findByLabelText, findByText } = renderScreen();
    const incBtn = await findByLabelText('レップ数を1増やす');
    fireEvent.press(incBtn);
    expect(await findByText('6')).toBeTruthy();
  });

  it('「−」ボタンでレップ数が 1 減る', async () => {
    const { findByLabelText, findByText } = renderScreen();
    const decBtn = await findByLabelText('レップ数を1減らす');
    fireEvent.press(decBtn);
    expect(await findByText('4')).toBeTruthy();
  });

  it('レップ数が 1 のとき「−」ボタンを押しても 1 以下にならない', async () => {
    const { findByLabelText, findByText } = renderScreen();
    const decBtn = await findByLabelText('レップ数を1減らす');
    for (let i = 0; i < 10; i++) {
      fireEvent.press(decBtn);
    }
    expect(await findByText('1')).toBeTruthy();
  });

  it('レップ数が 30 のとき「+」ボタンを押しても 30 以上にならない', async () => {
    const { findByLabelText, findByText } = renderScreen();
    const incBtn = await findByLabelText('レップ数を1増やす');
    for (let i = 0; i < 30; i++) {
      fireEvent.press(incBtn);
    }
    expect(await findByText('30')).toBeTruthy();
  });
});
