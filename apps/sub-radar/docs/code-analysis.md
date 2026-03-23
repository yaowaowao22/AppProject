# SubRadar コード分析レポート

作成日: 2026-03-23
対象ブランチ: main（コミット 2e0bc76）

---

## 1. 現行UIコンポーネント構造マップ

### アプリ全体の階層

```
App.tsx
└── SafeAreaProvider
    └── ThemeProvider（sub-radar テーマ / AsyncStorage テーマ復元）
        └── SubscriptionProvider（サブスク CRUD・合計額を提供）
            └── AppInner（モーダル状態管理: showAddModal / editingSubscription）
                ├── NavigationContainer
                │   └── RootNavigator（ThemedTabNavigator 2タブ）
                │       ├── Tab1: DashboardScreen（onAddPress コールバック経由）
                │       └── Tab2: SettingsScreen
                └── AddSubscriptionModal（conditional render, NavigationContainer 外）
```

### DashboardScreen.tsx の内部構造

```
DashboardScreen
├── [内部コンポーネント] SwipeableRow  ← 本来は components/ に分離すべき
│   ├── PanResponder（スワイプ検知）
│   ├── Animated.View（translateX アニメーション）
│   └── TouchableOpacity（削除ボタン）
├── FlatList
│   ├── ListHeader（JSX変数として定義 ← アンチパターン）
│   │   ├── ヘッダー行（タイトル + プレミアムバッジ）
│   │   ├── サマリーカード（月額合計 / 年間合計 / アクティブ件数）
│   │   ├── 次回請求セクション（7日以内、日付昇順）
│   │   └── 未使用サービス警告バナー（30日以上タップなし）
│   ├── renderSubscriptionItem
│   │   └── SwipeableRow > TouchableOpacity > Card
│   │       ├── アイコン円（color + '22' = 13% 不透明度）
│   │       ├── サービス名 + 未使用バッジ（H2 + Badge）
│   │       ├── 次回請求日（Caption）
│   │       ├── 月額 + カテゴリバッジ（Body + Badge）
│   │       └── [isExpanded] 詳細パネル（請求サイクル・請求日・月額・メモ）
│   ├── ListEmptyComponent（空状態）
│   └── FAB（右下固定、colors.primary）
```

### SettingsScreen.tsx の内部構造

```
SettingsScreen
└── ScrollView
    ├── プランカード（Card）
    │   ├── プラン状態表示（H2 + Caption + Badge）
    │   ├── アップグレードボタン（Button、非プレミアム時のみ）
    │   ├── Divider
    │   └── ListItem（購入復元）
    ├── 通知設定カード（Card）
    │   ├── Switch（3日前通知）
    │   ├── Divider
    │   └── Switch（前日通知）
    ├── 表示設定カード（Card）
    │   ├── カスタムセグメント（テーマ: ライト/ダーク/自動）← TouchableOpacity 自作
    │   ├── Divider
    │   └── カスタムセグメント（通貨: JPY/USD）← 同上
    ├── データカード（Card）
    │   └── ListItem（全サブスク削除）
    └── このアプリについてカード（Card）
        ├── バージョン・アプリ名
        ├── Divider + Caption（説明文）
        └── ListItem × 2（プライバシーポリシー・利用規約）
```

### AddSubscriptionModal.tsx の内部構造

```
AddSubscriptionModal（Modal, pageSheet）
└── KeyboardAvoidingView
    ├── ヘッダー（H2 + 閉じるボタン）
    └── ScrollView
        ├── サービス名入力（Card > TextInput）
        ├── 金額入力（Card > TextInput, numeric）
        ├── 通貨セグメント（Card > TouchableOpacity × 3: JPY/USD/EUR）
        ├── 請求サイクルセグメント（Card > TouchableOpacity × 4: 月次/年次/四半期/週次）
        ├── 請求日グリッド（Card > TouchableOpacity × 31: 1〜31日）← showBillingDay 条件
        ├── カテゴリセグメント（Card > TouchableOpacity × 5）
        ├── アイコン選択グリッド（Card > TouchableOpacity × 12）
        ├── メモ入力（Card > TextInput, multiline）
        ├── 保存ボタン（Button）
        └── 削除ボタン（TouchableOpacity, isEdit 時のみ）
```

---

## 2. 使用中の @massapp/ui コンポーネント一覧

| コンポーネント | DashboardScreen | SettingsScreen | AddSubscriptionModal |
|--------------|:--------------:|:--------------:|:--------------------:|
| `useTheme`   | ✓              | ✓              | ✓                    |
| `H1`         | ✓              | ✓              | —                    |
| `H2`         | ✓              | ✓              | ✓                    |
| `Body`       | ✓              | ✓              | ✓                    |
| `Caption`    | ✓              | ✓              | ✓                    |
| `Card`       | ✓              | ✓              | ✓                    |
| `Badge`      | ✓              | ✓              | —                    |
| `Button`     | —              | ✓              | ✓                    |
| `Divider`    | —              | ✓              | —                    |
| `ListItem`   | —              | ✓              | —                    |

### import文

```typescript
// DashboardScreen.tsx:13
import { useTheme, H1, H2, Body, Caption, Card, Badge } from '@massapp/ui';

// SettingsScreen.tsx:13-24
import {
  useTheme, H1, H2, Body, Caption, Card, Button, Badge, Divider, ListItem
} from '@massapp/ui';
import type { ThemeMode } from '@massapp/ui';

// AddSubscriptionModal.tsx:15
import { useTheme, H2, Body, Caption, Card, Button } from '@massapp/ui';
```

### 未使用のコンポーネント（@massapp/ui で利用可能だが未導入）

- `TextInput`（`@massapp/ui` に存在する場合）— 現在 RN の `TextInput` を直接使用
- `SegmentedControl` または相当品 — カスタムセグメントを自作している箇所で代替できる可能性

---

## 3. 現行の色・スタイル定義

### theme.ts（presetForestGreen ベース）

| トークン        | Light モード | Dark モード |
|----------------|-------------|------------|
| `primary`      | `#00897B`（Teal Green） | `#4DB6AC` |
| `primaryDark`  | `#00695C`   | `#00897B`  |
| `primaryLight` | `#4DB6AC`   | `#80CBC4`  |
| `secondary`    | `#2E7D32`   | `#66BB6A`  |
| `secondaryDark`| `#1B5E20`   | `#388E3C`  |
| `accent`       | `#26A69A`   | `#80CBC4`  |

※ `surface`, `background`, `text`, `textSecondary`, `textMuted`, `textOnPrimary`, `border`, `error`, `success`, `warning` 等は presetForestGreen のデフォルト値を継承

### カテゴリカラー（types.ts:14-20）

| カテゴリ | カラーコード | 系統      |
|---------|------------|----------|
| エンタメ | `#E91E63`  | ピンク    |
| 仕事    | `#2196F3`  | ブルー    |
| 生活    | `#FF9800`  | オレンジ  |
| 学習    | `#9C27B0`  | パープル  |
| その他  | `#78909C`  | グレー    |

### ハードコードされた数値・色（コードレビュー指摘箇所）

| 場所 | 値 | 備考 |
|-----|---|------|
| DashboardScreen.tsx:315 | `'#FF9800'` | `colors.warning` を使うべき |
| AddSubscriptionModal.tsx:314 | `'#FFFFFF'` | `colors.textOnPrimary` を使うべき |
| DashboardScreen.tsx:393 | `padding: 20` | `spacing.md` を使うべき |
| DashboardScreen.tsx:394 | `borderRadius: 16` | `radius.lg` を使うべき |
| DashboardScreen.tsx:397 | `marginVertical: 4` | `spacing.xs` を使うべき |
| DashboardScreen.tsx:344 | `paddingBottom: 100 + insets.bottom` | マジックナンバー 100 |

---

## 4. UI改善が必要な箇所トップ5

### 第1位: SwipeableRow が DashboardScreen 内に埋め込まれている

**ファイル:** `src/screens/DashboardScreen.tsx:28-92`

```tsx
// 問題: DashboardScreen.tsx の先頭に SwipeableRow が直書き
function SwipeableRow({ children, onDelete }) { ... }  // L28-92
```

**問題点:**
- design.md では `src/components/SwipeableRow.tsx` として分離する設計だったが未実施
- DashboardScreen と SettingsScreen の両方でスワイプが必要になった場合に再利用できない
- DashboardScreen のファイルが 493 行と長くなっている原因の一つ

**改善案:** `src/components/SwipeableRow.tsx` に移動し、export する。

---

### 第2位: ListHeader が JSX 変数として定義されている

**ファイル:** `src/screens/DashboardScreen.tsx:235-335`

```tsx
// 問題: JSX変数として定義
const ListHeader = (
  <View>
    ...  // L235-335
  </View>
);

// FlatList に渡している
<FlatList ListHeaderComponent={ListHeader} ... />
```

**問題点:**
- `const ListHeader = (<View>...</View>)` は JSX 変数（React Element）であり、`ListHeaderComponent` は**コンポーネント**を期待している
- 正しくは `const ListHeader = () => <View>...</View>` または `useCallback` でラップする必要がある
- 現状では DashboardScreen が再レンダリングされるたびに ListHeader の参照が変わり、FlatList がヘッダーを unmount/remount する可能性がある
- `upcomingBillings`・`unusedSubs`・`activeSubs` 等の useMemo 値をヘッダー内で参照しているため、コンポーネント化が必要

**改善案:**
```tsx
const ListHeader = useCallback(() => (
  <View>...</View>
), [upcomingBillings, unusedSubs, activeSubs, isPremium]);
```

---

### 第3位: カテゴリボタンのテキスト色のハードコード

**ファイル:** `src/screens/AddSubscriptionModal.tsx:314`

```tsx
// 問題: '#FFFFFF' をハードコード
<Body
  style={{
    color: category === cat ? '#FFFFFF' : colors.textSecondary,  // L314
    fontWeight: category === cat ? 'bold' : 'normal',
  }}
>
```

**問題点:**
- `'#FFFFFF'` は選択状態のテキスト色としてハードコードされており、テーマシステムを無視している
- ダークモードでも同じ白色になるため、背景色によっては視認性が問題になる可能性
- テーマの `colors.textOnPrimary` を使うべき（ただしここはカテゴリ色の上に載るため `textOnPrimary` ではなく適切な判定が必要）

**改善案:**
```tsx
color: category === cat ? colors.textOnPrimary : colors.textSecondary,
```

---

### 第4位: 未使用カードのボーダー色と「生活」カテゴリ色が独立したハードコード

**ファイル:** `src/screens/DashboardScreen.tsx:315`

```tsx
// 問題: '#FF9800' をハードコード（CATEGORY_COLORS['生活'] と値が一致しているが偶然）
<Card
  style={[
    styles.unusedCard,
    { borderLeftWidth: 3, borderLeftColor: '#FF9800', marginBottom: spacing.sm },  // L315
  ]}
>
```

**問題点:**
- `CATEGORY_COLORS['生活']` も `'#FF9800'` だが、未使用警告のオレンジは「生活カテゴリ」のオレンジとは意味が異なる
- `colors.warning` や `colors.error` 等のセマンティックトークンを使うべき
- カテゴリ色を変更した際に意図せず警告バナーの色が変わらないというバグのリスクがある

**改善案:**
```tsx
borderLeftColor: colors.warning,  // または colors.error
```

---

### 第5位: カスタムセグメントボタンパターンの重複

**ファイル:** `src/screens/SettingsScreen.tsx:214-275` / `src/screens/AddSubscriptionModal.tsx:195-253`

```tsx
// SettingsScreen.tsx のテーマ選択（L219-244）とAddSubscriptionModal.tsx の通貨選択（L197-218）で
// 全く同一の TouchableOpacity + スタイルパターンが重複している

<TouchableOpacity
  onPress={() => handleSetMode(m)}
  style={[
    styles.segmentButton,
    {
      backgroundColor: mode === m ? colors.primary : colors.surface,
      borderColor:     mode === m ? colors.primary : colors.border,
      borderRadius:    radius.sm,
    },
  ]}
>
```

**問題点:**
- SettingsScreen: テーマ選択・通貨選択の2箇所で同一パターン
- AddSubscriptionModal: 通貨・請求サイクル・カテゴリの3箇所で同一パターン（カテゴリのみ `colors.primary` の代わりに `CATEGORY_COLORS[cat]` を使用）
- 合計5箇所に散在しており、スタイル変更時の修正コストが高い
- UIバリアントを追加する際にさらに重複が増える

**改善案:** `src/components/SegmentControl.tsx` として切り出す
```tsx
interface SegmentControlProps<T> {
  options: Array<{ value: T; label: string; icon?: string }>;
  selected: T;
  onSelect: (v: T) => void;
  activeColor?: string;
}
```

---

## 5. 再利用できるロジック・状態管理の整理

### 5.1 SubscriptionContext（src/SubscriptionContext.tsx）

UIバリアント間で共通して利用できる状態:

| 値/関数 | 型 | 用途 |
|--------|---|------|
| `subscriptions` | `Subscription[]` | 全サブスクリプション一覧 |
| `isPremium` | `boolean` | プレミアムプラン状態 |
| `totalMonthly` | `number` | 月額合計（月換算・JPY） |
| `totalYearly` | `number` | 年間合計（= totalMonthly × 12） |
| `addSubscription` | `(sub) => boolean` | 追加（無料版3件制限付き） |
| `updateSubscription` | `(id, patch) => void` | 部分更新 |
| `deleteSubscription` | `(id) => void` | 削除 |

**注意:** `totalMonthly` は通貨換算なしの計算（異なる通貨のサブスクが混在する場合に不正確）。マルチ通貨対応はフェーズ2課題。

### 5.2 subscriptionUtils.ts（src/utils/subscriptionUtils.ts）

全て純粋関数（副作用なし）。UIバリアントで共通利用可能:

| 関数 | シグネチャ | 備考 |
|-----|---------|------|
| `calcMonthlyAmount` | `(sub: Subscription) => number` | 週次は × 4.33 |
| `getNextBillingDate` | `(sub: Subscription) => Date` | 2月対応: 28日上限 |
| `getDaysUntilBilling` | `(sub: Subscription) => number` | 当日 = 0 |
| `isUnused` | `(sub: Subscription) => boolean` | 30日未タップ = true |
| `formatCurrency` | `(amount: number, currency: Currency) => string` | ¥/$/€ フォーマット |

**バグ注意:** `getNextBillingDate` は `billingCycle` が `yearly`/`quarterly`/`weekly` の場合でも `billingDay`（月次の日付）を使って計算している。年次サブスクの次回請求日計算が不正確になる可能性がある。

### 5.3 DashboardScreen 内の派生データ計算（カスタムフック化推奨）

現在 DashboardScreen.tsx 内の useMemo として定義されているが、UIバリアント追加時に重複する:

```tsx
// DashboardScreen.tsx:113-130 — カスタムフックに抽出すべき
const upcomingBillings = useMemo(() =>
  subscriptions
    .filter(s => s.isActive)
    .map(s => ({ sub: s, days: getDaysUntilBilling(s) }))
    .filter(({ days }) => days <= 7)
    .sort((a, b) => a.days - b.days)
, [subscriptions]);

const unusedSubs = useMemo(
  () => subscriptions.filter(s => s.isActive && isUnused(s)),
  [subscriptions]
);

const activeSubs = useMemo(
  () => subscriptions.filter(s => s.isActive),
  [subscriptions]
);
```

**改善案:** `src/hooks/useSubscriptionDashboard.ts` として抽出
```tsx
export function useSubscriptionDashboard() {
  const { subscriptions, totalMonthly, totalYearly, isPremium } = useSubscriptions();
  const activeSubs = useMemo(...);
  const upcomingBillings = useMemo(...);
  const unusedSubs = useMemo(...);
  return { activeSubs, upcomingBillings, unusedSubs, totalMonthly, totalYearly, isPremium };
}
```

### 5.4 AddSubscriptionModal のフォームロジック

モーダルの `handleSave` ロジック（バリデーション + Subscription オブジェクト構築）は UIバリアントが変わってもほぼ同一のはずなので、カスタムフックへの切り出しが有効:

```tsx
// src/hooks/useSubscriptionForm.ts
export function useSubscriptionForm(subscription?: Subscription) {
  const [name, setName] = useState(subscription?.name ?? '');
  // ... その他のフィールド
  const handleSave = useCallback((): Subscription | null => { ... }, [...]);
  return { name, setName, ..., handleSave };
}
```

---

## 6. 新UIバリアント追加時の推奨アーキテクチャ

### 6.1 UIVariantContext 設計案

```
src/
├── ui/
│   ├── UIVariantContext.tsx     ← 新規追加
│   ├── variants/
│   │   ├── DefaultDashboard.tsx ← 現行の DashboardScreen の表示ロジック
│   │   ├── MinimalDashboard.tsx ← ミニマルUI
│   │   └── CompactDashboard.tsx ← コンパクトUI
│   └── components/
│       ├── SegmentControl.tsx   ← セグメントボタンの共通化
│       └── SubscriptionCard.tsx ← カード表示の共通化
├── hooks/
│   ├── useSubscriptionDashboard.ts  ← useMemo ロジックを集約
│   └── useSubscriptionForm.ts       ← フォームロジックを集約
└── components/
    └── SwipeableRow.tsx         ← DashboardScreen から移動
```

### 6.2 UIVariantContext の実装案

```typescript
// src/ui/UIVariantContext.tsx

import React, { createContext, useContext } from 'react';
import { useLocalStorage } from '@massapp/hooks';

export type UIVariant = 'default' | 'minimal' | 'compact';

interface UIVariantContextValue {
  variant: UIVariant;
  setVariant: (v: UIVariant) => void;
}

const UIVariantContext = createContext<UIVariantContextValue>({
  variant: 'default',
  setVariant: () => undefined,
});

export function UIVariantProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariant] = useLocalStorage<UIVariant>('sub_ui_variant', 'default');
  return (
    <UIVariantContext.Provider value={{ variant, setVariant }}>
      {children}
    </UIVariantContext.Provider>
  );
}

export function useUIVariant(): UIVariantContextValue {
  return useContext(UIVariantContext);
}
```

### 6.3 App.tsx へのプロバイダー組み込み位置

```tsx
// App.tsx（変更後）
<SafeAreaProvider>
  <ThemeProvider theme={theme} initialMode={themeMode}>
    <SubscriptionProvider>
      <UIVariantProvider>          {/* ← 追加 */}
        <AppInner />
      </UIVariantProvider>
    </SubscriptionProvider>
  </ThemeProvider>
</SafeAreaProvider>
```

### 6.4 DashboardScreen でのバリアント分岐パターン

```tsx
// src/screens/DashboardScreen.tsx（変更後）
import { useUIVariant } from '../ui/UIVariantContext';
import { DefaultDashboard } from '../ui/variants/DefaultDashboard';
import { MinimalDashboard } from '../ui/variants/MinimalDashboard';

export function DashboardScreen({ onAddPress }: DashboardScreenProps) {
  const { variant } = useUIVariant();
  const dashboardData = useSubscriptionDashboard();  // ロジックはフックに集約

  switch (variant) {
    case 'minimal':  return <MinimalDashboard  {...dashboardData} onAddPress={onAddPress} />;
    case 'compact':  return <CompactDashboard  {...dashboardData} onAddPress={onAddPress} />;
    default:         return <DefaultDashboard  {...dashboardData} onAddPress={onAddPress} />;
  }
}
```

### 6.5 SettingsScreen でのバリアント切替UI追加案

```tsx
// SettingsScreen.tsx の表示設定カードに追加
<Body color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
  UIスタイル
</Body>
<View style={styles.segmentRow}>
  {(['default', 'minimal', 'compact'] as UIVariant[]).map((v) => (
    <SegmentButton
      key={v}
      label={v === 'default' ? '標準' : v === 'minimal' ? 'ミニマル' : 'コンパクト'}
      selected={variant === v}
      onPress={() => setVariant(v)}
    />
  ))}
</View>
```

### 6.6 バリアント実装の優先順位と指針

| バリアント | 特徴 | 変更箇所 |
|-----------|-----|---------|
| `default`（現行） | サマリーカード + セクション分け + FAB | そのまま維持 |
| `minimal` | サマリー非表示・リストのみ・テキスト重視 | ListHeader を最小化 |
| `compact` | カード高さを縮小・情報密度を高める | subCard padding を削減 |

**共通すべきもの（バリアント間で変えない）:**
- `SubscriptionContext` の全状態・CRUD
- `subscriptionUtils.ts` の全ユーティリティ
- `SwipeableRow` のスワイプ削除挙動
- `AddSubscriptionModal` のフォーム（UIバリアントに影響されない）

---

## 7. デザイン仕様との差異

`docs/design.md` に記載された設計と現行実装の主な差異:

| 設計書の記述 | 現行実装 | 差異 |
|-----------|--------|------|
| 3タブ構成（ダッシュボード・サブスク一覧・設定） | 2タブ構成（ホーム・設定） | Tab2（SubscriptionListScreen）が未実装。ダッシュボードにリストを統合 |
| `src/components/SwipeableRow.tsx` として分離 | `DashboardScreen.tsx` 内に埋め込み | 未分離 |
| `src/components/SubscriptionFormModal.tsx` | `src/screens/AddSubscriptionModal.tsx` | ディレクトリとファイル名が異なる |
| `src/components/UnusedBadge.tsx` | `<Badge label="⚠️ 未使用" variant="warning" />` を直接使用 | 未コンポーネント化 |
| BillingCycle: `monthly / yearly / quarterly` | `monthly / yearly / quarterly / weekly` を追加実装 | 実装が設計書より拡張 |
| Subscription.nextBillingDate（ISO date） | Subscription.billingDay（1〜31の整数） | データモデルが変更（次回日付を都度計算する方式に変更） |
