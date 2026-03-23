# UIバリアントA 詳細設計書
## プレミアム・グラスモーフィズム型

> 作成日: 2026-03-23
> コンセプト: Rocket Money / Copilot Money 風
> 参照コード: `src/screens/DashboardScreen.tsx`（493行）

---

## 1. コンセプト概要

ダーク系グラデーション背景の上に半透明ガラス（グラスモーフィズム）カードを重ねる高級感のあるUI。
Copilot Moneyのブルーパープル×ダークテーマと、Rocket Moneyのデータ可視化構造を組み合わせる。

### デザイン原則

- **常時ダークテーマ**: システムテーマ設定に関わらず、バリアントA は常にダーク背景
- **深度の演出**: `elevation` + `blur` 近似の重層構造でカードの奥行きを表現
- **アクセントグラデーション**: ブルー→パープルのグラデーションを重要UIに使用
- **数字を主役に**: 月次合計金額を画面中央上部に巨大フォントで配置

---

## 2. カラーパレット定義

### 2.1 背景系

| トークン名        | HEX値              | 用途                           |
|------------------|--------------------|-------------------------------|
| `bg.top`         | `#0D0F1E`          | グラデーション上端              |
| `bg.bottom`      | `#1A1033`          | グラデーション下端              |
| `bg.mid`         | `#110E26`          | 中間点（3色グラデーション使用時） |
| `surface.glass`  | `rgba(255,255,255,0.07)` | グラスカード背景          |
| `surface.raised` | `rgba(255,255,255,0.12)` | サマリーカード等・浮き上がり表現 |
| `surface.overlay`| `rgba(255,255,255,0.04)` | 凡例行・細部のサブ背景    |

### 2.2 ボーダー系

| トークン名          | HEX値                      | 用途                       |
|--------------------|----------------------------|---------------------------|
| `border.glass`     | `rgba(255,255,255,0.15)`   | グラスカードのボーダー       |
| `border.glassInner`| `rgba(255,255,255,0.08)`   | カード内セパレーター         |
| `border.accent`    | `rgba(107,127,255,0.40)`   | アクセント付きカードのボーダー |

### 2.3 アクセント系（ブルーパープル）

| トークン名        | HEX値       | 用途                              |
|------------------|-------------|----------------------------------|
| `accent.blue`    | `#6B7FFF`   | プライマリアクセント、FABグラデーション開始色 |
| `accent.purple`  | `#A855F7`   | セカンダリアクセント、FABグラデーション終了色 |
| `accent.blueSoft`| `#4C63E8`   | 押下状態・ダークアクセント            |
| `accent.glow`    | `rgba(107,127,255,0.25)` | サマリーカードのグロー効果 |

### 2.4 テキスト系

| トークン名         | HEX値                    | 用途                  |
|-------------------|--------------------------|----------------------|
| `text.primary`    | `#FFFFFF`                | メインテキスト          |
| `text.secondary`  | `rgba(255,255,255,0.75)` | サブテキスト            |
| `text.muted`      | `rgba(255,255,255,0.45)` | ラベル・補足テキスト     |
| `text.onAccent`   | `#FFFFFF`                | アクセント背景上のテキスト |

### 2.5 カテゴリ系（現行から継承・明度調整）

| カテゴリ  | 現行HEX    | バリアントA HEX | 用途                    |
|---------|-----------|---------------|------------------------|
| エンタメ  | `#E91E63` | `#FF4D8D`     | カードボーダー・ドーナツセグメント |
| 仕事     | `#2196F3` | `#5B9BFF`     | 同上                   |
| 生活     | `#FF9800` | `#FFB74D`     | 同上                   |
| 学習     | `#9C27B0` | `#CE7CFF`     | 同上                   |
| その他   | `#78909C` | `#A0AEC0`     | 同上                   |

### 2.6 ステータス系

| トークン名      | HEX値     | 用途               |
|---------------|-----------|-------------------|
| `status.error`  | `#FF5B6B` | 削除ボタン・エラー  |
| `status.warning`| `#FFAA4B` | 未使用バナー        |
| `status.success`| `#4BFFB5` | 成功バッジ          |
| `status.info`   | `#6B7FFF` | 情報バッジ          |

---

## 3. ダッシュボードレイアウト設計

### 3.1 全体構造

```
┌──────────────────────────────────┐  ← SafeArea + LinearGradient (bg.top → bg.bottom)
│  ダッシュボード      [プレミアム]  │  ← ヘッダー行
│                                  │
│  ┌────────────────────────────┐  │
│  │  今月の合計         [月次▼] │  │  ← HeroSummaryCard（surface.raised）
│  │                            │  │
│  │   ¥ 12,800                 │  │  ← 月次合計（fontSize:52, animated）
│  │                            │  │
│  │  8件   最大¥3,200  節約¥800 │  │  ← 3カラム統計
│  └────────────────────────────┘  │
│                                  │
│  カテゴリ内訳                      │  ← セクションタイトル
│  ┌────────────────────────────┐  │
│  │   ○     ■エンタメ  40%     │  │  ← CategoryRingChart + 凡例
│  │  ○ ○    ■仕事     30%     │  │
│  │   ○     ■生活     20%     │  │
│  │         ■その他   10%     │  │
│  └────────────────────────────┘  │
│                                  │
│  次回請求（7日以内）               │  ← upcomingBillings
│  ┌────────────────────────────┐  │
│  │  Netflix    ¥990    残1日  │  │  ← グラスカード
│  └────────────────────────────┘  │
│                                  │
│  すべてのサブスク (8件)             │  ← 一覧ヘッダー
│  ┌────────────────────────────┐  │
│  │ [N]  Netflix        ¥990/月│  │  ← サブスクグラスカード
│  │      2025/4/15 次回請求     │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ [S]  Spotify        ¥980/月│  │
│  └────────────────────────────┘  │
│                                  │
│                      [＋]        │  ← FAB（グラデーション）
└──────────────────────────────────┘
```

### 3.2 上部: HeroSummaryCard

- 月次/年次切り替えトグルをカード右上（サマリーカード内）に配置
- 月次合計数字は `fontSize: 52, fontWeight: '800'`
- 白色でサマリーカード内が完結する（アクセントカラー背景不使用→glass背景採用）
- カード自体はグラスモーフィズム（`surface.raised` + `border.accent`）
- 3カラム統計: `アクティブ件数 | 最大月額サブスク | 未使用コスト合計`

### 3.3 中部: CategoryRingChart（react-native-svg 不使用）

`react-native-svg` を使わない近似実装として以下を採用する。

#### アプローチ: 「重ね合わせ半円 + 中央くり抜き」

外径 `140px`、内径（穴）`80px` のドーナツを、カテゴリ数に応じた色付き弧で描画。

```
┌─────────────────────────────────────────────────────┐
│ [リング図]                  [凡例]                   │
│                             ■ エンタメ  40%  ¥X,XXX │
│    ╭──────╮                 ■ 仕事      30%  ¥X,XXX │
│   ╱  ╭──╮  ╲               ■ 生活      20%  ¥X,XXX │
│  │   │  │   │              ■ 学習       5%  ¥X,XXX │
│   ╲  ╰──╯  ╱               ■ その他    5%  ¥X,XXX │
│    ╰──────╯                                        │
└─────────────────────────────────────────────────────┘
```

実装に使用するテクニック（View/StyleSheet のみ）:

```tsx
// RingSegment: 一つのセグメントを表す回転ビュー
// 外側コンテナ: width:140, height:140, borderRadius:70, overflow:'hidden'
// 各色の半円 View を rotate() で積み重ね
// 中心くり抜き: 絶対配置の白/ダーク円 (width:80, height:80, borderRadius:40)
```

実装ガイドライン:
- カテゴリが0件（サブスクなし）の場合は全体グレーのリング1本
- カテゴリが1種のみの場合は単色リング
- 最大5セグメント（現行カテゴリ数と一致）

### 3.4 下部: サブスクリスト（グラスモーフィズムカード）

- 背景: `surface.glass` + `border.glass`
- 左端ボーダー: `item.color`（現行の `borderLeftColor` を踏襲）
- アイコン円: `item.color + '30'`（不透明度19%、現行の22=13%より少し濃く）
- テキストは `text.primary` / `text.secondary` / `text.muted`

---

## 4. StyleSheet 定義

### 4.1 バリアントA専用カラー定数

```tsx
// src/ui/variants/variantAColors.ts（新規作成）
export const VA_COLORS = {
  bgTop:           '#0D0F1E',
  bgBottom:        '#1A1033',
  surfaceGlass:    'rgba(255,255,255,0.07)',
  surfaceRaised:   'rgba(255,255,255,0.12)',
  surfaceOverlay:  'rgba(255,255,255,0.04)',
  borderGlass:     'rgba(255,255,255,0.15)',
  borderGlassInner:'rgba(255,255,255,0.08)',
  borderAccent:    'rgba(107,127,255,0.40)',
  accentBlue:      '#6B7FFF',
  accentPurple:    '#A855F7',
  accentBlueSoft:  '#4C63E8',
  accentGlow:      'rgba(107,127,255,0.25)',
  textPrimary:     '#FFFFFF',
  textSecondary:   'rgba(255,255,255,0.75)',
  textMuted:       'rgba(255,255,255,0.45)',
  statusError:     '#FF5B6B',
  statusWarning:   '#FFAA4B',
  statusSuccess:   '#4BFFB5',
  // カテゴリ（明度調整済み）
  catEntertainment:'#FF4D8D',
  catWork:         '#5B9BFF',
  catLife:         '#FFB74D',
  catLearning:     '#CE7CFF',
  catOther:        '#A0AEC0',
} as const;
```

### 4.2 グラスカードの共通スタイル

```tsx
// glassmorphism カードの基本スタイル
glassCard: {
  backgroundColor: 'rgba(255,255,255,0.07)',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.15)',
  // iOS shadow (glow 近似)
  shadowColor: 'rgba(107,127,255,0.25)',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 16,
  // Android
  elevation: 4,
},
```

### 4.3 HeroSummaryCard（月次合計カード）

```tsx
heroCard: {
  backgroundColor: 'rgba(255,255,255,0.12)',
  borderRadius: 24,
  borderWidth: 1,
  borderColor: 'rgba(107,127,255,0.40)',
  padding: 24,
  marginBottom: 16,
  shadowColor: 'rgba(107,127,255,0.25)',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 1,
  shadowRadius: 24,
  elevation: 6,
},
heroHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 4,
},
heroLabel: {
  fontSize: 13,
  color: 'rgba(255,255,255,0.45)',
  letterSpacing: 0.5,
},
heroAmount: {
  fontSize: 52,
  fontWeight: '800',
  color: '#FFFFFF',
  letterSpacing: -1,
  marginVertical: 8,
},
heroAmountSmall: {   // 年次表示時は fontSize: 40
  fontSize: 40,
  fontWeight: '800',
  color: '#FFFFFF',
  letterSpacing: -0.5,
  marginVertical: 8,
},
heroDivider: {
  height: 1,
  backgroundColor: 'rgba(255,255,255,0.08)',
  marginVertical: 16,
},
heroStatsRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
},
heroStatItem: {
  alignItems: 'center',
  flex: 1,
},
heroStatValue: {
  fontSize: 16,
  fontWeight: '700',
  color: '#FFFFFF',
},
heroStatLabel: {
  fontSize: 11,
  color: 'rgba(255,255,255,0.45)',
  marginTop: 2,
},
```

### 4.4 月次/年次切り替えトグル

サマリーカード内右上に配置。現行は存在しないため**新規追加**。

```tsx
// HeroSummaryCard 内の右上
periodToggle: {
  flexDirection: 'row',
  backgroundColor: 'rgba(255,255,255,0.10)',
  borderRadius: 8,
  padding: 2,
},
periodToggleBtn: {
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 6,
},
periodToggleBtnActive: {
  backgroundColor: 'rgba(107,127,255,0.60)',
},
periodToggleText: {
  fontSize: 12,
  fontWeight: '600',
  color: 'rgba(255,255,255,0.50)',
},
periodToggleTextActive: {
  color: '#FFFFFF',
},
```

### 4.5 CategoryRingChart コンポーネント

```tsx
chartSection: {
  marginBottom: 16,
},
chartCard: {
  // glassCard と同じ
  backgroundColor: 'rgba(255,255,255,0.07)',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.15)',
  padding: 16,
},
chartRow: {
  flexDirection: 'row',
  alignItems: 'center',
},
ringContainer: {
  width: 120,
  height: 120,
  position: 'relative',
  marginRight: 16,
},
ringOuter: {
  width: 120,
  height: 120,
  borderRadius: 60,
  overflow: 'hidden',
  position: 'relative',
},
ringHole: {
  position: 'absolute',
  top: 20,
  left: 20,
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: '#0D0F1E',  // bg.top と合わせる
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10,
},
ringHoleText: {
  fontSize: 10,
  color: 'rgba(255,255,255,0.45)',
  textAlign: 'center',
},
legendContainer: {
  flex: 1,
  gap: 8,
},
legendRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
legendDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
},
legendLabel: {
  fontSize: 12,
  color: 'rgba(255,255,255,0.75)',
  flex: 1,
},
legendPercent: {
  fontSize: 12,
  fontWeight: '600',
  color: '#FFFFFF',
  marginLeft: 'auto',
},
```

#### CategoryRingChart の近似実装ロジック

```tsx
// カテゴリ別合計を計算し、割合に応じたセグメントを重ねる
// 各セグメントは「回転した半円View」で近似

// セグメント生成: パーセンテージ→角度変換
// 0-50% → 1つの半円 (borderRadius 片側のみ)
// 50-100% → 2つの半円を組み合わせ

// 簡略実装: borderWidth + borderColor のカスタマイズで疑似的に表現
// 実装例:
// <View style={{
//   width: 120, height: 120, borderRadius: 60,
//   borderWidth: 12, borderColor: 'transparent',
//   borderTopColor: catColor1,    // 上25%
//   borderRightColor: catColor2,  // 右25%
//   borderBottomColor: catColor3, // 下25%
//   borderLeftColor: catColor4,   // 左25%
// }} />
// ※ この方法は4分割のみ。5カテゴリ対応にはrotateを組み合わせる
```

**実用的な実装方針**: ドーナツの近似は`border-color`トリックで4象限を表現し、5番目のカテゴリは1番小さい象限に統合。中心の穴は絶対配置の`View`でくり抜く。複雑な場合は`react-native-svg`の導入を将来検討。

### 4.6 SwipeableRow 新デザイン

```tsx
// 変更箇所: DashboardScreen.tsx:71-91
// 削除アクション背景: error色（現行と同じ）、ただし角丸を付与

deleteAction: {
  position: 'absolute',
  right: 0,
  top: 0,
  bottom: 0,
  width: BUTTON_W,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#FF5B6B',   // statusError (現行: colors.error)
  borderTopRightRadius: 16,     // 追加: カードと合わせた角丸
  borderBottomRightRadius: 16,  // 追加
},
// Animated.View の背景: 透明に変更（現行: colors.background → グラス背景が透けるため）
animatedView: {
  backgroundColor: 'transparent',  // 現行: colors.background から変更
},
```

### 4.7 サブスクグラスカード（renderSubscriptionItem）

```tsx
// 現行: styles.subCard (padding:12, borderLeftWidth:3, borderLeftColor:item.color)
// 変更後:
subCard: {
  padding: 14,
  backgroundColor: 'rgba(255,255,255,0.07)',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.15)',
  borderLeftWidth: 3,
  // borderLeftColor は item.color で上書き（現行踏襲）
},
iconCircle: {
  width: 44,                     // 現行:40 → 少し大きく
  height: 44,
  borderRadius: 22,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
  // backgroundColor: item.color + '30' (現行: '22'=13% → '30'=19%)
},
subName: {
  fontSize: 15,
  fontWeight: '600',
  color: '#FFFFFF',              // 現行: themes テキスト → 固定白
},
daysUntilBadge: {
  // 現行 Badge の代替: グラスモーフィズムバッジ
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 10,
  backgroundColor: 'rgba(107,127,255,0.25)',
  borderWidth: 1,
  borderColor: 'rgba(107,127,255,0.50)',
},
expandedDetail: {
  borderTopWidth: 1,
  borderTopColor: 'rgba(255,255,255,0.08)',
  marginTop: 12,
  paddingTop: 12,
},
```

### 4.8 次回請求カード（upcomingCard）

```tsx
// 現行: styles.upcomingCard (padding:12)
// 変更後: グラス + アクセントボーダー
upcomingCard: {
  padding: 12,
  backgroundColor: 'rgba(107,127,255,0.10)',   // 青みがかったガラス
  borderRadius: 12,
  borderWidth: 1,
  borderColor: 'rgba(107,127,255,0.30)',
  marginBottom: 8,
},
```

### 4.9 未使用サービスバナー

```tsx
// 現行: borderLeftColor: '#FF9800' → status.warning に変更
unusedCard: {
  padding: 12,
  backgroundColor: 'rgba(255,170,75,0.10)',    // warning 薄いガラス
  borderRadius: 12,
  borderWidth: 1,
  borderLeftWidth: 3,
  borderColor: 'rgba(255,170,75,0.25)',
  borderLeftColor: '#FFAA4B',                  // status.warning
  marginBottom: 8,
},
```

### 4.10 FAB（グラデーション付き）

```tsx
// 現行: backgroundColor: colors.primary (単色)
// 変更後: グラデーション（expo-linear-gradient 使用）
// <LinearGradient colors={['#6B7FFF', '#A855F7']} style={styles.fab}>

fab: {
  position: 'absolute',
  right: 20,
  width: 60,                     // 現行:56 → 少し大きく
  height: 60,
  borderRadius: 30,
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: 'rgba(107,127,255,0.60)',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 1,
  shadowRadius: 16,
  elevation: 10,
  overflow: 'hidden',            // LinearGradient のクリップ用
},
```

### 4.11 ヘッダー行

```tsx
header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  paddingTop: insets.top + 12,
  marginBottom: 16,
},
headerTitle: {
  fontSize: 28,                  // 現行: H1 (fontSize:24) → 大きく
  fontWeight: '700',
  color: '#FFFFFF',
  letterSpacing: -0.5,
},
headerSubtitle: {
  fontSize: 13,
  color: 'rgba(255,255,255,0.45)',
  marginTop: 2,
},
```

---

## 5. DashboardScreen.tsx 変更マッピング

### 5.1 インポート変更

**該当箇所**: `DashboardScreen.tsx:1-22`

| 種別 | 内容 |
|------|------|
| **追加** | `import { LinearGradient } from 'expo-linear-gradient';` |
| **追加** | `import { VA_COLORS } from '../ui/variants/variantAColors';` |
| **追加** | `import { useState } from 'react';`（`periodMode` 用 — 既存の `useState` に追加） |
| **変更** | `useTheme` は維持（`spacing`, `radius` を利用するため） |
| **変更** | `H1, H2, Body, Caption` は一部を直接スタイル指定に変更 |

### 5.2 新規追加: periodMode 状態

**挿入箇所**: `DashboardScreen.tsx:110` 付近（`expandedId` の直下）

```tsx
// 追加
const [periodMode, setPeriodMode] = useState<'monthly' | 'yearly'>('monthly');
const displayAmount = periodMode === 'monthly' ? totalMonthly : totalYearly;
const displayLabel = periodMode === 'monthly' ? '今月の合計' : '年間の合計';
```

### 5.3 SwipeableRow 変更

**該当箇所**: `DashboardScreen.tsx:71-91`

| 行 | 現行 | 変更後 |
|----|------|--------|
| L79 | `backgroundColor: colors.error` | `backgroundColor: VA_COLORS.statusError` |
| L82 | `<Caption color="#fff">` | `<Caption style={{ fontSize:10, color:'#FFF' }}>` |
| L85 | `backgroundColor: colors.background` | `backgroundColor: 'transparent'` |
| L80 | `borderTopRightRadius` なし | `borderTopRightRadius: 16, borderBottomRightRadius: 16` **追加** |

### 5.4 renderSubscriptionItem 変更

**該当箇所**: `DashboardScreen.tsx:141-233`

| 行 | 現行 | 変更後 |
|----|------|--------|
| L161 | `Card style={[styles.subCard, { borderLeftWidth:3, borderLeftColor:item.color }]}` | `View style={[styles.subCard, { borderLeftColor:item.color }]}` へ。Card → View（背景制御のため） |
| L164 | `backgroundColor: item.color + '22'` | `backgroundColor: item.color + '30'` |
| L175-176 | `<H2 style={styles.subName}>{item.name}</H2>` | スタイル変更: `color: VA_COLORS.textPrimary, fontSize:15` |
| L178 | `<Caption color={colors.textMuted}>` | `<Caption style={{ color: VA_COLORS.textMuted }}>` |
| L186-191 | `<Badge label={item.category} variant="info">` | 独自スタイルバッジに変更（グラスバッジ） |
| L199-200 | `borderTopColor: colors.border` | `borderTopColor: 'rgba(255,255,255,0.08)'` |
| L203,207,210 | `Caption color={colors.textMuted/textSecondary}` | `VA_COLORS.textMuted / textSecondary` |

### 5.5 ListHeader 完全リデザイン

**該当箇所**: `DashboardScreen.tsx:235-335`

現行の JSX変数（アンチパターン）を `useCallback` でラップし、同時に内容をリデザインする。

```tsx
// 変更前 (L235): const ListHeader = (<View>...</View>)
// 変更後:
const ListHeader = useCallback(() => (
  <View>
    {/* ヘッダー行 (変更: H1→View+Text、Badge→独自スタイル) */}
    <View style={[styles.header]}>
      <View>
        <Text style={styles.headerTitle}>ダッシュボード</Text>
        <Text style={styles.headerSubtitle}>{activeSubs.length}件のサブスク</Text>
      </View>
      {/* プレミアムバッジ: グラスバッジに変更 */}
    </View>

    {/* HeroSummaryCard（月次/年次トグル含む）[新規] */}
    <View style={styles.heroCard}>
      <View style={styles.heroHeader}>
        <Text style={styles.heroLabel}>{displayLabel}</Text>
        {/* 月次/年次トグル: 右上配置 */}
        <View style={styles.periodToggle}>
          <TouchableOpacity
            style={[styles.periodToggleBtn, periodMode === 'monthly' && styles.periodToggleBtnActive]}
            onPress={() => setPeriodMode('monthly')}
          >
            <Text style={[styles.periodToggleText, periodMode === 'monthly' && styles.periodToggleTextActive]}>月次</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodToggleBtn, periodMode === 'yearly' && styles.periodToggleBtnActive]}
            onPress={() => setPeriodMode('yearly')}
          >
            <Text style={[styles.periodToggleText, periodMode === 'yearly' && styles.periodToggleTextActive]}>年次</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 金額表示 */}
      <Text style={periodMode === 'monthly' ? styles.heroAmount : styles.heroAmountSmall}>
        ¥{Math.round(displayAmount).toLocaleString('ja-JP')}
      </Text>

      <View style={styles.heroDivider} />

      {/* 3カラム統計 */}
      <View style={styles.heroStatsRow}>
        <View style={styles.heroStatItem}>
          <Text style={styles.heroStatValue}>{activeSubs.length}</Text>
          <Text style={styles.heroStatLabel}>アクティブ</Text>
        </View>
        <View style={styles.heroStatItem}>
          {/* 最大月額サブスク */}
          <Text style={styles.heroStatValue}>
            ¥{Math.round(Math.max(...activeSubs.map(s => calcMonthlyAmount(s)), 0)).toLocaleString('ja-JP')}
          </Text>
          <Text style={styles.heroStatLabel}>最大月額</Text>
        </View>
        <View style={styles.heroStatItem}>
          {/* 未使用コスト合計 */}
          <Text style={styles.heroStatValue}>
            ¥{Math.round(unusedSubs.reduce((acc, s) => acc + calcMonthlyAmount(s), 0)).toLocaleString('ja-JP')}
          </Text>
          <Text style={styles.heroStatLabel}>未使用計</Text>
        </View>
      </View>
    </View>

    {/* CategoryRingChart [新規] */}
    {activeSubs.length > 0 && <CategoryRingChart subscriptions={activeSubs} />}

    {/* 次回請求セクション: スタイル変更 (colors → VA_COLORS) */}
    {/* ... */}

    {/* 未使用バナー: borderLeftColor '#FF9800' → VA_COLORS.statusWarning */}
    {/* ... */}

    <Text style={styles.sectionTitle}>すべてのサブスク ({activeSubs.length}件)</Text>
  </View>
), [activeSubs, upcomingBillings, unusedSubs, isPremium, periodMode, displayAmount, displayLabel]);
```

### 5.6 メインcontainer・FlatList 変更

**該当箇所**: `DashboardScreen.tsx:337-378`

| 行 | 現行 | 変更後 |
|----|------|--------|
| L338 | `<View style={[styles.container, { backgroundColor: colors.background }]}>` | `<LinearGradient colors={[VA_COLORS.bgTop, VA_COLORS.bgBottom]} style={styles.container}>` |
| L349 | `ListHeaderComponent={ListHeader}` | `ListHeaderComponent={ListHeader}` （コンポーネント参照に変更済のため問題なし） |

### 5.7 FAB 変更

**該当箇所**: `DashboardScreen.tsx:367-376`

```tsx
// 変更前
<TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + spacing.lg }]}>
  <Ionicons name="add" size={28} color={colors.textOnPrimary} />
</TouchableOpacity>

// 変更後
<TouchableOpacity style={[styles.fab, { bottom: insets.bottom + spacing.lg }]} activeOpacity={0.85}>
  <LinearGradient colors={[VA_COLORS.accentBlue, VA_COLORS.accentPurple]} style={StyleSheet.absoluteFill} start={{x:0,y:0}} end={{x:1,y:1}} />
  <Ionicons name="add" size={28} color="#FFFFFF" />
</TouchableOpacity>
```

### 5.8 StyleSheet 変更（styles const）

**該当箇所**: `DashboardScreen.tsx:381-492`

| スタイル名 | 変更種別 | 主な変更内容 |
|-----------|---------|------------|
| `container` | 変更 | `flex:1` のみ残す（背景色は LinearGradient で担う） |
| `summaryCard` | **削除** | HeroSummaryCard の `heroCard` に置き換え |
| `totalAmount` | **削除** | `heroAmount` / `heroAmountSmall` に置き換え |
| `summaryDivider` | **削除** | `heroDivider` に置き換え |
| `summaryFooter` | **削除** | `heroStatsRow` に置き換え |
| `upcomingCard` | 変更 | 背景・ボーダー変更（4.8参照） |
| `unusedCard` | 変更 | 背景・ボーダー変更（4.9参照） |
| `subCard` | 変更 | グラスカードスタイル（4.7参照） |
| `iconCircle` | 変更 | `width/height: 44, borderRadius: 22` |
| `deleteAction` | 変更 | 角丸追加（4.6参照） |
| `fab` | 変更 | サイズ60x60、グロー shadow（4.10参照） |
| `header` | 変更 | 追加スタイルなし（paddingTop は inline） |
| **新規追加** | 追加 | `heroCard`, `heroHeader`, `heroLabel`, `heroAmount`, `heroAmountSmall`, `heroDivider`, `heroStatsRow`, `heroStatItem`, `heroStatValue`, `heroStatLabel`, `periodToggle`, `periodToggleBtn`, `periodToggleBtnActive`, `periodToggleText`, `periodToggleTextActive`, `chartCard`, `ringOuter`, `ringHole`, `legendContainer`, `legendRow`, `legendDot`, `sectionTitle`, `glassCard` |

---

## 6. 新規作成ファイル

### 6.1 `src/ui/variants/variantAColors.ts`

セクション4.1のカラー定数をエクスポート。

### 6.2 `src/ui/variants/CategoryRingChart.tsx`

```tsx
// インターフェース
interface CategoryRingChartProps {
  subscriptions: Subscription[];
}

// 表示ロジック:
// 1. subscriptions をカテゴリ別に集計
// 2. カテゴリ別合計月額 → 全体に占める割合を計算
// 3. VA_COLORS のカテゴリ色を適用
// 4. ドーナツ近似（border-color + rotate 技法）
// 5. 凡例（色ドット + カテゴリ名 + パーセント + 金額）
```

### 6.3 `src/ui/variants/GlassBadge.tsx`（オプション）

既存の `<Badge>` コンポーネントのグラスモーフィズム版。
現行のバッジ（`variant="info"`, `"warning"` 等）をグラス風にラップする軽量ラッパー。

---

## 7. 月次/年次切り替えトグル 詳細仕様

### 配置位置

- **HeroSummaryCard の右上コーナー**（`heroHeader` 内の `justifyContent:'space-between'`）
- ラベル「今月の合計」または「年間の合計」が左に表示

### 動作

| アクション | 表示変化 |
|-----------|---------|
| 「月次」タップ | `displayAmount = totalMonthly`, `heroAmount` フォントサイズ52 |
| 「年次」タップ | `displayAmount = totalYearly`, `heroAmountSmall` フォントサイズ40（桁数が増えるため縮小） |
| 状態永続化 | `AsyncStorage` への保存は実装しない（シンプル化のため） |

### StyleSheet（再掲）

```tsx
periodToggle: {
  flexDirection: 'row',
  backgroundColor: 'rgba(255,255,255,0.10)',
  borderRadius: 8,
  padding: 2,
},
periodToggleBtn: {
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 6,
},
periodToggleBtnActive: {
  backgroundColor: 'rgba(107,127,255,0.60)',
},
periodToggleText: {
  fontSize: 12,
  fontWeight: '600',
  color: 'rgba(255,255,255,0.50)',
},
periodToggleTextActive: {
  color: '#FFFFFF',
},
```

---

## 8. 変更サマリー（DashboardScreen.tsx）

| カテゴリ | 現行行数 | 変更後概算 | 変更内容 |
|---------|---------|----------|---------|
| インポート | L1-22 | L1-25 | LinearGradient・VA_COLORS 追加 |
| SwipeableRow | L27-92 | L27-95 | 削除ボタン角丸・背景透明化 |
| 状態定義 | L110 | L110-112 | `periodMode` 追加 |
| renderSubscriptionItem | L141-233 | L141-235 | カード・アイコン・テキスト色変更 |
| ListHeader | L235-335 | L235-360 | JSX変数→useCallback、HeroCard・RingChart・トグル追加 |
| メインreturn | L337-378 | L340-385 | LinearGradient ラッパー、FABグラデーション |
| StyleSheet | L381-492 | L390-600 | 旧summary系削除、新hero/glass系追加 |
| **合計** | **493行** | **〜620行** | 新規ファイル CategoryRingChart 等で分散可 |

---

## 9. 依存パッケージ

| パッケージ | 現行 | 変更後 | 備考 |
|-----------|------|--------|-----|
| `expo-linear-gradient` | なし | **必要** | LinearGradient 背景・FAB グラデーション |
| `react-native-svg` | なし | 不要 | CategoryRingChart は View のみで実装 |
| `@massapp/ui` | 使用中 | 維持 | Card → View 置き換え箇所あり |

インストールコマンド:
```bash
npx expo install expo-linear-gradient
```

---

## 10. 実装優先順位

| 優先度 | タスク | 理由 |
|-------|-------|------|
| P0 | `expo-linear-gradient` インストール | 背景・FABに必須 |
| P0 | `variantAColors.ts` 作成 | 全コンポーネントが依存 |
| P1 | HeroSummaryCard + periodToggle | ダッシュボードの核心 |
| P1 | グラスカード（subCard）スタイル変更 | 一覧の見た目を決定 |
| P2 | `CategoryRingChart.tsx` 作成 | チャートの複雑度が高い |
| P2 | SwipeableRow 角丸・削除アクション変更 | スワイプUXの完成度 |
| P3 | `GlassBadge.tsx`（オプション） | 既存 Badge で代替可能 |
