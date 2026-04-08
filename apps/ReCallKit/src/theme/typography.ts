// ============================================================
// ReCallKit タイポグラフィシステム
// Inter (iOS: SF Pro) + Noto Sans JP フォールバック
// letter-spacing: -0.011em をデフォルトに適用
// ============================================================

import { TextStyle } from 'react-native';

// iOS タイプスケール（8pt グリッド準拠）
export const TypeScale = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.37,
    lineHeight: 41,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.31,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.24,
    lineHeight: 28,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.22,
    lineHeight: 25,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.19,
    lineHeight: 22,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    letterSpacing: -0.19,
    lineHeight: 22,
  },
  // 日本語テキスト用: 行間を広げる
  bodyJA: {
    fontSize: 17,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 28, // 1.6倍
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: -0.18,
    lineHeight: 21,
  },
  subheadline: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: -0.17,
    lineHeight: 20,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: -0.14,
    lineHeight: 18,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: -0.13,
    lineHeight: 16,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    letterSpacing: -0.12,
    lineHeight: 13,
  },
} satisfies Record<string, Omit<TextStyle, 'color' | 'fontFamily'>>;

export type TypeScaleKey = keyof typeof TypeScale;
