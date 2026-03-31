/**
 * SectionLabel コンポーネント テスト
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { SectionLabel } from '../components/SectionLabel';
import { TanrenThemeProvider } from '../ThemeContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TanrenThemeProvider>{children}</TanrenThemeProvider>
);

describe('SectionLabel', () => {
  test('テキストが表示される', () => {
    const { getByText } = render(<SectionLabel>種目</SectionLabel>, { wrapper });
    expect(getByText('種目')).toBeTruthy();
  });

  test('空文字列でもクラッシュしない', () => {
    const { getByText } = render(<SectionLabel>{''}</SectionLabel>, { wrapper });
    expect(getByText('')).toBeTruthy();
  });

  test('英数字ラベルも表示される', () => {
    const { getByText } = render(<SectionLabel>SECTION A</SectionLabel>, { wrapper });
    expect(getByText('SECTION A')).toBeTruthy();
  });

  test('style prop を受け取ってもクラッシュしない', () => {
    const { getByText } = render(
      <SectionLabel style={{ marginTop: 24 }}>カスタムスタイル</SectionLabel>,
      { wrapper },
    );
    expect(getByText('カスタムスタイル')).toBeTruthy();
  });
});
