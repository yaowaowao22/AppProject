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

// カード影 2層目（強調カード用）
export const CardShadowStrong = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.14,
  shadowRadius: 10,
  elevation: 5,
} as const;

// サイドバーレイアウト定数
export const SidebarLayout = {
  // ドロワー幅
  width: 280,
  // ドロワー下端のオフセット（タブバー高さ分）
  bottomOffset: 83,
  // アイテム行の高さ
  itemHeight: 48,
  // アイテム行の左右パディング
  itemPaddingH: 16,
  // アイテム行のアイコンとラベルの間隔
  itemIconGap: 14,
  // アイコンサイズ
  iconSize: 22,
  // バッジの最小幅
  badgeMinWidth: 22,
  // セクションヘッダー行の高さ
  sectionHeaderHeight: 32,
  // フッターエリアの高さ
  footerHeight: 56,
  // 開閉アニメーション時間 (ms)
  animationDuration: 280,
} as const;
