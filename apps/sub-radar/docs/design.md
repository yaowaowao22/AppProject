# SubRadar 設計書

作成日: 2026-03-23
ベース参照: `research/spec_top2.md`（SubRadar節）、`push-notify` ソースコード

---

## 1. アプリ概要

### MVP機能（仕様書より）

| # | 機能 | 詳細 |
|---|------|------|
| 1 | サブスク登録 | 名称・金額・請求日・通貨・カテゴリを手動入力 |
| 2 | ダッシュボード | 月額合計（大表示）・年間合計・次回請求リスト |
| 3 | 更新通知 | 請求日の3日前・前日にプッシュ通知（UIモックのみ） |
| 4 | ウィジェット | フェーズ2以降対応 |
| 5 | iCloud同期 | フェーズ2以降対応 |

### 差別化ポイント

1. **未使用フラグ自動付与** — 30日以上タップされていないサービスに ⚠️ バッジを自動表示。「今月のムダ」を一目で把握できる
2. **口座連携ゼロ** — 銀行・クレカ連携不要。データはデバイス内のみに保存

### ビジネス情報

| 項目 | 内容 |
|------|------|
| 価格 | ¥480 買い切り（無料版: 3件まで） |
| ターゲット | 20〜40代・サブスク管理に疲れたIT系会社員・フリーランサー |
| リリース目標 | 2026年12月 |

---

## 2. ディレクトリ構成

push-notify の `src/` 構造をベースに SubRadar 用へ変更。

```
apps/sub-radar/
├── App.tsx                          # ThemeProvider / NavigationContainer / AppInner
├── package.json
└── src/
    ├── types.ts                     # Subscription, Category, BillingCycle, NotificationConfig
    ├── theme.ts                     # presetMidnightNavy ベースのカスタムテーマ
    ├── navigation/
    │   └── RootNavigator.tsx        # ThemedTabNavigator（3タブ）
    ├── screens/
    │   ├── DashboardScreen.tsx      # Tab1: ダッシュボード
    │   ├── SubscriptionListScreen.tsx  # Tab2: サブスク一覧
    │   └── SettingsScreen.tsx       # Tab3: 設定
    ├── components/
    │   ├── SwipeableRow.tsx         # push-notify から移植（スワイプ削除）
    │   ├── SubscriptionFormModal.tsx # 追加・編集フォームモーダル
    │   └── UnusedBadge.tsx          # ⚠️ 未使用フラグバッジ
    └── SubscriptionContext.tsx      # サブスク一覧の Context（UsageContext パターン）
```

---

## 3. 画面一覧と役割

### Tab1: ダッシュボード（DashboardScreen）

| 要素 | 詳細 |
|------|------|
| 月額合計（大表示） | 画面上部に ¥XX,XXX と大きく表示。全サブスクの月換算合計 |
| 年間合計 | 月額合計 × 12 をサブテキストで表示 |
| 次回請求リスト | 今後30日以内の請求を日付昇順で表示。残り日数バッジ付き |
| 未使用フラグ一覧 | 30日以上タップなしのサービスを ⚠️ バッジ付きでカード表示 |

**UI構成イメージ:**
```
┌─────────────────────────────┐
│  今月の合計                  │
│  ¥ 18,500                   │  ← H1 大表示
│  年間: ¥222,000             │  ← Caption
├─────────────────────────────┤
│  次回請求                    │
│  ┌──────────────────────┐   │
│  │ Netflix   ¥1,490  残3日 │   │
│  │ Spotify   ¥980   残7日 │   │
│  └──────────────────────┘   │
├─────────────────────────────┤
│  ⚠️ 未使用の可能性           │
│  ┌──────────────────────┐   │
│  │ ⚠️ Adobe CC  ¥6,248  │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
```

### Tab2: サブスク一覧（SubscriptionListScreen）

| 要素 | 詳細 |
|------|------|
| 登録済みリスト | FlatList で全サブスクを表示。月額・次回請求日・カテゴリを表示 |
| スワイプ削除 | 左スワイプで削除ボタン表示（`SwipeableRow` コンポーネント再利用） |
| 追加ボタン | 右下 FAB（FloatingActionButton）。タップで `SubscriptionFormModal` を開く |
| タップ操作 | タップで `lastTappedAt` を更新 → 未使用フラグをリセット |
| フリー制限 | 無料版は3件まで。4件目追加時にプレミアム誘導アラート |

**UI構成イメージ:**
```
┌─────────────────────────────┐
│  サブスク一覧    [合計: 5件]  │
│                              │
│  ← Netflix        ¥1,490/月 │  ← スワイプで削除
│  ← Spotify         ¥980/月  │
│  ← ⚠️ Adobe CC  ¥6,248/月   │  ← 未使用バッジ
│  ← GitHub         ¥1,068/月 │
│  ← Notion          ¥2,000/月 │
│                              │
│                        [＋]  │  ← FAB
└─────────────────────────────┘
```

### Tab3: 設定（SettingsScreen）

| セクション | 項目 |
|-----------|------|
| テーマ | ライト / ダーク / 自動（`useTheme().setMode` を流用） |
| 通知設定 | 通知ON/OFF・何日前に通知するか（1日前/3日前）のトグル |
| データ管理 | 全データ削除・CSV エクスポート（フェーズ2） |
| プレミアム | 無料版3件制限 → ¥480 買い切りアップグレード |
| このアプリについて | バージョン・プライバシーポリシー |

### モーダル: SubscriptionFormModal（追加・編集）

| フィールド | 型 | 必須 |
|-----------|---|------|
| サービス名 | TextInput | ✓ |
| 金額 | TextInput (numeric) | ✓ |
| 通貨 | Picker (JPY / USD / EUR) | ✓ |
| 請求サイクル | SegmentedControl (月次/年次/四半期) | ✓ |
| 次回請求日 | DatePicker | ✓ |
| カテゴリ | Picker | ✓ |
| メモ | TextInput (optional) | — |

---

## 4. データモデル（TypeScript型定義草案）

```typescript
// src/types.ts

export type BillingCycle = 'monthly' | 'yearly' | 'quarterly';

export type Currency = 'JPY' | 'USD' | 'EUR';

export type Category = 'work' | 'entertainment' | 'health' | 'utility' | 'education' | 'other';

export const CATEGORY_LABELS: Record<Category, string> = {
  work:          '仕事',
  entertainment: 'エンタメ',
  health:        '健康・フィットネス',
  utility:       '生活・ユーティリティ',
  education:     '学習',
  other:         'その他',
};

export interface Subscription {
  id: string;
  name: string;
  amount: number;           // 請求額（請求サイクル単位）
  currency: Currency;
  billingCycle: BillingCycle;
  nextBillingDate: string;  // ISO date: "2026-04-15"
  category: Category;
  iconName?: string;        // Ionicons name（例: "logo-netflix"）
  note?: string;
  lastTappedAt?: string;    // ISO datetime。30日超で未使用フラグ
  isActive: boolean;
  createdAt: string;        // ISO datetime
}

export interface NotificationConfig {
  enabled: boolean;
  daysBefore: number[];     // [1, 3] = 前日・3日前
}

// ユーティリティ: 月額換算
export function toMonthlyAmount(sub: Subscription): number {
  switch (sub.billingCycle) {
    case 'monthly':   return sub.amount;
    case 'yearly':    return sub.amount / 12;
    case 'quarterly': return sub.amount / 3;
  }
}

// ユーティリティ: 未使用フラグ判定（30日）
export const UNUSED_THRESHOLD_DAYS = 30;

export function isUnused(sub: Subscription): boolean {
  if (!sub.lastTappedAt) return true;
  const diff = Date.now() - new Date(sub.lastTappedAt).getTime();
  return diff > UNUSED_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
}

// ローカルストレージキー
export const STORAGE_KEYS = {
  subscriptions:      'subradar_subscriptions',
  notificationConfig: 'subradar_notification_config',
  isPremium:          'subradar_is_premium',
  themeMode:          'subradar_theme_mode',
} as const;

export const FREE_LIMIT = 3;
```

---

## 5. push-notify から流用するパターン

### 5.1 ThemeProvider / theme.ts

```typescript
// src/theme.ts — push-notify と同パターン
import { presetMidnightNavy } from '@massapp/ui';
import type { ThemeConfig } from '@massapp/ui';

export const theme: ThemeConfig = {
  ...presetMidnightNavy,
  name: 'sub-radar',
};
```

- `App.tsx` で `<ThemeProvider theme={theme} initialMode={themeMode}>` でラップ
- `AsyncStorage.getItem(STORAGE_KEYS.themeMode)` で初期テーマを復元（push-notify と同パターン）

### 5.2 useLocalStorage

`@massapp/hooks` の `useLocalStorage` を全画面で活用。

```typescript
// サブスク一覧の永続化
const [subscriptions, setSubscriptions] = useLocalStorage<Subscription[]>(
  STORAGE_KEYS.subscriptions, []
);

// プレミアム状態
const [isPremium, setIsPremium] = useLocalStorage('subradar_is_premium', false);
```

### 5.3 @massapp/ui コンポーネント

| コンポーネント | SubRadar での用途 |
|--------------|-----------------|
| `H1` | 月額合計の大数字表示 |
| `H2` | セクションタイトル・サービス名 |
| `Body`, `Caption` | 金額・日付・補足テキスト |
| `Card` | サブスク行・ダッシュボードカード |
| `Badge` | 残り日数・未使用フラグ・プレミアム状態 |
| `Button` | フォーム送信・プレミアム購入 |
| `Divider`, `ListItem` | 設定画面のリスト |

### 5.4 SwipeableRow

`InboxScreen.tsx` の `SwipeableRow` をそのまま `src/components/SwipeableRow.tsx` に切り出して再利用。
`PanResponder` + `Animated.Value` ベースの実装で、追加依存なし。

### 5.5 RootNavigator / ThemedTabNavigator

```typescript
// src/navigation/RootNavigator.tsx — push-notify と同パターン
const screens: TabScreen[] = [
  { name: 'Dashboard',         component: DashboardScreen,         options: { title: 'ダッシュボード', tabBarIcon: ... } },
  { name: 'SubscriptionList',  component: SubscriptionListScreen,  options: { title: 'サブスク',       tabBarIcon: ... } },
  { name: 'Settings',          component: SettingsScreen,          options: { title: '設定',           tabBarIcon: ... } },
];
```

### 5.6 SubscriptionContext（UsageContext パターン）

```typescript
// src/SubscriptionContext.tsx
interface SubscriptionContextValue {
  subscriptions: Subscription[];
  setSubscriptions: (subs: Subscription[]) => void;
  isPremium: boolean;
}

export const SubscriptionProvider = SubscriptionContext.Provider;
export function useSubscriptions(): SubscriptionContextValue { ... }
```

push-notify の `UsageProvider` / `useUsage` と同じパターン。`App.tsx` → `AppInner` 内で `<SubscriptionProvider>` でラップ。

---

## 6. モックとして実装する機能スコープ

### 実装する（UIとAsyncStorageのみ）

| 機能 | 実装方法 |
|------|---------|
| サブスク登録・編集・削除 | `useLocalStorage` + `SubscriptionFormModal` |
| ダッシュボード表示 | `Subscription[]` からリアルタイム計算 |
| 未使用フラグ判定 | `isUnused()` 関数でクライアント計算 |
| テーマ切り替え | `useTheme().setMode` + AsyncStorage 永続化 |
| フリー制限（3件） | `subscriptions.length >= FREE_LIMIT` チェック |
| 次回請求リスト | `nextBillingDate` でソート・残り日数計算 |

### 除外する（フェーズ2以降）

| 機能 | 理由 |
|------|------|
| ローカルプッシュ通知 | `expo-notifications` のスケジューリング設定が必要。初期モックには含めない |
| iCloud / CloudKit 同期 | SwiftUI 版での実装を想定。RN モックでは AsyncStorage のみ |
| ウィジェット（WidgetKit） | ネイティブ拡張が必要。RN モックでは対応不可 |
| RevenueCat 連携 | モックではプレミアムフラグを AsyncStorage で管理 |
| CSV エクスポート | UI のみ実装（`expo-sharing` 連携は後回し） |

---

## 7. 依存パッケージ（package.json 草案）

push-notify の `package.json` をベースに、通知・API 関連を削除した構成。

```json
{
  "name": "@massapp/sub-radar",
  "version": "0.1.0",
  "dependencies": {
    "@expo/vector-icons": "^15.0.3",
    "@massapp/hooks": "workspace:*",
    "@massapp/navigation": "workspace:*",
    "@massapp/ui": "workspace:*",
    "@react-native-async-storage/async-storage": "2.2.0",
    "@react-navigation/bottom-tabs": "^7.12.0",
    "@react-navigation/native": "^7.1.28",
    "expo": "~54.0.33",
    "expo-status-bar": "~3.0.9",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0"
  }
}
```

> push-notify と比べて削除するもの: `expo-notifications`, `expo-secure-store`, `react-native-purchases`, `@massapp/ads`, `react-native-google-mobile-ads`

---

## 8. 開発ロードマップ

```
Step 1  types.ts / theme.ts / SubscriptionContext.tsx を作成
Step 2  RootNavigator（3タブ構成）を実装
Step 3  SubscriptionListScreen + SwipeableRow + FormModal を実装
Step 4  DashboardScreen（合計・次回請求・未使用フラグ）を実装
Step 5  SettingsScreen（テーマ切り替え・データ削除・プレミアム誘導）を実装
Step 6  フリー制限（3件）ロジックを追加
Step 7  UI調整・動作確認
```

---

## 実装完了ファイル一覧

### 設定・基盤ファイル
- `package.json` — アプリ依存パッケージ定義（push-notify から広告・通知系を除外した構成）
- `app.json` — Expo アプリ設定（name: SubRadar, slug: sub-radar, bundleIdentifier: com.massapp.subradar）
- `babel.config.js` — Babel 設定（push-notify と同一）
- `metro.config.js` — Metro バンドラー設定（webモックリゾルバー含む）
- `tsconfig.json` — TypeScript コンパイラ設定
- `index.ts` — Expo エントリーポイント

### ソースファイル
- `src/types.ts` — 型定義（BillingCycle / SubscriptionCategory / Currency / Subscription / NotificationTiming / FREE_LIMIT / CATEGORY_COLORS / BILLING_CYCLE_LABEL）
- `src/theme.ts` — SubRadar テーマ（presetForestGreen ベース、primary を Teal Green #00897B へ差し替え）
- `src/config.ts` — アプリ定数（APP_VERSION / APP_NAME / STORE_KEYS / PREMIUM_PRICE_JPY / DEFAULT_DAYS_BEFORE）
- `src/SubscriptionContext.tsx` — サブスク一覧の Context（UsageContext パターン踏襲。addSubscription は無料版3件制限を内包し boolean を返す）
- `src/utils/subscriptionUtils.ts` — ユーティリティ関数（calcMonthlyAmount / getNextBillingDate / getDaysUntilBilling / isUnused / formatCurrency）

### 画面ファイル
- `src/screens/DashboardScreen.tsx` — Tab1 ダッシュボード（月額合計サマリー・次回請求7日以内・未使用警告・全サブスクFlatList・FAB）
- `src/screens/AddSubscriptionModal.tsx` — サブスク追加・編集モーダル（サービス名・金額・通貨・請求サイクル・請求日・カテゴリ・アイコン・メモ）
- `src/screens/SettingsScreen.tsx` — Tab2 設定画面（プラン・通知設定・表示設定・データ管理・アプリについて）

### ナビゲーション・エントリーポイント
- `src/navigation/RootNavigator.tsx` — 2タブ構成のナビゲーター（ホーム: DashboardScreen、設定: SettingsScreen）。DashboardScreen に onAddPress コールバックをラッパーコンポーネント経由で受け渡し
- `App.tsx` — アプリエントリーポイント。SafeAreaProvider + ThemeProvider（SubRadarテーマ + AsyncStorage テーマ復元）+ SubscriptionProvider でラップ。AddSubscriptionModal の表示状態（showAddModal / editingSubscription）を AppInner で管理し RootNavigator へコールバック渡し
