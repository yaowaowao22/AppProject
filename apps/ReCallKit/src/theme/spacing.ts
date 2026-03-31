// ============================================================
// ReCallKit スペーシングシステム
// 8pt グリッド準拠
// ============================================================

export const Spacing = {
  xs: 4,   // アイコンとラベルの間隔
  s: 8,    // 最小余白
  m: 16,   // 標準左右マージン・カード内パディング
  l: 24,   // カード間間隔・セクション内余白
  xl: 32,  // セクション間間隔
  xxl: 48, // 大セクション間
} as const;

export type SpacingKey = keyof typeof Spacing;

// ボーダー半径
export const Radius = {
  xs: 4,
  s: 8,
  m: 12, // カード
  l: 16,
  xl: 20,
  full: 9999, // タグチップ・ピル
} as const;

export type RadiusKey = keyof typeof Radius;

// タップターゲット最小サイズ（HIG: 44×44pt）
export const MinTapTarget = 44;

// カード影（ライトモード用）
export const CardShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 3,
  elevation: 2, // Android
} as const;
