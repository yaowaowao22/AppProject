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
  // アイテム行の右パディング
  itemPaddingH: 16,
  // アイテム行の左パディング（非アクティブ時）
  itemPaddingLeft: 24,
  // アイコンとラベルの間隔
  itemGap: 12,
  // アイコンサイズ（sidebar.html: 20px）
  iconSize: 20,
  // バッジの最小幅
  badgeMinWidth: 22,
  // カウントの最小幅
  countMinWidth: 16,
  // セクションヘッダー行の高さ
  sectionHeaderHeight: 32,
  // セクションヘッダーの左右パディング
  sectionHeaderPaddingH: 24,
  // フッターエリアの高さ（sidebar.html: 48px）
  footerHeight: 48,
  // フッターの左右パディング
  footerPaddingH: 24,
  // ヘッダーの下パディング
  headerPaddingBottom: 12,
  // タグドットサイズ
  tagDotSize: 6,
  // タグドット枠線幅
  tagDotBorderWidth: 1.5,
  // 閉じるボタンのタッチ領域
  closeBtnSize: 36,
  // 閉じるボタンのアイコンサイズ
  closeBtnIconSize: 22,
  // 開くアニメーション時間 (ms)
  animationOpen: 280,
  // 閉じるアニメーション時間 (ms) — 非対称アニメーション
  animationClose: 240,
} as const;

// ナビゲーションバーレイアウト定数（iOS HIG: Large Title Nav Bar）
export const NavBarLayout = {
  // コンパクト状態の高さ
  height: 44,
  // Large Title フォントサイズ
  largeTitleFontSize: 34,
  // ハンバーガーボタンのタップ領域サイズ
  hamburgerSize: 36,
  // ステータスバー高さ（Dynamic Island 考慮）
  statusBarHeight: 54,
  // Large Title 展開時の合計高さ (statusBarHeight + height + largeTitleRow)
  totalHeight: 146,
} as const;

// フィルターバッジレイアウト定数
export const FilterBadgeLayout = {
  // バッジの高さ
  height: 28,
  // バッジの角丸
  borderRadius: 6,
  // 水平パディング
  paddingH: 8,
  // フォントサイズ
  fontSize: 12,
} as const;
