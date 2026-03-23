# UIバリアントB 詳細設計書
## ミニマル・クリーンリスト型（Bobby / Chronicle風）

> 作成日: 2026-03-23
> 対象ファイル: `src/screens/DashboardScreen.tsx`（493行）
> 参考: `docs/ui-research.md`, `docs/code-analysis.md`

---

## 1. コンセプト

**「必要な情報だけを、美しく」**

- ホワイト/ライトグレー基調の清潔な背景
- オレンジ/コーラル系の単色アクセントで視線を誘導
- カード枠線なし・シャドウのみのフラットカード
- 情報密度を下げることで「見やすさ」を最大化
- Bobby の「デザイン品質の高さ」と Chronicle の「一つのことに集中する潔さ」を融合

---

## 2. カラーパレット定義

### 2.1 ベースカラー

```typescript
// src/ui/variants/variantB/palette.ts

export const VARIANT_B_PALETTE = {
  // ── 背景 ──────────────────────────────────────────
  background:     '#FAFAFA',   // 真白より少し温かみのあるオフホワイト
  surface:        '#FFFFFF',   // カード背景（純白）
  surfaceRaised:  '#FFFFFF',   // 浮き上がりカード（シャドウで区別）
  surfaceSunken:  '#F4F4F6',   // 入力フィールド背景

  // ── テキスト ──────────────────────────────────────
  textPrimary:    '#1A1A1A',   // 本文（ほぼ黒）
  textSecondary:  '#555555',   // サブテキスト
  textMuted:      '#999999',   // プレースホルダー・注釈
  textOnAccent:   '#FFFFFF',   // アクセント色の上のテキスト

  // ── ボーダー・セパレーター ────────────────────────
  border:         '#E8E8E8',   // 薄いボーダー
  separator:      '#F2F2F2',   // リストセパレーター（さらに薄く）
  divider:        '#EBEBEB',   // セクション区切り

  // ── アクセント（オレンジ/コーラル系）────────────────
  accent:         '#FF6B35',   // メインアクセント（コーラルオレンジ）
  accentLight:    '#FFF0EB',   // アクセントの薄い背景
  accentDark:     '#E85A25',   // タップ時の濃いアクセント

  // ── セマンティックカラー ──────────────────────────
  success:        '#34C759',   // iOS標準グリーン
  successLight:   '#F0FFF4',
  warning:        '#FF9500',   // iOS標準オレンジ
  warningLight:   '#FFF8EC',
  error:          '#FF3B30',   // iOS標準レッド
  errorLight:     '#FFF2F0',
  info:           '#007AFF',   // iOS標準ブルー
  infoLight:      '#F0F6FF',
} as const;
```

### 2.2 シャドウ定義

```typescript
// カードのシャドウ（枠線の代わり）
export const CARD_SHADOW = {
  shadowColor:   '#000000',
  shadowOffset:  { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius:  4,
  elevation:     2,            // Android
};

// 強調シャドウ（サマリーバーなど）
export const ELEVATED_SHADOW = {
  shadowColor:   '#000000',
  shadowOffset:  { width: 0, height: 2 },
  shadowOpacity: 0.10,
  shadowRadius:  8,
  elevation:     4,
};
```

### 2.3 ダークモード対応カラー

```typescript
export const VARIANT_B_DARK_PALETTE = {
  background:     '#0E0E10',   // 深いほぼ黒
  surface:        '#1C1C1E',   // iOS標準ダークサーフェス
  surfaceRaised:  '#2C2C2E',   // 浮き上がり
  surfaceSunken:  '#141416',

  textPrimary:    '#F2F2F7',
  textSecondary:  '#ABABBB',
  textMuted:      '#636366',
  textOnAccent:   '#FFFFFF',

  border:         '#2C2C2E',
  separator:      '#1C1C1E',
  divider:        '#2C2C2E',

  accent:         '#FF7A47',   // ダークモードではやや明るめに
  accentLight:    '#2D1A12',
  accentDark:     '#FF6B35',

  success:        '#30D158',
  successLight:   '#0D2015',
  warning:        '#FF9F0A',
  warningLight:   '#2D1F00',
  error:          '#FF453A',
  errorLight:     '#2D0A08',
  info:           '#0A84FF',
  infoLight:      '#001833',
};
```

---

## 3. カテゴリ別色分けシステム

```typescript
// src/ui/variants/variantB/categoryColors.ts
// 現行の types.ts と互換（値を継承）

export const CATEGORY_COLORS: Record<string, string> = {
  'エンタメ': '#E91E63',   // ピンク系：娯楽・配信
  '仕事':     '#2196F3',   // ブルー系：業務・生産性ツール
  '生活':     '#FF9800',   // オレンジ系：日常サービス
  '学習':     '#9C27B0',   // パープル系：教育・スキルアップ
  'その他':   '#78909C',   // グレー系：未分類
};

// カテゴリ背景色（10%不透明度）
export const CATEGORY_LIGHT_COLORS: Record<string, string> = {
  'エンタメ': '#FCE4EC',
  '仕事':     '#E3F2FD',
  '生活':     '#FFF3E0',
  '学習':     '#F3E5F5',
  'その他':   '#ECEFF1',
};

// カテゴリアイコン（Ionicons）
export const CATEGORY_ICONS: Record<string, string> = {
  'エンタメ': 'film-outline',
  '仕事':     'briefcase-outline',
  '生活':     'home-outline',
  '学習':     'book-outline',
  'その他':   'ellipsis-horizontal-circle-outline',
};
```

---

## 4. ダッシュボードレイアウト設計

### 4.1 全体構成

```
┌─────────────────────────────────┐
│  StatusBar エリア                │
├─────────────────────────────────┤
│  [A] コンパクトサマリーバー         │  高さ: ~80px
│  月額合計 ¥X,XXX | 残り予算 ¥X,XXX │
├─────────────────────────────────┤
│  [B] カテゴリタグフィルター          │  高さ: ~44px（横スクロール）
│  [すべて][エンタメ][仕事][生活]…    │
├─────────────────────────────────┤
│  [C] サブスクリプション リスト       │  残りのスペース
│  ┌───────────────────────────┐  │
│  │ 🎵 Spotify      12/5  ¥980 │  │  高さ: 64px/行
│  │    エンタメ                 │  │
│  ├───────────────────────────┤  │
│  │ 📺 Netflix      12/8 ¥1490 │  │
│  │    エンタメ                 │  │
│  └───────────────────────────┘  │
│  ⋮                               │
├─────────────────────────────────┤
│  [D] FAB（＋ボタン）              │  右下固定
└─────────────────────────────────┘
```

### 4.2 [A] コンパクトサマリーバー

```typescript
// StyleSheet定義
summaryBar: {
  flexDirection:    'row',
  alignItems:       'center',
  paddingHorizontal: 20,
  paddingVertical:   16,
  backgroundColor:  PALETTE.surface,
  // シャドウ（下向きのみ）
  shadowColor:      '#000000',
  shadowOffset:     { width: 0, height: 1 },
  shadowOpacity:    0.06,
  shadowRadius:     4,
  elevation:        2,
},

summaryLeft: {
  flex: 1,
},

summaryDivider: {
  width:           1,
  height:          32,
  backgroundColor: PALETTE.separator,
  marginHorizontal: 16,
},

summaryRight: {
  flex: 1,
  alignItems: 'flex-end',
},

summaryLabel: {
  fontSize:   11,
  color:      PALETTE.textMuted,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  marginBottom: 2,
},

summaryValue: {
  fontSize:   22,
  fontWeight: '700',
  color:      PALETTE.textPrimary,
  letterSpacing: -0.5,
},

summaryAccentValue: {
  fontSize:   22,
  fontWeight: '700',
  color:      PALETTE.accent,   // オレンジ強調
  letterSpacing: -0.5,
},

// カレンダーボタン（右上）
calendarButton: {
  padding:      8,
  borderRadius: 20,
  backgroundColor: PALETTE.surfaceSunken,
},
```

**表示内容:**
- 左列: ラベル「今月の合計」+ 金額（例: `¥3,960`）
- 右列: ラベル「次の請求まで」+ 日数（例: `3日`）コーラルオレンジ強調
- 右端: カレンダーアイコンボタン（月間ビューに切替）

### 4.3 [B] カテゴリタグフィルター

```typescript
filterContainer: {
  paddingVertical:  10,
  backgroundColor:  PALETTE.background,
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: PALETTE.divider,
},

filterScroll: {
  // ScrollView: horizontal, showsHorizontalScrollIndicator: false
  paddingHorizontal: 16,
},

filterTag: {
  flexDirection:  'row',
  alignItems:     'center',
  paddingHorizontal: 12,
  paddingVertical:    6,
  borderRadius:   20,                    // 丸タグ
  marginRight:    8,
  backgroundColor: PALETTE.surfaceSunken,
  borderWidth:    1,
  borderColor:    PALETTE.border,
},

filterTagActive: {
  backgroundColor: PALETTE.accent,
  borderColor:    PALETTE.accent,
},

filterTagText: {
  fontSize:    13,
  fontWeight:  '500',
  color:       PALETTE.textSecondary,
},

filterTagTextActive: {
  color: PALETTE.textOnAccent,
  fontWeight: '600',
},

filterTagDot: {
  width:        6,
  height:       6,
  borderRadius: 3,
  marginRight:  5,
  // backgroundColor: CATEGORY_COLORS[category] でカテゴリ色
},
```

**タグ一覧:**
`[すべて（N件）]` `[エンタメ]` `[仕事]` `[生活]` `[学習]` `[その他]` `[⚠️ 未使用]`

### 4.4 [C] リストアイテム

```typescript
// ── サブスクリスト行 ──────────────────────────────────
listItem: {
  flexDirection:   'row',
  alignItems:      'center',
  paddingHorizontal: 20,
  paddingVertical:   14,
  backgroundColor:  PALETTE.surface,
  minHeight:        68,
},

// 左: アイコン円
iconWrapper: {
  width:         44,
  height:        44,
  borderRadius:  22,
  justifyContent: 'center',
  alignItems:    'center',
  marginRight:   12,
  // backgroundColor: item.color + '18'（11%不透明度）
},

// 中: テキスト情報
itemInfo: {
  flex: 1,
},

itemName: {
  fontSize:    15,
  fontWeight:  '600',
  color:       PALETTE.textPrimary,
  lineHeight:  20,
},

itemMeta: {
  flexDirection: 'row',
  alignItems:    'center',
  marginTop:     3,
  gap:           8,
},

itemDate: {
  fontSize:  12,
  color:     PALETTE.textMuted,
},

itemCategoryDot: {
  width:        4,
  height:       4,
  borderRadius: 2,
  // backgroundColor: CATEGORY_COLORS[item.category]
},

itemCategoryLabel: {
  fontSize: 12,
  // color: CATEGORY_COLORS[item.category]
},

// 右: 金額 + カウントダウン
itemRight: {
  alignItems:  'flex-end',
  gap:          4,
},

itemAmount: {
  fontSize:    15,
  fontWeight:  '700',
  color:       PALETTE.textPrimary,
},

// 次回請求カウントダウンバッジ
countdownBadge: {
  paddingHorizontal: 7,
  paddingVertical:   2,
  borderRadius:      10,
  // backgroundColor: 日数に応じて変化（下表参照）
},

// 日数 → バッジ背景色
// days === 0   → error     (#FF3B30 + 20% bg)
// days <= 3    → warning   (#FF9500 + 15% bg)
// days <= 7    → accentLight (#FFF0EB)
// days > 7     → 非表示

// セパレーター
listSeparator: {
  height:           StyleSheet.hairlineWidth,
  backgroundColor:  PALETTE.separator,
  marginLeft:       20 + 44 + 12,  // アイコン幅 + マージン分インデント
},

// セクションヘッダー（7日以内 / すべてのサブスク）
sectionHeader: {
  paddingHorizontal: 20,
  paddingTop:        16,
  paddingBottom:      8,
  backgroundColor:  PALETTE.background,
},

sectionTitle: {
  fontSize:    11,
  fontWeight:  '600',
  color:       PALETTE.textMuted,
  letterSpacing: 0.8,
  textTransform: 'uppercase',
},
```

### 4.5 展開詳細パネル（タップ時）

現行と同様にタップで展開するが、デザインを刷新:

```typescript
expandedPanel: {
  marginTop:        12,
  paddingTop:       12,
  borderTopWidth:   StyleSheet.hairlineWidth,
  borderTopColor:   PALETTE.separator,
},

expandedGrid: {
  flexDirection:  'row',
  flexWrap:       'wrap',
  gap:             8,
},

expandedCell: {
  flex:             1,
  minWidth:         '45%',
  backgroundColor:  PALETTE.surfaceSunken,
  borderRadius:     10,
  padding:          10,
},

expandedCellLabel: {
  fontSize:   10,
  color:      PALETTE.textMuted,
  marginBottom: 2,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
},

expandedCellValue: {
  fontSize:   14,
  fontWeight: '600',
  color:      PALETTE.textPrimary,
},
```

---

## 5. カレンダービュー設計（月間ビュー）

### 5.1 アクセス方法

サマリーバー右端の **カレンダーアイコンボタン** をタップ → Bottom Sheet として表示（`react-native-modal` または `Animated.View` で実装）

### 5.2 カレンダービューレイアウト

```
┌─────────────────────────────────┐
│  ◀  2025年 12月  ▶    [✕閉じる] │
├─────────────────────────────────┤
│  日  月  火  水  木  金  土      │
├─────────────────────────────────┤
│       1   2   3  [4]  5   6     │
│  7   8   9  10  11  12  13      │
│  ●  14  ●  16  17  18  19      │  ← ● = 請求日ドット
│ 20  21  22  23  24  25  26      │
│ 27  28  29  30  31              │
├─────────────────────────────────┤
│ [選択日の請求一覧]                │
│ ┌─────────────────────────────┐ │
│ │ 🎵 Spotify    ¥980         │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 5.3 カレンダーStyleSheet定義

```typescript
calendarContainer: {
  backgroundColor:  PALETTE.surface,
  borderTopLeftRadius:  20,
  borderTopRightRadius: 20,
  paddingBottom:    24,
  // Bottom Sheetの高さ: 画面の65%
},

calendarHeader: {
  flexDirection:    'row',
  alignItems:       'center',
  justifyContent:   'space-between',
  paddingHorizontal: 20,
  paddingVertical:   16,
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: PALETTE.divider,
},

calendarTitle: {
  fontSize:    17,
  fontWeight:  '600',
  color:       PALETTE.textPrimary,
},

calendarNavBtn: {
  padding:      8,
  borderRadius: 16,
  backgroundColor: PALETTE.surfaceSunken,
},

// 曜日ヘッダー行
weekdayRow: {
  flexDirection:    'row',
  paddingHorizontal: 16,
  paddingVertical:   8,
},

weekdayCell: {
  flex:        1,
  alignItems:  'center',
},

weekdayText: {
  fontSize:  11,
  color:     PALETTE.textMuted,
  fontWeight: '500',
},

// 日付グリッド
dayGrid: {
  paddingHorizontal: 16,
},

weekRow: {
  flexDirection: 'row',
},

dayCell: {
  flex:           1,
  aspectRatio:    1,                // 正方形セル
  alignItems:     'center',
  justifyContent: 'center',
},

dayNumber: {
  fontSize:   15,
  fontWeight: '400',
  color:      PALETTE.textPrimary,
},

dayNumberToday: {
  color:      PALETTE.accent,
  fontWeight: '700',
},

dayNumberSelected: {
  color: PALETTE.textOnAccent,
},

// 今日・選択日の背景円
dayCellHighlight: {
  position:     'absolute',
  width:         34,
  height:        34,
  borderRadius: 17,
},

dayCellTodayBg: {
  backgroundColor: PALETTE.accentLight,
},

dayCellSelectedBg: {
  backgroundColor: PALETTE.accent,
},

// 請求ドット（カテゴリ色）
billingDots: {
  flexDirection: 'row',
  gap:            2,
  marginTop:      2,
  height:         6,
},

billingDot: {
  width:        5,
  height:       5,
  borderRadius: 2.5,
  // backgroundColor: CATEGORY_COLORS[category]
},

// 選択日の請求一覧
selectedDayList: {
  marginTop:        12,
  paddingHorizontal: 16,
},

selectedDayListTitle: {
  fontSize:    11,
  color:       PALETTE.textMuted,
  fontWeight:  '600',
  letterSpacing: 0.8,
  textTransform: 'uppercase',
  marginBottom: 8,
},

selectedDayItem: {
  flexDirection:    'row',
  alignItems:       'center',
  paddingVertical:   10,
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: PALETTE.separator,
},

selectedDayDot: {
  width:        8,
  height:       8,
  borderRadius: 4,
  marginRight:  10,
  // backgroundColor: item.color
},

selectedDayName: {
  flex:      1,
  fontSize:  14,
  color:     PALETTE.textPrimary,
  fontWeight: '500',
},

selectedDayAmount: {
  fontSize:   14,
  fontWeight: '700',
  color:      PALETTE.textPrimary,
},
```

---

## 6. 空状態（サブスクなし）UI

### 6.1 デザイン方針

Bobby/Chronicle スタイルの「清潔でシンプルなイラスト的空状態」。
アイコンを大きく表示し、コンテキストに合わせたメッセージを添える。

```typescript
emptyContainer: {
  flex:           1,
  alignItems:     'center',
  justifyContent: 'center',
  paddingTop:      80,
  paddingHorizontal: 40,
},

// 大型アイコン背景円
emptyIconWrapper: {
  width:            96,
  height:           96,
  borderRadius:     48,
  backgroundColor:  PALETTE.accentLight,   // コーラルオレンジの薄背景
  justifyContent:   'center',
  alignItems:       'center',
  marginBottom:     24,
},

// アイコン: 'albums-outline' → Ionicons size=48, color=PALETTE.accent

emptyTitle: {
  fontSize:   20,
  fontWeight: '700',
  color:      PALETTE.textPrimary,
  textAlign:  'center',
  marginBottom: 8,
},

emptySubtitle: {
  fontSize:   14,
  color:      PALETTE.textMuted,
  textAlign:  'center',
  lineHeight: 20,
  marginBottom: 32,
},

// CTA ボタン
emptyButton: {
  flexDirection:    'row',
  alignItems:       'center',
  gap:               8,
  paddingHorizontal: 24,
  paddingVertical:   12,
  borderRadius:      24,
  backgroundColor:  PALETTE.accent,
  // シャドウ
  shadowColor:      PALETTE.accent,
  shadowOffset:     { width: 0, height: 4 },
  shadowOpacity:    0.3,
  shadowRadius:     8,
  elevation:        4,
},

emptyButtonText: {
  fontSize:   16,
  fontWeight: '600',
  color:      PALETTE.textOnAccent,
},
```

**表示テキスト:**
- タイトル: 「まだサブスクがありません」
- サブ: 「＋ボタンでNetflixやSpotifyなど\nお使いのサービスを追加しましょう」
- CTAボタン: `[＋ 最初のサブスクを追加]` → `onAddPress` 呼び出し

---

## 7. DashboardScreen.tsx 変更マッピング

### 7.1 全体方針

バリアントBは **`src/ui/variants/variantB/MinimalDashboard.tsx`** として新規ファイルに実装。
既存の `DashboardScreen.tsx` は変更せず、バリアント分岐のみ追加。

### 7.2 DashboardScreen.tsx への変更（最小限）

```typescript
// DashboardScreen.tsx: 追加する import（L14付近）
import { useUIVariant } from '../ui/UIVariantContext';
import { MinimalDashboard } from '../ui/variants/variantB/MinimalDashboard';

// DashboardScreen 関数本体の先頭に追加（L99付近）
export function DashboardScreen({ onAddPress }: DashboardScreenProps) {
  const { variant } = useUIVariant();       // ← 追加

  // バリアント分岐（L100-L103に追加）
  if (variant === 'minimal') {
    return <MinimalDashboard onAddPress={onAddPress} />;
  }

  // 以下は既存コードそのまま
  const { colors, spacing, radius } = useTheme();
  ...
```

### 7.3 既存コードの再利用・変更・削除マッピング

| 行範囲 | 内容 | バリアントBでの扱い |
|--------|------|-------------------|
| L1-22 | import文 | **再利用**: MinimalDashboard.tsx で同様のimportを行う |
| L24-25 | `BUTTON_W`, `SCREEN_W` 定数 | **再利用**: SwipeableRow の動作は維持 |
| L28-92 | `SwipeableRow` 関数 | **移動先**: `src/components/SwipeableRow.tsx`（共通化） |
| L94-97 | `DashboardScreenProps` | **再利用**: MinimalDashboard も同じ Props |
| L99-130 | 状態管理・useMemo | **再利用**: フックに切り出して両バリアントで共有 |
| L132-139 | `handleTap` | **再利用**: `useSubscriptionDashboard` フックに移動 |
| L141-233 | `renderSubscriptionItem` | **置き換え**: スタイルを大幅変更（アイコン+名前+日付+金額のシンプル行） |
| L235-270 | サマリーカード（primary色背景） | **置き換え**: コンパクトサマリーバーに変更 |
| L272-296 | 次回請求セクション（7日以内） | **移動**: カレンダービューの選択日表示に統合 |
| L299-330 | 未使用サービス警告バナー | **変換**: フィルタータグ `[⚠️ 未使用]` として再実装 |
| L332-335 | 「すべてのサブスク」ヘッダー | **置き換え**: カテゴリタグフィルターに変更 |
| L337-378 | FlatList + FAB | **置き換え**: SectionList + 新FABデザイン |
| L381-492 | StyleSheet | **置き換え**: バリアントB専用スタイルで全面刷新 |

### 7.4 新規追加が必要なファイル

```
src/
├── ui/
│   ├── UIVariantContext.tsx            ← code-analysis.md 6.2の設計通り
│   └── variants/
│       └── variantB/
│           ├── MinimalDashboard.tsx    ← メイン実装
│           ├── SummaryBar.tsx          ← [A]サマリーバー
│           ├── CategoryTagFilter.tsx   ← [B]タグフィルター
│           ├── SubscriptionListItem.tsx← [C]リスト行
│           ├── CalendarView.tsx        ← カレンダービュー
│           ├── EmptyState.tsx          ← 空状態UI
│           └── palette.ts              ← カラー定義
├── hooks/
│   └── useSubscriptionDashboard.ts    ← useMemo ロジック集約
└── components/
    └── SwipeableRow.tsx               ← DashboardScreen.tsx L28-92 を移動
```

---

## 8. MinimalDashboard.tsx 実装スケッチ

```typescript
// src/ui/variants/variantB/MinimalDashboard.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { View, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@massapp/ui';
import { useSubscriptions } from '../../../SubscriptionContext';
import { useSubscriptionDashboard } from '../../../hooks/useSubscriptionDashboard';
import { SummaryBar } from './SummaryBar';
import { CategoryTagFilter } from './CategoryTagFilter';
import { SubscriptionListItem } from './SubscriptionListItem';
import { CalendarView } from './CalendarView';
import { EmptyState } from './EmptyState';
import { SwipeableRow } from '../../../components/SwipeableRow';
import { VARIANT_B_PALETTE as P } from './palette';
import { CATEGORY_COLORS } from './categoryColors';
import type { Subscription } from '../../../types';

interface Props { onAddPress?: () => void; }

export function MinimalDashboard({ onAddPress }: Props) {
  const insets = useSafeAreaInsets();
  const { deleteSubscription, updateSubscription } = useSubscriptions();
  const { activeSubs, upcomingBillings, unusedSubs, totalMonthly } = useSubscriptionDashboard();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleTap = useCallback((sub: Subscription) => {
    updateSubscription(sub.id, { lastTappedAt: new Date().toISOString() });
    setExpandedId(prev => prev === sub.id ? null : sub.id);
  }, [updateSubscription]);

  // フィルター適用
  const filteredSubs = useMemo(() => {
    if (!selectedCategory) return activeSubs;
    if (selectedCategory === '⚠️未使用') return unusedSubs;
    return activeSubs.filter(s => s.category === selectedCategory);
  }, [activeSubs, unusedSubs, selectedCategory]);

  // SectionList 用データ構築
  const sections = useMemo(() => {
    const upcoming = filteredSubs.filter(s =>
      upcomingBillings.some(u => u.sub.id === s.id)
    );
    const rest = filteredSubs.filter(s =>
      !upcomingBillings.some(u => u.sub.id === s.id)
    );
    const result = [];
    if (upcoming.length > 0) {
      result.push({ title: '7日以内に請求', data: upcoming });
    }
    if (rest.length > 0) {
      result.push({ title: 'すべてのサブスク', data: rest });
    }
    return result;
  }, [filteredSubs, upcomingBillings]);

  if (activeSubs.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <SummaryBar totalMonthly={totalMonthly} nextDays={null} onCalendarPress={() => {}} />
        <EmptyState onAddPress={onAddPress} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: P.background }]}>
      {/* サマリーバー */}
      <SummaryBar
        totalMonthly={totalMonthly}
        nextDays={upcomingBillings[0]?.days ?? null}
        onCalendarPress={() => setShowCalendar(true)}
        style={{ paddingTop: insets.top + 8 }}
      />

      {/* カテゴリフィルター */}
      <CategoryTagFilter
        subscriptions={activeSubs}
        unusedCount={unusedSubs.length}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* リスト */}
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Caption style={styles.sectionTitle}>{title}</Caption>
          </View>
        )}
        ItemSeparatorComponent={() => (
          <View style={styles.listSeparator} />
        )}
        renderItem={({ item }) => (
          <SwipeableRow onDelete={() => deleteSubscription(item.id)}>
            <SubscriptionListItem
              subscription={item}
              isExpanded={expandedId === item.id}
              daysUntilBilling={
                upcomingBillings.find(u => u.sub.id === item.id)?.days
              }
              onPress={() => handleTap(item)}
            />
          </SwipeableRow>
        )}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={onAddPress}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* カレンダーモーダル */}
      {showCalendar && (
        <CalendarView
          subscriptions={activeSubs}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.background,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop:        16,
    paddingBottom:      8,
    backgroundColor:  P.background,
  },
  sectionTitle: {
    fontSize:    11,
    fontWeight:  '600',
    color:       P.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  listSeparator: {
    height:           StyleSheet.hairlineWidth,
    backgroundColor:  P.separator,
    marginLeft:       76,    // 20(padding) + 44(icon) + 12(gap)
  },
  fab: {
    position:      'absolute',
    right:          20,
    width:          54,
    height:         54,
    borderRadius:   27,
    backgroundColor: P.accent,
    justifyContent: 'center',
    alignItems:     'center',
    shadowColor:    P.accent,
    shadowOffset:   { width: 0, height: 4 },
    shadowOpacity:  0.35,
    shadowRadius:   8,
    elevation:       6,
  },
});
```

---

## 9. SettingsScreen.tsx への変更（UIスタイル切替UI追加）

`src/screens/SettingsScreen.tsx` の「表示設定カード」内にバリアント切替セグメントを追加:

```typescript
// SettingsScreen.tsx の表示設定カード内（既存の通貨セグメントの下）に追加
// 追加位置: L275 付近（既存の summaryDivider の後）

<Divider style={{ marginVertical: spacing.sm }} />
<Body color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
  UIスタイル
</Body>
<View style={styles.segmentRow}>
  {(['default', 'minimal'] as UIVariant[]).map((v) => (
    <TouchableOpacity
      key={v}
      onPress={() => setVariant(v)}
      style={[
        styles.segmentButton,
        {
          backgroundColor: variant === v ? colors.primary : colors.surface,
          borderColor:     variant === v ? colors.primary : colors.border,
          borderRadius:    radius.sm,
        },
      ]}
    >
      <Body
        style={{
          color:      variant === v ? colors.textOnPrimary : colors.textSecondary,
          fontWeight: variant === v ? '600' : '400',
        }}
      >
        {v === 'default' ? '標準' : 'ミニマル'}
      </Body>
    </TouchableOpacity>
  ))}
</View>
```

---

## 10. 実装優先順位

| 優先度 | タスク | 依存 |
|--------|--------|------|
| 1 | `SwipeableRow.tsx` を独立ファイルに移動 | なし |
| 2 | `useSubscriptionDashboard.ts` フック作成 | なし |
| 3 | `UIVariantContext.tsx` + `UIVariantProvider` 作成 | なし |
| 4 | `palette.ts` + `categoryColors.ts` 作成 | なし |
| 5 | `SummaryBar.tsx` 実装 | 4 |
| 6 | `CategoryTagFilter.tsx` 実装 | 4 |
| 7 | `SubscriptionListItem.tsx` 実装 | 1, 4 |
| 8 | `EmptyState.tsx` 実装 | 4 |
| 9 | `CalendarView.tsx` 実装 | 4 |
| 10 | `MinimalDashboard.tsx` 統合 | 2, 5, 6, 7, 8, 9 |
| 11 | `DashboardScreen.tsx` にバリアント分岐追加 | 3, 10 |
| 12 | `SettingsScreen.tsx` にUIスタイル切替追加 | 3, 11 |

---

## 11. 現行コードとの互換性チェックリスト

- [ ] `SubscriptionContext` の `subscriptions`, `totalMonthly`, `totalYearly`, `isPremium` はそのまま使用
- [ ] `subscriptionUtils.ts` の全関数はそのまま再利用
- [ ] `types.ts` の `Subscription`, `CATEGORY_COLORS` はそのまま参照
- [ ] `AddSubscriptionModal.tsx` は変更不要（バリアントに依存しない）
- [ ] `SettingsScreen.tsx` は切替UIを追加するのみ（既存機能に影響なし）
- [ ] バリアントB未導入時は現行UI（デフォルトバリアント）がそのまま動作
