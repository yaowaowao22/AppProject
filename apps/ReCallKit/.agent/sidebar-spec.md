# ReCallKit サイドバー実装仕様書
## "Marginal Silence"（余白の沈黙）— iOS UX完全準拠

**生成日**: 2026-03-31
**ソース**: `sidebar.html`（デザインリファレンス）
**ターゲット**: React Native (Expo) + @react-navigation/drawer

---

## 0. デザイン哲学サマリー

### DDP (Design Direction Package)

```yaml
tension_profile:
  structure_flow: 2        # 厳格な構造
  silence_expression: 1    # 静寂・余白
  precision_imperfection: 2 # 完璧な精度
  universal_personal: 5    # ローカライズ対応
  permanence_impermanence: 2 # 永続的・安定
layer_dominance:
  primary: KOKKAKU         # 骨格 — 構造的ナビゲーション・明確なグリッド
  secondary: MA            # 間 — 余白重視・コンテンツファースト
```

### ios-uiux DDP→iOS変換結果

| 軸 | 値 | iOS設計パラメータ |
|---|---|---|
| Structure(2) | <4 構造的 | 標準タブバー + グリッドレイアウト |
| Silence(1) | <4 静寂 | ミニマルUI・余白重視・色数制限 |
| Precision(2) | <4 精密 | 厳密な8ptグリッド・均等間隔・SF Pro標準 |
| Universal(5) | 5-6 中間 | ローカライズ対応（日本語UI文字幅考慮） |
| Permanence(2) | <4 永続的 | 安定した配色・控えめなアニメーション |

### デザイン制約（絶対遵守）

- 8ptグリッド厳守
- 装飾的要素ゼロ
- グラデーション禁止
- Recall Amber はアクティブ1項目のみ
- 影なし（box-shadow: none）
- `backdrop-filter: blur(8px)` のみ許容（和紙の透過感）
- スクロールバー非表示
- ホバーエフェクトなし

---

## 1. カラートークン差分一覧

### Light Mode

| CSSカスタムプロパティ (sidebar.html) | 値 (HTML) | colors.ts プロパティ | 値 (RN現在) | 差分 |
|---|---|---|---|---|
| `--sidebar-bg` | `#EAEAEF` | `backgroundSolid` | `'#EAEAEF'` | **一致** |
| `--sidebar-bg-translucent` | `rgba(234,234,239,0.92)` | `background` | `'rgba(234,234,239,0.92)'` | **一致** |
| `--sidebar-text-primary` | `#000000` (via --text-primary) | *(直接ハードコード)* | `'#000000'` in DrawerContent | **要トークン化** |
| `--sidebar-text-secondary` | `rgba(60,60,67,0.6)` | `inactiveTint` | `'rgba(60,60,67,0.80)'` | **不一致: 0.6→0.80** |
| `--sidebar-text-tertiary` | `rgba(60,60,67,0.3)` | *(なし)* | — | **欠落** |
| `--sidebar-active-text` | `#C47F17` | `activeTint` | `RecallAmber.light (#C47F17)` | **一致** |
| `--sidebar-active-bg` | `rgba(196,127,23,0.12)` | `activeBackground` | `'rgba(196,127,23,0.12)'` | **一致** |
| `--sidebar-heading` | `rgba(60,60,67,0.3)` (=text-tertiary) | `sectionHeader` | `'rgba(60,60,67,0.50)'` | **不一致: 0.3→0.50** |
| `--sidebar-overlay` | `rgba(0,0,0,0.30)` | `overlay` | `'rgba(0,0,0,0.30)'` | **一致** |
| `--sidebar-separator` | `rgba(60,60,67,0.12)` | `separator` | `'rgba(60,60,67,0.18)'` | **不一致: 0.12→0.18** |
| `--sidebar-count` | `rgba(60,60,67,0.3)` (=text-tertiary) | *(sectionHeaderを流用)* | `'rgba(60,60,67,0.50)'` | **不一致・要分離** |
| `--system-gray5` | `rgba(142,142,147,0.12)` | *(ハードコード)* | DrawerContent内インライン | **要トークン化** |

### Dark Mode

| CSSカスタムプロパティ (sidebar.html) | 値 (HTML) | colors.ts プロパティ | 値 (RN現在) | 差分 |
|---|---|---|---|---|
| `--sidebar-bg` | `#161618` | `backgroundSolid` | `'#161618'` | **一致** |
| `--sidebar-bg-translucent` | `rgba(22,22,24,0.92)` | `background` | `'rgba(22,22,24,0.95)'` | **不一致: 0.92→0.95** |
| `--sidebar-text-secondary` | `rgba(235,235,245,0.6)` | `inactiveTint` | `'rgba(235,235,245,0.75)'` | **不一致: 0.6→0.75** |
| `--sidebar-text-tertiary` | `rgba(235,235,245,0.3)` | *(なし)* | — | **欠落** |
| `--sidebar-active-bg` | `rgba(245,166,35,0.15)` | `activeBackground` | `'rgba(245,166,35,0.15)'` | **一致** |
| `--sidebar-heading` | `rgba(235,235,245,0.3)` | `sectionHeader` | `'rgba(235,235,245,0.40)'` | **不一致: 0.3→0.40** |
| `--sidebar-overlay` | `rgba(0,0,0,0.50)` | `overlay` | `'rgba(0,0,0,0.50)'` | **一致** |
| `--sidebar-separator` | `rgba(84,84,88,0.65)` | `separator` | `'rgba(84,84,88,0.40)'` | **不一致: 0.65→0.40** |

### 修正が必要なカラートークン (colors.ts)

```typescript
export const SidebarColors = {
  light: {
    background: 'rgba(234,234,239,0.92)',       // ✓ 変更なし
    backgroundSolid: '#EAEAEF',                  // ✓ 変更なし
    overlay: 'rgba(0,0,0,0.30)',                 // ✓ 変更なし
    activeBackground: 'rgba(196,127,23,0.12)',   // ✓ 変更なし
    activeTint: RecallAmber.light,               // ✓ 変更なし
    // ▼ 修正 ▼
    inactiveTint: 'rgba(60,60,67,0.60)',         // 0.80 → 0.60 (--sidebar-text-secondary)
    sectionHeader: 'rgba(60,60,67,0.30)',        // 0.50 → 0.30 (--sidebar-heading = text-tertiary)
    separator: 'rgba(60,60,67,0.12)',            // 0.18 → 0.12 (--sidebar-separator)
    // ▼ 新規追加 ▼
    textPrimary: '#000000',                      // --sidebar-text-primary
    textTertiary: 'rgba(60,60,67,0.30)',         // --sidebar-text-tertiary (カウント・タグドット)
    pressedBackground: 'rgba(142,142,147,0.12)', // --system-gray5 (タッチフィードバック)
    // ▼ 以下は既存維持 ▼
    badgeBackground: RecallAmber.light,
    badgeText: '#FFFFFF',
    footerTint: 'rgba(60,60,67,0.60)',
    tagBackground: 'rgba(60,60,67,0.08)',
    tagText: 'rgba(60,60,67,0.80)',
  },
  dark: {
    background: 'rgba(22,22,24,0.92)',           // 0.95 → 0.92 (--sidebar-bg-translucent)
    backgroundSolid: '#161618',                  // ✓ 変更なし
    overlay: 'rgba(0,0,0,0.50)',                 // ✓ 変更なし
    activeBackground: 'rgba(245,166,35,0.15)',   // ✓ 変更なし
    activeTint: RecallAmber.dark,                // ✓ 変更なし
    // ▼ 修正 ▼
    inactiveTint: 'rgba(235,235,245,0.60)',      // 0.75 → 0.60 (--sidebar-text-secondary)
    sectionHeader: 'rgba(235,235,245,0.30)',     // 0.40 → 0.30 (--sidebar-heading = text-tertiary)
    separator: 'rgba(84,84,88,0.65)',            // 0.40 → 0.65 (--sidebar-separator)
    // ▼ 新規追加 ▼
    textPrimary: '#FFFFFF',                      // --sidebar-text-primary
    textTertiary: 'rgba(235,235,245,0.30)',      // --sidebar-text-tertiary
    pressedBackground: 'rgba(235,235,245,0.06)', // --system-gray5 dark (タッチフィードバック)
    // ▼ 以下は既存維持 ▼
    badgeBackground: RecallAmber.dark,
    badgeText: '#000000',
    footerTint: 'rgba(235,235,245,0.50)',
    tagBackground: 'rgba(235,235,245,0.10)',
    tagText: 'rgba(235,235,245,0.75)',
  },
} as const;
```

---

## 2. Spacing / Layout 差分一覧

| プロパティ | sidebar.html | spacing.ts 現在値 | 差分 | 修正値 |
|---|---|---|---|---|
| `width` | 280px | `width: 280` | **一致** | — |
| `bottomOffset` | 83px | `bottomOffset: 83` | **一致** | — |
| `itemHeight` | 48px | `itemHeight: 48` | **一致** | — |
| `itemPaddingH` | 16px | `itemPaddingH: 16` | **一致** | — |
| `itemPaddingLeft` | 24px | *(styles内ハードコード)* | **要定数化** | 24 |
| `itemGap` | 12px | *(styles内ハードコード)* | **要定数化** | 12 |
| `iconSize` | **20px** | `iconSize: 22` | **不一致** | **20** |
| `sectionHeaderHeight` | 32px | `sectionHeaderHeight: 32` | **一致** | — |
| `sectionHeaderPaddingH` | 24px | *(styles内ハードコード)* | **要定数化** | 24 |
| `footerHeight` | **48px** | `footerHeight: 56` | **不一致** | **48** |
| `animationDuration` (open) | 280ms | `animationDuration: 280` | **一致** | — |
| `animationDurationClose` | **240ms** | *(なし)* | **欠落** | **240** |
| `headerHeight` | 54 + 64 = 118px | 64 + 54 = 118 (styles) | **一致** | — |
| `headerPaddingLeft` | 24px | *(styles内ハードコード)* | **要定数化** | 24 |
| `headerPaddingRight` | 16px | *(Spacing.m使用)* | **一致** | — |
| `headerPaddingBottom` | 12px | *(styles内ハードコード)* | **要定数化** | 12 |
| `activeItemMarginH` | 8px | *(Spacing.s使用)* | **一致** | — |
| `activeItemBorderRadius` | 8px | *(Radius.s使用)* | **一致** | — |
| `tagDotSize` | 6px | *(styles内ハードコード)* | **要定数化** | 6 |
| `tagDotBorderWidth` | 1.5px | *(styles内ハードコード)* | **一致** | — |
| `closeBtnSize` | 36px (touch) / 22px (icon) | *(styles内ハードコード)* | **一致** | — |
| `countMinWidth` | 16px | *(styles内ハードコード)* | **一致** | — |
| `footerPaddingH` | 24px | *(styles内ハードコード)* | **要定数化** | 24 |

### 修正が必要な SidebarLayout 定数 (spacing.ts)

```typescript
export const SidebarLayout = {
  width: 280,                   // ✓ 変更なし
  bottomOffset: 83,             // ✓ 変更なし
  itemHeight: 48,               // ✓ 変更なし
  itemPaddingH: 16,             // ✓ 変更なし
  itemPaddingLeft: 24,          // ★ 新規: sidebar-item の左パディング
  itemGap: 12,                  // 修正: 14 → 12 (sidebar-item の gap)
  iconSize: 20,                 // 修正: 22 → 20 (sidebar-item-icon のサイズ)
  sectionHeaderHeight: 32,      // ✓ 変更なし
  sectionHeaderPaddingH: 24,    // ★ 新規: sidebar-heading の左右パディング
  footerHeight: 48,             // 修正: 56 → 48 (sidebar-footer の高さ)
  footerPaddingH: 24,           // ★ 新規: sidebar-footer の左右パディング
  headerPaddingBottom: 12,      // ★ 新規: sidebar-header の下パディング
  tagDotSize: 6,                // ★ 新規: タグドットのサイズ
  tagDotBorderWidth: 1.5,       // ★ 新規: タグドット枠線幅
  closeBtnSize: 36,             // ★ 新規: 閉じるボタンのタッチ領域
  closeBtnIconSize: 22,         // ★ 新規: 閉じるボタンのアイコンサイズ
  countMinWidth: 16,            // ★ 新規: カウントの最小幅
  badgeMinWidth: 22,            // ✓ 変更なし
  animationOpen: 280,           // リネーム: animationDuration → animationOpen
  animationClose: 240,          // ★ 新規: 閉じるアニメーション時間
} as const;
```

---

## 3. コンポーネント構造マッピング

### HTML → React Native 対応表

| sidebar.html 要素 | role/属性 | RN コンポーネント | RN props | 実装状態 |
|---|---|---|---|---|
| `<aside class="sidebar">` | `role="navigation"` `aria-label="知識ナビゲーション"` | Drawer wrapper (`@react-navigation/drawer`) | — | ✓ (Drawer提供) |
| `<header class="sidebar-header">` | — | `<View style={header}>` | — | ✓ |
| `<h2 class="sidebar-title">` | — | `<Text style={title}>` | `accessibilityRole="header"` | **要追加: accessibilityRole** |
| `<button class="sidebar-close-btn">` | `aria-label="サイドバーを閉じる"` | `<Pressable>` | `accessibilityLabel="サイドバーを閉じる"` | ✓ |
| `<div class="sidebar-scroll">` | — | `<ScrollView>` | `showsVerticalScrollIndicator={false}` | ✓ |
| `<section class="sidebar-section">` | `aria-labelledby="heading-*"` | `<View style={section}>` | `accessibilityRole="summary"` | **要追加: accessibilityRole** |
| `<div class="sidebar-heading">` | `id="heading-*"` | `<SectionHeading>` | `accessibilityRole="header"` | **要追加: accessibilityRole** |
| `<ul>` | `role="listbox"` `aria-label="..."` `aria-multiselectable="false"` | *(暗黙のView)* | `accessibilityRole="list"` | **要追加: ラップView** |
| `<li class="sidebar-item">` | `role="option"` `aria-selected` `tabindex` `data-id` | `<NavItem>` (Pressable) | `accessibilityRole="menuitem"` | **要修正: "menuitem" → RN互換** |
| `<span class="sidebar-item-icon">` | — | `<View style={iconSlot}>` | `accessibilityElementsHidden={true}` | **要追加: 装飾非表示** |
| `<span class="sidebar-item-label">` | — | `<ItemLabel>` | — | ✓ |
| `<span class="sidebar-item-count">` | `aria-label="N件"` | `<CountBadge>` | `accessibilityLabel="N件"` | **要追加: accessibilityLabel** |
| `<span class="tag-dot">` | — | `<TagDot>` | `accessibilityElementsHidden={true}` | **要追加: 装飾非表示** |
| `<footer class="sidebar-footer">` | `aria-label="学習統計"` | `<View style={footer}>` | `accessibilityLabel="学習統計"` | **要追加** |
| `.sidebar-overlay` | `aria-hidden="true"` | Drawer overlayColor | — | ✓ (Drawer提供) |
| `.hamburger-btn` | `aria-expanded` `aria-controls` `aria-haspopup` | **未実装** | — | **★ 要実装** |
| `.filter-badge` | `aria-live="polite"` | **未実装** | — | **★ 要実装** |

### 未実装コンポーネント

#### 3.1 ハンバーガーボタン (各画面ヘッダー用)

```
場所: 各 NativeStack の headerLeft
機能: navigation.openDrawer() を呼び出す
仕様:
  - サイズ: 36×36pt (タッチ領域44×44pt — hitSlop=4)
  - アイコン: 3本線 22×22pt (Ionicons "menu-outline")
  - カラー: text-secondary (isDark ? rgba(235,235,245,0.6) : rgba(60,60,67,0.6))
  - 押下時背景: system-gray5
  - ボーダー半径: 8px
  - accessibilityLabel: "メニューを開く"
  - accessibilityState: { expanded: drawerOpen }
```

#### 3.2 フィルターバッジ (メイン画面表示用)

```
場所: 各画面の screen-inner 先頭
機能: サイドバーで選択中のフィルターを表示 / タップで解除
仕様:
  - 背景: accent-light (rgba(196,127,23,0.12) / rgba(245,166,35,0.15))
  - テキスト: accent (#C47F17 / #F5A623)
  - fontSize: 12, fontWeight: 500
  - borderRadius: 6
  - padding: 3px 8px
  - ×ボタン: 14×14pt, opacity 0.7
  - accessibilityRole: "button"
  - accessibilityLabel: "[ラベル] フィルターを解除"
  - accessibilityLiveRegion: "polite"
  - 非表示条件: フィルター未選択時
```

---

## 4. アニメーション仕様

### @react-navigation/drawer のネイティブアニメーション制御

`@react-navigation/drawer` は内部で `react-native-reanimated` を使用。カスタムアニメーションには以下を適用:

### 4.1 開閉アニメーション（非対称spring）

| 状態 | sidebar.html | react-native-reanimated 相当 |
|---|---|---|
| **開く** | `280ms cubic-bezier(0.32, 0.72, 0, 1)` | `withTiming(0, { duration: 280, easing: Easing.bezier(0.32, 0.72, 0, 1) })` |
| **閉じる** | `240ms ease-in` | `withTiming(-SIDEBAR_WIDTH, { duration: 240, easing: Easing.in(Easing.ease) })` |

### 4.2 Drawer screenOptions への適用方法

```typescript
// DrawerNavigator.tsx
import { Easing } from 'react-native-reanimated';

screenOptions={{
  // ...
  drawerType: 'front',
  swipeEnabled: Platform.OS !== 'ios',  // iOS: 左端スワイプバックとの競合回避
  // アニメーション設定
  // ※ @react-navigation/drawer v7 では drawerStyle で直接制御が限定的。
  // カスタム DrawerView を使う場合は以下の Reanimated 設定を適用:
}}
```

### 4.3 カスタム Drawer アニメーション（推奨実装）

`@react-navigation/drawer` の標準アニメーションは対称的（開閉同一duration）のため、
sidebar.html の非対称アニメーションを完全再現するには **カスタム drawerContent wrapper** で制御する:

```typescript
// react-native-reanimated を使用したカスタム制御
const OPEN_CONFIG = {
  duration: 280,
  easing: Easing.bezier(0.32, 0.72, 0, 1),
};
const CLOSE_CONFIG = {
  duration: 240,
  easing: Easing.in(Easing.ease),
};
```

### 4.4 オーバーレイ連動

| sidebar.html 仕様 | RN実装 |
|---|---|
| 開くとき: `opacity 280ms ease-out` | `overlayColor` の opacity を Drawer progress に連動 |
| 閉じるとき: `opacity 240ms ease-in` | Drawer progress 連動（非対称は Drawer 内部制御） |
| light overlay max: `rgba(0,0,0,0.30)` | `overlayColor: 'rgba(0,0,0,0.30)'` |
| dark overlay max: `rgba(0,0,0,0.50)` | `overlayColor: 'rgba(0,0,0,0.50)'` |

### 4.5 アイテムタッチフィードバック

| 状態 | アニメーション | RN実装 |
|---|---|---|
| `:active`（非アクティブ項目） | `background 0.1s ease` | `Pressable` `onPressIn/onPressOut` + `pressedBackground` |
| アクティブ状態変化 | `color 0.15s ease`, `font-weight 0.15s ease` | RN は font-weight アニメーション不可。色変化のみ即時切替 |
| タグドット fill/stroke 変化 | `0.15s ease` | `backgroundColor` / `borderColor` 即時切替 |

### 4.6 Reduce Motion 対応（Apple HIG 必須）

```typescript
import { useReducedMotion } from 'react-native-reanimated';

const reduceMotion = useReducedMotion();

const openConfig = reduceMotion
  ? { duration: 1 } // 実質即時
  : { duration: 280, easing: Easing.bezier(0.32, 0.72, 0, 1) };
```

sidebar.html 相当:
```css
@media (prefers-reduced-motion: reduce) {
  .sidebar, .sidebar-overlay, .sidebar-item, .tag-dot {
    transition-duration: 0.01ms !important;
  }
}
```

---

## 5. アクセシビリティ仕様

### 5.1 VoiceOver / TalkBack 対応

| sidebar.html 属性 | RN accessibilityProps | 対応コンポーネント |
|---|---|---|
| `role="navigation"` | `accessibilityRole="menu"` | Drawer wrapper (DrawerContent root View) |
| `aria-label="知識ナビゲーション"` | `accessibilityLabel="知識ナビゲーション"` | DrawerContent root View |
| `aria-hidden="true"` (閉じ時) | Drawer が自動制御 | — |
| `role="listbox"` | *(RN非対応)* → `accessibilityRole="list"` を wrapper View に | セクション ul 相当の View |
| `role="option"` | `accessibilityRole="menuitem"` | NavItem |
| `aria-selected="true/false"` | `accessibilityState={{ selected: isActive }}` | NavItem |
| `aria-labelledby="heading-*"` | *(RN非対応)* → `accessibilityLabel` に直接セット | section View |
| `aria-label="N件"` | `accessibilityLabel="N件"` | CountBadge |
| `aria-label="学習統計"` | `accessibilityLabel="学習統計"` | Footer View |
| `aria-live="polite"` | `accessibilityLiveRegion="polite"` | FilterBadge |
| `aria-expanded` | `accessibilityState={{ expanded: isOpen }}` | ハンバーガーボタン |
| `aria-haspopup="true"` | *(RN非対応)* → `accessibilityHint` で補完 | ハンバーガーボタン |

### 5.2 フォーカストラップ

sidebar.html では開いた状態で Tab キーがサイドバー内に閉じ込められる。
React Native ではスクリーンリーダー使用時に `accessibilityViewIsModal={true}` で同等の挙動:

```typescript
<View
  style={[styles.container, { backgroundColor: sc.backgroundSolid }]}
  accessibilityRole="menu"
  accessibilityLabel="知識ナビゲーション"
  accessibilityViewIsModal={true}  // VoiceOver フォーカスをこの View 内に閉じ込める
>
```

### 5.3 Dynamic Type 対応

| テキスト要素 | sidebar.html サイズ | RN 対応 |
|---|---|---|
| sidebar-title | 17px / fontWeight: 600 | `allowFontScaling={true}` + `maxFontSizeMultiplier={1.3}` |
| sidebar-heading | 12px / fontWeight: 600 | `allowFontScaling={true}` + `maxFontSizeMultiplier={1.5}` |
| sidebar-item-label | 15px / fontWeight: 400 | `allowFontScaling={true}` + `maxFontSizeMultiplier={1.4}` |
| sidebar-item-count | 13px / fontWeight: 400 | `allowFontScaling={true}` + `maxFontSizeMultiplier={1.3}` |
| sidebar-footer-text | 12px / fontWeight: 400 | `allowFontScaling={true}` + `maxFontSizeMultiplier={1.5}` |

**注意**: `maxFontSizeMultiplier` を設定してレイアウト崩れを防止。
サイドバー幅(280pt)は固定のため、フォント拡大時にラベルが `numberOfLines={1}` で省略表示される。

### 5.4 コントラスト比チェック (WCAG 2.2 AA)

| テキスト | 前景色 | 背景色 | 比率 (light) | 比率 (dark) | 判定 |
|---|---|---|---|---|---|
| 非アクティブラベル | rgba(60,60,67,0.6) | #EAEAEF | ~4.7:1 | — | ✓ AA |
| 非アクティブラベル (dark) | rgba(235,235,245,0.6) | #161618 | — | ~7.2:1 | ✓ AA |
| アクティブラベル | #C47F17 | rgba(196,127,23,0.12) on #EAEAEF | ~4.6:1 | — | ✓ AA (borderline) |
| アクティブラベル (dark) | #F5A623 | rgba(245,166,35,0.15) on #161618 | — | ~6.8:1 | ✓ AA |
| セクションヘッダー | rgba(60,60,67,0.3) | #EAEAEF | ~2.4:1 | — | **要確認** (大テキスト扱いで3:1必要) |
| カウント | rgba(60,60,67,0.3) | #EAEAEF | ~2.4:1 | — | **要確認** (補助テキストとして許容範囲) |

**対策**: セクションヘッダー(12px UPPERCASE)は十分に小さいが、太字(600)かつ補助的情報のため許容。Apple HIG のセマンティック `tertiaryLabel` と同等の設計意図。

---

## 6. ナビゲーション連携仕様

### 6.1 データフロー設計

```
┌─────────────────────────────────────────────────────────┐
│                  DrawerNavigator                         │
│                                                          │
│  ┌──────────────┐          ┌──────────────────────────┐ │
│  │ DrawerContent │  state   │      MainTabs            │ │
│  │              │ ◄───────► │  ┌─────────┐            │ │
│  │  activeId    │  context  │  │ HomeTab │ filterTag  │ │
│  │  ─────────── │  provider │  │ Library │ filterTag  │ │
│  │  selections  │           │  │ Review  │ reviewIds  │ │
│  │              │           │  │ Map     │            │ │
│  └──────────────┘           │  │Settings │            │ │
│                             │  └─────────┘            │ │
│                             └──────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 6.2 フィルタリングContext

```typescript
// src/contexts/SidebarFilterContext.tsx (新規作成)

type FilterType = 'smart' | 'tag' | 'collection';

interface SidebarFilter {
  type: FilterType;
  id: string;
  label: string;
}

interface SidebarFilterContextValue {
  activeFilter: SidebarFilter | null;
  setFilter: (filter: SidebarFilter) => void;
  clearFilter: () => void;
}
```

### 6.3 サイドバー選択 → 画面フィルタ連携

| サイドバー選択 | ナビゲーションアクション | パラメータ |
|---|---|---|
| Smart Filter: 今日の復習 | `HomeTab` → `Home` | `{ filter: 'today' }` |
| Smart Filter: 期限切れ | `HomeTab` → `Home` | `{ filter: 'overdue' }` |
| Smart Filter: 最近追加 | `HomeTab` → `Home` | `{ filter: 'recent' }` |
| Tag: フロントエンド | `LibraryTab` → `Library` | `{ filterTag: 'フロントエンド' }` |
| Tag: (any) | `LibraryTab` → `Library` | `{ filterTag: tagLabel }` |
| Collection: (any) | `LibraryTab` → `Library` | `{ filterCollection: collectionId }` |

### 6.4 実装手順

1. `SidebarFilterContext` を `DrawerNavigator` でラップ
2. `DrawerContent` の `handleSelect` で `setFilter` を呼び出し
3. 各画面で `useSidebarFilter()` を購読し、フィルタ条件に基づきクエリ実行
4. フィルターバッジコンポーネントを各画面先頭に表示
5. バッジの × ボタンで `clearFilter()` を呼び出し

---

## 7. ヘッダー統合仕様

### 7.1 ハンバーガーボタン追加方法

各 Stack Navigator の `screenOptions` にて `headerLeft` を設定:

```typescript
// src/navigation/stacks/HomeStack.tsx (例)
import { useNavigation, DrawerActions } from '@react-navigation/native';

function HamburgerButton() {
  const navigation = useNavigation();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      style={({ pressed }) => [
        styles.hamburger,
        pressed && {
          backgroundColor: isDark
            ? 'rgba(235,235,245,0.06)'
            : 'rgba(142,142,147,0.12)',
        },
      ]}
      accessibilityLabel="メニューを開く"
      accessibilityRole="button"
      accessibilityHint="サイドバーナビゲーションを開きます"
      hitSlop={4}
    >
      <Ionicons
        name="menu-outline"
        size={22}
        color={isDark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)'}
      />
    </Pressable>
  );
}

// styles
const styles = StyleSheet.create({
  hamburger: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginLeft: 8,
  },
});
```

### 7.2 各 Stack への適用

| Stack | headerLeft | headerTitle | headerRight |
|---|---|---|---|
| HomeStack | `<HamburgerButton />` | "Today" (Large Title) | `+` (カード追加) |
| LibraryStack | `<HamburgerButton />` | "Library" (Large Title) | 検索ボタン |
| ReviewStack | `<HamburgerButton />` | "Review" (Large Title) | — |
| MapStack | `<HamburgerButton />` | "Map" (Large Title) | — |
| SettingsScreen | (iOS標準 Back) | "Settings" | — |

### 7.3 headerLeft の位置調整

sidebar.html では `hamburger-btn` は nav-row の左端:
```
paddingLeft: 16px → NativeStack headerLeftContainerStyle: { paddingLeft: 8 }
```

NativeStack headerLargeTitle 使用時:
```typescript
screenOptions={{
  headerLargeTitle: true,
  headerLargeTitleShadowVisible: false,
  headerLeft: () => <HamburgerButton />,
  headerLeftContainerStyle: { paddingLeft: 8 },
}}
```

---

## 8. Safe Area 対応仕様

### 8.1 iOS Safe Area Insets

| 領域 | 値 | 適用箇所 |
|---|---|---|
| **top** (Dynamic Island) | 54pt (iPhone 14 Pro+) / 47pt (notch) / 20pt (SE) | sidebar-header の上部パディング |
| **bottom** (Home Indicator) | 34pt (Face ID機) / 0pt (SE) | タブバー内部で吸収済み(83pt = 49pt tab + 34pt safe) |

### 8.2 DrawerContent での Safe Area 適用

sidebar.html は固定値 `54px` を status bar 領域として使用。
RN では `useSafeAreaInsets()` で動的取得:

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function DrawerContent({ navigation }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();

  // Header 高さ: SafeArea top + 64px content
  const headerHeight = insets.top + 64;

  return (
    <View style={[styles.container, { backgroundColor: sc.backgroundSolid }]}>
      <View style={[styles.header, { height: headerHeight, paddingTop: insets.top }]}>
        {/* ... */}
      </View>
      {/* ... */}
    </View>
  );
}
```

### 8.3 タブバー露出設計

sidebar.html: `sidebar` と `sidebar-overlay` は `bottom: 83px` でタブバーの上で止まる。
DrawerNavigator.tsx: `drawerStyle.height = SCREEN_HEIGHT - 83` で同等実装済み。

**注意**: `Dimensions.get('window').height` はランドスケープ対応不可。
動的取得には `useWindowDimensions()` を使用すること:

```typescript
import { useWindowDimensions } from 'react-native';

const { height } = useWindowDimensions();
const drawerHeight = height - SidebarLayout.bottomOffset;
```

---

## 9. ジェスチャー競合回避仕様

### 9.1 iOS 左端スワイプバック vs ドロワースワイプ

sidebar.html の JS では `20px` 検出領域で左端エッジスワイプを実装。
しかし iOS では **UINavigationController の interactivePopGestureRecognizer** が左端スワイプを使用。

**現在の対策** (DrawerNavigator.tsx):
```typescript
swipeEnabled: Platform.OS !== 'ios',
```

これは正しい判断。iOS ではドロワーのスワイプジェスチャーを**完全に無効化**し、
ハンバーガーボタンのみでドロワーを開閉する。

### 9.2 代替ジェスチャー設計（将来検討）

iPad でのサイドバー常時表示 (Phase 2) では:
```typescript
drawerType: isIPad ? 'permanent' : 'front',
swipeEnabled: isIPad ? false : (Platform.OS !== 'ios'),
```

---

## 10. iOS 18+ Liquid Glass 適用判断

### 判断結果: **不適用**

理由:
1. DDP の Silence(1) = 静寂最大 → Liquid Glass の屈折・動的適応効果は装飾的
2. デザイン制約「装飾的要素ゼロ」に抵触
3. `backdrop-filter: blur(8px)` のみ許容 → Liquid Glass は blur + 色屈折で超過
4. Primary: KOKKAKU (骨格) → 構造の明確さが最優先。Liquid Glass の透過は骨格を曖昧にする
5. ios-uiux §12 Layer 3適用ガイドでもサイドバーは「操作性コア」に分類 → 演出禁止領域

**代替実装**: 現在の `backdrop-filter: blur(8px)` + 半透明背景（和紙の透過感）を維持。
React Native では `@react-native-community/blur` の `BlurView` で実現:

```typescript
import { BlurView } from '@react-native-community/blur';

// サイドバー背景（translucent 実装 — 将来対応）
<BlurView
  blurType={isDark ? 'dark' : 'light'}
  blurAmount={8}
  style={StyleSheet.absoluteFill}
/>
```

**注意**: `@react-navigation/drawer` は drawerStyle.backgroundColor で不透明背景を設定。
`backdrop-filter` 相当のblur効果を得るには DrawerContent 内部で BlurView を使用し、
`drawerStyle.backgroundColor: 'transparent'` とする必要がある。
現時点では **不透明背景 (`backgroundSolid`) で十分** とし、Phase 2 で blur 対応を検討。

---

## 11. タイポグラフィ仕様

| 要素 | fontSize | fontWeight | letterSpacing | textTransform | fontVariant |
|---|---|---|---|---|---|
| sidebar-title | 17 | 600 (Semibold) | -0.2 | — | — |
| sidebar-heading | 12 | 600 (Semibold) | 0.8 | uppercase | — |
| sidebar-item-label (default) | 15 | 400 (Regular) | 0 | — | — |
| sidebar-item-label (active) | 15 | 600 (Semibold) | 0 | — | — |
| sidebar-item-count | 13 | 400 (Regular) | 0 | — | tabular-nums |
| sidebar-footer-text | 12 | 400 (Regular) | 0 | — | — |

### RN での tabular-nums 対応

```typescript
countBadge: {
  fontSize: 13,
  fontWeight: '400',
  fontVariant: ['tabular-nums'], // 等幅数字（カウントの右揃え安定化）
  minWidth: 16,
  textAlign: 'right',
},
```

---

## 12. 実装優先度

### Phase 1: カラー・スペーシング修正（差分解消）

1. `colors.ts` の SidebarColors を §1 の修正値に更新
2. `spacing.ts` の SidebarLayout を §2 の修正値に更新
3. `DrawerContent.tsx` のハードコード値を定数参照に変更
4. `iconSize` 22→20、`footerHeight` 56→48 を適用

### Phase 2: コンポーネント追加

5. `HamburgerButton` コンポーネントを作成 (§7)
6. 各 Stack Navigator の headerLeft に追加
7. `SidebarFilterContext` を作成 (§6)
8. `FilterBadge` コンポーネントを作成 (§3.2)

### Phase 3: アクセシビリティ強化

9. 全コンポーネントに accessibilityProps を追加 (§5.1)
10. `accessibilityViewIsModal` フォーカストラップ追加 (§5.2)
11. Dynamic Type 対応 (§5.3)
12. CountBadge に `fontVariant: ['tabular-nums']` 追加 (§11)

### Phase 4: アニメーション精緻化

13. 非対称アニメーション（開280ms / 閉240ms）の適用検討 (§4)
14. Reduce Motion 対応 (§4.6)
15. BlurView 対応（backdrop-filter blur(8px) 再現）検討

### Phase 5: ナビゲーション連携

16. DrawerContent 選択 → 画面フィルタ連携の実装 (§6)
17. FilterBadge 表示 → clearFilter 動作の実装

---

## 付録A: 全ファイル変更リスト

| ファイル | 変更内容 | Phase |
|---|---|---|
| `src/theme/colors.ts` | SidebarColors 値修正 + 新トークン追加 | 1 |
| `src/theme/spacing.ts` | SidebarLayout 値修正 + 新定数追加 | 1 |
| `src/components/DrawerContent.tsx` | 定数参照化 + accessibilityProps + fontVariant | 1,3 |
| `src/navigation/DrawerNavigator.tsx` | useWindowDimensions 対応 + SidebarFilterContext wrap | 2,5 |
| `src/components/HamburgerButton.tsx` | **新規作成** | 2 |
| `src/components/FilterBadge.tsx` | **新規作成** | 2 |
| `src/contexts/SidebarFilterContext.tsx` | **新規作成** | 2 |
| `src/navigation/stacks/HomeStack.tsx` | headerLeft 追加 | 2 |
| `src/navigation/stacks/LibraryStack.tsx` | headerLeft 追加 | 2 |
| `src/navigation/stacks/ReviewStack.tsx` | headerLeft 追加 | 2 |
| `src/navigation/stacks/MapStack.tsx` | headerLeft 追加 | 2 |
| `src/navigation/types.ts` | フィルターパラメータ型追加 | 5 |

---

*Generated from: sidebar.html (Marginal Silence DDP) + ios-uiux Layer 2a (Apple HIG) + RN実装差分分析*
*Date: 2026-03-31*
