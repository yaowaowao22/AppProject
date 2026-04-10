import { Platform } from 'react-native';

// ══════════════════════════════════════════════
// 無音の演算 — Design Tokens
// Sourced from whisper-calc-mock.html :root CSS variables
// ══════════════════════════════════════════════

export const colors = {
  black:   '#000',
  white:   '#fff',
  g0:      '#F5F5F5',   // surface
  g1:      '#E0E0E0',   // border / divider
  g2:      '#8E8E93',   // secondary label
  g3:      '#3A3A3C',   // dark element / func btn
  numBg:   '#1C1C1E',   // number btn
  amber:   '#FF9500',
  amberBg: 'rgba(255,149,0,0.10)',
} as const;

export type ColorToken = typeof colors;
export type ColorKey   = keyof ColorToken;

// SF Mono with Android fallback (monospace)
export const fontFamily = {
  mono: Platform.select({
    ios:     'SF Mono',
    android: 'monospace',
    default: 'monospace',
  }) as string,
  ui: Platform.select({
    ios:     'System',
    android: 'sans-serif',
    default: 'System',
  }) as string,
} as const;

export type FontFamilyToken = typeof fontFamily;

export const size = {
  btnSci:  50,   // science row height (px)
  btnNum:  62,   // number row height (px)
  btnUtil: 38,   // util bar height (px)
  gap:     1,    // grid gap (px)
} as const;

export type SizeToken = typeof size;
export type SizeKey   = keyof SizeToken;

// Bezier control points [x1, y1, x2, y2]
export const easing = {
  easeOut: [0.16, 1, 0.30, 1] as const,
  spring:  [0.34, 1.56, 0.64, 1] as const,
} as const;

export type EasingToken = typeof easing;
export type EasingKey   = keyof EasingToken;

// Result display font sizes (responsive to value length)
export const resultFontSize = {
  lg: 60,   // short values  (≤ 8 chars)
  md: 44,   // medium values (9–11 chars)
  sm: 30,   // long values   (12–14 chars)
} as const;

export type ResultFontSizeToken = typeof resultFontSize;
export type ResultFontSizeKey   = keyof ResultFontSizeToken;

// Convenience re-export of all tokens
const tokens = {
  colors,
  fontFamily,
  size,
  easing,
  resultFontSize,
} as const;

export default tokens;
